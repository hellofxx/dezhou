import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAcademyStore } from '../store';
import { LEVELS } from '../data/courses';

interface GraphNode {
  id: string;
  label: string;
  fullTitle: string;
  level: number;
  order: number;
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  crossLevel: boolean;
}

interface ConceptGraphProps {
  onNodeClick: (lessonId: string) => void;
}

const LAYOUT = {
  nodeWidth: 130,
  nodeHeight: 44,
  nodeGap: 16,
  levelGap: 70,
  paddingLeft: 70,
  paddingTop: 30,
  levelLabelWidth: 60,
};

function truncateLabel(text: string, max = 10): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

/** 动态生成节点和边 */
function buildGraph() {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  LEVELS.forEach((levelInfo, levelIdx) => {
    const levelY = LAYOUT.paddingTop + levelIdx * (LAYOUT.nodeHeight + LAYOUT.levelGap);
    const lessons = [...levelInfo.lessons].sort((a, b) => a.order - b.order);

    lessons.forEach((lesson, lessonIdx) => {
      const x = LAYOUT.paddingLeft + LAYOUT.levelLabelWidth + lessonIdx * (LAYOUT.nodeWidth + LAYOUT.nodeGap);
      nodes.push({
        id: lesson.id,
        label: truncateLabel(lesson.title),
        fullTitle: lesson.title,
        level: levelInfo.level,
        order: lesson.order,
        x,
        y: levelY,
      });

      // 同层依赖：order N 依赖 order N-1
      if (lessonIdx > 0) {
        const prevLesson = lessons[lessonIdx - 1];
        if (prevLesson) {
          edges.push({ from: prevLesson.id, to: lesson.id, crossLevel: false });
        }
      }
    });

    // 跨层依赖：Level N 的第一课依赖 Level N-1 的最后一课
    if (levelIdx > 0) {
      const prevLevel = LEVELS[levelIdx - 1];
      if (prevLevel) {
        const prevLessons = [...prevLevel.lessons].sort((a, b) => a.order - b.order);
        const prevLast = prevLessons[prevLessons.length - 1];
        const curFirst = lessons[0];
        if (prevLast && curFirst) {
          edges.push({ from: prevLast.id, to: curFirst.id, crossLevel: true });
        }
      }
    }
  });

  // 特殊依赖：根据 prerequisiteLevelIds 添加跨层边
  LEVELS.forEach((levelInfo) => {
    if (!levelInfo.prerequisiteLevelIds || levelInfo.prerequisiteLevelIds.length === 0) return;
    const curLessons = [...levelInfo.lessons].sort((a, b) => a.order - b.order);
    const curFirst = curLessons[0];
    if (!curFirst) return;

    levelInfo.prerequisiteLevelIds.forEach((prereqId) => {
      const prereqLevel = LEVELS.find((l) => l.id === prereqId);
      if (!prereqLevel) return;
      const prereqLessons = [...prereqLevel.lessons].sort((a, b) => a.order - b.order);
      const prereqLast = prereqLessons[prereqLessons.length - 1];
      if (prereqLast) {
        const exists = edges.some((e) => e.from === prereqLast.id && e.to === curFirst.id);
        if (!exists) {
          edges.push({ from: prereqLast.id, to: curFirst.id, crossLevel: true });
        }
      }
    });
  });

  return { nodes, edges };
}

