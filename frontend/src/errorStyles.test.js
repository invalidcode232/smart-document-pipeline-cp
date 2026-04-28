import { describe, expect, it } from 'vitest'
import { applyValidationErrors } from './errorStyles'

describe('applyValidationErrors', () => {
  it('styles invalid nodes and edges from backend error payload', () => {
    const nodes = [
      { id: 'n1', style: {} },
      { id: 'n2', style: {} },
    ]
    const edges = [{ id: 'e1', style: {} }]

    const errors = [
      {
        code: 'TYPE_MISMATCH',
        message: 'Invalid type',
        nodeIds: ['n1', 'n2'],
        edgeIds: ['e1'],
      },
    ]

    const result = applyValidationErrors(nodes, edges, errors)

    expect(result.styledNodes[0].style.border).toContain('#d62828')
    expect(result.styledNodes[1].style.border).toContain('#d62828')
    expect(result.styledEdges[0].style.stroke).toBe('#d62828')
  })
})
