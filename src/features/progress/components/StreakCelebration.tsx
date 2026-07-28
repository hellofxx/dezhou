import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../store';
import { useProgress } from '../hooks/useProgress';
import { MILESTONE_FREEZE_REWARDS } from '../types';
import { generateStreakShareCanvas, downloadBlob } from '@/shared/utils/shareCard';

interface StreakCelebrationProps {
  /** 里程碑天数（3/7/30/100/365） */
  days: number;
  open: boolean;
  onClose: () => void;
}

/** 里程碑视觉元数据：emoji + 文案 key + 动画类 */
const MILESTONE_META: Record<
  number,
  { emoji: string; titleKey: string; subtitleKey: string; animClass: string; firework?: boolean }
> = {
  3: {
    emoji: '🥉',
    titleKey: 'streak.celebration.bronzeTitle',
    subtitleKey: 'streak.celebration.bronzeSubtitle',
    animClass: 'sc-pop',
  },
  7: {
    emoji: '🔥',
    titleKey: 'streak.celebration.flameTitle',
    subtitleKey: 'streak.celebration.flameSubtitle',
    animClass: 'sc-flame',
    firework: true,
  },
  30: {
    emoji: '🏆',
    titleKey: 'streak.celebration.trophyTitle',
    subtitleKey: 'streak.celebration.trophySubtitle',
    animClass: 'sc-firework',
    firework: true,
  },
  100: {
    emoji: '💎',
    titleKey: 'streak.celebration.diamondTitle',
    subtitleKey: 'streak.celebration.diamondSubtitle',
    animClass: 'sc-shine',
    firework: true,
  },
  365: {
    emoji: '👑',
    titleKey: 'streak.celebration.legendTitle',
    subtitleKey: 'streak.celebration.legendSubtitle',
    animClass: 'sc-legend',
    firework: true,
  },
};

/**
 * Streak 里程碑全屏庆典 Dialog（P0-2.4）
 *
 * - 不同天数对应不同徽章与冻结卡奖励
 * - CSS keyframes 动画（不引入 framer-motion）
 * - 30 天及以上显示"分享"按钮，点击生成并下载分享卡片
 * - 关闭时调用 awardStreakFreeze 奖励对应数量（幂等：仅奖励一次）
 */
export default function StreakCelebration({ days, open, onClose }: StreakCelebrationProps) {
  const { t } = useTranslation();
  const awardStreakFreeze = useProgressStore((s) => s.awardStreakFreeze);
  const streak = useProgressStore((s) => s.streak);
  const { summary } = useProgress();
  const [sharing, setSharing] = useState(false);
  const [awarded, setAwarded] = useState(false);

  const meta = MILESTONE_META[days] ?? MILESTONE_META[3]!;
  const reward = MILESTONE_FREEZE_REWARDS[days] ?? 1;
  const showShareButton = days >= 30;

  const handleClose = useCallback(() => {
    // 关闭时奖励冻结卡（幂等：同一组件实例仅奖励一次）
    if (!awarded) {
      awardStreakFreeze(reward);
      setAwarded(true);
    }
    onClose();
  }, [awarded, awardStreakFreeze, reward, onClose]);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      const blob = await generateStreakShareCanvas(days, {
        accuracy: summary.overallAccuracy,
        badges: [],
        currentStreak: streak.currentStreak,
      });
      downloadBlob(blob, `streak-${days}-days.png`);
    } catch (err) {
      console.error('[StreakCelebration] 生成分享卡片失败', err);
    } finally {
      setSharing(false);
    }
  }, [days, summary.overallAccuracy, streak.currentStreak]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl w-[92vw] p-0 overflow-hidden border-[var(--brass-muted)] bg-[var(--felt-deep)]">
        {/* 内联 keyframes：使用任意值确保动画生效 */}
        <style>{`
          @keyframes sc-pop {
            0% { transform: scale(0.4) rotate(-12deg); opacity: 0; }
            60% { transform: scale(1.18) rotate(6deg); opacity: 1; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
          @keyframes sc-flame {
            0%, 100% { transform: scale(1) translateY(0); }
            50% { transform: scale(1.12) translateY(-6px); }
          }
          @keyframes sc-firework {
            0% { transform: scale(0.3); opacity: 0; }
            50% { transform: scale(1.25); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes sc-shine {
            0%, 100% { filter: brightness(1) drop-shadow(0 0 0 rgba(212,168,75,0)); }
            50% { filter: brightness(1.4) drop-shadow(0 0 24px rgba(212,168,75,0.9)); }
          }
          @keyframes sc-legend {
            0% { transform: scale(0.2) rotate(-30deg); opacity: 0; }
            60% { transform: scale(1.2) rotate(8deg); opacity: 1; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
          @keyframes sc-confetti {
            0% { transform: translateY(-10vh) rotate(0); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
          }
          @keyframes sc-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(212,168,75,0); }
            50% { box-shadow: 0 0 60px 12px rgba(212,168,75,0.5); }
          }
        `}</style>

        {/* 烟花/彩屑层（仅 firework 里程碑显示） */}
        {meta.firework && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="absolute text-2xl"
                style={{
                  left: `${(i * 6.25 + 4) % 100}%`,
                  top: '-10%',
                  animation: `sc-confetti ${2.4 + (i % 4) * 0.3}s linear ${i * 0.12}s infinite`,
                }}
              >
                {['🎉', '✨', '⭐', '🎊', '🎆'][i % 5]}
              </span>
            ))}
          </div>
        )}

        <DialogHeader className="sr-only">
          <DialogTitle>
            {t('streak.celebration.hiddenTitle', { days })}
          </DialogTitle>
          <DialogDescription>
            {t('streak.celebration.hiddenDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="relative z-10 flex flex-col items-center text-center px-8 py-12">
          {/* 徽章 emoji（带动画） */}
          <div
            className="text-8xl mb-4 leading-none"
            style={{ animation: `${meta.animClass} 0.9s ease-out` }}
            aria-hidden
          >
            {meta.emoji}
          </div>

          {/* 标题 */}
          <h2 className="font-display text-3xl md:text-4xl text-[var(--ivory)] mb-2">
            {t(meta.titleKey, { days })}
          </h2>
          <p className="text-sm text-[var(--ivory-muted)] mb-1 max-w-md">
            {t(meta.subtitleKey, { days })}
          </p>

          {/* 核心文案：恭喜连续训练 N 天 */}
          <p className="text-base text-[var(--brass-bright)] font-medium mt-4 mb-6">
            {t('streak.celebration.congrats', { days })}
          </p>

          {/* 冻结卡奖励 */}
          <div
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--clay)]/15 border border-[var(--clay)]/40 mb-8"
            style={{ animation: 'sc-glow 2.4s ease-in-out infinite' }}
          >
            <span className="text-2xl">❄️</span>
            <span className="text-sm text-[var(--ivory)] font-medium">
              {t('streak.celebration.freezeReward', { count: reward })}
            </span>
          </div>

          {/* 按钮区 */}
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
            {showShareButton && (
              <Button
                onClick={handleShare}
                disabled={sharing}
                variant="secondary"
                className="flex-1"
              >
                {sharing ? t('streak.celebration.sharing') : t('streak.celebration.share')}
              </Button>
            )}
            <Button onClick={handleClose} className="flex-1">
              {t('streak.celebration.continue')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
