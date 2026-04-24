import { describe, expect, it } from 'vitest'
import { validatePipelineGraph } from '../src/validator.js'

function node(id, type) {
  return { id, type, position: { x: 0, y: 0 }, data: {} }
}

function edge(id, source, target) {
  return { id, source, target }
}

describe('validatePipelineGraph', () => {
  it('rejects type mismatch edges', () => {
    const payload = {
      nodes: [node('ocr-1', 'ocr'), node('resize-1', 'imageResize')],
      edges: [edge('e1', 'ocr-1', 'resize-1')],
    }

    const result = validatePipelineGraph(payload)
    expect(result.valid).toBe(false)
    expect(result.errors.some((err) => err.code === 'TYPE_MISMATCH')).toBe(true)
  })

  it('enforces document merger exactly two incoming edges from distinct parents', () => {
    const payload = {
      nodes: [
        node('a', 'fileUpload'),
        node('b', 'summarize'),
        node('merger', 'documentMerger'),
      ],
      edges: [edge('e1', 'a', 'merger')],
    }

    const result = validatePipelineGraph(payload)
    expect(result.valid).toBe(false)
    expect(
      result.errors.some((err) => err.code === 'INVALID_MERGER_INCOMING_COUNT'),
    ).toBe(true)
  })

  it('rejects generic cycles', () => {
    const payload = {
      nodes: [node('s1', 'summarize'), node('s2', 'summarize')],
      edges: [edge('e1', 's1', 's2'), edge('e2', 's2', 's1')],
    }

    const result = validatePipelineGraph(payload)
    expect(result.valid).toBe(false)
    expect(result.errors.some((err) => err.code === 'INVALID_CYCLE')).toBe(true)
  })

  it('allows cycle only when it contains Human Review -> Text Correction loop-back', () => {
    const payload = {
      nodes: [node('tc', 'textCorrection'), node('hr', 'humanReview')],
      edges: [edge('e1', 'tc', 'hr'), edge('e2', 'hr', 'tc')],
    }

    const result = validatePipelineGraph(payload)
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects mixed invalid graph with type mismatch and invalid cycle', () => {
    const payload = {
      nodes: [
        node('ocr-1', 'ocr'),
        node('resize-1', 'imageResize'),
        node('sum-1', 'summarize'),
        node('sum-2', 'summarize'),
      ],
      edges: [
        edge('e1', 'ocr-1', 'resize-1'),
        edge('e2', 'sum-1', 'sum-2'),
        edge('e3', 'sum-2', 'sum-1'),
      ],
    }

    const result = validatePipelineGraph(payload)
    expect(result.valid).toBe(false)
    expect(result.errors.some((err) => err.code === 'TYPE_MISMATCH')).toBe(true)
    expect(result.errors.some((err) => err.code === 'INVALID_CYCLE')).toBe(true)
  })
})
