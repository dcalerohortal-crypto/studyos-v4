import { useState, useCallback, useRef, useEffect } from "react";
import {
  Loader2,
  RefreshCw,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  GripHorizontal,
} from "lucide-react";
import { MindmapNode, InteractiveMindmap } from "@/types";
import { expandMindmapNode } from "@/lib/contentGenerator";

interface Props {
  mindmap: InteractiveMindmap;
  notebookName: string;
  initialExpandedNodes?: Set<string>;
  onStateChange?: (expandedNodes: Set<string>) => void;
}

interface NodeProps {
  node: MindmapNode;
  level: number;
  expandedNodes: Set<string>;
  manuallyExpandedNodes: Set<string>;
  expandingNodes: Set<string>;
  poppingNodes: Set<string>;
  expandedNodesList: string[];
  notebookName: string;
  onToggle: (nodeId: string) => void;
  onExpand: (nodeId: string, parentContext: string) => Promise<void>;
  scale: number;
}

const LEVEL_COLORS = [
  "border-blue-500/50 from-blue-500/10 to-blue-500/5",
  "border-violet-500/50 from-violet-500/10 to-violet-500/5",
  "border-slate-500/50 from-slate-500/10 to-slate-500/5",
];

const LEVEL_BG = ["bg-blue-500/10", "bg-violet-500/10", "bg-slate-500/10"];

