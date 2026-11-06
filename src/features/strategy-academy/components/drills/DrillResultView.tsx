// DrillResultView — strategy-academy drills 结果页（feature-local 模板）
//
// 收编 6 个 drill + PracticeDrill 结果页的公共骨架：
//   Trophy → h3 标题（禁止 h1：结果页嵌在课程/训练视图内）→ 三张统计卡（正确率 / 用时 / 正确题数）
//   → 附加插槽 → 平铺黄铜主 CTA。
//
// 差异全部用插槽表达，不做 `mode='pressure'` 之类的模式爆炸（计划 P6）：
// - `note`：标题下的口径说明（OpponentDrill 的「两问全对才计为答对」）
// - `extraStats`：第二排统计（PracticeDrill 压力模式的超时 / 最长连对 / 压力得分）
// - `children`：其余结果区块（难度变化阶梯图 / 薄弱点 chips）
// - `animated`：PracticeDrill 的入场 motion 包裹；其余 drill 保持无 motion
//
// 视觉保持收编前原样：StatCard `size="xl" surface="solid"` 对应原「walnut-raised 实底 + text-3xl」卡；
// 统计卡外层 div 只为测试提供 `data-testid`（StatCard 不透传 data-*，且不得为此改 shared）。
// CTA 用 `Button variant="quiet"` + 临时平铺覆盖，V1 视觉批次再改为金属渐变 `default`。
//
// 归属：单模块（strategy-academy drills）消费，按 P3/P12 留在 feature 内，不进 shared。

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Target, Trophy } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { StatCard } from '@/shared/components/data-display/StatCard';
import { transitionSlow } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';

export interface DrillResultViewProps {
  correct: number;
  total: number;
  /** 用时文本（含单位，如 `12.3s`） */
  timeText: string;
  /** 结果页标题 key */
  titleKey: string;
  /** 标题 key 缺失时的回退文案 */
  titleFallback?: string;
  accuracyLabelKey: string;
  timeLabelKey: string;
  correctLabelKey: string;
  /** 标题下的口径说明（如「两问全对才计为答对」） */
  note?: ReactNode;
  /** 第二排统计（压力模式附加三卡） */
  extraStats?: ReactNode;
  /** 其余结果区块（难度阶梯图 / 薄弱点） */
  children?: ReactNode;
  /** 主 CTA 文案 key；与 `onFinish` 同时提供才渲染（PracticeDrill 结果页无主按钮） */
  ctaLabelKey?: string;
  onFinish?: () => void;
  /** PracticeDrill 的入场 motion 包裹；默认无 motion */
  animated?: boolean;
}

/**
 * 平铺黄铜主 CTA：quiet 变体 + 临时平铺覆盖（背景 / 字色 / hover 全部抵消 quiet 的 hover 语义）。
 * V1 视觉批次改为 `Button variant="default"` 后删除本常量。
 */
const FLAT_CTA_CLASS =
  'px-5 py-2.5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm transition-opacity hover:opacity-90 hover:bg-[var(--brass-fill)] hover:text-[var(--brass-fill-ink)]';

export function DrillResultView({
  correct,
  total,
  timeText,
  titleKey,
  titleFallback,
  accuracyLabelKey,
  timeLabelKey,
  correctLabelKey,
  note,
  extraStats,
  children,
  ctaLabelKey,
  onFinish,
  animated = false,
}: DrillResultViewProps) {
  const { t } = useTranslation();
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const hasNote = note !== undefined && note !== null;

  const content = (
    <>
      <Trophy className="w-14 h-14 text-[var(--brass-bright)] mx-auto mb-4" aria-hidden="true" />
      <h3
        className={cn(
          'font-display text-2xl text-[var(--ivory)]',
          hasNote ? 'mb-2' : 'mb-6',
        )}
      >
        {t(titleKey, { defaultValue: titleFallback })}
      </h3>
      {hasNote ? <p className="text-xs text-[var(--ivory-muted)] mb-6">{note}</p> : null}

      <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
        <div data-testid="drill-result-accuracy" className="h-full">
          <StatCard
            size="xl"
            surface="solid"
            valueFirst
            accent="gold"
            className="h-full"
            value={`${accuracy}%`}
            label={t(accuracyLabelKey)}
          />
        </div>
        <div data-testid="drill-result-time" className="h-full">
          <StatCard
            size="xl"
            surface="solid"
            valueFirst
            className="h-full"
            value={timeText}
            label={
              <span className="inline-flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {t(timeLabelKey)}
              </span>
            }
          />
        </div>
        <div data-testid="drill-result-correct" className="h-full">
          <StatCard
            size="xl"
            surface="solid"
            valueFirst
            className="h-full"
            value={`${correct}/${total}`}
            label={
              <span className="inline-flex items-center justify-center gap-1">
                <Target className="w-3 h-3" aria-hidden="true" />
                {t(correctLabelKey)}
              </span>
            }
          />
        </div>
      </div>

      {extraStats}
      {children}

      {ctaLabelKey && onFinish ? (
        <Button variant="quiet" onClick={onFinish} className={FLAT_CTA_CLASS}>
          {t(ctaLabelKey)}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      ) : null}
    </>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionSlow}
        className="text-center py-8"
      >
        {content}
      </motion.div>
    );
  }

  return <div className="text-center py-8">{content}</div>;
}
