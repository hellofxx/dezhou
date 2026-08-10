import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { transitionFast } from '@/shared/utils/motion';
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_CATEGORY,
  type AchievementCategory,
  type Achievement,
  type AchievementTier,
} from '../../data/achievements';
import { useProgressStore } from '../../store';

interface AchievementWallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_TABS: { key: AchievementCategory; icon: string }[] = [
  { key: 'learning', icon: '📚' },
  { key: 'streak', icon: '🔥' },
  { key: 'skill', icon: '🎯' },
  { key: 'milestone', icon: '🏆' },
];

// 四档徽章色对齐牌室色板（DESIGN_LANGUAGE §2.4）：金/铜用 token，银用暖银象牙，钻石用霜钢蓝
const TIER_COLORS: Record<AchievementTier, string> = {
  bronze: 'var(--poker-bronze)',
  silver: 'var(--ivory-dim)',
  gold: 'var(--poker-gold)',
  diamond: 'var(--poker-frost)',
};

export default function AchievementWall({ open, onOpenChange }: AchievementWallProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<AchievementCategory>('learning');

  const unlockedAchievements = useProgressStore((s) => s.unlockedAchievements);
  const achievementUnlockDates = useProgressStore((s) => s.achievementUnlockDates);

  const total = ACHIEVEMENTS.length;
  const unlocked = unlockedAchievements.length;

  const currentAchievements = useMemo(
    () => ACHIEVEMENTS_BY_CATEGORY[activeTab] ?? [],
    [activeTab]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-[var(--felt)] border-[var(--brass)]/40 rounded-[var(--radius-lg)] overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
          <DialogTitle className="text-[var(--ivory)] text-xl flex items-center gap-2">
            <span>🏆</span>
            {t('achievements.wall')}
          </DialogTitle>
          <DialogDescription className="text-[var(--ivory-muted)]">
            {t('achievements.progress', { current: unlocked, total })}
          </DialogDescription>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-[var(--walnut-raised)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--brass)] to-[var(--brass-bright)] transition-all duration-500"
              style={{ width: `${total > 0 ? (unlocked / total) * 100 : 0}%` }}
            />
          </div>
        </DialogHeader>

        {/* Category tabs */}
        <div className="flex gap-1 px-6 pb-3 shrink-0 border-b border-[var(--walnut-border)]">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 px-3 rounded-t-md text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[var(--brass)]/15 text-[var(--brass-bright)] border-b-2 border-[var(--brass-bright)]'
                  : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-light)]/30'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {t(`achievements.categories.${tab.key}`)}
            </button>
          ))}
        </div>

        {/* Achievement grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={transitionFast}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {currentAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={unlockedAchievements.includes(achievement.id)}
                  unlockDate={achievementUnlockDates[achievement.id]}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockDate?: number;
}

function AchievementCard({ achievement, unlocked, unlockDate }: AchievementCardProps) {
  const { t } = useTranslation();
  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all ${
        unlocked
          ? 'border-[var(--brass)]/50 bg-[var(--brass)]/8 shadow-[0_0_16px_rgba(200,164,86,0.15)]'
          : 'border-[var(--walnut-border)] bg-[var(--felt)]/60 opacity-75'
      }`}
    >
      {/* Tier badge */}
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full"
        style={{ backgroundColor: tierColor }}
        title={achievement.tier}
      />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`text-3xl shrink-0 ${unlocked ? '' : 'grayscale opacity-40'}`}
        >
          {unlocked ? achievement.icon : '🔒'}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-semibold truncate ${
              unlocked ? 'text-[var(--ivory)]' : 'text-[var(--ivory-dim)]'
            }`}
          >
            {t(achievement.title)}
          </div>
          <div className="text-xs text-[var(--ivory-muted)] mt-0.5 line-clamp-2">
            {t(achievement.description)}
          </div>

          {/* Reward info */}
          {achievement.reward && (
            <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--ivory-muted)]">
              {achievement.reward.freezeCards && (
                <span className="flex items-center gap-0.5">
                  <span>🧊</span>
                  <span>+{achievement.reward.freezeCards}</span>
                </span>
              )}
              {achievement.reward.xp && (
                <span className="flex items-center gap-0.5">
                  <span>⭐</span>
                  <span>+{achievement.reward.xp} XP</span>
                </span>
              )}
            </div>
          )}

          {/* Unlock date */}
          {unlocked && unlockDate && (
            <div className="text-[10px] text-[var(--brass)]/70 mt-1.5 font-numeric">
              {formatDate(unlockDate)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
