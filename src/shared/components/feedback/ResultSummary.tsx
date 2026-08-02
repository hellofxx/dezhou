import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

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

function getAccuracyColor(accuracy: number): string {
  if (accuracy >= 0.9) return 'text-[var(--brass-bright)]';
  if (accuracy >= 0.7) return 'text-[var(--sage)]';
  if (accuracy >= 0.5) return 'text-[var(--brass)]';
  return 'text-[var(--clay)]';
}

function getAccuracyText(accuracy: number): string {
  if (accuracy >= 0.9) return '优秀！';
  if (accuracy >= 0.7) return '良好';
  if (accuracy >= 0.5) return '继续加油';
  return '需要更多练习';
}

/**
 * Unified training result summary component.
 * Provides consistent layout across all training modules.
 */
export function ResultSummary({
  title = '训练完成！',
  subtitle,
  accuracy,
  accuracyLabel,
  stats,
  onRetry,
  onBack,
  retryLabel = '再来一次',
  backLabel = '返回首页',
  children,
}: ResultSummaryProps) {
  const accuracyPercent = Math.round(accuracy * 100);
  const accColor = getAccuracyColor(accuracy);
  const accLabel = accuracyLabel ?? getAccuracyText(accuracy);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Title */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-[var(--brass-bright)]" />
            <h1 className="font-display text-[28px] text-[var(--ivory)] tracking-wide">{title}</h1>
          </div>
          <p className="text-sm text-[var(--ivory-muted)]">{subtitle ?? accLabel}</p>
        </motion.div>

        {/* Accuracy ring */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
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
                transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span
                className={`font-numeric text-4xl font-bold ${accColor}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              >
                {accuracyPercent}%
              </motion.span>
              <span className="text-xs text-[var(--ivory-muted)]">正确率</span>
            </div>
          </div>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {stats.map((stat, i) => (
            <div key={i} className="bg-[var(--felt)] border border-[var(--walnut-border)] rounded-md p-3 text-center">
              <div className="flex justify-center mb-1 text-[var(--ivory-muted)]">{stat.icon}</div>
              <div className="text-xl font-bold text-[var(--ivory)] font-numeric">{stat.value}</div>
              <div className="text-xs text-[var(--ivory-muted)]">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Extra content (weak spots, wrong answers, etc.) */}
        {children}

        {/* Action buttons */}
        <motion.div
          className="flex justify-center gap-4 pt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <Button
            onClick={onRetry}
            className="bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--primary-foreground)] px-6"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {retryLabel}
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            className="px-6 border-[var(--walnut-border)] text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/40"
          >
            <Home className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
