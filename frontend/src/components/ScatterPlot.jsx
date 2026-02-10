import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';

// Awesome Theme Colors
const THEME = {
    class0: {
        point: '#2563EB', // Blue 600
        region: '#DBEAFE', // Blue 100
        stroke: '#FFFFFF'
    },
    class1: {
        point: '#DC2626', // Red 600
        region: '#FEE2E2', // Red 100
        stroke: '#FFFFFF'
    },
    grid: '#FFFFFF',
    text: '#64748B', // Slate 500
    splitLine: '#10B981', // Emerald 500
    regression: {
        low: '#3B82F6',
        high: '#EF4444',
        neutral: '#F3F4F6'
    }
};

const ScatterPlot = ({ data, boundaries, boundaryGrid, task, selectedRegion }) => {
    const containerRef = useRef(null);
    const dimensions = useResizeObserver(containerRef);
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || !dimensions || !svgRef.current) return;

        const { width, height } = dimensions;
        const margin = { top: 20, right: 20, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        if (innerWidth <= 0 || innerHeight <= 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render for simplicity in this iteration

        // Create main group
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // --- Scales ---
        const xExtent = d3.extent(data, d => d.x);
        const yExtent = d3.extent(data, d => d.y);

        // Add 10% padding for a nicer view
        const xPad = (xExtent[1] - xExtent[0]) * 0.1;
        const yPad = (yExtent[1] - yExtent[0]) * 0.1;

        const xMin = (xExtent[0] || 0) - xPad;
        const xMax = (xExtent[1] || 1) + xPad;
        const yMin = (yExtent[0] || 0) - yPad;
        const yMax = (yExtent[1] || 1) + yPad;

        const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth]);
        const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

        // --- Background & Regions ---

        // 1. Draw Decision Regions (Tree - Rectangles)
        // We draw this first so it's at the back
        if (boundaries && boundaries.length > 0) {
            g.selectAll(".boundary-rect")
                .data(boundaries)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x))
                .attr("y", d => yScale(d.y + d.height))
                .attr("width", d => Math.abs(xScale(d.x + d.width) - xScale(d.x)))
                .attr("height", d => Math.abs(yScale(d.y) - yScale(d.y + d.height)))
                .attr("fill", d => {
                    if (task === 'regression') {
                        // For regression, we might want a continuous gradient or just grey
                        // Simple approach: interpolate
                        return d3.interpolateRdBu((d.value + 1) / 2); // Normalize?
                    }
                    // Classification
                    return d.class === 1 ? THEME.class1.region : THEME.class0.region;
                })
                .attr("stroke", "none");
        }

        // 1b. Draw Decision Grid (Forest/Boosting)
        if (boundaryGrid && boundaryGrid.length > 0) {
            // Assuming uniform grid
            const cellSizeX = Math.abs(xScale(boundaryGrid[1].x) - xScale(boundaryGrid[0].x)) * 1.1; // Overlap slightly
            // Find a Y neighbor to get height
            // Approximation if grid is flattened.
            // Alternative: calculate width/height from data domain / resolution

            // Let's assume the grid points are centers.
            // We need to know the resolution.
            // For now, let's just use circles or rects with estimated size.
            // Better: Voronoi? No, too heavy.
            // Let's rely on the rect approach from before but cleaner.
             g.selectAll(".grid-cell")
                .data(boundaryGrid)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x) - 3)
                .attr("y", d => yScale(d.y) - 3)
                .attr("width", 6) // Dynamic size would be better
                .attr("height", 6)
                .attr("fill", d => d.label > 0.5 ? THEME.class1.region : THEME.class0.region)
                .attr("opacity", 0.6); // Blending for ensembles
        }

        // 2. Grid Lines (White overlay on regions)
        const xAxis = d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickPadding(10);
        const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickPadding(10);

        const gridGroup = g.append("g").attr("class", "grid-lines");

        gridGroup.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll("line")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5); // Subtle white grid

        gridGroup.append("g")
            .call(yAxis)
            .selectAll("line")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("opacity", 0.5);

        // Remove domain paths
        gridGroup.selectAll(".domain").remove();

        // Style ticks
        gridGroup.selectAll("text")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "10px")
            .style("fill", THEME.text);

        // 3. Highlight Selected Region
        if (selectedRegion) {
             g.append("rect")
                .attr("x", xScale(selectedRegion.xMin))
                .attr("y", yScale(selectedRegion.yMax))
                .attr("width", Math.max(0, xScale(selectedRegion.xMax) - xScale(selectedRegion.xMin)))
                .attr("height", Math.max(0, yScale(selectedRegion.yMin) - yScale(selectedRegion.yMax)))
                .attr("fill", "none")
                .attr("stroke", THEME.splitLine)
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4,4")
                .style("pointer-events", "none");
        }

        // 4. Data Points
        g.selectAll(".point")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 6)
            .attr("fill", d => {
                 if (task === 'regression') {
                     // Diverging color for regression
                     return d3.interpolateRdBu((d.label + 1) / 2); // simplistic normalization
                 }
                 return d.label === 1 ? THEME.class1.point : THEME.class0.point;
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .attr("class", "cursor-pointer transition-all duration-300 hover:r-8 shadow-sm")
            // Add a simple drop shadow via filter? Maybe later.
            .on("mouseover", function() {
                d3.select(this).transition().duration(200).attr("r", 9);
            })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("r", 6);
            })
            .append("title")
            .text(d => `X: ${d.x.toFixed(2)}, Y: ${d.y.toFixed(2)}\nLabel: ${d.label}`);

        // 5. Axes Labels
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 35)
            .attr("text-anchor", "middle")
            .attr("fill", THEME.text)
            .style("font-family", "Inter, sans-serif")
            .style("font-weight", "600")
            .style("font-size", "12px")
            .text("Feature X");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -35)
            .attr("text-anchor", "middle")
            .attr("fill", THEME.text)
            .style("font-family", "Inter, sans-serif")
            .style("font-weight", "600")
            .style("font-size", "12px")
            .text("Feature Y");

    }, [data, boundaries, boundaryGrid, dimensions, task, selectedRegion]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[300px] relative bg-slate-50/50">
            <svg ref={svgRef} className="w-full h-full block" />
            {(!data || data.length === 0) && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
                    Generate data to start
                </div>
            )}
        </div>
    );
};

export default ScatterPlot;
