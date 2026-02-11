import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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
    const gRef = useRef(null); // The group that gets zoomed

    // We keep track of the zoom behavior to call it manually
    const zoomBehavior = useRef(null);

    // 1. Setup Zoom & Draw Tree (Re-run only if structure or dimensions change)
    useEffect(() => {
        if (!svgRef.current || !gRef.current || !structure || !dimensions) return;

        const { width, height } = dimensions;
        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);

        // --- Layout Configuration ---
        const nodeWidth = 140;
        const nodeHeight = 70;
        const xSpacing = nodeWidth + 40;
        const ySpacing = nodeHeight + 60;

        const root = d3.hierarchy(structure);
        const treeLayout = d3.tree().nodeSize([xSpacing, ySpacing]);
        treeLayout(root);

        // --- Zoom Setup ---
        // Only initialize zoom once or if dimensions drastically change?
        // Actually, we can re-attach zoom, but we want to preserve transform if structure is same.
        // For now, let's just setup zoom.

        zoomBehavior.current = d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoomBehavior.current);

        // Center the tree initially
        // We only want to do this if it's a "fresh" tree.
        // A simple heuristic: if the transform is identity, center it.
        const currentTransform = d3.zoomTransform(svg.node());
        if (currentTransform.k === 1 && currentTransform.x === 0 && currentTransform.y === 0) {
             const initialScale = 0.8;
             const xOffset = width / 2 - root.x * initialScale;
             const yOffset = 50;
             svg.call(zoomBehavior.current.transform, d3.zoomIdentity.translate(xOffset, yOffset).scale(initialScale));
        }

        // --- Drawing ---
        g.selectAll("*").remove(); // Clear previous

        // Links
        const linksG = g.append("g").attr("class", "links");
        linksG.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
            .attr("fill", "none")
            .attr("stroke", THEME.link)
            .attr("stroke-width", 2)
            .attr("opacity", 0.6);

        // Nodes
        const nodesG = g.append("g").attr("class", "nodes");
        const nodeGroups = nodesG.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .style("cursor", "pointer")
            .on("click", (event, d) => {
                event.stopPropagation();
                if (onNodeClick) onNodeClick(d.data);
            });

        // Node Shadow
        nodeGroups.append("rect")
            .attr("x", -nodeWidth / 2 + 4)
            .attr("y", 4)
            .attr("width", nodeWidth)
            .attr("height", nodeHeight)
            .attr("rx", 12)
            .attr("fill", "#000")
            .attr("opacity", 0.05);

        // Node Card (Background)
        nodeGroups.append("rect")
            .attr("class", "node-card") // targeted for selection
            .attr("x", -nodeWidth / 2)
            .attr("y", 0)
            .attr("width", nodeWidth)
            .attr("height", nodeHeight)
            .attr("rx", 12)
            .attr("fill", "white")
            .attr("stroke", d => {
                 // Initial stroke
                 return THEME.neutral.stroke;
            })
            .attr("stroke-width", 1.5);

        // Header Strip
        nodeGroups.append("path")
            .attr("d", d => {
                const r = 12;
                const w = nodeWidth;
                const h = 24;
                // Top rounded rect path
                return `M ${-w/2} ${h} V ${r} Q ${-w/2} 0 ${-w/2 + r} 0 H ${w/2 - r} Q ${w/2} 0 ${w/2} ${r} V ${h} Z`;
            })
            .attr("fill", d => {
                if (task === 'regression') return THEME.neutral.fill;
                const counts = d.data.value || [0, 0];
                const p1 = (counts[0] + counts[1] > 0) ? counts[1] / (counts[0] + counts[1]) : 0;
                return p1 > 0.5 ? THEME.class1.fill : THEME.class0.fill;
            });

        // Header Text (Feature/Class)
        nodeGroups.append("text")
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.05em")
            .attr("fill", d => {
                 if (task === 'regression') return THEME.text;
                 const counts = d.data.value || [0, 0];
                 const p1 = (counts[0] + counts[1] > 0) ? counts[1] / (counts[0] + counts[1]) : 0;
                 return p1 > 0.5 ? THEME.class1.text : THEME.class0.text;
            })
            .text(d => {
                if (!d.children) { // Leaf
                    return task === 'regression' ? `Val: ${d.data.value[0]?.toFixed(2)}` : `Class ${(d.data.value[1] > d.data.value[0]) ? '1' : '0'}`;
                }
                return d.data.feature === 0 ? 'Feature X' : 'Feature Y';
            });

        // Body Text
        const bodyG = nodeGroups.append("g").attr("transform", "translate(0, 40)");

        // Threshold / Info
        bodyG.append("text")
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .attr("fill", "#334155")
            .text(d => {
                if (!d.children) return task === 'regression' ? '' : `Ratio: ${(d.data.value[1] / (d.data.value[0] + d.data.value[1])).toFixed(2)}`;
                return `≤ ${d.data.threshold?.toFixed(2)}`;
            });

        // Secondary Info (Impurity/Samples)
        bodyG.append("text")
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .style("font-size", "9px")
            .attr("fill", "#94A3B8")
            .text(d => {
                if (!d.children) return `Samples: ${d.data.samples}`;
                return d.data.impurity ? `Impurity: ${d.data.impurity.toFixed(2)}` : `Samples: ${d.data.samples}`;
            });

    }, [structure, dimensions, task]); // Re-draw only if structure changes

    // 2. Handle Selection (Independent Effect)
    useEffect(() => {
        if (!gRef.current) return;
        const g = d3.select(gRef.current);

        g.selectAll(".node-card")
            .transition().duration(200)
            .attr("stroke", d => {
                const isSelected = selectedNode && (d.data === selectedNode || (d.data.threshold === selectedNode.threshold && d.data.feature === selectedNode.feature));
                if (isSelected) return "#10B981"; // Green

                // Default stroke
                if (task === 'classification') {
                     const counts = d.data.value || [0, 0];
                     const p1 = (counts[0] + counts[1] > 0) ? counts[1] / (counts[0] + counts[1]) : 0;
                     return p1 > 0.5 ? THEME.class1.stroke : THEME.class0.stroke;
                }
                return THEME.neutral.stroke;
            })
            .attr("stroke-width", d => {
                const isSelected = selectedNode && (d.data === selectedNode || (d.data.threshold === selectedNode.threshold && d.data.feature === selectedNode.feature));
                return isSelected ? 4 : 1.5;
            });

    }, [selectedNode, task]);


    // Manual Zoom Controls
    const handleZoom = (factor) => {
        if (!svgRef.current || !zoomBehavior.current) return;
        d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.current.scaleBy, factor);
    };

    const handleReset = () => {
         if (!svgRef.current || !zoomBehavior.current || !dimensions) return;
         // Reset to center?
         // We'd need to re-calculate center.
         // For simplicity, just reset to identity or a sensible default.
         d3.select(svgRef.current).transition().duration(750).call(
            zoomBehavior.current.transform,
            d3.zoomIdentity.translate(dimensions.width/2, 50).scale(0.8)
         );
    };

    if (!structure) return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center bg-slate-50 text-slate-400">
             <p>No model structure available.</p>
        </div>
    );

    return (
        <div ref={containerRef} className="w-full h-full min-h-[500px] relative bg-slate-50 overflow-hidden rounded-b-2xl">
            <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing">
                <g ref={gRef}></g>
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
