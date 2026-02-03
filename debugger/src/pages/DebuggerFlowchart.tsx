import { useEffect, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    MarkerType,
    BackgroundVariant,
    type Edge,
    type Node as RFNode
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { useFlowStore } from '../stores/useFlowStore.ts';
import { Maximize, Search, Filter, Share2 } from 'lucide-react';

// Hierarchical layout configuration
const nodeWidth = 280;
const nodeHeight = 100;

const getLayoutedElements = (nodes: RFNode[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
        rankdir: direction,
        nodesep: 80,
        ranksep: 120,
        marginx: 50,
        marginy: 50
    });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - nodeWidth / 2,
                y: nodeWithPosition.y - nodeHeight / 2,
            },
        };
    });

    return { nodes: layoutedNodes, edges };
};

function FlowchartContent() {
    const { currentFlowId, flows } = useFlowStore();
    const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const { fitView, setCenter } = useReactFlow();

    useEffect(() => {
        if (!currentFlowId || !flows[currentFlowId]) return;

        const flow = flows[currentFlowId];

        // Transform our custom flow data to React Flow format
        const reactFlowNodes: RFNode[] = Object.values(flow.nodes).map((node) => ({
            id: node.id,
            position: { x: 0, y: 0 }, // Will be set by layout algorithm
            data: {
                label: node.text,
                type: node.type,
                nodeId: node.id
            },
            style: {
                background: node.type === 'terminal' ? '#FEE2E2' : '#FFFFFF',
                color: '#111827',
                borderRadius: '12px',
                padding: '20px',
                fontSize: '14px',
                fontWeight: '600',
                width: nodeWidth,
                minHeight: nodeHeight,
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                border: node.id === flow.startNodeId ? '3px solid #DC2626' : '1px solid #E5E7EB',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }
        }));

        const reactFlowEdges: Edge[] = [];
        Object.values(flow.nodes).forEach((node) => {
            node.options.forEach((option) => {
                reactFlowEdges.push({
                    id: `${node.id}-${option.next}`,
                    source: node.id,
                    target: option.next,
                    label: option.label,
                    labelStyle: { fill: '#DC2626', fontWeight: 700, fontSize: 11 },
                    labelBgStyle: { fill: '#FEE2E2', fillOpacity: 0.9 },
                    labelBgPadding: [6, 4] as [number, number],
                    labelBgBorderRadius: 6,
                    animated: node.type === 'diagnosis',
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: '#9CA3AF',
                        width: 20,
                        height: 20,
                    },
                    style: {
                        stroke: '#9CA3AF',
                        strokeWidth: 2
                    }
                });
            });
        });

        // Apply hierarchical layout
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            reactFlowNodes,
            reactFlowEdges,
            'TB' // Top to Bottom
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

        // Fit view after layout
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 800 });
        }, 50);
    }, [currentFlowId, flows, setNodes, setEdges, fitView]);

    // Zoom to node on click
    const handleNodeClick = useCallback((_event: React.MouseEvent, node: RFNode) => {
        const zoom = 1.2;
        const x = node.position.x + nodeWidth / 2;
        const y = node.position.y + nodeHeight / 2;

        setCenter(x, y, { zoom, duration: 600 });
    }, [setCenter]);

    // Fit view handler
    const handleFitView = useCallback(() => {
        fitView({ padding: 0.2, duration: 800 });
    }, [fitView]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <header className="h-16 px-8 flex items-center justify-between bg-white border-b border-gray-200 z-10">
                <div className="flex items-center gap-6">
                    <h2 className="text-lg font-bold">Flow Visualization</h2>
                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                        <Search size={16} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search nodes..."
                            className="bg-transparent text-sm focus:outline-none w-48 font-medium"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
                        <Filter size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-900 transition-colors">
                        <Share2 size={20} />
                    </button>
                    <div className="w-[1px] h-6 bg-gray-200 mx-1" />
                    <button
                        onClick={handleFitView}
                        className="btn-primary flex items-center gap-2 py-1.5 px-4 text-sm"
                    >
                        <Maximize size={16} /> Fit View
                    </button>
                </div>
            </header>

            {/* React Flow Canvas */}
            <div className="flex-1 bg-gray-50 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleNodeClick}
                    fitView
                    minZoom={0.1}
                    maxZoom={2}
                    defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <Controls />
                    <MiniMap
                        style={{ height: 120, width: 200 }}
                        nodeColor={(n: any) => n.data?.type === 'terminal' ? '#DC2626' : '#E5E7EB'}
                        maskColor="rgba(0, 0, 0, 0.05)"
                    />
                </ReactFlow>
            </div>

            {/* Legend */}
            <div className="absolute bottom-6 left-6 z-10 p-4 bg-white/90 backdrop-blur rounded-xl border border-gray-200 shadow-xl space-y-2 pointer-events-none">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Legend</p>
                <div className="flex items-center gap-3 text-xs font-semibold">
                    <div className="w-4 h-4 rounded border-2 border-primary" />
                    <span>Start Node</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                    <span>Terminal/Action</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                    <div className="w-4 h-1 bg-gray-300 rounded" />
                    <span>Connection</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-primary">
                    <span>💡 Click nodes to zoom</span>
                </div>
            </div>
        </div>
    );
}

// Wrap in ReactFlowProvider to provide context
export default function DebuggerFlowchartWrapper() {
    return (
        <ReactFlowProvider>
            <FlowchartContent />
        </ReactFlowProvider>
    );
}
