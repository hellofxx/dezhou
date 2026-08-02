import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { TrainingRecord } from '../../types';

interface Achievement {
  id: string;
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

function computeAchievements(records: TrainingRecord[]): Achievement[] {
  const sorted = [...records].sort((a, b) => a.createdAt - b.createdAt);
  const totalSessions = records.length;

  // 连续天数计算
  const dates = [...new Set(records.map((r) => toDateStr(r.createdAt)))].sort();
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
    if (r.result.totalQuestions >= 20 && r.result.accuracy >= 1) {
      hasPerfect = true;
      break;
    }
  }

  // 任意模块90%正确率
  let has90Accuracy = false;
  for (const [, s] of moduleStats) {
    if (s.total > 0 && s.correct / s.total >= 0.9) {
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
    return s && s.sessions >= 10;
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
      name: '初出茅庐',
      description: '完成首次训练',
      icon: '🌟',
      unlockedAt: sorted.length > 0 ? sorted[0]!.createdAt : null,
      progress: Math.min(totalSessions, 1),
      requirement: '完成 1 次训练',
    },
    {
      id: 'streak-7',
      name: '连续7天',
      description: '连续训练7天',
      icon: '🔥',
      unlockedAt: maxStreak >= 7 ? findStreakUnlockedDate(dates) : null,
      progress: Math.min(maxStreak, 7),
      requirement: '连续训练 7 天',
    },
    {
      id: 'hundred-sessions',
      name: '百炼成钢',
      description: '完成100次训练',
      icon: '💪',
      unlockedAt: totalSessions >= 100 ? sorted[99]?.createdAt ?? null : null,
      progress: Math.min(totalSessions, 100),
      requirement: '完成 100 次训练',
    },
    {
      id: 'sharpshooter',
      name: '神射手',
      description: '任意模块正确率达到90%',
      icon: '🎯',
      unlockedAt: has90Accuracy ? records[records.length - 1]?.createdAt ?? null : null,
      progress: has90Accuracy ? 100 : Math.round(Math.max(...Array.from(moduleStats.values()).map(s => s.total > 0 ? (s.correct / s.total) * 100 : 0), 0)),
      requirement: '任意模块正确率 90%',
    },
    {
      id: 'gto-master',
      name: 'GTO大师',
      description: 'GTO模拟器正确率达80%',
      icon: '🧠',
      unlockedAt: gtoAccuracy >= 0.8 ? records.find(r => r.module === 'gto-simulator')?.createdAt ?? null : null,
      progress: Math.round(gtoAccuracy * 100),
      requirement: 'GTO 正确率 80%',
    },
    {
      id: 'perfectionist',
      name: '完美主义',
      description: '单次训练100%正确（20题以上）',
      icon: '💎',
      unlockedAt: hasPerfect ? records.find(r => r.result.totalQuestions >= 20 && r.result.accuracy >= 1)?.createdAt ?? null : null,
      progress: hasPerfect ? 100 : 0,
      requirement: '单次 20 题全对',
    },
    {
      id: 'all-rounder',
      name: '全能选手',
      description: '所有模块各完成至少10次训练',
      icon: '🏆',
      unlockedAt: allModulesQualified ? records[records.length - 1]?.createdAt ?? null : null,
      progress: Math.min(minModuleSessions, 10) * 10,
      requirement: '各模块至少 10 次',
    },
    {
      id: 'speed-king',
      name: '速度之王',
      description: '平均答题时间低于5秒',
      icon: '⚡',
      unlockedAt: avgTime > 0 && avgTime <= 5000 ? records[records.length - 1]?.createdAt ?? null : null,
      progress: avgTime > 0 ? Math.max(0, Math.round((1 - (avgTime - 5000) / 10000) * 100)) : 0,
      requirement: '平均用时 < 5 秒',
    },
  ];
}

function findStreakUnlockedDate(dates: string[]): number | null {
  if (dates.length < 7) return null;
  const sorted = [...dates].sort();
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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export default function AchievementBadges({ records }: AchievementBadgesProps) {
  const achievements = useMemo(() => computeAchievements(records), [records]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[var(--ivory)]">成就</CardTitle>
        </CardHeader>
        <CardContent>
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
          >
            {achievements.map((ach) => (
              <motion.div key={ach.id} variants={item}>
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
  const unlocked = achievement.unlockedAt !== null;
  const progressPct = Math.min(100, Math.max(0, achievement.progress));

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        unlocked
          ? 'border-[var(--brass)]/40 bg-[var(--brass)]/8 shadow-[0_0_12px_rgba(200,164,86,0.18)]'
          : 'border-[var(--walnut-border)] bg-[var(--felt)]/50 opacity-70'
      }`}
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`text-2xl ${unlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${unlocked ? 'text-[var(--brass)]' : 'text-[var(--ivory-dim)]'}`}>
            {achievement.name}
          </div>
          <div className="text-xs text-[var(--ivory-muted)] truncate">{achievement.description}</div>
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
          <div className="text-[10px] text-[var(--ivory-muted)] font-numeric">{achievement.requirement}</div>
        </div>
      )}
      {unlocked && (
        <div className="text-[10px] text-[var(--brass)]/80 font-numeric">
          {achievement.unlockedAt ? formatDate(achievement.unlockedAt) : '已解锁'}
        </div>
      )}
    </div>
  );
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}
