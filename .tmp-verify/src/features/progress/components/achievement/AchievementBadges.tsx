import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { MOTION_DURATION, SCALE_IN, staggerContainer } from '@/shared/utils/motion';
import type { TrainingRecord } from '../../types';

interface Achievement {
  id: string;
  /** i18n key：title/description 单源复用 achievements.items.*（与 AchievementWall 同源） */
  name: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  progress: number;
  requirement: string;
}

interface AchievementBadgesProps {
  records: TrainingRecord[];
}

// PROG-03：徽章进度阈值集中命名（单点事实源），消除魔法数字内联
const BADGE_THRESHOLDS = {
  streakDays: 7,
  hundredSessions: 100,
  sharpshooterAccuracy: 0.9,
  gtoAccuracy: 0.8,
  perfectSampleSize: 20,
  allRounderSessions: 10,
  speedAvgTimeMs: 5000,
} as const;

function computeAchievements(records: TrainingRecord[]): Achievement[] {
  const sorted = [...records].toSorted((a, b) => a.createdAt - b.createdAt);
  const totalSessions = records.length;

  // 连续天数计算
  const dates = [...new Set(records.map((r) => toDateStr(r.createdAt)))].toSorted();
  let maxStreak = 0;
  let currentRun = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]!);
    const curr = new Date(dates[i]!);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      currentRun++;
    } else {
      maxStreak = Math.max(maxStreak, currentRun);
      currentRun = 1;
    }
  }
  maxStreak = Math.max(maxStreak, currentRun);
  if (dates.length === 0) maxStreak = 0;

  // 各模块统计
  const moduleStats = new Map<string, { sessions: number; correct: number; total: number }>();
  for (const r of records) {
    const s = moduleStats.get(r.module) ?? { sessions: 0, correct: 0, total: 0 };
    s.sessions++;
    s.correct += r.result.correctAnswers;
    s.total += r.result.totalQuestions;
    moduleStats.set(r.module, s);
  }

  // 最高单次正确率（20题以上）
  let hasPerfect = false;
  for (const r of records) {
    if (r.result.totalQuestions >= BADGE_THRESHOLDS.perfectSampleSize && r.result.accuracy >= 1) {
      hasPerfect = true;
      break;
    }
  }

  // 任意模块90%正确率
  let has90Accuracy = false;
  for (const [, s] of moduleStats) {
    if (s.total > 0 && s.correct / s.total >= BADGE_THRESHOLDS.sharpshooterAccuracy) {
      has90Accuracy = true;
      break;
    }
  }

  // GTO 80%
  const gtoStats = moduleStats.get('gto-simulator');
  const gtoAccuracy = gtoStats && gtoStats.total > 0 ? gtoStats.correct / gtoStats.total : 0;

  // 所有模块各10次
  const requiredModules = ['range-trainer', 'pot-odds', 'gto-simulator'];
  const allModulesQualified = requiredModules.every((m) => {
    const s = moduleStats.get(m);
    return s && s.sessions >= BADGE_THRESHOLDS.allRounderSessions;
  });
  const minModuleSessions = requiredModules.reduce((min, m) => {
    const s = moduleStats.get(m);
    return Math.min(min, s?.sessions ?? 0);
  }, Infinity);

  // 平均答题时间
  const totalQuestions = records.reduce((s, r) => s + r.result.totalQuestions, 0);
  const totalTime = records.reduce((s, r) => s + r.result.averageTime * r.result.totalQuestions, 0);
  const avgTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;

  return [
    {
      id: 'first-training',
      // PROG-03：title/description 单源复用 achievements.items.*（与 ACHIEVEMENTS 数据源同 key），
      // requirement 保留 badges.*（徽章带进度展示独有）
      name: 'achievements.items.firstTraining.title',
      description: 'achievements.items.firstTraining.description',
      icon: '🌟',
      unlockedAt: sorted.length > 0 ? sorted[0]!.createdAt : null,
      progress: Math.min(totalSessions, 1),
      requirement: 'achievements.badges.firstTraining.requirement',
    },
    {
      id: 'streak-7',
      name: 'achievements.items.streak7.title',
      description: 'achievements.items.streak7.description',
      icon: '🔥',
      unlockedAt: maxStreak >= BADGE_THRESHOLDS.streakDays ? findStreakUnlockedDate(dates) : null,
      progress: Math.min(maxStreak, BADGE_THRESHOLDS.streakDays),
      requirement: 'achievements.badges.streak7.requirement',
    },
    {
      id: 'hundred-sessions',
      name: 'achievements.badges.hundredSessions.name',
      description: 'achievements.badges.hundredSessions.description',
      icon: '💪',
      unlockedAt: totalSessions >= BADGE_THRESHOLDS.hundredSessions ? sorted[99]?.createdAt ?? null : null,
      progress: Math.min(totalSessions, BADGE_THRESHOLDS.hundredSessions),
      requirement: 'achievements.badges.hundredSessions.requirement',
    },
    {
      id: 'sharpshooter',
      name: 'achievements.badges.sharpshooter.name',
      description: 'achievements.badges.sharpshooter.description',
      icon: '🎯',
      unlockedAt: has90Accuracy ? records[records.length - 1]?.createdAt ?? null : null,
      progress: has90Accuracy ? 100 : Math.round(Math.max(...Array.from(moduleStats.values()).map(s => s.total > 0 ? (s.correct / s.total) * 100 : 0), 0)),
      requirement: 'achievements.badges.sharpshooter.requirement',
    },
    {
      id: 'gto-master',
      name: 'achievements.badges.gtoMaster.name',
      description: 'achievements.badges.gtoMaster.description',
      icon: '🧠',
      unlockedAt: gtoAccuracy >= BADGE_THRESHOLDS.gtoAccuracy ? records.find(r => r.module === 'gto-simulator')?.createdAt ?? null : null,
      progress: Math.round(gtoAccuracy * 100),
      requirement: 'achievements.badges.gtoMaster.requirement',
    },
    {
      id: 'perfectionist',
      name: 'achievements.badges.perfectionist.name',
      description: 'achievements.badges.perfectionist.description',
      icon: '💎',
      unlockedAt: hasPerfect ? records.find(r => r.result.totalQuestions >= BADGE_THRESHOLDS.perfectSampleSize && r.result.accuracy >= 1)?.createdAt ?? null : null,
      progress: hasPerfect ? 100 : 0,
      requirement: 'achievements.badges.perfectionist.requirement',
    },
    {
      id: 'all-rounder',
      name: 'achievements.badges.allRounder.name',
      description: 'achievements.badges.allRounder.description',
      icon: '🏆',
      unlockedAt: allModulesQualified ? records[records.length - 1]?.createdAt ?? null : null,
      progress: Math.min(minModuleSessions, BADGE_THRESHOLDS.allRounderSessions) * 10,
      requirement: 'achievements.badges.allRounder.requirement',
    },
    {
      id: 'speed-king',
      name: 'achievements.badges.speedKing.name',
      description: 'achievements.badges.speedKing.description',
      icon: '⚡',
      unlockedAt: avgTime > 0 && avgTime <= BADGE_THRESHOLDS.speedAvgTimeMs ? records[records.length - 1]?.createdAt ?? null : null,
      progress: avgTime > 0 ? Math.max(0, Math.round((1 - (avgTime - BADGE_THRESHOLDS.speedAvgTimeMs) / 10000) * 100)) : 0,
      requirement: 'achievements.badges.speedKing.requirement',
    },
  ];
}

