import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';

const TreeDiagram = ({ structure, task, onNodeClick, selectedNode, dataDomain }) => {
    const containerRef = useRef(null);
    const dimensions = useResizeObserver(containerRef);
    const svgRef = useRef(null);

    useEffect(() => {
        if (!structure || !dimensions || !svgRef.current) return;

        const { width, height } = dimensions;
        const margin = { top: 40, right: 90, bottom: 50, left: 90 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (innerWidth <= 0 || innerHeight <= 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Hierarchy
        const root = d3.hierarchy(structure);

        // Compute regions (logic from before)
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

        const treeLayout = d3.tree().size([innerHeight, innerWidth]);
        treeLayout(root);

        // Links
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x))
            .attr("fill", "none")
            .attr("stroke", "#cbd5e1") // Slate-300
            .attr("stroke-width", 2);

        // Nodes
        const nodes = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (event, d) => {
                if (onNodeClick) onNodeClick(d.data);
            });

        // Color Scales
        const colorScaleClass = d3.scaleLinear()
            .domain([0, 1])
            .range(["#3b82f6", "#ef4444"]); // Blue to Red

        const regColorScale = d3.scaleSequential()
            .domain([-1.5, 1.5])
            .interpolator(d3.interpolateRdBu);

        // Node Circle
        nodes.append("circle")
            .attr("r", 8)
            .attr("fill", d => {
                const val = d.data.value; // [count0, count1] or [mean]
                if (task === 'regression') {
                    return regColorScale(val[0]);
                } else {
                    // Classification: Prob of class 1
                    const total = d.data.samples;
                    const prob1 = val.length > 1 ? val[1] / total : 0.5; // fallback
                    // Wait, value might be normalized? No, backend returns counts for now in math.class_counts but value is raw.
                    // Let's assume value is counts or probabilities.
                    // My backend returns normalized value if sum approx 1?
                    // Let's check sums.
                    const sumVal = val.reduce((a, b) => a + b, 0);
                    const p1 = val.length > 1 ? val[1] / sumVal : 0;
                    return colorScaleClass(p1);
                }
            })
            .attr("stroke", d => {
                if (selectedNode && selectedNode === d.data) return "#10b981"; // Emerald-500
                return "#fff";
            })
            .attr("stroke-width", d => selectedNode && selectedNode === d.data ? 3 : 2)
            .style("cursor", "pointer");

        // Labels (Condition)
        nodes.append("text")
            .attr("dy", "-1.2em")
            .attr("x", 0)
            .style("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "#64748b")
            .style("font-weight", "600")
            .text(d => {
                if (d.data.type === 'split') {
                    return `${d.data.feature === 0 ? "X" : "Y"} ≤ ${d.data.threshold.toFixed(2)}`;
                }
                return "";
            })
            .style("background", "white"); // Background for readability? SVG text doesn't support bg easily.

        // Labels (Value/Impurity)
        nodes.append("text")
            .attr("dy", "1.6em")
            .attr("x", 0)
            .style("text-anchor", "middle")
            .style("font-size", "9px")
            .style("fill", "#94a3b8")
            .text(d => `Imp: ${d.data.impurity.toFixed(2)}`);

    }, [structure, dimensions, selectedNode, dataDomain, task]);

    return (
        <div ref={containerRef} className="w-full h-full relative min-h-[300px]">
            <svg ref={svgRef} className="w-full h-full block" />
            {!structure && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    No structure available
                </div>
            )}
        </div>
    );
};

export default TreeDiagram;
