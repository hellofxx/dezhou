import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { MOTION_DURATION, MOTION_EASE, transitionSlow } from '@/shared/utils/motion';
import type { TrainingResult } from '@/shared/types/common';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { RotateCcw, Home, Trophy, Target, Clock, AlertTriangle } from 'lucide-react';

interface SessionResultProps {
  result: TrainingResult;
  onRetry: () => void;
  onBackToHome: () => void;
}

/** 根据正确率返回颜色和评价 key — uses card-room palette (brass/sage/clay) */
function getAccuracyInfo(accuracy: number): { color: string; labelKey: string } {
  if (accuracy >= 0.9) return { color: 'text-[var(--brass-bright)]', labelKey: 'rangeTrainer.result.excellent' };
  if (accuracy >= 0.7) return { color: 'text-[var(--sage)]', labelKey: 'rangeTrainer.result.good' };
  if (accuracy >= 0.5) return { color: 'text-[var(--brass)]', labelKey: 'rangeTrainer.result.keepGoing' };
  return { color: 'text-[var(--clay)]', labelKey: 'rangeTrainer.result.morePractice' };
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
    .sort((a, b) => b.wrongCount - a.wrongCount);
}

/** 数字递增动画 */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.loop, ease: MOTION_EASE.out }}
    >
      {value}{suffix}
    </motion.span>
  );
}

export function SessionResult({ result, onRetry, onBackToHome }: SessionResultProps) {
  const { t } = useTranslation();
  const accuracyPercent = Math.round(result.accuracy * 100);
  const { color: accColor, labelKey: accLabelKey } = getAccuracyInfo(result.accuracy);
  const weakHands = getWeakHands(result);
  const avgTimeSec = (result.averageTime / 1000).toFixed(1);
  const wrongDetails = result.details.filter((d) => !d.isCorrect);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* 顶部大标题 */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionSlow}
        >
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-[var(--brass-bright)]" />
            <h1 className="font-display text-[28px] text-[var(--ivory)] tracking-wide">{t('rangeTrainer.result.title')}</h1>
          </div>
          <p className="text-sm text-[var(--ivory-muted)]">{t(accLabelKey)}</p>
        </motion.div>

        {/* 正确率大圆环 */}
        <motion.div
          className="flex justify-center"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: MOTION_DURATION.loop, delay: 0.2 }}
        >
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--walnut-border)"
                strokeWidth="8"
              />
              <motion.circle
                cx="60" cy="60" r="52"
                fill="none"
                stroke="var(--brass)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52}
                initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 52 * (1 - result.accuracy),
                }}
                transition={{ duration: MOTION_DURATION.loop, delay: 0.4, ease: MOTION_EASE.out }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-numeric text-4xl font-bold ${accColor}`}>
                <AnimatedNumber value={accuracyPercent} suffix="%" />
              </span>
              <span className="text-xs text-[var(--ivory-muted)]">{t('rangeTrainer.result.accuracy')}</span>
            </div>
          </div>
        </motion.div>

        {/* 统计卡片 */}
        <motion.div
          className="grid grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionSlow, delay: 0.6 }}
        >
          <StatCard icon={<Target className="w-4 h-4" />} label={t('rangeTrainer.result.total')} value={`${result.totalQuestions}`} />
          <StatCard icon={<span className="text-[var(--sage)] text-sm font-bold">✓</span>} label={t('rangeTrainer.result.correct')} value={`${result.correctAnswers}`} />
          <StatCard icon={<span className="text-[var(--clay)] text-sm font-bold">✗</span>} label={t('rangeTrainer.result.wrong')} value={`${result.totalQuestions - result.correctAnswers}`} />
          <StatCard icon={<Clock className="w-4 h-4" />} label={t('rangeTrainer.result.avgTime')} value={`${avgTimeSec}s`} />
        </motion.div>

        {/* 薄弱手牌 */}
        {weakHands.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-[17px] text-[var(--ivory)] flex items-center gap-2 tracking-wide">
                  <AlertTriangle className="w-4 h-4 text-[var(--brass-bright)]" />
                  {t('rangeTrainer.result.weakHands')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weakHands.map(({ hand, wrongCount }) => (
                    <span
                      key={hand}
                      className="px-3 py-1.5 rounded-md bg-[var(--clay)]/12 border border-[var(--clay)]/40 text-[var(--clay)] text-sm font-medium font-numeric"
                    >
                      {hand}
                      <span className="ml-1 text-xs opacity-80">{t('rangeTrainer.result.wrongCount', { count: wrongCount })}</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 错题列表 */}
        {wrongDetails.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-[17px] text-[var(--ivory)] tracking-wide">{t('rangeTrainer.result.wrongDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[var(--ivory-muted)] border-b border-[var(--walnut-border)]">
                        <th className="text-left py-2 px-2 font-medium">{t('rangeTrainer.result.hand')}</th>
                        <th className="text-left py-2 px-2 font-medium">{t('rangeTrainer.result.yourChoice')}</th>
                        <th className="text-left py-2 px-2 font-medium">{t('rangeTrainer.result.correctAnswer')}</th>
                        <th className="text-right py-2 px-2 font-medium">{t('rangeTrainer.result.time')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wrongDetails.map((d, i) => (
                        <tr key={i} className="border-b border-[var(--walnut-border)]/40 last:border-0">
                          <td className="py-2 px-2 font-medium text-[var(--ivory)] font-numeric">{d.question}</td>
                          <td className="py-2 px-2 text-[var(--clay)] capitalize font-numeric">{d.userAnswer}</td>
                          <td className="py-2 px-2 text-[var(--sage)] capitalize font-numeric">{d.correctAnswer}</td>
                          <td className="py-2 px-2 text-right text-[var(--ivory-muted)] font-numeric">
                            {(d.timeTaken / 1000).toFixed(1)}s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 操作按钮 */}
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
            {t('rangeTrainer.result.retry')}
          </Button>
          <Button
            variant="outline"
            onClick={onBackToHome}
            className="px-6 border-[var(--walnut-border)] text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/40"
          >
            <Home className="w-4 h-4 mr-2" />
            {t('rangeTrainer.result.backHome')}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[var(--felt)] border border-[var(--walnut-border)] rounded-md p-3 text-center">
      <div className="flex justify-center mb-1 text-[var(--ivory-muted)]">{icon}</div>
      <div className="text-xl font-bold text-[var(--ivory)] font-numeric">{value}</div>
      <div className="text-xs text-[var(--ivory-muted)]">{label}</div>
    </div>
  );
}
