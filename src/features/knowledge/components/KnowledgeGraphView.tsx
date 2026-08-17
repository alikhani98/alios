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
  return value.length > 30 ? `${value.slice(0, 27)}...` : value;
}

export function KnowledgeGraphView({
  graph,
  focusedItemId,
  onSelectNode,
}: KnowledgeGraphViewProps) {
  const { direction, t } = useI18n();
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

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
    <Card className="overflow-hidden">
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

        <div className="rounded-2xl border bg-muted/20 p-2">
          <svg
            role="img"
            aria-label={t("knowledge.graphAriaLabel")}
            className="h-[28rem] w-full"
            viewBox="0 0 1000 640"
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
                  className="cursor-pointer outline-none"
                  onClick={() => onSelectNode(node.id)}
                  onKeyDown={(event) => handleKeyDown(event, node.id)}
                >
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isFocused ? 58 : 50}
                    className={cn(
                      "fill-card stroke-primary/55 transition-all duration-200",
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
      </CardContent>
    </Card>
  );
}
