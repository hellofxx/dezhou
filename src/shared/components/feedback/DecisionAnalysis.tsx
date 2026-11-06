/**
 * 决策分析折叠区组件（§13.4.1）
 *
 * @module shared/components/feedback/DecisionAnalysis
 * @description 反馈卡片中的可折叠"决策分析"区域：
 * 展开态显示 ① 对比视图（你的决策 vs GTO 最优）② 差异原因 ③ 相关课程链接。
 * wrong / blunder 级别默认展开，其余级别默认折叠（由调用方传 defaultOpen）。
 *
 * 相关课程 chip 的跳转由调用方经 `onRelatedLessonOpen` 注入（共享层不拼 feature 路由）；
 * 未注入回调时不渲染 chip，避免出现点击无跳转的死链。
 */

import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { Button } from '@/shared/components/ui/button';
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
  /**
   * 相关课程点击回调：由调用方用自身 navigate 注入。
   * 未提供时不渲染 chip（共享层不感知 feature 路由，也不提供默认跳转）。
   */
  onRelatedLessonOpen?: (lessonId: string) => void;
  /** 推荐动作标题（缺省用 feedback.decisionAnalysis.gtoOptimal） */
  recommendedLabel?: string;
  /** 默认是否展开（wrong/blunder 默认展开） */
  defaultOpen?: boolean;
}

export function DecisionAnalysis({
  userAction,
  gtoAction,
  difference,
  relatedLessonId,
  onRelatedLessonOpen,
  recommendedLabel,
  defaultOpen = false,
}: DecisionAnalysisProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen);
  // aria-controls 需要稳定的内容区 id（多实例共存时不可重复）
  const panelId = useId();

  return (
    <div className="mt-3">
      {/* 交互状态由 Button（quiet 语义）接管；描边/尺寸/字色/悬停表面沿用原折叠头观感 */}
      <Button
        type="button"
        variant="quiet"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        className="h-auto gap-1.5 rounded border border-[var(--poker-walnut-border)] bg-transparent px-3 py-1.5 text-sm font-normal text-[var(--poker-ivory-dim)] hover:bg-[var(--poker-walnut-raised)] hover:text-[var(--poker-ivory-dim)] max-md:min-h-11"
      >
        <span>{open ? t('feedback.decisionAnalysis.hideAnalysis') : t('feedback.decisionAnalysis.viewAnalysis')}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`}
        />
      </Button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transitionStandard}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {(userAction || gtoAction) && (
                <ComparisonView
                  userAction={userAction}
                  gtoAction={gtoAction}
                  recommendedLabel={recommendedLabel}
                />
              )}
              {difference && (
                <p className="text-sm text-[var(--poker-ivory-dim)]">
                  <span className="mr-1 text-[var(--poker-brass-muted)]">
                    {t('feedback.decisionAnalysis.differenceTitle')}：
                  </span>
                  {difference}
                </p>
              )}
              {relatedLessonId && onRelatedLessonOpen && (
                <RelatedLessonChip
                  lessonId={relatedLessonId}
                  onOpen={onRelatedLessonOpen}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
