import { useTranslation } from 'react-i18next';
import type { QuestionDifficulty } from '../types';

/**
 * P2-03：难度自适应变化阶梯图（结果页展示）。
 *
 * 将自适应训练中的难度升降序列可视化为阶梯图：
 * 横轴 = 题号，纵轴 = 难度等级（基础/进阶/高级），
 * 变化点在对应题号处垂直跳变，段终点以难度色圆点标注。
 * 颜色与 PracticeDrill 的 DIFFICULTY_COLORS（Tailwind 类版）一一对应：
 * beginner=success / intermediate=info / advanced=warning。
 */

export interface DifficultyChange {
  from: QuestionDifficulty;
  to: QuestionDifficulty;
  questionIndex: number;
}

const DIFFICULTY_LEVEL: Record<QuestionDifficulty, number> = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  beginner: '基础',
  intermediate: '进阶',
  advanced: '高级',
};

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  beginner: 'var(--success)',
  intermediate: 'var(--info)',
  advanced: 'var(--warning)',
};

const W = 300;
const H = 76;
const PAD_X = 6;
const PAD_Y = 10;
const PLOT_W = W - PAD_X * 2;
const PLOT_H = H - PAD_Y * 2;

function xAt(questionIndex: number, total: number): number {
  return PAD_X + (questionIndex / Math.max(total, 1)) * PLOT_W;
}

function yAt(level: number): number {
  return PAD_Y + PLOT_H - (level + 0.5) * (PLOT_H / 3);
}

export function DifficultyStairChart({
  changes,
  totalQuestions,
}: {
  changes: DifficultyChange[];
  totalQuestions: number;
}) {
  const { t } = useTranslation();
  // 阶梯点序列：起点（题 0，初始难度）→ 每次变化在 questionIndex 处水平延伸后垂直跳变 → 终点（末题）
  const points: Array<[number, number]> = [[0, DIFFICULTY_LEVEL[changes[0]!.from]]];
  const segmentEnds: Array<{ x: number; y: number; level: QuestionDifficulty }> = [];

  for (const change of changes) {
    const lastY = points[points.length - 1]![1];
    points.push([change.questionIndex, lastY]);
    points.push([change.questionIndex, DIFFICULTY_LEVEL[change.to]]);
    segmentEnds.push({ x: change.questionIndex, y: DIFFICULTY_LEVEL[change.to], level: change.to });
  }
  const finalLevel = changes[changes.length - 1]!.to;
  points.push([totalQuestions, DIFFICULTY_LEVEL[finalLevel]]);
  segmentEnds.push({ x: totalQuestions, y: DIFFICULTY_LEVEL[finalLevel], level: finalLevel });

  const polylinePoints = points.map(([qx, lv]) => `${xAt(qx, totalQuestions)},${yAt(lv)}`).join(' ');

  return (
    <div className="mb-6 max-w-sm mx-auto">
      <p className="text-xs text-[var(--ivory-muted)] mb-2">{t('academy.difficultyStairChart.label')}</p>
      <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)]/40 p-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto"
          role="img"
          aria-label={t('academy.difficultyStairChart.ariaLabel')}
        >
          {/* 三条水平参考线（对应三个难度档） */}
          {([0, 1, 2] as const).map((lv) => (
            <line
              key={lv}
              x1={PAD_X}
              y1={yAt(lv)}
              x2={W - PAD_X}
              y2={yAt(lv)}
              stroke="var(--walnut-light)"
              strokeOpacity={0.3}
              strokeDasharray="3 3"
            />
          ))}
          {/* 阶梯线 */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="var(--brass-bright)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {/* 段终点（变化落点 + 终点），按难度着色 */}
          {segmentEnds.map((seg, i) => (
            <circle
              key={i}
              cx={xAt(seg.x, totalQuestions)}
              cy={yAt(seg.y)}
              r={3.5}
              fill={DIFFICULTY_COLORS[seg.level]}
            />
          ))}
        </svg>
        {/* 图例 */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1 text-[10px]"
              style={{ color: DIFFICULTY_COLORS[d] }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: DIFFICULTY_COLORS[d] }}
              />
              {DIFFICULTY_LABELS[d]}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
