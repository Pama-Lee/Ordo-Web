import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom Input Node
const InputNode = ({ data }: { data: { label: string; code: string } }) => {
  return (
    <div className="input-node">
      <Handle type="source" position={Position.Right} className="handle-right" />
      <div className="node-header">
        <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span>{data.label}</span>
      </div>
      <div className="node-code">
        <pre>{data.code}</pre>
      </div>
    </div>
  );
};

// Custom Engine Node
const EngineNode = ({ data }: { data: { label: string; subtitle: string } }) => {
  return (
    <div className="engine-node">
      <Handle type="target" position={Position.Left} className="handle-left" />
      <Handle type="source" position={Position.Right} className="handle-right" />
      <div className="engine-glow"></div>
      <div className="engine-ring"></div>
      <div className="engine-content">
        <img src="/images/favicon_io/apple-touch-icon.png" alt="Ordo" className="engine-logo" />
        <span className="engine-label">{data.label}</span>
        <span className="engine-subtitle">{data.subtitle}</span>
      </div>
      {/* Static particles - no rotation */}
      <div className="engine-particles">
        <div className="particle particle-1">JIT</div>
        <div className="particle particle-2">0 Alloc</div>
        <div className="particle particle-3">1.63µs</div>
      </div>
    </div>
  );
};

// Custom Output Node
const OutputNode = ({ data }: { data: { label: string; code: string } }) => {
  return (
    <div className="output-node">
      <Handle type="target" position={Position.Left} className="handle-left" />
      <div className="node-header success">
        <svg className="node-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        <span>{data.label}</span>
      </div>
      <div className="node-code success">
        <pre>{data.code}</pre>
      </div>
    </div>
  );
};

const nodeTypes = {
  inputNode: InputNode,
  engineNode: EngineNode,
  outputNode: OutputNode,
};

interface FlowDiagramProps {
  inputLabel?: string;
  outputLabel?: string;
  engineLabel?: string;
  engineSubtitle?: string;
}