export function ConceptGraph({ onNodeClick }: ConceptGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const { progress, isLevelUnlocked } = useAcademyStore();
  const completedLessons = progress.completedLessons;

  const { nodes, edges } = useMemo(() => buildGraph(), []);

  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  // 计算 SVG 尺寸
  const svgDimensions = useMemo(() => {
    let maxX = 0;
    let maxY = 0;
    nodes.forEach((n) => {
      maxX = Math.max(maxX, n.x + LAYOUT.nodeWidth + 40);
      maxY = Math.max(maxY, n.y + LAYOUT.nodeHeight + 40);
    });
    return { width: Math.max(maxX, 800), height: Math.max(maxY, 600) };
  }, [nodes]);

  // 响应式检测
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // 初始化 viewBox
  useEffect(() => {
    setViewBox({ x: 0, y: 0, w: svgDimensions.width, h: svgDimensions.height });
  }, [svgDimensions]);

  // Hover 相关边
  const relatedEdges = useMemo(() => {
    if (!hoveredNode) return new Set<number>();
    const related = new Set<number>();
    edges.forEach((edge, idx) => {
      if (edge.from === hoveredNode || edge.to === hoveredNode) {
        related.add(idx);
      }
    });
    return related;
  }, [hoveredNode, edges]);

  // 判断节点状态
  const getNodeStatus = useCallback(
    (node: GraphNode): 'completed' | 'current' | 'locked' | 'available' => {
      if (completedLessons.includes(node.id)) return 'completed';
      if (!isLevelUnlocked(node.level)) return 'locked';
      // 当前进行中：该 level 已解锁，该课程未完成，且前一课已完成（或为第一课）
      const levelInfo = LEVELS.find((l) => l.level === node.level);
      if (levelInfo) {
        const lessons = [...levelInfo.lessons].sort((a, b) => a.order - b.order);
        const idx = lessons.findIndex((l) => l.id === node.id);
        if (idx === 0) return 'current';
        const prevLesson = lessons[idx - 1];
        if (prevLesson && completedLessons.includes(prevLesson.id)) return 'current';
      }
      return 'available';
    },
    [completedLessons, isLevelUnlocked]
  );

  // 缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
      setViewBox((vb) => {
        const newW = Math.min(Math.max(vb.w * scaleFactor, 400), svgDimensions.width * 2);
        const newH = Math.min(Math.max(vb.h * scaleFactor, 300), svgDimensions.height * 2);
        const dx = (vb.w - newW) / 2;
        const dy = (vb.h - newH) / 2;
        return { x: vb.x + dx, y: vb.y + dy, w: newW, h: newH };
      });
    },
    [svgDimensions]
  );

  // 平移
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - panStart.current.x) * scaleX;
      const dy = (e.clientY - panStart.current.y) * scaleY;
      setViewBox((vb) => ({ ...vb, x: vb.x - dx, y: vb.y - dy }));
      panStart.current = { x: e.clientX, y: e.clientY };
    },
    [isPanning, viewBox.w, viewBox.h]
  );

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const resetView = useCallback(() => {
    setViewBox({ x: 0, y: 0, w: svgDimensions.width, h: svgDimensions.height });
  }, [svgDimensions]);

  // 移动端：卡片列表视图
  if (isMobile) {
    return (
      <div className="space-y-4">
        {LEVELS.map((levelInfo) => {
          const lessons = [...levelInfo.lessons].sort((a, b) => a.order - b.order);
          const unlocked = isLevelUnlocked(levelInfo.level);
          return (
            <div key={levelInfo.level} className="rounded-lg border border-[var(--walnut-border)] bg-[var(--walnut-raised)] p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{levelInfo.icon}</span>
                <span className="text-xs font-semibold text-[var(--ivory)]">
                  L{levelInfo.level} · {levelInfo.title}
                </span>
                {!unlocked && <span className="text-[10px] text-[var(--ivory-dim)]">🔒</span>}
              </div>
              <div className="space-y-1.5">
                {lessons.map((lesson) => {
                  const isCompleted = completedLessons.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onNodeClick(lesson.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-xs transition-colors ${
                        isCompleted
                          ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                          : unlocked
                            ? 'bg-[var(--surface-raised)] text-[var(--ivory)] border border-[var(--walnut-border)] hover:border-[var(--brass)]'
                            : 'bg-transparent text-[var(--ivory-dim)] border border-dashed border-[var(--walnut-border)] opacity-60'
                      }`}
                    >
                      <span className="mr-1.5">{isCompleted ? '✓' : '○'}</span>
                      {lesson.title}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 桌面/平板：SVG 图谱
  return (
    <div className="relative w-full">
      {/* 控制按钮 */}
      <div className="absolute top-2 right-2 z-10 flex gap-1.5">
        <button
          onClick={resetView}
          className="px-2 py-1 text-[10px] rounded bg-[var(--walnut-raised)] border border-[var(--walnut-border)] text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] hover:border-[var(--brass)] transition-colors"
        >
          适应屏幕
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)]/30">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="w-full h-auto select-none"
          style={{ maxHeight: '560px', cursor: isPanning ? 'grabbing' : 'grab' }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--walnut-light)" />
            </marker>
            <marker id="arrowhead-success" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--success)" />
            </marker>
            <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--brass-bright)" />
            </marker>
          </defs>

          {/* Level 标签和背景行 */}
          {LEVELS.map((levelInfo, levelIdx) => {
            const levelY = LAYOUT.paddingTop + levelIdx * (LAYOUT.nodeHeight + LAYOUT.levelGap);
            return (
              <g key={`level-${levelInfo.level}`}>
                {/* 行背景 */}
                <rect
                  x={0}
                  y={levelY - 8}
                  width={svgDimensions.width}
                  height={LAYOUT.nodeHeight + 16}
                  fill={levelIdx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
                  rx={4}
                />
                {/* Level 标签 */}
                <text x={12} y={levelY + 16} fill="var(--ivory-muted)" fontSize={12} fontWeight={600}>
                  L{levelInfo.level}
                </text>
                <text x={12} y={levelY + 32} fill="var(--ivory-dim)" fontSize={9}>
                  {levelInfo.title}
                </text>
              </g>
            );
          })}

          {/* 边 */}
          {edges.map((edge, idx) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const isRelated = relatedEdges.has(idx);
            const fromCompleted = completedLessons.includes(edge.from);
            const toCompleted = completedLessons.includes(edge.to);
            const bothCompleted = fromCompleted && toCompleted;

            let path: string;
            if (!edge.crossLevel) {
              // 同层：水平贝塞尔
              const x1 = fromNode.x + LAYOUT.nodeWidth;
              const y1 = fromNode.y + LAYOUT.nodeHeight / 2;
              const x2 = toNode.x;
              const y2 = toNode.y + LAYOUT.nodeHeight / 2;
              const cpOffset = Math.min(30, (x2 - x1) / 3);
              path = `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`;
            } else {
              // 跨层：垂直贝塞尔
              const x1 = fromNode.x + LAYOUT.nodeWidth / 2;
              const y1 = fromNode.y + LAYOUT.nodeHeight;
              const x2 = toNode.x + LAYOUT.nodeWidth / 2;
              const y2 = toNode.y;
              const midY = (y1 + y2) / 2;
              path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
            }

            const strokeColor = isRelated
              ? 'var(--brass-bright)'
              : bothCompleted
                ? 'var(--success)'
                : 'var(--walnut-light)';

            return (
              <path
                key={`edge-${idx}`}
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isRelated ? 2.5 : 1.5}
                strokeDasharray={bothCompleted ? undefined : '5 3'}
                markerEnd={
                  isRelated ? 'url(#arrowhead-active)' : bothCompleted ? 'url(#arrowhead-success)' : 'url(#arrowhead)'
                }
                opacity={hoveredNode && !isRelated ? 0.25 : 1}
                className="transition-opacity duration-200"
              />
            );
          })}

          {/* 节点 */}
          {nodes.map((node) => {
            const status = getNodeStatus(node);
            const isHovered = hoveredNode === node.id;
            const levelInfo = LEVELS.find((l) => l.level === node.level);

            // 样式
            let fill: string;
            let stroke: string;
            let textColor: string;
            let dashArray: string | undefined;

            switch (status) {
              case 'completed':
                fill = 'rgba(127, 184, 131, 0.15)';
                stroke = 'var(--success)';
                textColor = 'var(--poker-success)';
                dashArray = undefined;
                break;
              case 'current':
                fill = 'var(--surface-raised)';
                stroke = 'var(--brass)';
                textColor = 'var(--ivory)';
                dashArray = undefined;
                break;
              case 'locked':
                fill = 'rgba(0,0,0,0.2)';
                stroke = 'var(--ivory-dim)';
                textColor = 'var(--ivory-dim)';
                dashArray = '4 3';
                break;
              default:
                fill = 'var(--surface-raised)';
                stroke = 'rgba(255,255,255,0.25)';
                textColor = 'var(--ivory)';
                dashArray = undefined;
            }

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25, delay: (node.level - 1) * 0.06 + node.order * 0.03 }}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onNodeClick(node.id);
                }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* 节点背景 */}
                <rect
                  x={node.x}
                  y={node.y}
                  width={LAYOUT.nodeWidth}
                  height={LAYOUT.nodeHeight}
                  rx={8}
                  fill={fill}
                  stroke={isHovered ? 'var(--brass-bright)' : stroke}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray={dashArray}
                />

                {/* 当前进行中脉冲动画 */}
                {status === 'current' && (
                  <rect
                    x={node.x - 2}
                    y={node.y - 2}
                    width={LAYOUT.nodeWidth + 4}
                    height={LAYOUT.nodeHeight + 4}
                    rx={10}
                    fill="none"
                    stroke="var(--brass)"
                    strokeWidth={1}
                    opacity={0.5}
                  >
                    <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                  </rect>
                )}

                {/* 节点文字 */}
                <text
                  x={node.x + LAYOUT.nodeWidth / 2}
                  y={node.y + LAYOUT.nodeHeight / 2 + (status === 'completed' ? 0 : 1)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textColor}
                  fontSize={11}
                  fontWeight={status === 'completed' ? 600 : 400}
                >
                  {node.label}
                </text>

                {/* 已完成 ✓ */}
                {status === 'completed' && (
                  <g transform={`translate(${node.x + LAYOUT.nodeWidth - 18}, ${node.y + 4})`}>
                    <circle cx={7} cy={7} r={7} fill="var(--success)" opacity={0.9} />
                    <path d="M4 7 L6.5 9.5 L10 4.5" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}

                {/* 未解锁 🔒 */}
                {status === 'locked' && (
                  <text x={node.x + LAYOUT.nodeWidth - 16} y={node.y + 14} fontSize={10} fill="var(--ivory-dim)">
                    🔒
                  </text>
                )}

                {/* Tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={node.x - 10}
                      y={node.y - 40}
                      width={LAYOUT.nodeWidth + 20}
                      height={32}
                      rx={6}
                      fill="rgba(0,0,0,0.92)"
                      stroke="rgba(255,255,255,0.2)"
                    />
                    <text x={node.x + LAYOUT.nodeWidth / 2} y={node.y - 27} textAnchor="middle" fill="white" fontSize={10} fontWeight={500}>
                      {node.fullTitle}
                    </text>
                    <text x={node.x + LAYOUT.nodeWidth / 2} y={node.y - 14} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={9}>
                      {levelInfo ? `L${levelInfo.level} · ${levelInfo.title}` : ''} ·{' '}
                      {status === 'completed' ? '已完成' : status === 'current' ? '进行中' : status === 'locked' ? '未解锁' : '未开始'}
                    </text>
                  </g>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* 图例 */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500/20 border border-green-500" />
          <span className="text-[10px] text-[var(--ivory-muted)]">已完成</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[var(--surface-raised)] border border-[var(--brass)]" />
          <span className="text-[10px] text-[var(--ivory-muted)]">进行中</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[var(--surface-raised)] border border-white/25" />
          <span className="text-[10px] text-[var(--ivory-muted)]">未开始</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm border border-dashed border-[var(--ivory-dim)]" />
          <span className="text-[10px] text-[var(--ivory-muted)]">未解锁</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="var(--success)" strokeWidth="1.5" /></svg>
          <span className="text-[10px] text-[var(--ivory-muted)]">已完成路径</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="8"><line x1="0" y1="4" x2="20" y2="4" stroke="var(--walnut-light)" strokeWidth="1.5" strokeDasharray="4 2" /></svg>
          <span className="text-[10px] text-[var(--ivory-muted)]">前置依赖</span>
        </div>
      </div>
    </div>
  );
}
