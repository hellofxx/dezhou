// DrillProgressHeader — strategy-academy drills 答题进度头（feature-local 模板）
//
// 收编 6 个 drill + PracticeDrill 的「退出 + 进度条 + 题号 + 当前正确率 + 附加标记」行：
// - 进度条统一走 shared `ProgressBar`（`ui/progress` 薄包装，role=progressbar + aria-valuenow），
//   填充色经 `indicatorClassName` 覆盖为纯色（黄铜 / 压力红），与收编前的纯色观感一致：
//   `bg-none` 关掉共享渐变层、`shadow-none` 关掉共享 glow、`duration-300` 沿用原过渡时长。
// - 进度语义不变：填充比例 = 已作答题数 / 总题数（第 N 题显示 (N-1)/total）。
//   ProgressBar 内的值只用于 aria 与 transform 比例，故取整为整数百分比。
// - 当前正确率由本组件按模板插值渲染，杜绝调用点各自传错参数
//   （历史缺陷：模板是 {{correct}}/{{answered}}，4 个 drill 传的是 {{rate}} → 渲染出裸占位符）。
// - `extra` 承载各 drill 的差异（PracticeDrill 的难度 pill / 压力标记），动画与样式留在调用点。
//
// 归属：单模块（strategy-academy drills）消费，按 P3/P12 留在 feature 内，不进 shared。

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { ProgressBar } from '@/shared/components/data-display/ProgressBar';
import { cn } from '@/shared/utils/cn';

/** 当前正确率：调用点只传事实值，文案由本组件按模板插值 */
export interface DrillRunningAccuracy {
  correct: number;
  answered: number;
  /**
   * 覆盖文案模板，默认 `drills.common.runningAccuracy`（{{correct}}/{{answered}}）。
   * 传自定义模板时可同时插 `{{accuracy}}`（整数百分比），如 `academy.drill.liveAccuracy`。
   */
  textKey?: string;
}

export interface DrillProgressHeaderProps {
  /** 当前题号（1 起） */
  current: number;
  total: number;
  /** 传入即渲染退出入口（BackLink） */
  onExit?: () => void;
  /** 进度文字（题号 / 百分比等），字符串时同时作为进度条无障碍名称 */
  progressText?: ReactNode;
  /** 显式无障碍名称；不传则回退 `progressText`（仅字符串可用） */
  ariaLabel?: string;
  /** 当前正确率；`answered === 0` 时不渲染 */
  runningAccuracy?: DrillRunningAccuracy;
  /** 填充条色调：brass 黄铜（默认）/ danger 压力模式 */
  valueTone?: 'brass' | 'danger';
  /** 附加标记（难度 pill / 压力标记等），渲染在行尾 */
  extra?: ReactNode;
}

/** 纯色填充：关掉共享渐变与 glow，保留原 drill 的纯色 + 300ms 过渡 */
const TONE_INDICATOR: Record<'brass' | 'danger', string> = {
  brass: 'bg-none bg-[var(--brass-bright)]',
  danger: 'bg-none bg-[var(--danger)]',
};

export function DrillProgressHeader({
  current,
  total,
  onExit,
  progressText,
  ariaLabel,
  runningAccuracy,
  valueTone = 'brass',
  extra,
}: DrillProgressHeaderProps) {
  const { t } = useTranslation();
  const answered = Math.max(0, current - 1);
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  const showAccuracy = runningAccuracy !== undefined && runningAccuracy.answered > 0;
  const accuracyText = showAccuracy
    ? t(runningAccuracy.textKey ?? 'drills.common.runningAccuracy', {
        correct: runningAccuracy.correct,
        answered: runningAccuracy.answered,
        accuracy: Math.round((runningAccuracy.correct / runningAccuracy.answered) * 100),
      })
    : null;

  // 可见进度文字即进度条的可访问名称（字符串才有意义；ChoiceDrill 的混合节点走 ariaLabel）
  const label = ariaLabel ?? (typeof progressText === 'string' ? progressText : undefined);

  return (
    <div className="flex items-center gap-3">
      {onExit ? (
        <BackLink onClick={onExit} label={t('drills.common.exit')} className="shrink-0" />
      ) : null}
      <ProgressBar
        value={percent}
        size="sm"
        label={label}
        className="flex-1"
        indicatorClassName={cn('shadow-none duration-300', TONE_INDICATOR[valueTone])}
      />
      {progressText !== undefined ? (
        <span className="text-xs text-[var(--ivory-muted)] shrink-0">{progressText}</span>
      ) : null}
      {accuracyText ? (
        <span className="text-xs text-[var(--success)] shrink-0">{accuracyText}</span>
      ) : null}
      {extra}
    </div>
  );
}
