import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, Keyboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// 全局训练伴生 Dialog：Tilt 提醒与里程碑庆典（覆盖 BlankLayout 下的训练页，
// 与 AppLayout 同策略，修复"主训练页连错 3 题无 Tilt 弹窗"的覆盖缺口）
import TiltWarning from '@/features/progress/components/TiltWarning';
import MilestoneCelebrationHost from '@/features/progress/components/MilestoneCelebrationHost';
import OnboardingGate from '@/features/progress/components/OnboardingGate';

const SHORTCUTS = [
  { key: '1', action: 'Fold（弃牌）' },
  { key: '2', action: 'Call（跟注）' },
  { key: '3', action: 'Raise（加注）' },
  { key: 'Space', action: '确认 / 下一题' },
  { key: 'Esc', action: '退出训练' },
  { key: '?', action: '显示/隐藏快捷键' },
];

export default function BlankLayout() {
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      // Don't trigger if typing in input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      setShowShortcuts((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="relative h-screen felt-texture overflow-hidden">
      {/* Back button - top left, semi-transparent with brass icon */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-sm text-[var(--ivory-muted)] hover:text-[var(--ivory)] bg-[var(--surface-overlay)] hover:bg-[var(--surface-raised)] transition-colors"
        aria-label="返回上一页"
      >
        <ArrowLeft size={16} className="text-[var(--brass)]" />
        <span>返回</span>
      </button>

      {/* Keyboard hint button - top right */}
      <button
        onClick={() => setShowShortcuts(true)}
        className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-2 rounded-[var(--radius)] text-xs text-[var(--ivory-dim)] hover:text-[var(--ivory)] bg-[var(--surface-overlay)] hover:bg-[var(--surface-raised)] transition-colors"
        title="快捷键 (?)"
        aria-label="快捷键"
      >
        <Keyboard size={14} className="text-[var(--brass)]" />
        <span className="hidden sm:inline">?</span>
      </button>

      {/* Content — 嵌入 OnboardingGate 门禁，覆盖全屏训练路由（P2A-01） */}
      <div className="h-full">
        <OnboardingGate>
          <Outlet />
        </OnboardingGate>
      </div>

      {/* P2-5.3: 全局 Tilt 提示 Dialog — 训练页（范围测验/赔率测验/GTO 会话）均在本布局下 */}
      <TiltWarning />

      {/* 里程碑庆典全局 Host — 训练完成触发里程碑时就地展示 */}
      <MilestoneCelebrationHost />

      {/* Shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--surface-overlay)]"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-6 max-w-sm w-full mx-4 border border-[var(--walnut-border)] shadow-[var(--shadow-lg)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-semibold text-[var(--ivory)] flex items-center gap-2">
                  <Keyboard size={16} className="text-[var(--brass-bright)]" />
                  键盘快捷键
                </h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-light)]/40"
                  aria-label="关闭快捷键面板"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {SHORTCUTS.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-[var(--ivory-muted)]">{s.action}</span>
                    <kbd className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--walnut-light)]/60 border border-[var(--walnut-border)] text-xs font-numeric text-[var(--ivory)]">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
