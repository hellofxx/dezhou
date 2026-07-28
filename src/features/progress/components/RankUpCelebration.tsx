import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import type { RankUpEvent } from '@/shared/types/elo';
import { getRankForScore } from '@/shared/utils/elo';

interface RankUpCelebrationProps {
  rankUp: RankUpEvent | null;
  onClose: () => void;
}

/**
 * 段位升级庆祝 Dialog（P1-2.7）
 *
 * 监听 progress.eloRankUp，非 null 时弹出全屏 Dialog。
 * 使用 CSS 动画 + framer-motion 入场（项目其他 celebration 也用 framer-motion）。
 */
export default function RankUpCelebration({ rankUp, onClose }: RankUpCelebrationProps) {
  const { t } = useTranslation();
  const open = rankUp !== null;

  // 5 秒后自动关闭（避免用户忘了关）
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-[var(--felt)] border-[var(--brass-bright)]/40 rounded-[var(--radius-lg)] overflow-hidden">
        <AnimatePresence>
          {rankUp && (
            <motion.div
              key="rank-up-content"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
              className="text-center py-4"
            >
              {/* 大徽章 emoji */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 180 }}
                className="text-6xl mb-2"
              >
                {rankUp.to.icon}
              </motion.div>

              {/* 彩纸粒子（CSS 动画） */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 1,
                      x: 0,
                      y: 0,
                      scale: 1,
                    }}
                    animate={{
                      opacity: 0,
                      x: (Math.cos((i / 8) * Math.PI * 2) * 120),
                      y: (Math.sin((i / 8) * Math.PI * 2) * 120) + 50,
                      scale: 0.3,
                    }}
                    transition={{ duration: 1.2, delay: 0.2 + i * 0.05, ease: 'easeOut' }}
                    className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
                    style={{
                      background: i % 2 === 0 ? 'var(--brass-bright)' : 'var(--success)',
                    }}
                  />
                ))}
              </div>

              <DialogHeader className="items-center">
                <DialogTitle className="font-display text-2xl text-[var(--brass-bright)]">
                  🎉 {t('rankUp.title')}
                </DialogTitle>
                <DialogDescription className="text-[var(--ivory-muted)] text-sm mt-1">
                  {t('rankUp.subtitle')}
                </DialogDescription>
              </DialogHeader>

              {/* 段位过渡展示：旧段位 → 新段位 */}
              <div className="flex items-center justify-center gap-4 my-6">
                {/* 旧段位 */}
                <div className="flex flex-col items-center gap-1 opacity-70">
                  <span className="text-3xl grayscale">{rankUp.from.icon}</span>
                  <span
                    className="text-xs font-display tracking-wide"
                    style={{ color: rankUp.from.color }}
                  >
                    {rankUp.from.name}
                  </span>
                </div>

                {/* 箭头 */}
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[var(--brass-bright)] text-2xl"
                >
                  →
                </motion.div>

                {/* 新段位 */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className="flex flex-col items-center gap-1"
                >
                  <motion.span
                    animate={{
                      scale: [1, 1.15, 1],
                    }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="text-4xl"
                  >
                    {rankUp.to.icon}
                  </motion.span>
                  <span
                    className="text-sm font-display font-bold tracking-wide"
                    style={{ color: rankUp.to.color }}
                  >
                    {rankUp.to.name}
                  </span>
                </motion.div>
              </div>

              {/* 段位描述 */}
              <p className="text-xs text-[var(--ivory-dim)] mb-4 px-4">
                {rankUp.to.description}
              </p>

              {/* 继续按钮 */}
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-[var(--radius)] bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:brightness-110 transition-all shadow-[var(--shadow-brass)]"
              >
                {t('rankUp.continue')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 工具：根据分数变化生成 RankUpEvent（仅升级）
 * 供外部测试或其他场景使用
 */
export function detectRankUp(oldScore: number, newScore: number): RankUpEvent | null {
  const oldRank = getRankForScore(oldScore);
  const newRank = getRankForScore(newScore);
  if (newRank.minScore > oldRank.minScore) {
    return { from: oldRank, to: newRank };
  }
  return null;
}
