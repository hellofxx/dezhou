/**
 * 决策分析折叠区组件（§13.4.1）
 *
 * @module shared/components/feedback/DecisionAnalysis
 * @description 反馈卡片中的可折叠"决策分析"区域：
 * 展开态显示 ① 对比视图（你的决策 vs GTO 最优）② 差异原因 ③ 相关课程链接。
 * wrong / blunder 级别默认展开，其余级别默认折叠（由调用方传 defaultOpen）。
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { ComparisonView } from '@/shared/components/feedback/ComparisonView';
import { RelatedLessonChip } from '@/shared/components/feedback/RelatedLessonChip';

interface DecisionAnalysisProps {
  /** 用户选择的动作描述 */
  userAction?: string;
  /** GTO 推荐动作描述 */
  gtoAction?: string;
  /** 差异原因（1-2 句） */
  difference?: string;
  /** 相关课程 id（用于 related-lesson-chip） */
  relatedLessonId?: string;
  /** 默认是否展开（wrong/blunder 默认展开） */
  defaultOpen?: boolean;
}

export function DecisionAnalysis({
  userAction,
  gtoAction,
  difference,
  relatedLessonId,
  defaultOpen = false,
}: DecisionAnalysisProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded border border-[var(--poker-walnut-border)] bg-transparent px-3 py-1.5 text-sm text-[var(--poker-ivory-dim)] transition-colors hover:bg-[var(--poker-walnut-raised)]"
      >
        <span>{open ? t('feedback.decisionAnalysis.hideAnalysis') : t('feedback.decisionAnalysis.viewAnalysis')}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitionStandard}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {(userAction || gtoAction) && (
                <ComparisonView userAction={userAction} gtoAction={gtoAction} />
              )}
              {difference && (
                <p className="text-sm text-[var(--poker-ivory-dim)]">
                  <span className="mr-1 text-[var(--poker-brass-muted)]">
                    {t('feedback.decisionAnalysis.differenceTitle')}：
                  </span>
                  {difference}
                </p>
              )}
              {relatedLessonId && <RelatedLessonChip lessonId={relatedLessonId} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