export default function FlowDiagramReact({
  inputLabel = 'Input JSON',
  outputLabel = 'Decision Result',
  engineLabel = 'ORDO',
  engineSubtitle = 'ENGINE',
}: FlowDiagramProps) {
  const inputCode = `{
  "user": {
    "vip": true,
    "level": "gold"
  },
  "order": {
    "amount": 1500
  }
}`;

  const outputCode = `{
  "result": "VIP_DISCOUNT",
  "discount": 0.20,
  "trace": ["check_vip", "vip_discount"],
  "duration_us": 1.63
}`;

  const initialNodes: Node[] = [
    {
      id: 'input',
      type: 'inputNode',
      position: { x: 0, y: 80 },
      data: { label: inputLabel, code: inputCode },
    },
    {
      id: 'engine',
      type: 'engineNode',
      position: { x: 320, y: 50 },
      data: { label: engineLabel, subtitle: engineSubtitle },
    },
    {
      id: 'output',
      type: 'outputNode',
      position: { x: 620, y: 95 },
      data: { label: outputLabel, code: outputCode },
    },
  ];

  const initialEdges: Edge[] = [
    {
      id: 'input-engine',
      source: 'input',
      target: 'engine',
      animated: true,
      style: { stroke: '#f97316', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#f97316',
        width: 20,
        height: 20,
      },
      label: 'JSON',
      labelStyle: { fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
    },
    {
      id: 'engine-output',
      source: 'engine',
      target: 'output',
      animated: true,
      style: { stroke: '#22c55e', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#22c55e',
        width: 20,
        height: 20,
      },
      label: '1.63µs',
      labelStyle: { fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="flow-diagram-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#1e293b" gap={20} size={1} />
      </ReactFlow>
      
      <style>{`
        .flow-diagram-container {
          width: 100%;
          height: 380px;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
        }
        
        .react-flow__node {
          font-family: 'JetBrains Mono', monospace;
        }
        
        /* Handle Styles */
        .react-flow__handle {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #f97316;
          border: 2px solid #0f172a;
        }
        
        .handle-right {
          right: -5px;
        }
        
        .handle-left {
          left: -5px;
        }
        
        .output-node .react-flow__handle {
          background: #22c55e;
        }
        
        /* Input Node Styles */
        .input-node {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 12px;
          padding: 0;
          min-width: 200px;
          box-shadow: 0 0 30px rgba(249, 115, 22, 0.1);
          transition: all 0.3s ease;
        }
        
        .input-node:hover {
          border-color: rgba(249, 115, 22, 0.6);
          box-shadow: 0 0 40px rgba(249, 115, 22, 0.2);
        }
        
        .node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(249, 115, 22, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px 12px 0 0;
          font-size: 11px;
          font-weight: 600;
          color: #f97316;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .node-header.success {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
        }
        
        .node-icon {
          width: 14px;
          height: 14px;
        }
        
        .node-code {
          padding: 12px 14px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 0 0 12px 12px;
        }
        
        .node-code pre {
          margin: 0;
          font-size: 10px;
          line-height: 1.5;
          color: #94a3b8;
          white-space: pre;
        }
        
        .node-code.success pre {
          color: #86efac;
        }
        
        /* Output Node Styles */
        .output-node {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 12px;
          padding: 0;
          min-width: 220px;
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.1);
          transition: all 0.3s ease;
        }
        
        .output-node:hover {
          border-color: rgba(34, 197, 94, 0.6);
          box-shadow: 0 0 40px rgba(34, 197, 94, 0.2);
        }
        
        /* Engine Node Styles */
        .engine-node {
          position: relative;
          width: 200px;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .engine-glow {
          position: absolute;
          inset: -10px;
          background: radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, transparent 70%);
          border-radius: 50%;
          animation: pulse 3s ease-in-out infinite;
        }
        
        .engine-ring {
          position: absolute;
          inset: 20px;
          border: 2px dashed rgba(249, 115, 22, 0.4);
          border-radius: 50%;
          animation: spin 20s linear infinite;
        }
        
        .engine-content {
          position: relative;
          z-index: 10;
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          border: 2px solid rgba(249, 115, 22, 0.5);
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 40px rgba(249, 115, 22, 0.2), inset 0 0 30px rgba(0, 0, 0, 0.5);
        }
        
        .engine-logo {
          width: 45px;
          height: 45px;
          margin-bottom: 4px;
        }
        
        .engine-label {
          font-size: 14px;
          font-weight: bold;
          color: white;
          letter-spacing: 2px;
        }
        
        .engine-subtitle {
          font-size: 8px;
          color: #f97316;
          letter-spacing: 3px;
          margin-top: 2px;
        }
        
        .engine-particles {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .particle {
          position: absolute;
          padding: 4px 8px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(249, 115, 22, 0.5);
          border-radius: 4px;
          font-size: 9px;
          color: #f97316;
          white-space: nowrap;
          animation: float 3s ease-in-out infinite;
        }
        
        .particle-1 {
          top: 5px;
          left: 50%;
          transform: translateX(-50%);
          animation-delay: 0s;
        }
        
        .particle-2 {
          bottom: 35px;
          left: 5px;
          animation-delay: 1s;
        }
        
        .particle-3 {
          bottom: 35px;
          right: 5px;
          animation-delay: 2s;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.03); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(-50%); }
          50% { transform: translateY(-5px) translateX(-50%); }
        }
        
        .particle-2, .particle-3 {
          animation-name: floatSide;
        }
        
        @keyframes floatSide {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        /* Edge animation enhancement */
        .react-flow__edge-path {
          stroke-dasharray: 5 5;
          animation: dash 0.5s linear infinite;
        }
        
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .flow-diagram-container {
            height: 500px;
          }
          
          .input-node, .output-node {
            min-width: 160px;
          }
          
          .node-code pre {
            font-size: 9px;
          }
          
          .engine-node {
            width: 160px;
            height: 160px;
          }
          
          .engine-content {
            width: 100px;
            height: 100px;
          }
          
          .engine-logo {
            width: 35px;
            height: 35px;
          }
          
          .engine-label {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
