import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Compass, Info, Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import { transitionSlow } from '@/shared/utils/motion';
import { findLevelSummaryById } from '../utils/academyMeta';
import { levelTitleKey } from '../utils/titleKeys';

interface PlacementResultViewProps {
  /** 实际生效的推荐起点（store 并集后的值，重测不降级） */
  recommendedLevelId: string;
  /** 实际生效的免修范围（L1-L4B 单调前缀） */
  creditLevels: readonly string[];
  correct: number;
  total: number;
  onRetest: () => void;
  onBack: () => void;
}

/**
 * 定位测评结果视图（P1）。
 *
 * 文案口径（不可弱化）：
 * - 免修范围"只放宽解锁，不计完成"，不写 completedLessons
 * - 最高免修到 L4B，L5 及以上必须实际完成
 */
export default function PlacementResultView({
  recommendedLevelId,
  creditLevels,
  correct,
  total,
  onRetest,
  onBack,
}: PlacementResultViewProps) {
  const { t } = useTranslation();
  const levelLabel = (levelId: string): string =>
    t(levelTitleKey(levelId), {
      defaultValue: findLevelSummaryById(levelId)?.title ?? levelId,
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionSlow}
      className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6 space-y-5"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-lg bg-[var(--brass)]/10 flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5 text-[var(--brass-text)]" />
        </div>
        <div>
          <h2 className="font-display text-xl text-[var(--ivory)]">
            {t('academy.placement.page.result.title', { defaultValue: '测评结果' })}
          </h2>
          <p className="text-sm text-[var(--ivory-muted)] mt-0.5">
            {t('academy.placement.page.result.score', {
              defaultValue: '答对 {{correct}} / {{total}} 题',
              correct,
              total,
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-[var(--felt)] border border-[var(--walnut-border)] p-4">
          <p className="text-xs text-[var(--ivory-dim)]">
            {t('academy.placement.page.result.recommended', { defaultValue: '推荐起点' })}
          </p>
          <p className="font-display text-lg text-[var(--brass-bright)] mt-1">
            {levelLabel(recommendedLevelId)}
          </p>
          <p className="font-numeric text-xs text-[var(--ivory-muted)] mt-1">
            {recommendedLevelId.toUpperCase()}
          </p>
        </div>

        <div className="rounded-lg bg-[var(--felt)] border border-[var(--walnut-border)] p-4">
          <p className="text-xs text-[var(--ivory-dim)]">
            {t('academy.placement.page.result.credit', { defaultValue: '免修解锁范围' })}
          </p>
          {creditLevels.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5 mt-1.5">
              {creditLevels.map((levelId) => (
                <li
                  key={levelId}
                  className="rounded-md bg-[var(--walnut-raised)] px-2 py-0.5 text-xs text-[var(--ivory)]"
                >
                  {levelLabel(levelId)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[var(--ivory)] mt-1.5">
              {t('academy.placement.page.result.creditNone', {
                defaultValue: '无免修，从基础入门开始',
              })}
            </p>
          )}
          <p className="text-xs text-[var(--brass-text)] mt-2">
            {t('academy.placement.page.result.creditNote', {
              defaultValue: '只放宽解锁，不计完成',
            })}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[var(--brass)]/30 bg-[var(--walnut-raised)] p-4 space-y-2 text-xs text-[var(--ivory-muted)]">
        <p className="flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass-text)]" />
          <span>
            {t('academy.placement.page.result.creditNoteDesc', {
              defaultValue:
                '免修的等级可以直接进入学习，但课时不会标记为已完成，测验成绩与掌握度也不会被记录。',
            })}
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass-text)]" />
          <span>
            {t('academy.placement.page.result.noL5', {
              defaultValue: 'L5 及以上不参与免修，仍需实际完成对应课时。',
            })}
          </span>
        </p>
        <p className="flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass-text)]" />
          <span>
            {t('academy.placement.page.result.retestHint', {
              defaultValue: '重测只取更高结果，不会降级。',
            })}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRetest}
          className="inline-flex items-center gap-2 min-h-11 px-4 rounded-lg bg-[var(--walnut-raised)] text-sm text-[var(--ivory)] hover:bg-[var(--walnut-light)] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t('academy.placement.page.retest', { defaultValue: '重新测评' })}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-11 px-5 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t('academy.placement.page.backAcademy', { defaultValue: '返回策略学院' })}
        </button>
      </div>
    </motion.div>
  );
}
