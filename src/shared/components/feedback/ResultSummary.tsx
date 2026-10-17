import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';

interface StatItem {
  icon: React.ReactNode;
  label: string;
  value: string;
}

interface ResultSummaryProps {
  title?: string;
  subtitle?: string;
  accuracy: number; // 0-1
  accuracyLabel?: string;
  stats: StatItem[];
  onRetry: () => void;
  onBack: () => void;
  retryLabel?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

// 纸张表面只用 §2.6 深阶语义色（暗色房间的 --sage / --clay 在纸面上对比度不足）
function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 0.9) return 'text-[var(--paper-success)]';
  if (accuracy >= 0.7) return 'text-[var(--paper-brass)]';
  if (accuracy >= 0.5) return 'text-[var(--paper-warning)]';
  return 'text-[var(--paper-danger)]';
}

// PLAT-08：返回 i18n key，组件内 t() 解析（common.resultSummary.*）
function getAccuracyText(accuracy: number): string {
  if (accuracy >= 0.9) return 'common.resultSummary.excellent';
  if (accuracy >= 0.7) return 'common.resultSummary.good';
  if (accuracy >= 0.5) return 'common.resultSummary.keepGoing';
  return 'common.resultSummary.morePractice';
}

/**
 * Unified training result summary component.
 * Provides consistent layout across all training modules.
 * 材质：发牌员纸条（DESIGN.md §1.5 / §5.23）—— 自身非 fixed，故自带 relative 供纸条发线定位。
 * 滚动容器内移到纸张之内：外层若 overflow-auto，会裁掉 ::after 顶部黄铜钉（top: -5px）。
 */
export function ResultSummary({
  title = 'common.resultSummary.defaultTitle',
  subtitle,
  accuracy,
  accuracyLabel,
  stats,
  onRetry,
  onBack,
  retryLabel = 'common.resultSummary.retry',
  backLabel = 'common.resultSummary.back',
  children,
}: ResultSummaryProps) {
  const { t } = useTranslation();
  const accuracyPercent = Math.round(accuracy * 100);
  const accColor = getAccuracyColor(accuracy);
  const accLabel = accuracyLabel ?? t(getAccuracyText(accuracy));
  const resolvedTitle = t(title, { defaultValue: title });
  const resolvedRetryLabel = t(retryLabel, { defaultValue: retryLabel });
  const resolvedBackLabel = t(backLabel, { defaultValue: backLabel });

  return (
    <div className="dealer-slip relative h-full">
      <div className="h-full overflow-auto">
        {/* 全宽布局：外层 main（AppLayout）已提供内边距，不再限宽居中 */}
        <div className="py-8 space-y-6">
          {/* Title */}
          <motion.div
            className="text-center space-y-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_DURATION.slow }}
          >
            <div className="flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-[var(--brass-bright)]" aria-hidden="true" />
              <h1 className="font-display text-[28px] text-[var(--ivory)] tracking-wide">{resolvedTitle}</h1>
            </div>
            <p className="text-sm text-[var(--ivory-muted)]">{subtitle ?? accLabel}</p>
          </motion.div>

          {/* Accuracy ring */}
          <motion.div
            className="flex justify-center"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: MOTION_DURATION.slow, delay: 0.2 }}
          >
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--walnut-border)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="52"
                  fill="none"
                  stroke="var(--brass)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - accuracy) }}
                  transition={{ duration: MOTION_DURATION.slow, delay: 0.4, ease: MOTION_EASE.out }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className={`font-numeric text-4xl font-bold ${accColor}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
                >
                  {accuracyPercent}%
                </motion.span>
                <span className="text-xs text-[var(--ivory-muted)]">{t('common.resultSummary.accuracy')}</span>
              </div>
            </div>
          </motion.div>

          {/* Stats cards —— 纸上抬升块用 --paper-raised（经 .dealer-slip 重锚的 --walnut-raised） */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION_DURATION.slow, delay: 0.6 }}
          >
            {stats.map((stat, i) => (
              <div key={i} className="bg-[var(--walnut-raised)] border border-[var(--walnut-border)] rounded-md p-3 text-center">
                <div className="flex justify-center mb-1 text-[var(--ivory-muted)]">{stat.icon}</div>
                <div className="text-xl font-bold text-[var(--ivory)] font-numeric">{stat.value}</div>
                <div className="text-xs text-[var(--ivory-muted)]">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Extra content (weak spots, wrong answers, etc.) */}
          {children}

          {/* Action buttons —— 按钮金属族（§5.5）：主 CTA .btn-brass / 次动作 .btn-metal */}
          <motion.div
            className="flex justify-center gap-4 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: MOTION_DURATION.fast, delay: MOTION_DURATION.standard }}
          >
            <Button type="button" onClick={onRetry} className="px-6">
              <RotateCcw aria-hidden="true" />
              {resolvedRetryLabel}
            </Button>
            <Button type="button" variant="secondary" onClick={onBack} className="px-6">
              <Home aria-hidden="true" />
              {resolvedBackLabel}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
