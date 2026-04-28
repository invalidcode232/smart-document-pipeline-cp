CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_type TEXT NOT NULL,
  position_x DOUBLE PRECISION NOT NULL,
  position_y DOUBLE PRECISION NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pipeline_id, node_id)
);

CREATE TABLE IF NOT EXISTS pipeline_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (pipeline_id, edge_id),
  FOREIGN KEY (pipeline_id, source_node_id)
    REFERENCES pipeline_nodes (pipeline_id, node_id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (pipeline_id, target_node_id)
    REFERENCES pipeline_nodes (pipeline_id, node_id)
    ON DELETE CASCADE
    DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS idx_pipeline_nodes_pipeline_id
  ON pipeline_nodes(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_edges_pipeline_id
  ON pipeline_edges(pipeline_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_edges_source
  ON pipeline_edges(pipeline_id, source_node_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_edges_target
  ON pipeline_edges(pipeline_id, target_node_id);
