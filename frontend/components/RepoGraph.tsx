"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { getGraph } from "@/lib/api";
import type { GraphData, GraphNode, GraphLink } from "@/lib/api";

interface RepoGraphProps {
  repoId: string;
}

const EXT_COLORS: Record<string, string> = {
  ".ts":   "#c8a84b",
  ".tsx":  "#e8c86a",
  ".js":   "#b89030",
  ".jsx":  "#a07820",
  ".py":   "#6ab88a",
  ".md":   "#8abaa0",
  ".json": "#c8906a",
  ".yaml": "#b07858",
  ".yml":  "#b07858",
  ".toml": "#b07858",
  ".css":  "#c870a0",
  ".scss": "#b05888",
  ".html": "#7090c8",
  ".go":   "#60a8b8",
  ".rs":   "#c87070",
  ".sh":   "#90b850",
  ".rb":   "#c87070",
};
const FILE_DEFAULT = "#7a7560";
const DIR_COLOR    = "#c8a84b";

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

type NodeSel = d3.Selection<SVGCircleElement, SimNode, SVGGElement, unknown>;
type LinkSel = d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>;
type LabelSel = d3.Selection<SVGTextElement, SimNode, SVGGElement, unknown>;

export function RepoGraph({ repoId }: RepoGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [nodeCount, setNodeCount] = useState(0);
  const [search, setSearch] = useState("");

  const nodeSelRef = useRef<NodeSel | null>(null);
  const linkSelRef = useRef<LinkSel | null>(null);
  const labelSelRef = useRef<LabelSel | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const childMapRef = useRef<Map<string, Set<string>>>(new Map());
  const parentMapRef = useRef<Map<string, string>>(new Map());
  const selectedIdRef = useRef<string | null>(null);

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

  // Reactive search — updates D3 opacity without re-rendering
  useEffect(() => {
    if (status !== "ready" || !nodeSelRef.current) return;
    const q = search.trim().toLowerCase();

    if (q) selectedIdRef.current = null;

    applyHighlight(q ? null : selectedIdRef.current, q);
  }, [search, status]);

  function applyHighlight(focusId: string | null, searchQuery: string) {
    const nodeSel = nodeSelRef.current;
    const linkSel = linkSelRef.current;
    const labelSel = labelSelRef.current;
    if (!nodeSel) return;

    const q = searchQuery.trim().toLowerCase();

    if (!focusId && !q) {
      nodeSel
        .attr("fill-opacity", (d) => (d.type === "directory" ? 0.9 : 0.75))
        .attr("stroke-opacity", 1);
      linkSel?.attr("stroke-opacity", 1);
      labelSel?.attr("opacity", 1);
      return;
    }

    let activeIds: Set<string> | null = null;

    if (focusId) {
      activeIds = getSubtreeAndAncestors(focusId);
    }

    const matches = (d: SimNode) => {
      if (q && !(d.label.toLowerCase().includes(q) || d.id.toLowerCase().includes(q))) return false;
      if (activeIds && !activeIds.has(d.id)) return false;
      return true;
    };

    nodeSel
      .attr("fill-opacity", (d) => (matches(d) ? (d.type === "directory" ? 0.9 : 0.75) : 0.07))
      .attr("stroke-opacity", (d) => (matches(d) ? 1 : 0.07));
    linkSel?.attr("stroke-opacity", (d) =>
      matches(d.source) && matches(d.target) ? 0.6 : 0.04
    );
    labelSel?.attr("opacity", (d) => (matches(d) ? 1 : 0.07));
  }

  function getSubtreeAndAncestors(nodeId: string): Set<string> {
    const result = new Set<string>();

    // descendants (BFS)
    const queue = [nodeId];
    while (queue.length) {
      const curr = queue.shift()!;
      result.add(curr);
      childMapRef.current.get(curr)?.forEach((child) => {
        if (!result.has(child)) queue.push(child);
      });
    }

    // ancestors (walk up parent chain)
    let cursor = parentMapRef.current.get(nodeId);
    while (cursor) {
      result.add(cursor);
      cursor = parentMapRef.current.get(cursor);
    }

    return result;
  }

  function resetZoom() {
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(400)
        .call(zoomRef.current.transform, d3.zoomIdentity);
    }
  }

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
    zoomRef.current = zoom;

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    const links: SimLink[] = (data.links as GraphLink[])
      .map((l) => ({
        source: nodeMap.get(typeof l.source === "string" ? l.source : (l.source as SimNode).id)!,
        target: nodeMap.get(typeof l.target === "string" ? l.target : (l.target as SimNode).id)!,
      }))
      .filter((l) => l.source && l.target);

    // Build adjacency maps for subtree traversal
    const childMap = new Map<string, Set<string>>();
    const parentMap = new Map<string, string>();
    links.forEach((l) => {
      const src = l.source.id;
      const tgt = l.target.id;
      if (!childMap.has(src)) childMap.set(src, new Set());
      childMap.get(src)!.add(tgt);
      parentMap.set(tgt, src);
    });
    childMapRef.current = childMap;
    parentMapRef.current = parentMap;

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
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", "#2e2b1e")
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
      .attr("stroke", (d) => (d.type === "directory" ? "#c8a84b" : "none"))
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .call(drag);

    const label = container
      .append("g")
      .selectAll<SVGTextElement, SimNode>("text")
      .data(nodes.filter((d) => d.type === "directory"))
      .join("text")
      .text((d) => d.label)
      .attr("font-size", (d) => (d.id === "root" ? 11 : 9))
      .attr("fill", "#e8e4d0")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -nodeRadius(d) - 3)
      .style("pointer-events", "none")
      .style("user-select", "none");

    nodeSelRef.current = node;
    linkSelRef.current = link;
    labelSelRef.current = label;

    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "d3-tooltip")
      .style("position", "fixed")
      .style("background", "#111108")
      .style("border", "1px solid #4a4535")
      .style("color", "#e8e4d0")
      .style("padding", "6px 10px")
      .style("border-radius", "0")
      .style("font-size", "11px")
      .style("font-family", "monospace")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("z-index", "9999")
      .style("max-width", "320px")
      .style("word-break", "break-all");

    node
      .on("mouseover", (_event: MouseEvent, d: SimNode) => {
        tooltip.style("opacity", "1").text(d.id === "root" ? "/" : d.id);
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip.style("left", `${event.clientX + 12}px`).style("top", `${event.clientY - 28}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", "0");
      })
      .on("click", (event: MouseEvent, d: SimNode) => {
        event.stopPropagation();
        if (selectedIdRef.current === d.id) {
          selectedIdRef.current = null;
          applyHighlight(null, "");
        } else {
          selectedIdRef.current = d.id;
          applyHighlight(d.id, "");
        }
      });

    // Click on SVG background to deselect
    svg.on("click.deselect", () => {
      if (selectedIdRef.current) {
        selectedIdRef.current = null;
        applyHighlight(null, "");
      }
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8a84b" strokeWidth="2" strokeLinecap="round" className="animate-spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <p className="font-mono text-[11px] uppercase tracking-widest text-[#7a7560]">Building graph...</p>
          </div>
        </div>
      )}

      {status === "empty" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#7a7560]">No file data found.</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-mono text-[11px] uppercase tracking-widest text-[#c84848]">Failed to load graph.</p>
        </div>
      )}

      {status === "ready" && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 border border-[#2e2b1e] bg-[#0a0a08]/95 px-3 py-1.5 backdrop-blur-sm">
            <SearchIcon />
            <input
              type="text"
              placeholder="SEARCH FILES..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 bg-transparent font-mono text-[11px] uppercase tracking-wider text-[#e8e4d0] placeholder-[#4a4535] outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-[#4a4535] hover:text-[#c8a84b]">
                <ClearIcon />
              </button>
            )}
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="absolute right-3 top-3 z-10">
          <button
            onClick={resetZoom}
            title="Reset zoom"
            className="flex items-center gap-1.5 border border-[#2e2b1e] bg-[#0a0a08]/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#7a7560] backdrop-blur-sm transition-colors hover:border-[#c8a84b]/40 hover:text-[#c8a84b]"
          >
            <ResetIcon />
            Reset zoom
          </button>
        </div>
      )}

      <svg ref={svgRef} className="h-full w-full" style={{ background: "transparent" }} />

      {status === "ready" && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-2">
          <div className="border border-[#2e2b1e] bg-[#0a0a08]/95 p-3 backdrop-blur-sm">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[#4a4535]">
              {nodeCount} nodes · scroll · drag · click to focus
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5">
              <LegendItem color={DIR_COLOR} label="directory" />
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

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="shrink-0" style={{ width: 8, height: 8, background: color }} />
      <span className="font-mono text-[10px] text-[#7a7560]">{label}</span>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4a4535" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}
