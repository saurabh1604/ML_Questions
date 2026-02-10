import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { RefreshCw, Minus, Plus } from 'lucide-react';

// Awesome Theme Colors (Shared Concept)
const THEME = {
    class0: '#3B82F6', // Blue 500
    class1: '#EF4444', // Red 500
    stroke: '#CBD5E1', // Slate 300
    text: '#475569',   // Slate 600
    selected: '#10B981' // Emerald 500
};

const TreeDiagram = ({ structure, task, onNodeClick, selectedNode }) => {
    const containerRef = useRef(null);
    const dimensions = useResizeObserver(containerRef);
    const svgRef = useRef(null);
    const gRef = useRef(null);

    // Zoom State
    const [zoomTransform, setZoomTransform] = useState(d3.zoomIdentity);

    // Setup Zoom
    useEffect(() => {
        if (!svgRef.current || !gRef.current) return;

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);

        const zoomBehavior = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setZoomTransform(event.transform);
            });

        svg.call(zoomBehavior);
        // Initial center happens in the draw effect
    }, []);

    const handleZoom = (factor) => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.transition().duration(300).call(d3.zoom().scaleBy, factor);
    };

    const resetZoom = () => {
        if (!svgRef.current || !dimensions) return;
        const svg = d3.select(svgRef.current);
        // Reset to center roughly
        svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity.translate(dimensions.width/2, 50).scale(0.8)
        );
    };

    // Draw Tree
    useEffect(() => {
        if (!structure || !dimensions || !gRef.current) return;

        const { width, height } = dimensions;
        if (width === 0 || height === 0) return;

        const g = d3.select(gRef.current);
        g.selectAll("*").remove(); // Clear

        // 1. Process Data
        const root = d3.hierarchy(structure);

        // 2. Layout
        // We use nodeSize to ensure consistent spacing regardless of tree size
        // x is horizontal, y is vertical in d3.tree() by default?
        // No, d3.tree() produces x,y coordinates.
        // If we want top-down: x is horizontal, y is vertical.

        const nodeWidth = 70;
        const nodeHeight = 80;

        const treeLayout = d3.tree().nodeSize([nodeWidth, nodeHeight]);
        treeLayout(root);

        // Center the tree horizontally
        // d3.tree with nodeSize sets root at (0,0).
        // Children spread out around 0.
        // We need to translate the group to the center of the SVG.

        // However, the zoom behavior controls the transform of gRef.
        // But we want the *content* to be centered initially.
        // If we rely on d3.zoom identity, (0,0) is top-left.
        // So we should just render the tree as is, and let the initial zoom handle centering?
        // Or wrap the content in a group that is centered?
        // Let's render relative to (0,0) being root, and set initial translation.

        // Fix overlaps if tree is wide
        let x0 = Infinity;
        let x1 = -Infinity;
        root.each(d => {
            if (d.x > x1) x1 = d.x;
            if (d.x < x0) x0 = d.x;
        });

        // 3. Draw Links (Curved)
        const linkPath = d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y);

        const linksG = g.append("g").attr("class", "links");

        linksG.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", linkPath)
            .attr("fill", "none")
            .attr("stroke", THEME.stroke)
            .attr("stroke-width", 2)
            .attr("opacity", 0.6);

        // 4. Draw Nodes
        const nodesG = g.append("g").attr("class", "nodes");

        const nodeGroups = nodesG.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node cursor-pointer transition-opacity")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .on("click", (event, d) => {
                event.stopPropagation();
                if (onNodeClick) onNodeClick(d.data); // Pass raw data
            });

        // Node Circle
        nodeGroups.append("circle")
            .attr("r", 8)
            .attr("fill", d => {
                // Color by dominant class
                if (task === 'regression') {
                     // Regression: color by value (normalized? hard without domain)
                     // Just use a neutral or gradient based on value vs parent?
                     // Simple: Blue
                     return "#60A5FA";
                } else {
                    // Classification: Class 0 vs 1
                    // value is [count0, count1]
                    const counts = d.data.value || [0, 0];
                    const total = counts[0] + counts[1];
                    const p1 = total > 0 ? counts[1] / total : 0;
                    // Interpolate color? Or hard split?
                    // Hard split matches the regions usually.
                    return p1 > 0.5 ? THEME.class1 : THEME.class0;
                }
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            // Selected State Ring
            .each(function(d) {
                if (selectedNode && (d.data === selectedNode || d.data.id === selectedNode.id)) {
                    d3.select(this)
                        .attr("stroke", THEME.selected)
                        .attr("stroke-width", 3)
                        .attr("r", 10);
                }
            });

        // Labels (Background)
        const labelGroup = nodeGroups.append("g")
            .attr("transform", "translate(0, -15)"); // Above node

        labelGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("fill", THEME.text)
            .style("font-family", "Inter, sans-serif")
            .style("font-weight", "600")
            .style("font-size", "10px")
            .text(d => {
                if (!d.children) return ""; // Leaf? Maybe show class
                // Split node
                return d.data.feature === 0
                    ? `X ≤ ${d.data.threshold.toFixed(2)}`
                    : `Y ≤ ${d.data.threshold.toFixed(2)}`;
            })
            .call(text => text.clone(true).lower()
                .attr("stroke", "white")
                .attr("stroke-width", 4)
                .attr("stroke-linejoin", "round")
            );

        // Leaf Labels (Class Prediction)
        nodeGroups.filter(d => !d.children).append("text")
            .attr("dy", "20")
            .attr("text-anchor", "middle")
            .attr("fill", "#94a3b8")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "9px")
            .style("font-weight", "500")
            .text(d => {
                 if (task === 'regression') return d.data.value[0]?.toFixed(2);
                 const counts = d.data.value || [0, 0];
                 return counts[1] > counts[0] ? "Class 1" : "Class 0";
            });

    }, [structure, dimensions, selectedNode, task]);

    // Initial centering when data loads
    useEffect(() => {
        if (structure && dimensions && svgRef.current) {
            // Wait for render?
            // Simple approach: Center (0,0) (root) at (width/2, 50)
            const svg = d3.select(svgRef.current);
             svg.call(d3.zoom().transform, d3.zoomIdentity.translate(dimensions.width / 2, 40).scale(1));
        }
    }, [structure, dimensions?.width]); // dimensions?.width helps trigger on resize

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-50/30">
            <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing">
                <g ref={gRef}></g>
            </svg>

            <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 bg-white/90 backdrop-blur shadow-sm rounded-lg p-1.5 border border-slate-200">
                <button onClick={() => handleZoom(1.2)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition" title="Zoom In">
                    <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => handleZoom(0.8)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition" title="Zoom Out">
                    <Minus className="w-4 h-4" />
                </button>
                <div className="h-px bg-slate-200 my-0.5"></div>
                <button onClick={resetZoom} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition" title="Reset View">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

             {!structure && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <p className="text-sm font-medium">No model structure</p>
                </div>
            )}
        </div>
    );
};

export default TreeDiagram;
