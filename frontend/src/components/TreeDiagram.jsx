import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

const TreeDiagram = ({ structure, task, onNodeClick, selectedNode, dataDomain }) => {
    const containerRef = useRef(null);
    const dimensions = useResizeObserver(containerRef);
    const svgRef = useRef(null);
    const gRef = useRef(null); // Reference to the group that will be transformed

    // State for zoom transform - not strictly needed for re-render, but good for tracking
    // const [transform, setTransform] = useState(d3.zoomIdentity);

    // Setup Zoom
    useEffect(() => {
        if (!svgRef.current || !gRef.current) return;

        const svg = d3.select(svgRef.current);
        const g = d3.select(gRef.current);

        const zoomBehavior = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
            });

        svg.call(zoomBehavior);

        // Initial Center?
        // Let's do a programmatic center on first load if dimensions available
    }, []);

    const resetZoom = () => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.transition().duration(750).call(
            d3.zoom().transform,
            d3.zoomIdentity.translate(dimensions?.width/2 || 0, 50).scale(0.8) // Approximate center
        );
    };

    // Draw Tree
    useEffect(() => {
        if (!structure || !dimensions || !gRef.current) return;

        const { width, height } = dimensions;

        // Use a larger layout size based on tree depth/breadth
        const root = d3.hierarchy(structure);

        // Compute Regions (for math panel)
        if (dataDomain) {
            root.eachBefore(node => {
                if (node.depth === 0) {
                    node.data.region = { ...dataDomain };
                } else {
                    const parentRegion = node.parent.data.region;
                    const parentData = node.parent.data;
                    const region = { ...parentRegion };
                    if (parentData.feature !== undefined) {
                        const threshold = parentData.threshold;
                        const feature = parentData.feature;
                        const isLeft = node.parent.children[0] === node;
                        if (feature === 0) {
                            if (isLeft) region.xMax = Math.min(region.xMax, threshold);
                            else region.xMin = Math.max(region.xMin, threshold);
                        } else {
                            if (isLeft) region.yMax = Math.min(region.yMax, threshold);
                            else region.yMin = Math.max(region.yMin, threshold);
                        }
                    }
                    node.data.region = region;
                }
            });
        }

        const depth = root.height;
        const leaves = root.leaves().length;

        // Heuristic sizing
        const nodeWidth = 60;
        const nodeHeight = 80;
        const layoutWidth = Math.max(width, leaves * nodeWidth);
        const layoutHeight = Math.max(height, (depth + 1) * nodeHeight);

        const treeLayout = d3.tree().size([layoutHeight, layoutWidth]);
        // Note: d3.tree usually maps size([height, width]) for vertical trees?
        // No, size([width, height]) for vertical (top-down).
        // Let's stick to vertical layout (top-down).
        // x = horizontal position, y = vertical position.

        // d3.tree().size([w, h]) returns x in [0, w], y in [0, h]
        // Actually for vertical trees, we want size([width, height]).
        // But let's check d3 version behavior. Usually size([width, height]).

        const vTreeLayout = d3.tree().size([layoutWidth - 100, layoutHeight - 100]);
        vTreeLayout(root);

        const g = d3.select(gRef.current);
        g.selectAll("*").remove(); // Clear

        const contentG = g.append("g")
            .attr("transform", `translate(50, 50)`); // Margins

        // Links
        contentG.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkVertical() // Use Vertical Link
                .x(d => d.x)
                .y(d => d.y))
            .attr("fill", "none")
            .attr("stroke", "#cbd5e1")
            .attr("stroke-width", 1.5);

        // Nodes
        const nodes = contentG.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node cursor-pointer")
            .attr("transform", d => `translate(${d.x},${d.y})`)
            .on("click", (event, d) => {
                event.stopPropagation();
                if (onNodeClick) onNodeClick(d.data);
            });

        // Colors
        const colorScaleClass = d3.scaleLinear()
            .domain([0, 1])
            .range(["#3b82f6", "#ef4444"]);

        const regColorScale = d3.scaleSequential()
            .domain([-1.5, 1.5])
            .interpolator(d3.interpolateRdBu);

        // Circle
        nodes.append("circle")
            .attr("r", d => d.children ? 6 : 4)
            .attr("fill", d => {
                const val = d.data.value;
                if (task === 'regression') {
                    return regColorScale(val[0]);
                } else {
                    const sumVal = val.reduce((a, b) => a + b, 0);
                    const p1 = val.length > 1 ? val[1] / (sumVal || 1) : 0;
                    return colorScaleClass(p1);
                }
            })
            .attr("stroke", d => selectedNode && selectedNode === d.data ? "#10b981" : "#fff")
            .attr("stroke-width", d => selectedNode && selectedNode === d.data ? 3 : 1.5);

        // Label Background (Halo)
        nodes.append("text")
            .attr("dy", "-0.8em")
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "#64748b")
            .style("font-weight", "600")
            .style("pointer-events", "none")
            .text(d => d.data.type === 'split' ? `${d.data.feature === 0 ? "X" : "Y"} ≤ ${d.data.threshold.toFixed(2)}` : "")
            .clone(true).lower()
            .attr("stroke", "white")
            .attr("stroke-width", 3);

    }, [structure, dimensions, selectedNode, dataDomain, task]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-50/50">
            <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing">
                <g ref={gRef}></g>
            </svg>

            <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/80 backdrop-blur shadow-sm rounded-lg p-1 border border-slate-200">
                <button onClick={resetZoom} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded" title="Reset View">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

             {!structure && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    No structure available
                </div>
            )}
        </div>
    );
};

export default TreeDiagram;