function findStreakUnlockedDate(dates: string[]): number | null {
  if (dates.length < 7) return null;
  const sorted = [...dates].toSorted();
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const curr = new Date(sorted[i]!);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      run++;
      if (run >= 7) return curr.getTime();
    } else {
      run = 1;
    }
  }
  return null;
}

function toDateStr(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AchievementBadges({ records }: AchievementBadgesProps) {
  const { t } = useTranslation();
  const achievements = useMemo(() => computeAchievements(records), [records]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATION.slow, delay: 0.4 }}
    >
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-[15px] text-[var(--ivory)] tracking-wide">
            {t('achievements.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={staggerContainer(0.06)}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3"
          >
            {achievements.map((ach) => (
              <motion.div key={ach.id} variants={SCALE_IN}>
                <AchievementCard achievement={ach} />
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const { t } = useTranslation();
  const unlocked = achievement.unlockedAt !== null;
  const progressPct = Math.min(100, Math.max(0, achievement.progress));
  // PROG-03：name/description/requirement 已是 i18n key（achievements.badges.*），直接 t() 解析
  const nameKey = achievement.name;
  const descKey = achievement.description;
  const reqKey = achievement.requirement;

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        unlocked
          ? 'border-[var(--brass)]/40 bg-[var(--brass)]/8 shadow-[var(--shadow-brass)]'
          : 'border-[var(--walnut-border)] bg-[var(--felt)]/50 opacity-70'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`text-2xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${unlocked ? 'text-[var(--brass)]' : 'text-[var(--ivory-dim)]'}`}>
            {t(nameKey)}
          </div>
          <div className="text-xs text-[var(--ivory-muted)] truncate">{t(descKey)}</div>
        </div>
      </div>
      {!unlocked && (
        <div className="space-y-1">
          <div className="h-1.5 w-full rounded-full bg-[var(--walnut-raised)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--brass)] transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-[10px] text-[var(--ivory-muted)] font-numeric">{t(reqKey)}</div>
        </div>
      )}
      {unlocked && (
        <div className="text-[10px] text-[var(--brass)]/80 font-numeric">
          {achievement.unlockedAt ? formatDate(achievement.unlockedAt) : t('achievements.unlocked')}
        </div>
      )}
    </div>
  );
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
