"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { SubgraphDTO } from "@/lib/api";

// ---------------------------------------------------------------------------
// Node type → colour mapping
// ---------------------------------------------------------------------------

const TYPE_COLORS: Record<string, string> = {
  USE_CASE:   "#8A9C8B",
  ASSET:      "#9baf9c",
  VENDOR:     "#9a9078",
  DATA_ASSET: "#C4924A",
  JURISDICTION: "#d4a456",
};

const CONFIDENCE_BORDER: Record<string, string> = {
  HIGH:   "#8A9C8B",
  MEDIUM: "#C4924A",
  LOW:    "#C86F58",
};

// ---------------------------------------------------------------------------
// Helpers: map API data → React Flow nodes/edges
// ---------------------------------------------------------------------------

function toFlowNode(
  node: SubgraphDTO["root"] | SubgraphDTO["neighbours"][number],
  isRoot: boolean,
  idx: number,
  total: number,
): Node {
  // Arrange neighbours in a circle around root
  const angle = (2 * Math.PI * idx) / Math.max(total, 1);
  const radius = 240;
  const x = isRoot ? 0 : Math.cos(angle) * radius;
  const y = isRoot ? 0 : Math.sin(angle) * radius;

  const color = TYPE_COLORS[node.type] ?? "#9a9078";
  const border = CONFIDENCE_BORDER[node.confidence] ?? "#5c5248";

  return {
    id: node.id,
    position: { x, y },
    data: { label: node.label },
    style: {
      background: "#1a1918",
      border: `2px solid ${isRoot ? color : border}`,
      borderRadius: "10px",
      color: "#D9C8B4",
      fontSize: "12px",
      padding: "8px 12px",
      maxWidth: "160px",
      boxShadow: isRoot ? `0 0 16px ${color}44` : "none",
      fontWeight: isRoot ? 700 : 400,
    },
  };
}

function toFlowEdge(edge: SubgraphDTO["edges"][number]): Edge {
  return {
    id: edge.id,
    source: edge.fromId,
    target: edge.toId,
    label: edge.type.replace(/_/g, " ").toLowerCase(),
    style: { stroke: "#2a2825", strokeWidth: 1.5 },
    labelStyle: { fill: "#5c5248", fontSize: 10 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#2a2825" },
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DependencyGraph({ subgraph }: { subgraph: SubgraphDTO }) {
  const initNodes: Node[] = [
    toFlowNode(subgraph.root, true, 0, 0),
    ...subgraph.neighbours.map((n, i) =>
      toFlowNode(n, false, i, subgraph.neighbours.length),
    ),
  ];
  const initEdges: Edge[] = subgraph.edges.map(toFlowEdge);

  const [nodes, , onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: "100%", height: "460px" }} className="rounded-xl overflow-hidden border border-[#2a2825]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        style={{ background: "#0d0d14" }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#2a2825" />
        <Controls style={{ background: "#1a1918", border: "1px solid #2a2825" }} />
        <MiniMap
          style={{ background: "#1a1918", border: "1px solid #2a2825" }}
          nodeColor={(n) => TYPE_COLORS[(n.data as { type?: string })?.type ?? ""] ?? "#8A9C8B"}
          maskColor="#1a1918aa"
        />
      </ReactFlow>
    </div>
  );
}
