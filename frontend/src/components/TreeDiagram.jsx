import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const TreeDiagram = ({ structure, width = 600, height = 500, onNodeClick, selectedNode, dataDomain }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!structure || !svgRef.current) return;

        const margin = { top: 40, right: 90, bottom: 50, left: 90 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create hierarchy
        const root = d3.hierarchy(structure);

        // Compute regions for each node
        // dataDomain: { xMin, xMax, yMin, yMax }
        if (dataDomain) {
            root.eachBefore(node => {
                if (node.depth === 0) {
                    node.data.region = { ...dataDomain };
                } else {
                    const parentRegion = node.parent.data.region;
                    const parentData = node.parent.data; // This is the split node

                    // Copy parent region
                    const region = { ...parentRegion };

                    if (parentData.feature !== undefined) {
                        const threshold = parentData.threshold;
                        const feature = parentData.feature;

                        // Check if this node is left or right child
                        // d3.hierarchy preserves order: children[0] is left, children[1] is right
                        const isLeft = node.parent.children[0] === node;

                        if (feature === 0) { // X axis split
                            if (isLeft) {
                                region.xMax = Math.min(region.xMax, threshold);
                            } else {
                                region.xMin = Math.max(region.xMin, threshold);
                            }
                        } else { // Y axis split
                            if (isLeft) {
                                region.yMax = Math.min(region.yMax, threshold);
                            } else {
                                region.yMin = Math.max(region.yMin, threshold);
                            }
                        }
                    }
                    node.data.region = region;
                }
            });
        }

        // Tree Layout
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
            .attr("stroke", "#ccc")
            .attr("stroke-width", 2);

        // Nodes
        const nodes = g.selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .on("click", (event, d) => {
                // Pass the node data (including calculated region) to parent
                if (onNodeClick) onNodeClick(d.data);
            });

        // Node Circles
        nodes.append("circle")
            .attr("r", 10)
            .attr("fill", d => {
                // Highlight selected
                if (selectedNode && selectedNode === d.data) return "red"; // Check reference? Or add ID?
                // Reference check might fail if structure is recreated, but here structure is prop.
                // Assuming structure prop is stable or we rely on some ID.
                // Let's use simple check for now.
                // Color by prediction/impurity?
                return d.children ? "#555" : "#999";
            })
            .attr("stroke", d => d.data === selectedNode ? "red" : "steelblue")
            .attr("stroke-width", 3)
            .style("cursor", "pointer");

        // Labels
        nodes.append("text")
            .attr("dy", ".35em")
            .attr("x", d => d.children ? -13 : 13)
            .style("text-anchor", d => d.children ? "end" : "start")
            .text(d => {
                if (d.data.type === 'split') {
                    // Show split condition
                    const fName = d.data.feature === 0 ? "X" : "Y";
                    return `${fName} <= ${d.data.threshold.toFixed(2)}`;
                } else {
                    // Leaf
                    if (d.data.value && d.data.value.length === 1) {
                         return `Val: ${d.data.value[0].toFixed(2)}`;
                    }
                    // Class counts
                    // return `Leaf`;
                    // Show dominant class?
                    return "Leaf";
                }
            })
            .style("font-size", "12px");

        // Info on hover/below
        nodes.append("text")
            .attr("dy", "1.5em")
            .attr("x", d => d.children ? -13 : 13)
            .style("text-anchor", d => d.children ? "end" : "start")
            .text(d => `Imp: ${d.data.impurity.toFixed(2)}`)
            .style("font-size", "10px")
            .style("fill", "#777");

    }, [structure, width, height, selectedNode, dataDomain]);

    return (
        <div className="overflow-auto bg-white rounded shadow-lg border border-gray-200">
             <h3 className="text-lg font-semibold p-2 border-b text-center sticky top-0 bg-white z-10">Decision Tree Structure</h3>
            <svg ref={svgRef} width={width} height={height}></svg>
        </div>
    );
};

export default TreeDiagram;
