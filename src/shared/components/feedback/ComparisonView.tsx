/**
 * 对比视图组件 - 你的决策 vs GTO 最优（§13.4.2）
 *
 * @module shared/components/feedback/ComparisonView
 * @description 左右分栏对比用户动作与 GTO 推荐动作，高亮差异点。
 * 仅用于 wrong / blunder 级别反馈；无对应动作时不渲染该栏。
 */

import { useTranslation } from 'react-i18next';

interface ComparisonViewProps {
  /** 用户选择的动作描述 */
  userAction?: string;
  /** GTO 推荐动作描述 */
  gtoAction?: string;
}

export function ComparisonView({ userAction, gtoAction }: ComparisonViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row overflow-hidden rounded-md border border-[var(--poker-walnut-border)]">
      {userAction && (
        <div className="flex-1 border-b border-[var(--poker-walnut-border)] bg-[var(--poker-danger-bg)] px-4 py-3 sm:border-b-0 sm:border-r">
          <div className="text-[10px] uppercase tracking-wide text-[var(--poker-ivory-muted)]">
            {t('feedback.decisionAnalysis.yourDecision')}
          </div>
          <div className="mt-1 text-base text-[var(--poker-ivory-dim)]">{userAction}</div>
        </div>
      )}
      {gtoAction && (
        <div className="flex-1 bg-[var(--poker-brass-glow)] px-4 py-3">
          <div className="text-[10px] uppercase tracking-wide text-[var(--poker-ivory-muted)]">
            {t('feedback.decisionAnalysis.gtoOptimal')}
          </div>
          <div className="mt-1 text-base text-[var(--poker-brass)]">{gtoAction}</div>
        </div>
      )}
    </div>
  );
}
