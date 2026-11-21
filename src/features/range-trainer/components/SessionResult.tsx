import { useTranslation } from 'react-i18next';
import type { TrainingResult } from '@/shared/types/common';
import { ResultSlip } from '@/shared/components/feedback/ResultSlip';
import type { ResultTone } from '@/shared/components/feedback/ResultHeader';
import { AlertTriangle, Check, Clock, Home, RotateCcw, Target, X } from 'lucide-react';

interface SessionResultProps {
  result: TrainingResult;
  onRetry: () => void;
  onBackToHome: () => void;
}

/** 根据正确率返回颜色、评价 key 与标题区语调 — uses card-room palette (brass/sage/clay) */
function getAccuracyInfo(accuracy: number): { color: string; labelKey: string; tone: ResultTone } {
  if (accuracy >= 0.9) return { color: 'var(--paper-brass)', labelKey: 'rangeTrainer.result.excellent', tone: 'success' };
  if (accuracy >= 0.7) return { color: 'var(--paper-success)', labelKey: 'rangeTrainer.result.good', tone: 'neutral' };
  if (accuracy >= 0.5) return { color: 'var(--paper-warning)', labelKey: 'rangeTrainer.result.keepGoing', tone: 'warning' };
  return { color: 'var(--paper-danger)', labelKey: 'rangeTrainer.result.morePractice', tone: 'danger' };
}

/** 统计薄弱手牌（答错≥2次） */
function getWeakHands(result: TrainingResult): { hand: string; wrongCount: number }[] {
  const wrongMap: Record<string, number> = {};
  for (const d of result.details) {
    if (!d.isCorrect) {
      wrongMap[d.question] = (wrongMap[d.question] ?? 0) + 1;
    }
  }
  return Object.entries(wrongMap)
    .filter(([, count]) => count >= 2)
    .map(([hand, wrongCount]) => ({ hand, wrongCount }))
    .toSorted((a, b) => b.wrongCount - a.wrongCount);
}

function AccuracyRing({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="relative h-40 w-40">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="none" stroke="var(--paper-edge)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="52"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * 52}
          strokeDashoffset={2 * Math.PI * 52 * (1 - percent / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-numeric text-4xl font-bold" style={{ color }}>
          {percent}%
        </span>
        <span className="text-xs text-[var(--ivory-muted)]" />
      </div>
    </div>
  );
}

export function SessionResult({ result, onRetry, onBackToHome }: SessionResultProps) {
  const { t } = useTranslation();
  const accuracyPercent = Math.round(result.accuracy * 100);
  const { color, labelKey, tone } = getAccuracyInfo(result.accuracy);
  const weakHands = getWeakHands(result);
  const wrongDetails = result.details.filter((d) => !d.isCorrect);
  const avgTimeSec = (result.averageTime / 1000).toFixed(1);

  return (
    <ResultSlip
      open
      onClose={onBackToHome}
      title={t('rangeTrainer.result.title')}
      subtitle={t(labelKey)}
      tone={tone}
      ring={<AccuracyRing percent={accuracyPercent} color={color} />}
      metrics={[
        { label: t('rangeTrainer.result.total'), value: `${result.totalQuestions}`, icon: <Target className="w-4 h-4" /> },
        { label: t('rangeTrainer.result.correct'), value: `${result.correctAnswers}`, icon: <Check className="w-4 h-4" />, accent: 'success' },
        {
          label: t('rangeTrainer.result.wrong'),
          value: `${result.totalQuestions - result.correctAnswers}`,
          icon: <X className="w-4 h-4" />,
        },
        { label: t('rangeTrainer.result.avgTime'), value: `${avgTimeSec}s`, icon: <Clock className="w-4 h-4" /> },
      ]}
      detail={
        <div className="space-y-3">
          {weakHands.length > 0 ? (
            <section className="rounded-lg border border-[var(--paper-rule)] bg-[var(--paper-raised)] p-4">
              <h3 className="m-0 mb-2 flex items-center gap-2 font-display text-[15px] text-[var(--ivory)]">
                <AlertTriangle className="h-4 w-4 text-[var(--brass-text)]" aria-hidden="true" />
                {t('rangeTrainer.result.weakHands')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {weakHands.map(({ hand, wrongCount }) => (
                  <span
                    key={hand}
                    className="rounded-md border border-[var(--danger)]/40 bg-[var(--danger-bg)] px-3 py-1.5 font-numeric text-sm font-medium text-[var(--danger-text)]"
                  >
                    {hand}
                    <span className="ml-1 text-xs opacity-80">
                      {t('rangeTrainer.result.wrongCount', { count: wrongCount })}
                    </span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {wrongDetails.length > 0 ? (
            <section className="rounded-lg border border-[var(--paper-rule)] bg-[var(--paper-raised)] p-4">
              <h3 className="m-0 mb-2 font-display text-[15px] text-[var(--ivory)]">
                {t('rangeTrainer.result.wrongDetails')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--paper-rule)] text-[var(--ivory-muted)]">
                      <th className="px-2 py-2 text-left font-medium">{t('rangeTrainer.result.hand')}</th>
                      <th className="px-2 py-2 text-left font-medium">{t('rangeTrainer.result.yourChoice')}</th>
                      <th className="px-2 py-2 text-left font-medium">{t('rangeTrainer.result.correctAnswer')}</th>
                      <th className="px-2 py-2 text-right font-medium">{t('rangeTrainer.result.time')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wrongDetails.map((d, i) => (
                      <tr key={i} className="border-b border-[var(--paper-rule)]/60 last:border-0">
                        <td className="px-2 py-2 font-medium text-[var(--ivory)] font-numeric">{d.question}</td>
                        <td className="px-2 py-2 font-numeric capitalize text-[var(--danger-text)]">{d.userAnswer}</td>
                        <td className="px-2 py-2 font-numeric capitalize text-[var(--sage-text)]">{d.correctAnswer}</td>
                        <td className="px-2 py-2 text-right font-numeric text-[var(--ivory-muted)]">
                          {(d.timeTaken / 1000).toFixed(1)}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
      }
      actions={[
        { label: t('rangeTrainer.result.retry'), onClick: onRetry, variant: 'primary', icon: <RotateCcw className="w-4 h-4" /> },
        { label: t('rangeTrainer.result.backHome'), onClick: onBackToHome, variant: 'outline', icon: <Home className="w-4 h-4" /> },
      ]}
    />
  );
}
