"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import type { GraphData, GraphNode, GraphLink } from "@/lib/notes";
import { usePanes } from "@/lib/panes-context";

interface GraphProps {
  data: GraphData;
  onNodeClick: (nodeId: string) => void;
}

interface SimulationNode extends GraphNode, d3.SimulationNodeDatum {}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  source: SimulationNode;
  target: SimulationNode;
}

export function Graph({ data, onNodeClick }: GraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { openPanes, activeNoteId } = usePanes();

  // Track open note IDs for highlighting
  const openNoteIds = new Set(openPanes.map((n) => n.id));

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;
    if (data.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;

    // Create copies of data for simulation
    const nodes: SimulationNode[] = data.nodes.map((d) => ({ ...d }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimulationLink[] = data.links
      .map((l) => ({
        source: nodeMap.get(l.source as string)!,
        target: nodeMap.get(l.target as string)!,
      }))
      .filter((l) => l.source && l.target);

    // Create container group for zoom
    const g = svg.append("g");

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Create force simulation
    const simulation = d3
      .forceSimulation<SimulationNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<SimulationNode, SimulationLink>(links)
          .id((d) => d.id)
          .distance(50)
      )
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(20));

    // Draw links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "graph-link");

    // Draw nodes
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, SimulationNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", (d) => {
        let cls = "graph-node";
        if (openNoteIds.has(d.id)) cls += " active";
        return cls;
      })
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        onNodeClick(d.id);
      });

    // Add drag behavior separately to avoid type issues
    const dragBehavior = d3
      .drag<SVGGElement, SimulationNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(dragBehavior);

    node.append("circle").attr("r", 5);

    node
      .append("text")
      .attr("dx", 8)
      .attr("dy", 3)
      .text((d) => d.title.length > 20 ? d.title.slice(0, 20) + "..." : d.title);

    // Update positions on tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x!)
        .attr("y1", (d) => d.source.y!)
        .attr("x2", (d) => d.target.x!)
        .attr("y2", (d) => d.target.y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Initial zoom to fit
    const initialScale = 0.8;
    svg.call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width * (1 - initialScale) / 2, height * (1 - initialScale) / 2)
        .scale(initialScale)
    );

    return () => {
      simulation.stop();
    };
  }, [data, dimensions, onNodeClick, openNoteIds, activeNoteId]);

  return (
    <div ref={containerRef} className="graph-container" style={{ width: "100%", height: "100%" }}>
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ overflow: "visible" }}
      />
    </div>
  );
}
