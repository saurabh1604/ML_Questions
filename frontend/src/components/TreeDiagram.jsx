import React, { useRef, useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';

// Awesome Theme
const THEME = {
    class0: { fill: '#EFF6FF', stroke: '#3B82F6', text: '#1E3A8A' }, // Blue
    class1: { fill: '#FEF2F2', stroke: '#EF4444', text: '#991B1B' }, // Red
    neutral: { fill: '#F8FAFC', stroke: '#94A3B8', text: '#475569' }, // Slate
    link: '#CBD5E1',
    text: '#64748B'
};

const TreeDiagram = ({ structure, task, onNodeClick, selectedNode }) => {
    const containerRef = useRef(null);
    const dimensions = useResizeObserver(containerRef);
    const svgRef = useRef(null);

    // Transform state for zoom/pan
    const [transform, setTransform] = useState(d3.zoomIdentity);

    // Node Dimensions
    const nodeWidth = 140;
    const nodeHeight = 70;
    const xSpacing = 160;
    const ySpacing = 100;

    // Process Tree Data with Memoization
    const root = useMemo(() => {
        if (!structure) return null;
        const hierarchy = d3.hierarchy(structure);
        const treeLayout = d3.tree().nodeSize([nodeWidth + 20, ySpacing + 20]);
        return treeLayout(hierarchy);
    }, [structure, nodeWidth, ySpacing]);

    // Setup Zoom
    useEffect(() => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);

        const zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                setTransform(event.transform);
            });

        svg.call(zoom);

        // Center initial tree
        if (dimensions && root) {
            const initialScale = 0.8;
            const xOffset = dimensions.width / 2 - root.x * initialScale; // Center root
            const yOffset = 50;

            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale)
            );
        }

    }, [dimensions, root]);

    // Manual Zoom Handlers
    const handleZoom = (factor) => {
        if (!svgRef.current) return;
        d3.select(svgRef.current).transition().call(d3.zoom().scaleBy, factor);
    };

    const handleReset = () => {
         if (!svgRef.current || !dimensions || !root) return;
         const svg = d3.select(svgRef.current);
         const initialScale = 0.8;
         const xOffset = dimensions.width / 2;
         const yOffset = 50;
         svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale)
         );
    };

    if (!structure) return (
        <div ref={containerRef} className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 text-slate-400">
             <p>No model structure available.</p>
        </div>
    );

    return (
        <div ref={containerRef} className="w-full h-full min-h-[500px] relative bg-slate-50 overflow-hidden">
            <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing">
                <g transform={transform.toString()}>

                    {/* Links */}
                    <g className="links">
                        {root.links().map((link, i) => {
                            const d = d3.linkVertical()
                                .x(d => d.x)
                                .y(d => d.y)
                                (link);
                            return (
                                <path
                                    key={i}
                                    d={d}
                                    fill="none"
                                    stroke={THEME.link}
                                    strokeWidth={2}
                                    className="transition-all duration-500 ease-in-out"
                                />
                            );
                        })}
                    </g>

                    {/* Nodes */}
                    <g className="nodes">
                        {root.descendants().map((node, i) => {
                            const isLeaf = !node.children;
                            const isSelected = selectedNode && (node.data === selectedNode || node.data.id === selectedNode.id);

                            // Determine Color
                            let style = THEME.neutral;
                            if (task === 'classification') {
                                const counts = node.data.value || [0, 0];
                                const p1 = (counts[0] + counts[1] > 0) ? counts[1] / (counts[0] + counts[1]) : 0;
                                style = p1 > 0.5 ? THEME.class1 : THEME.class0;
                            } else {
                                // Regression: could map value to color intensity
                            }

                            return (
                                <g
                                    key={i}
                                    transform={`translate(${node.x},${node.y})`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNodeClick && onNodeClick(node.data);
                                    }}
                                    className={`cursor-pointer transition-all duration-300 ${isSelected ? 'scale-110' : 'hover:scale-105'}`}
                                >
                                    {/* Shadow for depth */}
                                    <rect
                                        x={-nodeWidth / 2}
                                        y={0}
                                        width={nodeWidth}
                                        height={nodeHeight}
                                        rx={12}
                                        fill="#000"
                                        opacity={0.05}
                                        transform="translate(4, 4)"
                                    />

                                    {/* Main Card */}
                                    <rect
                                        x={-nodeWidth / 2}
                                        y={0}
                                        width={nodeWidth}
                                        height={nodeHeight}
                                        rx={12}
                                        fill="white"
                                        stroke={isSelected ? '#10B981' : style.stroke}
                                        strokeWidth={isSelected ? 3 : 1.5}
                                        className="shadow-sm"
                                    />

                                    {/* Header Strip (Gini/Entropy) */}
                                    <path
                                        d={`M ${-nodeWidth/2} 0 Q ${-nodeWidth/2} 0, ${-nodeWidth/2} 0 L ${nodeWidth/2} 0 Q ${nodeWidth/2} 0, ${nodeWidth/2} 0 L ${nodeWidth/2} 24 L ${-nodeWidth/2} 24 Z`}
                                        // Rounded top corners manually or just clip
                                        // Simpler: Just a rect at top
                                    />
                                     <rect
                                        x={-nodeWidth / 2}
                                        y={0}
                                        width={nodeWidth}
                                        height={24}
                                        rx={12} // Rounded all
                                        fill={style.fill}
                                        clipPath="inset(0 0 10px 0)" // Clip bottom to make it flat? No, standard rect is fine
                                    />
                                     <rect
                                        x={-nodeWidth / 2}
                                        y={10}
                                        width={nodeWidth}
                                        height={14}
                                        fill={style.fill} // Filler to flatten bottom corners
                                    />

                                    {/* Header Text */}
                                    <text
                                        y={16}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fontWeight="bold"
                                        fill={style.text}
                                        className="uppercase tracking-wider"
                                    >
                                        {isLeaf ? (task === 'regression' ? `Val: ${node.data.value[0]?.toFixed(2)}` : `Class ${style === THEME.class1 ? '1' : '0'}`) :
                                         node.data.feature === 0 ? 'Feature X' : 'Feature Y'}
                                    </text>

                                    {/* Body Text */}
                                    <g transform="translate(0, 40)">
                                        {!isLeaf ? (
                                            <>
                                                <text textAnchor="middle" fontSize="14" fontWeight="bold" fill="#334155">
                                                    ≤ {node.data.threshold?.toFixed(2)}
                                                </text>
                                                <text y={16} textAnchor="middle" fontSize="9" fill="#94A3B8">
                                                    {node.data.impurity ? `Impurity: ${node.data.impurity.toFixed(2)}` : ''}
                                                </text>
                                            </>
                                        ) : (
                                            <>
                                                <text textAnchor="middle" fontSize="12" fontWeight="bold" fill="#334155">
                                                    {task === 'regression' ? '' : `Ratio: ${(node.data.value[1] / (node.data.value[0] + node.data.value[1])).toFixed(2)}`}
                                                </text>
                                                <text y={16} textAnchor="middle" fontSize="9" fill="#94A3B8">
                                                    Samples: {node.data.samples}
                                                </text>
                                            </>
                                        )}
                                    </g>

                                    {/* Connector Dot for Incoming Link */}
                                    {node.parent && (
                                        <circle cx={0} cy={0} r={4} fill={THEME.link} stroke="white" strokeWidth={2} />
                                    )}

                                    {/* Connector Dot for Outgoing Link */}
                                    {!isLeaf && (
                                        <circle cx={0} cy={nodeHeight} r={4} fill={THEME.link} stroke="white" strokeWidth={2} />
                                    )}
                                </g>
                            );
                        })}
                    </g>
                </g>
            </svg>

            {/* Controls */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                 <button onClick={() => handleZoom(1.2)} className="bg-white p-2 rounded-full shadow-lg text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all border border-slate-100">
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button onClick={() => handleZoom(0.8)} className="bg-white p-2 rounded-full shadow-lg text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all border border-slate-100">
                    <ZoomOut className="w-5 h-5" />
                </button>
                <button onClick={handleReset} className="bg-white p-2 rounded-full shadow-lg text-slate-600 hover:text-indigo-600 hover:scale-110 transition-all border border-slate-100">
                    <RotateCcw className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default TreeDiagram;
