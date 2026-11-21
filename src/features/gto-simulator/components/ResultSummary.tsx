/**
 * GTO 模拟器结算页摘要（唯一消费者：GTOResultPage）。
 *
 * 纸张外壳、指标/动作与详情槽统一走 shared `ResultSlip` 的 page 变体；
 * 正确率环由本组件绘制。标题层级为 h2（壳层 h1 是全站唯一一级标题）。
 */
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { RotateCcw, Home } from 'lucide-react';
import { ResultSlip } from '@/shared/components/feedback/ResultSlip';
import type { ResultTone } from '@/shared/components/feedback/ResultHeader';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';

interface StatItem {
  icon: ReactNode;
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
  children?: ReactNode;
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

/** 正确率 → 标题区语调（≥90% 成功 / ≥70% 中性 / ≥50% 警示 / 以下危险） */
function getAccuracyTone(accuracy: number): ResultTone {
  if (accuracy >= 0.9) return 'success';
  if (accuracy >= 0.7) return 'neutral';
  if (accuracy >= 0.5) return 'warning';
  return 'danger';
}

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
    <ResultSlip
      presentation="page"
      title={resolvedTitle}
      subtitle={subtitle ?? accLabel}
      tone={getAccuracyTone(accuracy)}
      ring={
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: MOTION_DURATION.slow, delay: 0.2 }}
        >
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--walnut-border)" strokeWidth="8" />
              <motion.circle
                cx="60"
                cy="60"
                r="52"
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
      }
      metrics={stats.map((stat) => ({
        label: stat.label,
        value: stat.value,
        icon: stat.icon,
      }))}
      detail={children}
      actions={[
        { label: resolvedRetryLabel, onClick: onRetry, icon: <RotateCcw />, variant: 'primary' },
        { label: resolvedBackLabel, onClick: onBack, icon: <Home />, variant: 'secondary' },
      ]}
    />
  );
}
