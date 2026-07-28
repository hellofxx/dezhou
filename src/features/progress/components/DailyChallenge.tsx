import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Trophy, Flame, ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useProgress } from '../hooks/useProgress';

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

  const rewards: Record<string, string> = {
    'range': '手牌大师',
    'pot-odds': '赔率专家',
    'gto': 'GTO 精英',
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

/** 获取连续完成每日挑战的天数 */
function getConsecutiveChallengeDays(records: { createdAt: number; result: { accuracy: number }; module: string }[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;

  for (let i = 1; i <= 365; i++) {
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfYear = getDayOfYear(checkDate);
    const types: string[] = ['range-trainer', 'pot-odds', 'gto-simulator'];
    const expectedModule = types[dayOfYear % 3];
    const dateStr = checkDate.toISOString().split('T')[0]!;

    const dayRecords = records.filter((r) => {
      const d = new Date(r.createdAt);
      return d.toISOString().split('T')[0] === dateStr && r.module === expectedModule;
    });

    if (dayRecords.length > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export default function DailyChallenge() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { records } = useProgress();

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]!;
  const dayOfYear = getDayOfYear(today);
  const challenge = useMemo(() => generateDailyChallenge(dateStr, dayOfYear), [dateStr, dayOfYear]);

  const consecutiveDays = useMemo(() => getConsecutiveChallengeDays(records), [records]);

  // Check if today's challenge is completed
  const todayCompleted = useMemo(() => {
    const types: string[] = ['range-trainer', 'pot-odds', 'gto-simulator'];
    const expectedModule = types[dayOfYear % 3];
    return records.some((r) => {
      const d = new Date(r.createdAt);
      return d.toISOString().split('T')[0] === dateStr && r.module === expectedModule;
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
    <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-[var(--gold)]" />
          <h2 className="font-display text-[17px] text-[var(--ivory)] tracking-wide">
            {t('dailyChallenge.title')}
          </h2>
          <div className="ml-auto flex items-center gap-1 text-xs text-[var(--gold)]">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-numeric">{consecutiveDays}</span>
            <span className="text-[var(--ivory-muted)]">{t('dailyChallenge.consecutiveDays')}</span>
          </div>
        </div>

        <div className="space-y-3">
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
                  {t('dailyChallenge.reward')}: {challenge.reward}
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
        </div>
      </CardContent>
    </Card>
  );
}
