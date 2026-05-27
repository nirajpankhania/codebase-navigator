"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getGraph } from "@/lib/api";
import type { GraphData, GraphNode, GraphLink } from "@/lib/api";

interface RepoGraphProps {
  repoId: string;
}

const EXT_COLORS: Record<string, string> = {
  ".ts": "#818cf8",
  ".tsx": "#a78bfa",
  ".js": "#fbbf24",
  ".jsx": "#f59e0b",
  ".py": "#34d399",
  ".md": "#6ee7b7",
  ".json": "#fb923c",
  ".yaml": "#fdba74",
  ".yml":  "#fdba74",
  ".toml": "#fdba74",
  ".css": "#f472b6",
  ".scss": "#ec4899",
  ".html": "#60a5fa",
  ".go": "#22d3ee",
  ".rs": "#f87171",
  ".sh": "#a3e635",
  ".rb": "#f87171",
};
const FILE_DEFAULT = "#94a3b8";
const DIR_COLOR = "#7c3aed";

function nodeColor(node: GraphNode): string {
  if (node.type === "directory") return DIR_COLOR;
  return EXT_COLORS[node.extension ?? ""] ?? FILE_DEFAULT;
}

function nodeRadius(node: GraphNode): number {
  if (node.id === "root") return 12;
  if (node.type === "directory") return 8;
  return 4;
}

interface SimNode extends GraphNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: SimNode;
  target: SimNode;
}

export function RepoGraph({ repoId }: RepoGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [nodeCount, setNodeCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const data: GraphData = await getGraph(repoId);
        if (cancelled) return;

        if (!data.nodes.length) {
          setStatus("empty");
          return;
        }

        setNodeCount(data.nodes.length);
        render(data);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    init();
    return () => { cancelled = true; };
  }, [repoId]);

  function render(data: GraphData) {
    const el = svgRef.current;
    if (!el) return;

    const width = el.clientWidth || 900;
    const height = el.clientHeight || 600;

    const svg = d3.select(el);
    svg.selectAll("*").remove();

    const container = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 4])
      .on("zoom", (event) => container.attr("transform", event.transform.toString()));

    svg.call(zoom);

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = (data.links as GraphLink[])
      .map((l) => ({
        source: nodeMap.get(typeof l.source === "string" ? l.source : (l.source as SimNode).id)!,
        target: nodeMap.get(typeof l.target === "string" ? l.target : (l.target as SimNode).id)!,
      }))
      .filter((l) => l.source && l.target);

    const simulation = d3
      .forceSimulation<SimNode>(nodes)
      .force("link", d3.forceLink<SimNode, SimLink>(links).id((d) => d.id).distance((l) =>
        (l.source as SimNode).type === "directory" && (l.target as SimNode).type === "directory" ? 80 : 45
      ))
      .force("charge", d3.forceManyBody<SimNode>().strength((d) => (d.type === "directory" ? -200 : -60)))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide<SimNode>((d) => nodeRadius(d) + 3));

    const link = container
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#334155")
      .attr("stroke-width", 1);

    const drag = d3
      .drag<SVGCircleElement, SimNode>()
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

    const node = container
      .append("g")
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", nodeRadius)
      .attr("fill", nodeColor)
      .attr("fill-opacity", (d) => (d.type === "directory" ? 0.9 : 0.75))
      .attr("stroke", (d) => (d.type === "directory" ? "#a78bfa" : "none"))
      .attr("stroke-width", 1.5)
      .style("cursor", "grab")
      .call(drag);

    const label = container
      .append("g")
      .selectAll("text")
      .data(nodes.filter((d) => d.type === "directory"))
      .join("text")
      .text((d) => d.label)
      .attr("font-size", (d) => (d.id === "root" ? 11 : 9))
      .attr("fill", "#c4b5fd")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -nodeRadius(d) - 3)
      .style("pointer-events", "none")
      .style("user-select", "none");

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "fixed")
      .style("background", "#1e1b4b")
      .style("border", "1px solid #4c1d95")
      .style("color", "#e2e8f0")
      .style("padding", "6px 10px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("font-family", "monospace")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")
      .style("max-width", "320px")
      .style("word-break", "break-all");

    node
      .on("mouseover", (event: MouseEvent, d: SimNode) => {
        tooltip.style("opacity", "1").text(d.id === "root" ? "/" : d.id);
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", "0");
      });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      label.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    });

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }

  return (
    <div className="relative flex h-full w-full flex-col">
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <p className="text-sm text-slate-500">Building graph...</p>
          </div>
        </div>
      )}

      {status === "empty" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-slate-500">No file data found for this repository.</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-red-400">Failed to load graph.</p>
        </div>
      )}

      <svg ref={svgRef} className="h-full w-full" style={{ background: "transparent" }} />

      {status === "ready" && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3 backdrop-blur-sm">
            <p className="mb-2 text-xs font-medium text-slate-400">{nodeCount} nodes · scroll to zoom · drag to pan</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              <LegendItem color={DIR_COLOR} label="directory" circle />
              {Object.entries(EXT_COLORS).slice(0, 8).map(([ext, color]) => (
                <LegendItem key={ext} color={color} label={ext} />
              ))}
              <LegendItem color={FILE_DEFAULT} label="other" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, circle }: { color: string; label: string; circle?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="shrink-0"
        style={{
          width: circle ? 10 : 8,
          height: circle ? 10 : 8,
          borderRadius: circle ? "50%" : 2,
          background: color,
          border: circle ? `1.5px solid #a78bfa` : "none",
        }}
      />
      <span className="font-mono text-xs text-slate-500">{label}</span>
    </div>
  );
}
