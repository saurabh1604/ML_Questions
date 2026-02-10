import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';

const ScatterPlot = ({ data, boundaries, boundaryGrid, task, selectedRegion }) => {
    const containerRef = useRef(null);
    const dimensions = useResizeObserver(containerRef);
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || !dimensions || !svgRef.current) return;

        const { width, height } = dimensions;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (innerWidth <= 0 || innerHeight <= 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        // Assuming data is roughly [-2, 3] based on generation, but let's calculate extent
        const xExtent = d3.extent(data, d => d.x);
        const yExtent = d3.extent(data, d => d.y);

        // Add padding (5%)
        const xPad = (xExtent[1] - xExtent[0]) * 0.05;
        const yPad = (yExtent[1] - yExtent[0]) * 0.05;

        const xMin = xExtent[0] - xPad;
        const xMax = xExtent[1] + xPad;
        const yMin = yExtent[0] - yPad;
        const yMax = yExtent[1] + yPad;

        const xScale = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([innerHeight, 0]);

        // Color Scale
        const colorScaleClass = d3.scaleOrdinal()
            .domain([0, 1])
            .range(["#3b82f6", "#ef4444"]); // Blue-500, Red-500

        // Regression Color Scale (diverging)
        const targetExtent = d3.extent(data, d => task === 'regression' ? d.label : 0);
        // Find max absolute value to center diverging scale
        const maxAbs = Math.max(Math.abs(targetExtent[0] || 0), Math.abs(targetExtent[1] || 0));

        const regColorScale = d3.scaleSequential()
            .domain([-maxAbs, maxAbs])
            .interpolator(d3.interpolateRdBu);

        // 1. Draw Boundary Grid (Forest/Boosting) - Background
        if (boundaryGrid && boundaryGrid.length > 0) {
            // Determine cell size from grid spacing (assuming 0.1)
            const gridSize = 0.1;
            // Better to compute it from data if possible, but we generated it with 0.1
            // Actually, let's just use rects.
            // Improve: render as image for performance? No, 2500 rects is okay for modern browsers.
            // But let's use slightly larger rects to avoid gaps due to rounding.
            const cellWidth = Math.abs(xScale(xMin + gridSize) - xScale(xMin)) * 1.05;
            const cellHeight = Math.abs(yScale(yMin) - yScale(yMin + gridSize)) * 1.05;

            g.selectAll(".grid-cell")
                .data(boundaryGrid)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x) - cellWidth / 2)
                .attr("y", d => yScale(d.y) - cellHeight / 2) // centering
                .attr("width", cellWidth)
                .attr("height", cellHeight)
                .attr("fill", d => task === 'regression' ? regColorScale(d.label) : colorScaleClass(d.label))
                .attr("opacity", 0.2)
                .style("shape-rendering", "crispEdges"); // Avoid anti-aliasing gaps
        }

        // 2. Draw Decision Boundaries (Tree Rectangles) - Background
        if (boundaries && boundaries.length > 0) {
            g.selectAll(".boundary-rect")
                .data(boundaries)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x))
                .attr("y", d => yScale(d.y + d.height))
                .attr("height", d => Math.abs(yScale(d.y) - yScale(d.y + d.height)))
                .attr("width", d => Math.abs(xScale(d.x + d.width) - xScale(d.x)))
                .attr("fill", d => task === 'regression' ? regColorScale(d.class) : colorScaleClass(d.class))
                .attr("stroke", "white")
                .attr("stroke-width", 0.5)
                .attr("opacity", 0.3);
        }

        // 2.5 Draw Selected Region Highlight
        if (selectedRegion) {
             g.append("rect")
                .attr("x", xScale(selectedRegion.xMin))
                .attr("y", yScale(selectedRegion.yMax))
                .attr("width", Math.max(0, xScale(selectedRegion.xMax) - xScale(selectedRegion.xMin)))
                .attr("height", Math.max(0, yScale(selectedRegion.yMin) - yScale(selectedRegion.yMax)))
                .attr("fill", "none")
                .attr("stroke", "#10b981") // Emerald-500
                .attr("stroke-width", 3)
                .attr("stroke-dasharray", "5,5")
                .style("pointer-events", "none");
        }

        // Grid lines
        const xAxis = d3.axisBottom(xScale).tickSize(-innerHeight).tickPadding(10);
        const yAxis = d3.axisLeft(yScale).tickSize(-innerWidth).tickPadding(10);

        g.append("g")
            .attr("class", "grid-lines")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll("line")
            .attr("stroke", "#e2e8f0") // Slate-200
            .attr("stroke-dasharray", "2,2");

        g.append("g")
            .attr("class", "grid-lines")
            .call(yAxis)
            .selectAll("line")
            .attr("stroke", "#e2e8f0")
            .attr("stroke-dasharray", "2,2");

        // Remove domain lines for cleaner look
        g.selectAll(".domain").remove();

        // 3. Draw Data Points
        g.selectAll(".point")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "point transition-all duration-200 hover:r-6")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 5)
            .attr("fill", d => task === 'regression' ? regColorScale(d.label) : colorScaleClass(d.label))
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .attr("cursor", "pointer")
            .append("title") // Simple tooltip
            .text(d => `(${d.x.toFixed(2)}, ${d.y.toFixed(2)})\nLabel: ${d.label.toFixed(2)}`);

        // Labels
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 35)
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b") // Slate-500
            .style("font-size", "12px")
            .style("font-weight", "500")
            .text("Feature X");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .text("Feature Y");

    }, [data, boundaries, boundaryGrid, dimensions, task, selectedRegion]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[300px] relative">
            <svg ref={svgRef} className="w-full h-full block" />
            {!data || data.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                    No data available
                </div>
            )}
        </div>
    );
};

export default ScatterPlot;
