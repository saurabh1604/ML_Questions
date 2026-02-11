import React, { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '../hooks/useResizeObserver';

// Awesome Theme Colors - Soft Pastels & Vivid Accents
const THEME = {
    class0: {
        point: '#3B82F6', // Blue 500
        region: '#EFF6FF', // Blue 50
        stroke: '#2563EB', // Blue 600
        glow: 'rgba(59, 130, 246, 0.5)'
    },
    class1: {
        point: '#EF4444', // Red 500
        region: '#FEF2F2', // Red 50
        stroke: '#DC2626', // Red 600
        glow: 'rgba(239, 68, 68, 0.5)'
    },
    grid: '#E2E8F0', // Slate 200
    text: '#64748B', // Slate 500
    selection: {
        stroke: '#10B981', // Emerald 500
        fill: 'rgba(16, 185, 129, 0.1)'
    }
};

const ScatterPlot = ({ data, boundaries, boundaryGrid, task, selectedRegion }) => {
    const containerRef = useRef(null);
    const dimensions = useResizeObserver(containerRef);
    const svgRef = useRef(null);

    // Memoize scales/domains to prevent recalculation on every render frame
    const { xScale, yScale, innerWidth, innerHeight, margin } = useMemo(() => {
        if (!dimensions || !data || data.length === 0) return {};

        const { width, height } = dimensions;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        const xExtent = d3.extent(data, d => d.x);
        const yExtent = d3.extent(data, d => d.y);

        // Add 10% padding for breathing room
        const xPad = (xExtent[1] - xExtent[0]) * 0.1 || 0.5;
        const yPad = (yExtent[1] - yExtent[0]) * 0.1 || 0.5;

        const xMin = (xExtent[0] || 0) - xPad;
        const xMax = (xExtent[1] || 1) + xPad;
        const yMin = (yExtent[0] || 0) - yPad;
        const yMax = (yExtent[1] || 1) + yPad;

        const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, innerWidth]);
        const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

        return { xScale, yScale, innerWidth, innerHeight, margin };
    }, [dimensions, data]);

    // Draw Chart
    useEffect(() => {
        if (!xScale || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clean slate

        // Defs for Glow Filters
        const defs = svg.append("defs");
        const filter = defs.append("filter").attr("id", "glow");
        filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
        const feMerge = filter.append("feMerge");
        feMerge.append("feMergeNode").attr("in", "coloredBlur");
        feMerge.append("feMergeNode").attr("in", "SourceGraphic");

        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // --- 1. Decision Boundaries (Background) ---

        // A. Tree Rectangles
        if (boundaries && boundaries.length > 0) {
            g.selectAll(".boundary-rect")
                .data(boundaries)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x))
                .attr("y", d => yScale(d.y + d.height))
                .attr("width", d => Math.max(0, xScale(d.x + d.width) - xScale(d.x)))
                .attr("height", d => Math.max(0, yScale(d.y) - yScale(d.y + d.height)))
                .attr("fill", d => {
                    if (task === 'regression') return d3.interpolateRdBu((d.value + 1) / 2); // Simplified normalization
                    return d.class === 1 ? THEME.class1.region : THEME.class0.region;
                })
                .attr("opacity", 0.8)
                .attr("stroke", "white")
                .attr("stroke-width", 0.5);
        }

        // B. Forest/Boosting Grid (Contour approximation via circles/rects)
        if (boundaryGrid && boundaryGrid.length > 0) {
            // Determine grid resolution from data
            // Assuming uniform grid
            const width = Math.abs(xScale(boundaryGrid[1].x) - xScale(boundaryGrid[0].x)) + 1;

            g.selectAll(".grid-cell")
                .data(boundaryGrid)
                .enter()
                .append("rect")
                .attr("x", d => xScale(d.x) - width/2)
                .attr("y", d => yScale(d.y) - width/2)
                .attr("width", width)
                .attr("height", width)
                .attr("fill", d => {
                    if (task === 'regression') return d3.interpolateRdBu((d.label + 1) / 2);
                    // Soft gradient for probabilities
                    return d3.interpolateRdBu(1 - d.label);
                })
                .attr("opacity", 0.4);
        }

        // --- 2. Grid Lines & Axes ---
        const xAxis = d3.axisBottom(xScale).ticks(5).tickSize(-innerHeight).tickPadding(10);
        const yAxis = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickPadding(10);

        const gridGroup = g.append("g").attr("class", "grid");

        // X Grid
        gridGroup.append("g")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("line").attr("stroke", THEME.grid).attr("stroke-dasharray", "4,4"))
            .call(g => g.selectAll("text").style("fill", THEME.text).style("font-size", "10px").style("font-family", "sans-serif"));

        // Y Grid
        gridGroup.append("g")
            .call(yAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("line").attr("stroke", THEME.grid).attr("stroke-dasharray", "4,4"))
            .call(g => g.selectAll("text").style("fill", THEME.text).style("font-size", "10px").style("font-family", "sans-serif"));

        // Labels
        g.append("text")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight + 35)
            .attr("text-anchor", "middle")
            .attr("fill", THEME.text)
            .style("font-weight", "600")
            .style("font-size", "11px")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.05em")
            .text("Feature X");

        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerHeight / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .attr("fill", THEME.text)
            .style("font-weight", "600")
            .style("font-size", "11px")
            .style("text-transform", "uppercase")
            .style("letter-spacing", "0.05em")
            .text("Feature Y");

        // --- 3. Data Points ---
        g.selectAll(".point")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", 6)
            .attr("fill", d => {
                 if (task === 'regression') return d3.interpolateRdBu((d.y + 1) / 2); // Use Y for color in regression or logic? Actually usually regression color is target value.
                 // For now, assume regression target isn't plotted as color unless 3rd dim.
                 // Wait, for regression, color usually maps to residual or value.
                 // Let's stick to standard class coloring for classification.
                 return d.label === 1 ? THEME.class1.point : THEME.class0.point;
            })
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .style("filter", "url(#glow)") // Add glow
            .attr("class", "transition-all hover:r-8 cursor-crosshair");

        // --- 4. Selection Highlight ---
        if (selectedRegion) {
             g.append("rect")
                .attr("x", xScale(selectedRegion.xMin))
                .attr("y", yScale(selectedRegion.yMax))
                .attr("width", Math.max(0, xScale(selectedRegion.xMax) - xScale(selectedRegion.xMin)))
                .attr("height", Math.max(0, yScale(selectedRegion.yMin) - yScale(selectedRegion.yMax)))
                .attr("fill", THEME.selection.fill)
                .attr("stroke", THEME.selection.stroke)
                .attr("stroke-width", 3)
                .attr("rx", 4) // Rounded corners
                .style("pointer-events", "none")
                .style("filter", "drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))")
                .attr("opacity", 0)
                .transition().duration(300).ease(d3.easeCubicOut)
                .attr("opacity", 1);
        }

    }, [data, boundaries, boundaryGrid, xScale, yScale, innerWidth, innerHeight, margin, task, selectedRegion]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[400px] relative bg-white">
            <svg ref={svgRef} className="w-full h-full block overflow-visible" />
            {(!data || data.length === 0) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                    </div>
                    <span className="text-sm font-medium">No data generated</span>
                </div>
            )}
        </div>
    );
};

export default ScatterPlot;
