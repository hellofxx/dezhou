import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useProgressStore } from '../store';
import { getTodayString } from '../utils/spacedRepetition';

type Mood = 'good' | 'neutral' | 'bad';

/**
 * P2-5.6: 今日情绪标记组件。
 *
 * 在 Dashboard 渲染，提供「好 / 一般 / 差」三档情绪标记按钮，
 * 标记会写入 `progressStore.emotion.todayMood` 与 `moodDate`。
 * 同时展示今日正确率（来自 `dailyCorrect / dailyTotal`），
 * 让用户感知情绪与正确率的关联。
 *
 * 跨日时，store 的 setTodayMood 会自动覆盖 moodDate 为今日，
 * 但 dailyCorrect/dailyTotal 的跨日重置由 recordAnswer 处理，
 * 这里仅做读取时的防御性判断。
 */
export default function MoodTracker() {
  const { t } = useTranslation();
  const todayMood = useProgressStore((s) => s.emotion.todayMood);
  const moodDate = useProgressStore((s) => s.emotion.moodDate);
  const dailyCorrect = useProgressStore((s) => s.emotion.dailyCorrect);
  const dailyTotal = useProgressStore((s) => s.emotion.dailyTotal);
  const dailyQuestionsDate = useProgressStore((s) => s.emotion.dailyQuestionsDate);
  const setTodayMood = useProgressStore((s) => s.setTodayMood);

  const today = getTodayString();
  // 今日已选情绪（moodDate 必须是今天）
  const selectedMood: Mood | null = moodDate === today ? todayMood : null;
  // 今日正确率（dailyQuestionsDate 必须是今天；否则视为 0 题）
  const effectiveDailyTotal = dailyQuestionsDate === today ? dailyTotal : 0;
  const effectiveDailyCorrect = dailyQuestionsDate === today ? dailyCorrect : 0;
  const todayAccuracy = effectiveDailyTotal > 0
    ? Math.round((effectiveDailyCorrect / effectiveDailyTotal) * 100)
    : null;

  const moodOptions: { value: Mood; label: string; icon: React.ReactNode; activeClass: string }[] = useMemo(() => [
    {
      value: 'good',
      label: t('mood.good', { defaultValue: '好' }),
      icon: <Smile className="w-5 h-5" />,
      activeClass: 'border-[var(--success)] bg-[var(--success)]/15 text-[var(--success)] ring-1 ring-[var(--success)]/40',
    },
    {
      value: 'neutral',
      label: t('mood.neutral', { defaultValue: '一般' }),
      icon: <Meh className="w-5 h-5" />,
      activeClass: 'border-[var(--brass-bright)] bg-[var(--brass-bright)]/15 text-[var(--brass-bright)] ring-1 ring-[var(--brass-bright)]/40',
    },
    {
      value: 'bad',
      label: t('mood.bad', { defaultValue: '差' }),
      icon: <Frown className="w-5 h-5" />,
      activeClass: 'border-[var(--danger)] bg-[var(--danger)]/15 text-[var(--danger)] ring-1 ring-[var(--danger)]/40',
    },
  ], [t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-[var(--ivory-muted)] flex items-center gap-2">
            <Smile className="w-4 h-4" />
            {t('mood.title', { defaultValue: '今日情绪' })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {moodOptions.map((opt) => {
              const isSelected = selectedMood === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTodayMood(opt.value)}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-center gap-1.5 rounded-md border p-3 transition-all ${
                    isSelected
                      ? opt.activeClass
                      : 'border-[var(--walnut-border)] bg-[var(--background)] text-[var(--ivory-muted)] hover:border-[var(--brass-muted)] hover:text-[var(--ivory)]'
                  }`}
                >
                  {opt.icon}
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* 情绪与正确率关联展示 */}
          <div className="rounded-md bg-[var(--walnut-raised)]/60 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ivory-dim)]">
                {t('mood.todayAccuracy', { defaultValue: '今日正确率' })}
              </span>
              <span className="font-numeric text-[var(--ivory)]">
                {todayAccuracy !== null
                  ? `${todayAccuracy}% (${effectiveDailyCorrect}/${effectiveDailyTotal})`
                  : t('mood.noData', { defaultValue: '暂无数据' })}
              </span>
            </div>
            {selectedMood && todayAccuracy !== null && (
              <p className="text-[11px] text-[var(--ivory-dim)] mt-2">
                {selectedMood === 'good' && todayAccuracy >= 70
                  ? t('mood.correlationGoodHigh', { defaultValue: '状态不错，正确率也高 — 保持节奏！' })
                  : selectedMood === 'bad' && todayAccuracy < 50
                    ? t('mood.correlationBadLow', { defaultValue: '状态差且正确率偏低，建议休息一下。' })
                    : selectedMood === 'bad'
                      ? t('mood.correlationBadHigh', { defaultValue: '虽然状态不佳但正确率尚可，注意疲劳累积。' })
                      : t('mood.correlationNeutral', { defaultValue: '记录持续累积后可发现情绪与正确率的关联。' })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
