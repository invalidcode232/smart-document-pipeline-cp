import { NODE_TYPES } from "@smart-document-pipeline/shared";

function error(code, message, nodeIds = [], edgeIds = []) {
  return { code, message, nodeIds, edgeIds };
}

function findCycles(nodesById, adjacency) {
  const visited = new Set();
  const inStack = new Set();
  const stack = [];
  const cycles = [];

  const dfs = (nodeId) => {
    visited.add(nodeId);
    inStack.add(nodeId);
    stack.push(nodeId);

    for (const nextId of adjacency.get(nodeId) || []) {
      if (!visited.has(nextId)) {
        dfs(nextId);
      } else if (inStack.has(nextId)) {
        const start = stack.indexOf(nextId);
        if (start >= 0) {
          cycles.push([...stack.slice(start), nextId]);
        }
      }
    }

    stack.pop();
    inStack.delete(nodeId);
  };

  for (const nodeId of nodesById.keys()) {
    if (!visited.has(nodeId)) dfs(nodeId);
  }

  return cycles;
}

function cycleHasAllowedException(cycleNodePath, edges, nodesById) {
  const cycleNodeSet = new Set(cycleNodePath);
  const cycleEdges = edges.filter((e) => cycleNodeSet.has(e.source) && cycleNodeSet.has(e.target));

  const hasHumanReviewToTextCorrection = cycleEdges.some((edge) => {
    const sourceType = nodesById.get(edge.source)?.type;
    const targetType = nodesById.get(edge.target)?.type;
    return sourceType === "humanReview" && targetType === "textCorrection";
  });

  return hasHumanReviewToTextCorrection;
}

export function validatePipelineGraph(payload) {
  const nodes = payload?.nodes || [];
  const edges = payload?.edges || [];
  const errors = [];

  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map();
  const incoming = new Map();

  for (const edge of edges) {
    const sourceNode = nodesById.get(edge.source);
    const targetNode = nodesById.get(edge.target);

    if (!sourceNode || !targetNode) {
      errors.push(
        error(
          "MISSING_NODE_REFERENCE",
          `Edge ${edge.id} references missing nodes.`,
          [edge.source, edge.target].filter(Boolean),
          [edge.id],
        ),
      );
      continue;
    }

    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);

    if (!incoming.has(edge.target)) incoming.set(edge.target, []);
    incoming.get(edge.target).push(edge);

    const sourceSpec = NODE_TYPES[sourceNode.type];
    const targetSpec = NODE_TYPES[targetNode.type];

    if (!sourceSpec || !targetSpec) {
      errors.push(
        error(
          "UNKNOWN_NODE_TYPE",
          `Unknown node type in edge ${edge.id}.`,
          [sourceNode.id, targetNode.id],
          [edge.id],
        ),
      );
      continue;
    }

    // NODE_TYPES specifies the type of acceptable inputs & outputs,
    // we use this to check for type compatibility here
    const compatible = sourceSpec.outputs.some((outType) => targetSpec.inputs.includes(outType));

    if (!compatible) {
      errors.push(
        error(
          "TYPE_MISMATCH",
          `Cannot connect ${sourceSpec.label} to ${targetSpec.label}.`,
          [sourceNode.id, targetNode.id],
          [edge.id],
        ),
      );
    }
  }

  for (const node of nodes) {
    if (node.type !== "documentMerger") continue;
    const incomingEdges = incoming.get(node.id) || [];

    if (incomingEdges.length !== 2) {
      errors.push(
        error(
          "INVALID_MERGER_INCOMING_COUNT",
          "Document Merger must have exactly two incoming edges.",
          [node.id],
          incomingEdges.map((e) => e.id),
        ),
      );
      continue;
    }

    // Remove duplicates to check the number of *unique* parent nodes
    const uniqueParents = new Set(incomingEdges.map((e) => e.source));
    if (uniqueParents.size !== 2) {
      errors.push(
        error(
          "INVALID_MERGER_PARENT_DUPLICATE",
          "Document Merger incoming edges must come from two distinct parent nodes.",
          [node.id],
          incomingEdges.map((e) => e.id),
        ),
      );
    }
  }

  const cycles = findCycles(nodesById, adjacency);
  for (const cycle of cycles) {
    if (!cycleHasAllowedException(cycle, edges, nodesById)) {
      const cycleNodeSet = [...new Set(cycle)];
      const cycleEdgeIds = edges
        .filter((edge) => cycleNodeSet.includes(edge.source) && cycleNodeSet.includes(edge.target))
        .map((edge) => edge.id);

      errors.push(
        error(
          "INVALID_CYCLE",
          "Cycle detected. Only Human Review -> Text Correction loop-backs are allowed.",
          cycleNodeSet,
          cycleEdgeIds,
        ),
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
