import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/createApp.js'

describe('POST /api/pipelines', () => {
  it('returns structured validation errors for invalid graph', async () => {
    const app = createApp()

    const response = await request(app).post('/api/pipelines').send({
      name: 'Invalid Graph',
      nodes: [
        { id: 'ocr-1', type: 'ocr', position: { x: 0, y: 0 }, data: {} },
        { id: 'resize-1', type: 'imageResize', position: { x: 0, y: 0 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'ocr-1', target: 'resize-1' }],
    })

    expect(response.status).toBe(422)
    expect(response.body).toHaveProperty('message')
    expect(Array.isArray(response.body.errors)).toBe(true)
    expect(response.body.errors[0]).toHaveProperty('code')
    expect(response.body.errors[0]).toHaveProperty('nodeIds')
    expect(response.body.errors[0]).toHaveProperty('edgeIds')
  })

  it('persists valid graph and returns saved payload', async () => {
    const persistPipeline = vi.fn(async (payload) => ({
      id: 'pipeline-1',
      version: 1,
      name: payload.name,
      nodes: payload.nodes,
      edges: payload.edges,
    }))

    const app = createApp({ persistPipeline })

    const payload = {
      name: 'Valid Graph',
      nodes: [
        { id: 'file-1', type: 'fileUpload', position: { x: 0, y: 0 }, data: {} },
        { id: 'ocr-1', type: 'ocr', position: { x: 120, y: 0 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'file-1', target: 'ocr-1' }],
    }

    const response = await request(app).post('/api/pipelines').send(payload)

    expect(response.status).toBe(200)
    expect(response.body.id).toBe('pipeline-1')
    expect(persistPipeline).toHaveBeenCalledTimes(1)
  })
})
