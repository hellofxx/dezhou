import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ClipboardCheck, RotateCcw } from 'lucide-react';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import type { CheckpointDimensionStat } from '../utils/checkpoint';
import { checkpointText } from '../utils/checkpointCopy';

interface CheckpointResultViewProps {
  level: number;
  score: number;
  correct: number;
  total: number;
  isFirstAttempt: boolean;
  firstScore: number;
  bestScore: number;
  wrongCount: number;
  stats: readonly CheckpointDimensionStat[];
  onRetry: () => void;
  onBack: () => void;
}

/**
 * 检查点结算卡（形成性自查）。
 *
 * 文案口径（PRD §5.16.13）：显式标注「形成性、不发证、不解锁下一级」，并与认证测验区分 ——
 * 认证有冷却/有效期/通过判定，检查点只记成绩、错题进 SRS 复习队列，重考无冷却。
 */
export function CheckpointResultView({
  level,
  score,
  correct,
  total,
  isFirstAttempt,
  firstScore,
  bestScore,
  wrongCount,
  stats,
  onRetry,
  onBack,
}: CheckpointResultViewProps) {
  const { t } = useTranslation();

  return (
    <div className="py-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-8"
      >
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-5 h-5 text-[var(--brass-bright)]" aria-hidden="true" />
          <h2 className="font-display text-xl text-[var(--ivory)]">
            {checkpointText(t, 'resultTitle', 'Level {{level}} 检查点结果', { level })}
          </h2>
        </div>

        <p className="font-numeric text-4xl text-[var(--brass-bright)] mb-1">
          {checkpointText(t, 'score', '{{score}}%', { score })}
        </p>
        <p className="text-sm text-[var(--ivory-dim)] mb-3">
          {t('academy.quiz.answeredCount', { correct, total })}
        </p>
        <p className="text-xs font-numeric text-[var(--ivory-muted)] mb-4">
          {checkpointText(t, 'firstAndBest', '首次成绩 {{first}}% · 最佳成绩 {{best}}%', {
            first: firstScore,
            best: bestScore,
          })}
          {' · '}
          {isFirstAttempt
            ? checkpointText(t, 'firstAttemptNote', '本次按来源课时逐题计入 ELO')
            : checkpointText(t, 'retakeNote', '重考不计入 ELO，仅更新成绩与复习队列')}
        </p>

        {stats.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--ivory-dim)] mb-2">
              {checkpointText(t, 'dimensionBreakdown', '各维度表现')}
            </p>
            <ul className="flex flex-wrap gap-2">
              {stats.map((stat) => (
                <li
                  key={stat.dimension}
                  className="rounded-sm border border-[var(--walnut-border)] bg-[var(--felt)]/40 px-2 py-1 text-[11px] text-[var(--ivory-dim)] font-numeric"
                >
                  {t(`academy.eloDimension.${stat.dimension}`, { defaultValue: stat.dimension })}{' '}
                  {stat.correct}/{stat.total}
                </li>
              ))}
            </ul>
          </div>
        )}

        {wrongCount > 0 && (
          <p className="mb-4 text-xs text-[var(--ivory-muted)]">
            {checkpointText(
              t,
              'srsHint',
              '{{count}} 道错题已加入复习队列，复习入口回链到题目来源课时',
              { count: wrongCount },
            )}
          </p>
        )}

        <div className="mb-5 rounded-lg border border-[var(--brass)]/30 bg-[var(--brass)]/10 px-3 py-2 text-xs leading-relaxed text-[var(--ivory-dim)]">
          <p className="font-semibold mb-1">
            {checkpointText(t, 'formativeNote', '形成性自查：不发证书、不解锁下一级')}
          </p>
          <p>
            {checkpointText(
              t,
              'certificationDiff',
              '与认证测验的区别：认证有通过率与冷却/有效期，本检查点只用于自查与调整训练重点，可随时重考。',
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onRetry}
            className={`inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 ${FOCUS_RING}`}
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {checkpointText(t, 'retry', '再检查一次')}
          </button>
          <button
            onClick={onBack}
            className={`inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg border border-[var(--walnut-border)] text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors ${FOCUS_RING}`}
          >
            {checkpointText(t, 'backToAcademy', '返回策略学院')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
