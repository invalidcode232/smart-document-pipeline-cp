export function applyValidationErrors(nodes, edges, errors) {
  const invalidNodeIds = new Set()
  const invalidEdgeIds = new Set()

  for (const err of errors || []) {
    for (const nodeId of err.nodeIds || []) invalidNodeIds.add(nodeId)
    for (const edgeId of err.edgeIds || []) invalidEdgeIds.add(edgeId)
  }

  const styledNodes = nodes.map((node) => ({
    ...node,
    style: invalidNodeIds.has(node.id)
      ? { ...(node.style || {}), border: '2px solid #d62828' }
      : { ...(node.style || {}) },
  }))

  const styledEdges = edges.map((edge) => ({
    ...edge,
    style: invalidEdgeIds.has(edge.id)
      ? { ...(edge.style || {}), stroke: '#d62828', strokeWidth: 3 }
      : { ...(edge.style || {}) },
  }))

  return { styledNodes, styledEdges }
}
