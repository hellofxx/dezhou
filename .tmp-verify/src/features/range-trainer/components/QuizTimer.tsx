import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionFast } from '@/shared/utils/motion';

interface QuizTimerProps {
  timeRemaining: number;  // 秒
  timeLimit: number;      // 总限时（0=无限）
  isPaused: boolean;
}

export function QuizTimer({ timeRemaining, timeLimit, isPaused }: QuizTimerProps) {
  const { t } = useTranslation();
  const size = 80;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // 计算进度百分比
  let progress = 1;
  if (timeLimit > 0) {
    progress = timeRemaining / timeLimit;
  }

  // 颜色：>50% 绿, 20-50% 黄, <20% 红
  const getColor = () => {
    if (timeLimit === 0) return 'var(--brass)'; // 无限时模式始终绿色
    if (progress > 0.5) return 'var(--success)';
    if (progress > 0.2) return 'var(--warning)';
    return 'var(--danger)';
  };

  const strokeDashoffset = circumference * (1 - progress);

  // 显示时间
  const displayTime = timeLimit > 0 ? Math.ceil(timeRemaining) : Math.floor(timeRemaining);
  const minutes = Math.floor(displayTime / 60);
  const seconds = displayTime % 60;
  const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}`;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-raised)"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆环 */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          animate={{ strokeDashoffset, stroke: getColor() }}
          transition={transitionFast}
        />
      </svg>
      {/* 中间数字 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-bold tabular-nums"
          style={{ color: getColor() }}
        >
          {timeStr}
        </span>
        {isPaused && (
          <span className="text-[10px] text-[var(--ivory-dim)]">{t('rangeTrainer.timer.paused')}</span>
        )}
      </div>
    </div>
  );
}
