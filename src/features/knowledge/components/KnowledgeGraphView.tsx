import { Link2 } from "lucide-react";
import type { KeyboardEvent } from "react";

import { useI18n } from "@/shared/i18n";
import { Badge, Card, CardContent } from "@/shared/ui";
import { cn } from "@/shared/utils";

import { KNOWLEDGE_TYPE_LABEL_KEYS } from "../constants";
import type { KnowledgeGraph } from "../knowledgeGraph";

type KnowledgeGraphViewProps = {
  graph: KnowledgeGraph;
  focusedItemId?: string | null;
  onSelectNode: (itemId: string) => void;
};

function shortenLabel(value: string): string {
  return value.length > 18 ? `${value.slice(0, 15)}...` : value;
}

export function KnowledgeGraphView({
  graph,
  focusedItemId,
  onSelectNode,
}: KnowledgeGraphViewProps) {
  const { direction, t } = useI18n();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const hasConnections = graph.edges.length > 0;
  const graphHeight = Math.max(
    640,
    Math.ceil(graph.nodes.length / 5) * 125 + 100
  );

  const handleKeyDown = (
    event: KeyboardEvent<SVGGElement>,
    itemId: string
  ) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onSelectNode(itemId);
  };

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
            {t("knowledge.graphSummary")}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {t("knowledge.graphNodeCount", { count: graph.nodes.length })}
            </Badge>
            <Badge variant="secondary">
              {t("knowledge.graphEdgeCount", { count: graph.edges.length })}
            </Badge>
          </div>
        </div>

        {!hasConnections ? (
          <div
            className="knowledge-graph-isolated-grid grid gap-3 rounded-2xl border bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-3"
            role="list"
          >
            {graph.nodes.map((node) => (
              <div key={node.id} role="listitem">
                <button
                  type="button"
                  className={cn(
                    "knowledge-graph-isolated-node flex min-h-20 w-full min-w-0 flex-col items-start justify-center gap-1 rounded-xl border bg-card p-3 text-start shadow-sm transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    focusedItemId === node.id && "border-primary ring-2 ring-primary/40"
                  )}
                  aria-label={t("knowledge.graphOpenNode", {
                    title: node.title,
                  })}
                  onClick={() => onSelectNode(node.id)}
                >
                  <span className="break-words text-sm font-semibold text-foreground">
                    {node.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(KNOWLEDGE_TYPE_LABEL_KEYS[node.type])}
                  </span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="knowledge-graph-canvas rounded-2xl border bg-muted/20 p-2">
          <svg
            role="img"
            aria-label={t("knowledge.graphAriaLabel")}
            width={1000}
            height={graphHeight}
            viewBox={`0 0 1000 ${graphHeight}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker
                id="knowledge-edge-arrow"
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="8"
                refY="4"
              >
                <path d="M0,0 L8,4 L0,8 Z" className="fill-primary/45" />
              </marker>
            </defs>
            {graph.edges.map((edge) => {
              const source = nodeById.get(edge.sourceId);
              const target = nodeById.get(edge.targetId);

              if (!source || !target) {
                return null;
              }

              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className="stroke-primary/35"
                  markerEnd="url(#knowledge-edge-arrow)"
                  strokeWidth="2"
                />
              );
            })}
            {graph.nodes.map((node) => {
              const isFocused = focusedItemId === node.id;

              return (
                <g
                  key={node.id}
                  role="link"
                  tabIndex={0}
                  aria-label={t("knowledge.graphOpenNode", {
                    title: node.title,
                  })}
                  className="knowledge-graph-node cursor-pointer"
                  onClick={() => onSelectNode(node.id)}
                  onKeyDown={(event) => handleKeyDown(event, node.id)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isFocused ? 58 : 50}
                    className={cn(
                      "knowledge-graph-node-surface fill-card stroke-primary/55 transition-all duration-200 motion-reduce:transition-none",
                      isFocused ? "stroke-[5]" : "stroke-[3]"
                    )}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y - 38}
                    r="10"
                    className="fill-alios-saffron"
                  />
                  <text
                    x={node.x}
                    y={node.y - 6}
                    direction={direction}
                    textAnchor="middle"
                    className="fill-foreground text-[18px] font-semibold"
                  >
                    {shortenLabel(node.title)}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + 22}
                    direction={direction}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[13px]"
                  >
                    {t(KNOWLEDGE_TYPE_LABEL_KEYS[node.type])}
                  </text>
                </g>
              );
            })}
          </svg>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
