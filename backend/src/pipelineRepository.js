import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function savePipelineGraph(payload) {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    let pipelineId = payload.id
    let version = 1

    if (pipelineId) {
      const updated = await client.query(
        `
          UPDATE pipelines
          SET name = $2, version = version + 1, updated_at = NOW()
          WHERE id = $1
          RETURNING id, version
        `,
        [pipelineId, payload.name || 'Untitled Pipeline'],
      )

      if (!updated.rowCount) {
        const inserted = await client.query(
          `
            INSERT INTO pipelines (id, name, version)
            VALUES ($1, $2, 1)
            RETURNING id, version
          `,
          [pipelineId, payload.name || 'Untitled Pipeline'],
        )
        pipelineId = inserted.rows[0].id
        version = inserted.rows[0].version
      } else {
        version = updated.rows[0].version
      }
    } else {
      const inserted = await client.query(
        `
          INSERT INTO pipelines (name, version)
          VALUES ($1, 1)
          RETURNING id, version
        `,
        [payload.name || 'Untitled Pipeline'],
      )
      pipelineId = inserted.rows[0].id
      version = inserted.rows[0].version
    }

    await client.query('DELETE FROM pipeline_edges WHERE pipeline_id = $1', [pipelineId])
    await client.query('DELETE FROM pipeline_nodes WHERE pipeline_id = $1', [pipelineId])

    for (const node of payload.nodes || []) {
      await client.query(
        `
          INSERT INTO pipeline_nodes (pipeline_id, node_id, node_type, position_x, position_y, config)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        `,
        [
          pipelineId,
          node.id,
          node.type,
          Number(node.position?.x || 0),
          Number(node.position?.y || 0),
          JSON.stringify(node.data || {}),
        ],
      )
    }

    for (const edge of payload.edges || []) {
      await client.query(
        `
          INSERT INTO pipeline_edges (
            pipeline_id,
            edge_id,
            source_node_id,
            target_node_id
          )
          VALUES ($1, $2, $3, $4)
        `,
        [
          pipelineId,
          edge.id,
          edge.source,
          edge.target,
        ],
      )
    }

    await client.query('COMMIT')

    return {
      id: pipelineId,
      name: payload.name || 'Untitled Pipeline',
      version,
      nodes: payload.nodes || [],
      edges: payload.edges || [],
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
