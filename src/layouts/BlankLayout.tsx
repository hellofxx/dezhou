import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useNavigate } from 'react-router-dom';
import { ArrowLeft, Keyboard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
// 全局训练伴生 Dialog：Tilt 提醒与里程碑庆典（覆盖 BlankLayout 下的训练页，
// 与 AppLayout 同策略，修复"主训练页连错 3 题无 Tilt 弹窗"的覆盖缺口）
import TiltWarning from '@/features/progress/components/gate/TiltWarning';
import MilestoneCelebrationHost from '@/features/progress/components/celebration/MilestoneCelebrationHost';
import OnboardingGate from '@/features/progress/components/gate/OnboardingGate';
import { useDocumentTitle } from './useDocumentTitle';

// PLAT-09：存 i18n key（common.shortcuts.*），渲染时 t() 解析
const SHORTCUTS = [
  { key: '1', action: 'common.action.fold' },
  { key: '2', action: 'common.action.call' },
  { key: '3', action: 'common.action.raise' },
  { key: 'Space', action: 'common.shortcuts.confirm' },
  { key: 'Esc', action: 'common.shortcuts.exit' },
  { key: '?', action: 'common.shortcuts.toggle' },
];

export default function BlankLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useDocumentTitle(t('common.a11y.trainingPage'));

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      // Don't trigger if typing in input or editable region
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
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
        className="absolute top-4 left-4 z-10 flex items-center gap-2 min-h-11 min-w-11 px-3 py-2 rounded-[var(--radius)] text-sm text-[var(--ivory-muted)] hover:text-[var(--ivory)] bg-[var(--surface-overlay)] hover:bg-[var(--surface-raised)] transition-colors"
        aria-label={t('common.ui.back')}
      >
        <ArrowLeft size={16} className="text-[var(--brass)]" />
        <span>{t('common.ui.back')}</span>
      </button>

      {/* Keyboard hint button - top right */}
      <button
        onClick={() => setShowShortcuts(true)}
        className="absolute top-4 right-4 z-10 flex items-center justify-center gap-1.5 min-h-11 min-w-11 px-2.5 py-2 rounded-[var(--radius)] text-xs text-[var(--ivory-dim)] hover:text-[var(--ivory)] bg-[var(--surface-overlay)] hover:bg-[var(--surface-raised)] transition-colors"
        title={t('common.shortcutsTitle')}
        aria-label={t('common.shortcutsTitle')}
      >
        <Keyboard size={14} className="text-[var(--brass)]" />
        <span className="hidden sm:inline">?</span>
      </button>

      {/* Content — 嵌入 OnboardingGate 门禁，覆盖全屏训练路由（P2A-01）；
          训练页名由壳层 h1 承担（视觉隐藏，供读屏器定位） */}
      <main id="main-content" className="h-full">
        <h1 className="sr-only">{t('common.a11y.trainingPage')}</h1>
        <OnboardingGate>
          <Outlet />
        </OnboardingGate>
      </main>

      {/* P2-5.3: 全局 Tilt 提示 Dialog — 训练页（范围测验/赔率测验/GTO 会话）均在本布局下 */}
      <TiltWarning />

      {/* 里程碑庆典全局 Host — 训练完成触发里程碑时就地展示 */}
      <MilestoneCelebrationHost />

      {/* Shortcuts — 复用共享 Dialog（纸张材质/关闭按钮/焦点陷阱/Escape 由 primitives 提供） */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-10 font-display text-base font-semibold text-[var(--ivory)]">
              <Keyboard size={16} className="text-[var(--brass-bright)]" />
              {t('common.shortcutsTitle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {SHORTCUTS.map((s) => (
              <div key={s.key} className="flex items-center justify-between py-1.5">
                <span className="text-sm text-[var(--ivory-muted)]">{t(s.action)}</span>
                <kbd className="px-2 py-0.5 rounded-[var(--radius-sm)] bg-[var(--walnut-light)]/60 border border-[var(--walnut-border)] text-xs font-numeric text-[var(--ivory)]">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
