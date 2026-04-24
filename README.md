# Smart Document Pipeline

This repository contains a monorepo implementation of a Smart Document Pipeline builder.

## Workspace Layout

- `/backend`: Express API, PostgreSQL persistence, graph validation engine
- `/frontend`: React + React Flow UI for drag-and-drop pipeline design
- `/shared`: Canonical node type and data type registry consumed by backend and frontend

## Canonical Node Registry

The canonical registry is defined in:

- `/home/runner/work/smart-document-pipeline/smart-document-pipeline/shared/src/nodeTypes.js`

Both frontend and backend import this exact module to avoid contract drift.

## PostgreSQL Schema

Schema SQL:

- `/home/runner/work/smart-document-pipeline/smart-document-pipeline/backend/db/schema.sql`

Main tables:

- `pipelines`
- `pipeline_nodes`
- `pipeline_edges`

Includes:

- FK constraints with cascading deletes
- Deferrable edge-to-node FK constraints
- indexes for pipeline and node lookups

## API: Save / Update Pipeline

### `POST /api/pipelines`

Accepts full graph payload:

```json
{
  "id": "optional-uuid",
  "name": "Pipeline Name",
  "nodes": [
    {
      "id": "node-1",
      "type": "ocr",
      "position": { "x": 120, "y": 80 },
      "data": {}
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-a",
      "target": "node-b",
      "sourceHandle": null,
      "targetHandle": null
    }
  ]
}
```

Behavior:

- Runs validation before persistence
- On validation errors, returns `422`
- On success, upserts pipeline metadata and replaces node/edge sets in a transaction

## Validation Error Contract

Validation failures return:

```json
{
  "message": "Pipeline validation failed.",
  "errors": [
    {
      "code": "TYPE_MISMATCH",
      "message": "Cannot connect OCR to Image Resize.",
      "nodeIds": ["node-a", "node-b"],
      "edgeIds": ["edge-1"]
    }
  ]
}
```

Frontend maps `nodeIds` and `edgeIds` to visual highlighting (red border/stroke).

## Implemented Business Rules

1. Type matching across all edges
2. Document Merger: exactly two incoming edges from distinct parent nodes
3. DAG enforcement with only one exception:
   - cycles are rejected unless they include `Human Review -> Text Correction`

## Commands

Run from repository root:

```bash
npm install
npm run lint
npm run test
npm run build
```

Run app locally:

```bash
# terminal 1
npm run start -w backend

# terminal 2
npm run dev -w frontend
```
