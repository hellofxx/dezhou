import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Trophy, Flame, ArrowRight, CheckCircle2, Circle, Puzzle } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { useProgressStore } from '../../store';
// 今日任务卡：合并每日挑战（训练器引导）与每日谜题入口；streak 统一读 progress store
// 依赖倒置：每日谜题完成状态经 achievementRegistry 查询，日期 key 复用 shared toLocalDateKey
import { getAchievementSources } from '@/shared/stores/achievementRegistry';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

interface DailyChallenge {
  id: string;
  date: string;
  type: 'range' | 'pot-odds' | 'gto';
  description: string;
  target: { accuracy?: number; time?: number; count: number };
  completed: boolean;
  reward: string;
}

/** 获取今年第几天 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** 基于日期种子生成每日挑战 */
function generateDailyChallenge(dateStr: string, dayOfYear: number): DailyChallenge {
  const types: ('range' | 'pot-odds' | 'gto')[] = ['range', 'pot-odds', 'gto'];
  const type = types[dayOfYear % 3]!;
  const counts = [15, 20, 25, 30];
  const accuracies = [70, 75, 80, 85];
  const count = counts[dayOfYear % counts.length]!;
  const accuracy = accuracies[(dayOfYear + 1) % accuracies.length]!;

  // PROG-06：奖励名存 i18n key（dailyChallenge.reward*），渲染时 t() 解析
  const rewards: Record<string, string> = {
    'range': 'dailyChallenge.rewardRange',
    'pot-odds': 'dailyChallenge.rewardPotOdds',
    'gto': 'dailyChallenge.rewardGto',
  };

  return {
    id: `daily-${dateStr}`,
    date: dateStr,
    type,
    description: '',
    target: { count, accuracy },
    completed: false,
    reward: rewards[type]!,
  };
}

export default function DailyChallenge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { records } = useProgress();
  // streak 展示统一读 progress store（全局唯一事实源，不再私有计算）
  const currentStreak = useProgressStore((s) => s.streak.currentStreak);
  const dailyKey = toLocalDateKey(Date.now());
  const puzzleDone = getAchievementSources().some((s) => s.isDailyPuzzleCompleted?.(dailyKey) ?? false);

  const today = new Date();
  // R3: 与每日谜题行统一用本地时区日期（原 toISOString 为 UTC，同卡双口径会在 00:00–08:00 错位）
  const dateStr = dailyKey;
  const dayOfYear = getDayOfYear(today);
  const challenge = useMemo(() => generateDailyChallenge(dateStr, dayOfYear), [dateStr, dayOfYear]);

  // Check if today's challenge is completed
  const todayCompleted = useMemo(() => {
    const types: string[] = ['range-trainer', 'pot-odds', 'gto-simulator'];
    const expectedModule = types[dayOfYear % 3];
    return records.some((r) => {
      return toLocalDateKey(r.createdAt) === dateStr && r.module === expectedModule;
    });
  }, [records, dateStr, dayOfYear]);

  const descriptionKey = challenge.type === 'range'
    ? 'dailyChallenge.rangeChallenge'
    : challenge.type === 'pot-odds'
      ? 'dailyChallenge.potOddsChallenge'
      : 'dailyChallenge.gtoChallenge';

  const targetPath = challenge.type === 'range'
    ? '/range-trainer'
    : challenge.type === 'pot-odds'
      ? '/pot-odds'
      : '/gto-simulator';

  return (
    <Card className="bg-[var(--felt)] border-[var(--walnut-border)] h-full">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-[var(--brass-bright)]" />
          <h2 className="font-display text-[17px] text-[var(--ivory)] tracking-wide">
            {t('dailyChallenge.title')}
          </h2>
          <div className="ml-auto flex items-center gap-1 text-xs text-[var(--brass-bright)]">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-numeric">{currentStreak}</span>
            <span className="text-[var(--ivory-muted)]">{t('dailyChallenge.consecutiveDays')}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          <div className="flex items-start gap-2">
            {todayCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--brass-bright)] shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-[var(--ivory-muted)] shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm text-[var(--ivory)]">
                {t(descriptionKey, { count: challenge.target.count, accuracy: challenge.target.accuracy })}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-[var(--ivory-muted)]">
                  {t('dailyChallenge.reward')}: {t(challenge.reward)}
                </span>
                <span className={`text-xs font-medium ${todayCompleted ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory-muted)]'}`}>
                  {todayCompleted ? t('dailyChallenge.completed') : t('dailyChallenge.notCompleted')}
                </span>
              </div>
            </div>
          </div>

          {!todayCompleted && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(targetPath)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-semibold hover:bg-[var(--brass-bright)] transition-colors"
            >
              {t('dailyChallenge.startChallenge')}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          )}

          {/* 每日谜题入口行：与每日挑战统一为今日任务 */}
          <button
            onClick={() => navigate('/puzzle/daily')}
            className="w-full flex items-center gap-2 pt-3 border-t border-[var(--walnut-border)]/60 text-left group mt-auto"
          >
            {puzzleDone ? (
              <CheckCircle2 className="w-5 h-5 text-[var(--brass-bright)] shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-[var(--ivory-muted)] shrink-0" />
            )}
            <Puzzle className="w-4 h-4 text-[var(--ivory-dim)] shrink-0" />
            <span className="flex-1 text-sm text-[var(--ivory)]">{t('dailyChallenge.dailyPuzzle')}</span>
            <span className={`text-xs font-medium ${puzzleDone ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory-muted)]'}`}>
              {puzzleDone ? t('dailyChallenge.completed') : t('dailyChallenge.notCompleted')}
            </span>
            <ArrowRight className="w-4 h-4 text-[var(--ivory-muted)] group-hover:text-[var(--brass-bright)] transition-colors" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