function AnimatedNode({
  node,
  level,
  expandedNodes,
  manuallyExpandedNodes,
  expandingNodes,
  poppingNodes,
  expandedNodesList,
  notebookName,
  onToggle,
  onExpand,
  scale,
}: NodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const isManuallyExpanded = manuallyExpandedNodes.has(node.id);
  const isExpanding = expandingNodes.has(node.id);
  const isPopping = poppingNodes.has(node.id);
  const hasChildren = node.hijos && node.hijos.length > 0;
  const shouldShowChildren = isManuallyExpanded && hasChildren;
  const colorClass = LEVEL_COLORS[Math.min(level, 2)];
  const bgClass = LEVEL_BG[Math.min(level, 2)];
  const nodeIndex = expandedNodesList.indexOf(node.id);
  const isRecentlyExpanded = nodeIndex !== -1;

  const fontSize =
    scale >= 1 ? "text-base" : scale >= 0.75 ? "text-sm" : "text-xs";
  const padding =
    level === 0
      ? scale >= 1
        ? "p-6"
        : scale >= 0.75
          ? "p-4"
          : "p-3"
      : scale >= 1
        ? "p-4"
        : scale >= 0.75
          ? "p-3"
          : "p-2";
  const minWidth =
    level === 0
      ? scale >= 1
        ? "min-w-[300px]"
        : scale >= 0.75
          ? "min-w-[240px]"
          : "min-w-[180px]"
      : scale >= 1
        ? "min-w-[180px]"
        : scale >= 0.75
          ? "min-w-[140px]"
          : "min-w-[100px]";
  const maxWidth =
    level === 0
      ? scale >= 1
        ? "max-w-[400px]"
        : scale >= 0.75
          ? "max-w-[320px]"
          : "max-w-[240px]"
      : scale >= 1
        ? "max-w-[280px]"
        : scale >= 0.75
          ? "max-w-[220px]"
          : "max-w-[160px]";

  const isRoot = level === 0;

  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.id);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <div
        className={`
          relative rounded-2xl border backdrop-blur-xl
          bg-gradient-to-br ${colorClass}
          cursor-pointer transition-all duration-300
          ${!isRoot ? "hover:scale-105 hover:shadow-lg hover:shadow-accent/10" : ""}
          ${padding} ${minWidth} ${maxWidth}
          ${isRoot ? "cursor-default" : ""}
          ${isExpanding ? "animate-pulse" : ""}
          ${isPopping ? "animate-node-pop-3d" : ""}
          ${isManuallyExpanded && !isPopping ? "animate-expand-glow-3d" : ""}
          ${hasChildren && !isManuallyExpanded ? "animate-float-3d" : ""}
        `}
        onClick={handleClick}
      >
        {/* Expand indicator (only for non-root with children) */}
        {!isRoot && hasChildren && (
          <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center z-10">
            {isExpanding ? (
              <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
            ) : isManuallyExpanded ? (
              <Minus className="w-3 h-3 text-accent" />
            ) : (
              <Plus className="w-3 h-3 text-accent" />
            )}
          </div>
        )}

        {/* Root icon */}
        {isRoot && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
            <span className="text-lg">🗺️</span>
          </div>
        )}

        {/* Title */}
        <h4
          className={`font-bold text-foreground mb-1 text-center ${isRoot ? "text-xl" : fontSize}`}
        >
          {node.titulo}
        </h4>

        {/* Content */}
        <p
          className={`text-muted-foreground text-center leading-relaxed ${isRoot ? "text-sm mt-2" : ""}`}
        >
          {node.contenido}
        </p>

        {/* Level badge (only for non-root) */}
        {!isRoot && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-card border border-border rounded-full">
            <span className="text-[10px] text-muted-foreground font-medium">
              {level === 1 ? "1" : level}
            </span>
          </div>
        )}

        {/* Expand indicator for root */}
        {isRoot && hasChildren && !isManuallyExpanded && (
          <div className="mt-3 flex items-center justify-center gap-2 text-accent text-sm">
            <span>Click para expandir</span>
            <Plus className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Children - Only show if manually expanded */}
      {shouldShowChildren && (
        <div className="relative mt-8 animate-expand-down animate-flip-in-3d">
          {/* Vertical line from parent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-border to-transparent" />

          {/* Horizontal line */}
          {node.hijos!.length > 1 && (
            <div
              className="absolute top-6 left-0 right-0 h-0.5 bg-border"
              style={{
                background: `linear-gradient(90deg, transparent 0%, var(--border) 20%, var(--border) 80%, transparent 100%)`,
              }}
            />
          )}

          {/* Children container */}
          <div
            className={`flex gap-4 pt-6 ${node.hijos!.length > 1 ? "justify-center" : ""}`}
          >
            {node.hijos!.map((child, idx) => (
              <div
                key={child.id}
                className="relative flex flex-col items-center animate-child-reveal-3d"
                style={{
                  animationDelay: `${idx * 80}ms`,
                  perspective: "800px",
                }}
              >
                {/* Vertical line from horizontal */}
                <div
                  className="absolute top-0 w-0.5 h-6 bg-border"
                  style={{ left: "50%", transform: "translateX(-50%)" }}
                />

                <AnimatedNode
                  node={child}
                  level={level + 1}
                  expandedNodes={expandedNodes}
                  manuallyExpandedNodes={manuallyExpandedNodes}
                  expandingNodes={expandingNodes}
                  poppingNodes={poppingNodes}
                  expandedNodesList={expandedNodesList}
                  notebookName={notebookName}
                  onToggle={onToggle}
                  onExpand={onExpand}
                  scale={scale}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EsquemaInteractivo({
  mindmap,
  notebookName,
  initialExpandedNodes,
  onStateChange,
}: Props) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    () => new Set()
  );
  const [manuallyExpandedNodes, setManuallyExpandedNodes] = useState<
    Set<string>
  >(() => new Set());
  const [expandingNodes, setExpandingNodes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [poppingNodes, setPoppingNodes] = useState<Set<string>>(new Set());
  const [expandedNodesList, setExpandedNodesList] = useState<string[]>([]);

  // Pan/Drag state
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollPos, setScrollPos] = useState({ x: 0, y: 0 });

  const MIN_ZOOM = 50;
  const MAX_ZOOM = 150;
  const ZOOM_STEP = 10;

  const scale = zoomLevel / 100;

  // Calculate initial scroll to center root node
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollLeft =
        (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop =
        (container.scrollHeight - container.clientHeight) / 2;
    }
  }, []);

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  };

  const resetZoom = () => {
    setZoomLevel(100);
  };

  // Collapse all - reset to initial state
  const collapseAll = () => {
    setManuallyExpandedNodes(new Set());
    setExpandedNodes(new Set());
    onStateChange?.(new Set());

    // Reset scroll position
    if (containerRef.current) {
      containerRef.current.scrollLeft =
        (containerRef.current.scrollWidth - containerRef.current.clientWidth) /
        2;
      containerRef.current.scrollTop = 0;
    }
  };

  // Handle drag/pan
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start drag if clicking on the container background (not a node)
    if ((e.target as HTMLElement).closest('[class*="rounded-2xl"]')) {
      return;
    }

    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollPos({
      x: containerRef.current?.scrollLeft || 0,
      y: containerRef.current?.scrollTop || 0,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const dx = dragStart.x - e.clientX;
    const dy = dragStart.y - e.clientY;

    containerRef.current.scrollLeft = scrollPos.x + dx;
    containerRef.current.scrollTop = scrollPos.y + dy;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleToggle = useCallback(
    (nodeId: string) => {
      setManuallyExpandedNodes(prev => {
        const next = new Set(prev);

        if (next.has(nodeId)) {
          // Collapse this node and all its children
          next.delete(nodeId);
          // Recursively remove ONLY descendants of this node
          const removeDescendants = (
            nodes: MindmapNode[],
            parentId?: string
          ) => {
            nodes.forEach(node => {
              if (parentId === nodeId) {
                // This is a direct child of the node we're closing
                next.delete(node.id);
                // Continue removing descendants of this child
                if (node.hijos) {
                  removeDescendants(node.hijos, node.id);
                }
              } else if (node.hijos) {
                // Keep searching for the target node
                removeDescendants(node.hijos, parentId);
              }
            });
          };
          removeDescendants(
            [
              {
                id: "root",
                titulo: mindmap.titulo,
                contenido: mindmap.contenido,
                hijos: mindmap.hijos,
              },
            ],
            undefined
          );
          // Update expanded nodes list for animations
          setExpandedNodesList(prev => prev.filter(id => id !== nodeId));
        } else {
          // Expand this node - trigger 3D pop animation
          next.add(nodeId);
          setExpandedNodes(prev => new Set(prev).add(nodeId));
          // Add to popping nodes for animation
          setPoppingNodes(prev => new Set(prev).add(nodeId));
          // Add to expanded list for 3D animations
          setExpandedNodesList(prev => [...prev, nodeId]);
          // Remove pop animation class after animation completes
          setTimeout(() => {
            setPoppingNodes(prev => {
              const nextSet = new Set(prev);
              nextSet.delete(nodeId);
              return nextSet;
            });
          }, 400);
        }

        onStateChange?.(next);
        return next;
      });
    },
    [onStateChange, mindmap]
  );

  const handleExpand = useCallback(
    async (nodeId: string, parentContext: string) => {
      setExpandingNodes(prev => new Set(prev).add(nodeId));
      setError(null);

      try {
        const children = await expandMindmapNode(
          nodeId,
          parentContext,
          notebookName
        );

        if (children && children.length > 0) {
          // Add children to the tree
          const addChildrenToTree = (nodes: MindmapNode[]): MindmapNode[] => {
            return nodes.map(node => {
              if (node.id === nodeId) {
                return { ...node, hijos: children };
              }
              if (node.hijos) {
                return { ...node, hijos: addChildrenToTree(node.hijos) };
              }
              return node;
            });
          };

          // Update the state
          setManuallyExpandedNodes(prev => {
            const next = new Set(prev);
            next.add(nodeId);
            return next;
          });

          setExpandedNodes(prev => new Set(prev).add(nodeId));
          setCurrentMindmap(prev => ({
            ...prev,
            hijos: addChildrenToTree(prev.hijos),
          }));

          onStateChange?.(new Set([...manuallyExpandedNodes, nodeId]));
        } else {
          setError("No se pudieron cargar más nodos");
        }
      } catch (err) {
        setError("Error al expandir. Inténtalo de nuevo.");
      } finally {
        setExpandingNodes(prev => {
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      }
    },
    [notebookName, onStateChange, manuallyExpandedNodes]
  );

  const [currentMindmap, setCurrentMindmap] = useState(mindmap);

  const handleRetry = useCallback(() => {
    setError(null);
  }, []);

  const hasAnyChildren = (nodes: MindmapNode[]): boolean => {
    return nodes.some(node => node.hijos && node.hijos.length > 0);
  };

  const rootNode = {
    id: "root",
    titulo: mindmap.titulo,
    contenido: mindmap.contenido,
    hijos: mindmap.hijos,
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header with collapse button */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-xl flex items-center justify-center">
            <span className="text-xl">🗺️</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {currentMindmap.titulo}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentMindmap.contenido}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Collapse button */}
          <button
            onClick={collapseAll}
            className="flex items-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-xl transition-colors text-sm"
            title="Colapsar todo"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Colapsar</span>
          </button>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-blue-500/50 bg-blue-500/10" />
              <span className="text-muted-foreground">1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-violet-500/50 bg-violet-500/10" />
              <span className="text-muted-foreground">2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-slate-500/50 bg-slate-500/10" />
              <span className="text-muted-foreground">3+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-red-400">{error}</span>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )}

      {/* Mindmap Container with Drag */}
      <div
        ref={containerRef}
        className={`
          flex-1 overflow-auto border border-border rounded-xl 
          bg-secondary/20 cursor-grab active:cursor-grabbing
          ${isDragging ? "select-none" : ""}
        `}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Drag indicator */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground text-xs pointer-events-none opacity-50">
          <GripHorizontal className="w-4 h-4" />
          <span>Arrastra para moverte</span>
        </div>

        <div
          className="flex justify-center min-w-max p-8"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            minHeight: "100%",
          }}
        >
          <AnimatedNode
            node={rootNode}
            level={0}
            expandedNodes={expandedNodes}
            manuallyExpandedNodes={manuallyExpandedNodes}
            expandingNodes={expandingNodes}
            poppingNodes={poppingNodes}
            expandedNodesList={expandedNodesList}
            notebookName={notebookName}
            onToggle={handleToggle}
            onExpand={handleExpand}
            scale={scale}
          />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-card border border-border rounded-xl p-2 shadow-lg">
        <button
          onClick={zoomOut}
          disabled={zoomLevel <= MIN_ZOOM}
          className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
          title="Alejar"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={resetZoom}
          className="px-2 py-1 hover:bg-secondary rounded-lg transition-colors font-medium text-sm min-w-[60px]"
          title="Resetear zoom"
        >
          {zoomLevel}%
        </button>

        <button
          onClick={zoomIn}
          disabled={zoomLevel >= MAX_ZOOM}
          className="p-2 hover:bg-secondary rounded-lg transition-colors disabled:opacity-30"
          title="Acercar"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-secondary/50 rounded-xl flex-shrink-0">
        <p className="text-xs text-muted-foreground text-center">
          <span className="font-medium text-foreground">Click</span> en un nodo
          para expandir. Usa <RotateCcw className="w-3 h-3 inline" /> para
          colapsar todo. Arrastra el fondo para moverte.
        </p>
      </div>

      <style>{`
        @keyframes expand-down {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes expand-up {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0);
          }
          50% {
            box-shadow: 0 0 20px 5px rgba(139, 92, 246, 0.3);
          }
        }
        
        /* 3D Animations */
        @keyframes flip-in-3d {
          0% {
            opacity: 0;
            transform: perspective(1000px) rotateX(-90deg) scale(0.8);
            transform-origin: top center;
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) scale(1);
            transform-origin: top center;
          }
        }
        
        @keyframes node-pop-3d {
          0% { 
            transform: scale(1) perspective(500px); 
          }
          40% { 
            transform: scale(1.15) rotateY(8deg) perspective(500px); 
            filter: brightness(1.2);
          }
          70% { 
            transform: scale(0.95) rotateY(-3deg) perspective(500px); 
          }
          100% { 
            transform: scale(1) rotateY(0deg) perspective(500px); 
            filter: brightness(1);
          }
        }
        
        @keyframes child-reveal-3d {
          0% {
            opacity: 0;
            transform: perspective(800px) translateZ(-80px) rotateX(20deg) scale(0.6);
          }
          60% {
            opacity: 0.8;
            transform: perspective(800px) translateZ(20px) rotateX(-5deg) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: perspective(800px) translateZ(0) rotateX(0deg) scale(1);
          }
        }
        
        @keyframes expand-glow-3d {
          0% { 
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.8),
                        0 0 40px 5px rgba(99, 102, 241, 0.5),
                        inset 0 0 20px rgba(99, 102, 241, 0.1);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.4),
                        0 0 60px 15px rgba(99, 102, 241, 0.3),
                        inset 0 0 30px rgba(99, 102, 241, 0.2);
          }
          100% { 
            box-shadow: 0 0 0 0 rgba(99, 102, 241, 0),
                        0 0 30px 5px rgba(99, 102, 241, 0.15),
                        inset 0 0 10px rgba(99, 102, 241, 0.05);
          }
        }
        
        @keyframes float-3d {
          0%, 100% {
            transform: translateY(0px) perspective(500px) rotateX(2deg);
          }
          50% {
            transform: translateY(-5px) perspective(500px) rotateX(-2deg);
          }
        }
        
        .animate-expand-down {
          animation: expand-down 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-expand-up {
          animation: expand-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        
        .rounded-2xl:hover {
          animation: glow-pulse 1.5s ease-in-out infinite;
        }
        
        /* 3D Animation Classes */
        .animate-flip-in-3d {
          animation: flip-in-3d 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        
        .animate-node-pop-3d {
          animation: node-pop-3d 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-style: preserve-3d;
        }
        
        .animate-child-reveal-3d {
          animation: child-reveal-3d 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transform-style: preserve-3d;
          opacity: 0;
        }
        
        .animate-expand-glow-3d {
          animation: expand-glow-3d 0.8s ease-out forwards;
        }
        
        .animate-float-3d {
          animation: float-3d 3s ease-in-out infinite;
          transform-style: preserve-3d;
        }
        
        .perspective-3d {
          transform-style: preserve-3d;
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
