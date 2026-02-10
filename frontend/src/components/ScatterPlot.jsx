import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ScatterPlot = ({ data, boundaries, boundaryGrid, width = 600, height = 600, task, selectedRegion }) => {
    const svgRef = useRef(null);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Scales
        // Assuming data is roughly [-2, 3] based on generation, but let's calculate extent
        const xExtent = d3.extent(data, d => d.x);
        const yExtent = d3.extent(data, d => d.y);

        // Add some padding
        const xMin = xExtent[0] - 0.5;
        const xMax = xExtent[1] + 0.5;
        const yMin = yExtent[0] - 0.5;
        const yMax = yExtent[1] + 0.5;

        const xScale = d3.scaleLinear()
            .domain([xMin, xMax])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([innerHeight, 0]);

        // Color Scale
        const colorScale = d3.scaleOrdinal()
            .domain([0, 1]) // Binary
            .range(["#1f77b4", "#ff7f0e"]);

        // Regression Color Scale (diverging)
        const regColorScale = d3.scaleSequential()
            .domain([-1.5, 1.5]) // Rough range of sin wave + noise
            .interpolator(d3.interpolateRdBu);

        // 1. Draw Boundary Grid (Forest/Boosting)
        if (boundaryGrid && boundaryGrid.length > 0) {
            // Determine cell size from grid spacing (assuming 0.1)
            // But we can just use rects centered at points or small circles
            // Better: use rects. Grid is 0.1 spacing.
            const gridSize = 0.1;
            const cellWidth = xScale(xMin + gridSize) - xScale(xMin);
            const cellHeight = yScale(yMin) - yScale(yMin + gridSize);

            g.selectAll(".grid-cell")
                .data(boundaryGrid)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x) - cellWidth / 2)
                .attr("y", d => yScale(d.y) - cellHeight / 2)
                .attr("width", cellWidth)
                .attr("height", cellHeight)
                .attr("fill", d => task === 'regression' ? regColorScale(d.label) : colorScale(d.label))
                .attr("opacity", 0.3);
        }

        // 2. Draw Decision Boundaries (Tree Rectangles)
        if (boundaries && boundaries.length > 0) {
            g.selectAll(".boundary-rect")
                .data(boundaries)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x))
                .attr("y", d => yScale(d.y + d.height))
                .attr("height", d => Math.abs(yScale(d.y) - yScale(d.y + d.height)))
                .attr("width", d => xScale(d.x + d.width) - xScale(d.x))
                .attr("fill", d => task === 'regression' ? regColorScale(d.class) : colorScale(d.class))
                .attr("stroke", "#fff")
                .attr("stroke-width", 1)
                .attr("opacity", 0.4);
        }

        // 2.5 Draw Selected Region
        if (selectedRegion) {
             g.append("rect")
                .attr("x", xScale(selectedRegion.xMin))
                .attr("y", yScale(selectedRegion.yMax))
                .attr("width", xScale(selectedRegion.xMax) - xScale(selectedRegion.xMin))
                .attr("height", yScale(selectedRegion.yMin) - yScale(selectedRegion.yMax))
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 3)
                .style("pointer-events", "none"); // Allow clicking through
        }

        // 3. Draw Data Points
        g.selectAll(".point")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 4)
            // If background is colored by prediction, points should be colored by true value?
            // Let's color points by value for regression too using same scale but full opacity.
            .attr("fill", d => task === 'regression' ? regColorScale(d.label) : colorScale(d.label))
            // In my DataPoint model: x, y, label.
            // For regression: x is feature1, y is feature2 (if 2D). label is target.
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

        // Axes
        g.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(xScale));

        g.append("g")
            .call(d3.axisLeft(yScale));

        // Labels
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 35)
            .attr("text-anchor", "middle")
            .text("Feature 1 (X)");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .text("Feature 2 (Y)");

    }, [data, boundaries, boundaryGrid, width, height, task, selectedRegion]);

    return (
        <div className="bg-white p-4 rounded shadow-lg">
            <h3 className="text-lg font-semibold mb-2">Feature Space</h3>
            <svg ref={svgRef} width={width} height={height} className="border border-gray-200 bg-gray-50"></svg>
        </div>
    );
};

export default ScatterPlot;
