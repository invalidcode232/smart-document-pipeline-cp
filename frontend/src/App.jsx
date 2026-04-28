import { useCallback, useMemo, useState } from 'react'
import {
    addEdge,
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    useEdgesState,
    useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { NODE_TYPES } from '@smart-document-pipeline/shared'
import { applyValidationErrors } from './errorStyles'
import './App.css'

let nodeCounter = 1
let edgeCounter = 1

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'

function createNode(type) {
    return {
        id: `node-${nodeCounter++}`,
        type: 'default',
        position: { x: 80 + Math.random() * 200, y: 80 + Math.random() * 200 },
        data: { label: NODE_TYPES[type].label },
        pipelineType: type,
    }
}

function toSavePayload(nodes, edges, pipelineName) {
    return {
        name: pipelineName,
        nodes: nodes.map((node) => ({
            id: node.id,
            type: node.pipelineType,
            position: node.position,
            data: node.data,
        })),
        edges: edges.map((edge) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle || null,
            targetHandle: edge.targetHandle || null,
        })),
    }
}

export default function App() {
    const [nodes, setNodes, onNodesChange] = useNodesState([])
    const [edges, setEdges, onEdgesChange] = useEdgesState([])
    const [errors, setErrors] = useState([])
    const [pipelineName, setPipelineName] = useState('My Pipeline')

    const addNode = useCallback(
        (type) => {
            setErrors([])
            setNodes((prev) => [...prev, createNode(type)])
        },
        [setNodes],
    )

    const onConnect = useCallback(
        (connection) => {
            setErrors([])
            setEdges((eds) =>
                addEdge(
                    {
                        ...connection,
                        id: `edge-${edgeCounter++}`,
                    },
                    eds,
                ),
            )
        },
        [setEdges],
    )

    const savePipeline = useCallback(async () => {
        const payload = toSavePayload(nodes, edges, pipelineName)
        const response = await fetch(`${API_BASE_URL}/api/pipelines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            const body = await response.json()
            setErrors(body.errors || [{ message: 'Unknown validation error.' }])
            return
        }

        setErrors([])
    }, [nodes, edges, pipelineName])

    const styledGraph = useMemo(
        () => applyValidationErrors(nodes, edges, errors),
        [nodes, edges, errors],
    )

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <h2>Node Palette</h2>
                <label htmlFor="pipelineName">Pipeline Name</label>
                <input
                    id="pipelineName"
                    value={pipelineName}
                    onChange={(e) => setPipelineName(e.target.value)}
                />
                <div className="palette-list">
                    {Object.entries(NODE_TYPES).map(([key, value]) => (
                        <button key={key} type="button" onClick={() => addNode(key)}>
                            {value.label}
                        </button>
                    ))}
                </div>
                <button type="button" className="save-btn" onClick={savePipeline}>
                    Save Pipeline
                </button>

                <div className="errors-panel">
                    <h3>Validation Errors</h3>
                    {!errors.length && <p>None</p>}
                    <ul>
                        {errors.map((err, index) => (
                            <li key={`${err.code || 'error'}-${index}`}>
                                <strong>{err.code || 'ERROR'}:</strong> {err.message}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>

            <main className="canvas">
                <ReactFlow
                    nodes={styledGraph.styledNodes}
                    edges={styledGraph.styledEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    fitView
                >
                    <MiniMap />
                    <Controls />
                    <Background />
                </ReactFlow>
            </main>
        </div>
    )
}
