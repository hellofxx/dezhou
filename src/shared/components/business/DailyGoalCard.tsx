import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

export interface DailyGoalCardProps {
  /** 已完成数 */
  completed: number;
  /** 总数 */
  total: number;
  /** 今日学习分钟数（可选） */
  minutes?: number;
  /** 目标描述（如"掌握 CO 位置 3-Bet 范围"） */
  goalLabel?: string;
  className?: string;
}

/**
 * DailyGoalCard — 今日学习目标卡（DESIGN_LANGUAGE §13.2.4）。
 * 象牙铭牌样式：walnut-raised 底 + 顶边黄铜发线 + brass 进度条。
 */
export default function DailyGoalCard({
  completed,
  total,
  minutes,
  goalLabel,
  className,
}: DailyGoalCardProps) {
  const { t } = useTranslation();

  const percent = total > 0 ? Math.min(100, Math.max(0, (completed / total) * 100)) : 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--poker-radius-md)] border border-[var(--poker-walnut-border)] bg-[var(--poker-walnut-raised)] px-5 py-4',
        className
      )}
    >
      {/* 顶边黄铜发线 */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--poker-brass),transparent)]"
      />

      {/* 铭牌 eyebrow 标签 */}
      <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--poker-ivory-muted)]">
        {t('progress.dailyGoal.eyebrow')}
      </span>

      {/* 主文本：{completed}/{total} 项任务 */}
      <p className="mt-1 font-display text-lg leading-snug text-[var(--poker-ivory)]">
        {t('progress.dailyGoal.count', { completed, total })}
      </p>

      {/* 副文本：今日已学习 X 分钟 */}
      {typeof minutes === 'number' && (
        <p className="mt-1 text-xs text-[var(--poker-ivory-dim)]">
          {t('progress.dailyGoal.minutes', { minutes })}
        </p>
      )}

      {/* 目标描述 */}
      {goalLabel && (
        <p className="mt-1 text-xs text-[var(--poker-ivory-dim)]">{goalLabel}</p>
      )}

      {/* 底部进度条 */}
      <div className="mt-3 h-1 overflow-hidden rounded-[2px] bg-[var(--poker-walnut-border)]">
        <div
          className="h-full rounded-[2px] bg-[var(--poker-brass)] transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
