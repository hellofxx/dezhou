import { useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { APP_NAME, APP_VERSION } from '@/shared/constants/app';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import OnboardingGate from '@/features/progress/components/OnboardingGate';
// P2-5.3: 全局 Tilt 提示组件（监听连续答错数）
import TiltWarning from '@/features/progress/components/TiltWarning';
import MobileNav from './MobileNav';
import TableRail from '@/shared/components/TableRail';
import { useProgressStore } from '@/features/progress/store';
import {
  ChevronLeft,
  Home,
  Target,
  Calculator,
  Bot,
  ClipboardList,
  BarChart3,
  Settings,
  Trophy,
  Zap,
  Globe,
  GraduationCap,
  BookOpen,
  Puzzle,
  Flame,
  Spade,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  i18nKey: string;
}

interface NavGroup {
  title: string;
  i18nKey: string;
  items: NavItem[];
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const currentStreak = useProgressStore((s) => s.streak.currentStreak);

  const navGroups = useMemo<NavGroup[]>(() => [
    {
      title: t('nav.overview'),
      i18nKey: 'nav.overview',
      items: [
        { label: t('progress.title'), path: '/', icon: <Home size={20} />, i18nKey: 'progress.title' },
      ],
    },
    {
      title: t('nav.training'),
      i18nKey: 'nav.training',
      items: [
        { label: t('nav.academy'), path: '/academy', icon: <GraduationCap size={20} />, i18nKey: 'nav.academy' },
        { label: t('nav.basics'), path: '/academy/basics', icon: <BookOpen size={20} />, i18nKey: 'nav.basics' },
        { label: t('nav.rangeTrainer'), path: '/range-trainer', icon: <Target size={20} />, i18nKey: 'nav.rangeTrainer' },
        { label: t('nav.potOdds'), path: '/pot-odds', icon: <Calculator size={20} />, i18nKey: 'nav.potOdds' },
        { label: t('nav.gtoSimulator'), path: '/gto-simulator', icon: <Bot size={20} />, i18nKey: 'nav.gtoSimulator' },
        { label: t('nav.dailyChallenge'), path: '/daily-challenge', icon: <Zap size={20} />, i18nKey: 'nav.dailyChallenge' },
        { label: t('nav.puzzle'), path: '/puzzle', icon: <Puzzle size={20} />, i18nKey: 'nav.puzzle' },
      ],
    },
    {
      title: t('nav.study'),
      i18nKey: 'nav.study',
      items: [
        { label: t('nav.handHistory'), path: '/hand-history', icon: <ClipboardList size={20} />, i18nKey: 'nav.handHistory' },
      ],
    },
    {
      title: t('nav.data'),
      i18nKey: 'nav.data',
      items: [
        { label: t('nav.progress'), path: '/progress', icon: <BarChart3 size={20} />, i18nKey: 'nav.progress' },
        { label: t('nav.leaderboard'), path: '/leaderboard', icon: <Trophy size={20} />, i18nKey: 'nav.leaderboard' },
      ],
    },
    {
      title: t('nav.settingsGroup'),
      i18nKey: 'nav.settingsGroup',
      items: [
        { label: t('nav.settings'), path: '/settings', icon: <Settings size={20} />, i18nKey: 'nav.settings' },
      ],
    },
  ], [t]);

  const pageTitle: Record<string, string> = {
    '/': t('dashboard.title', '训练仪表盘'),
    '/academy': t('nav.academy'),
    '/range-trainer': t('nav.rangeTrainer'),
    '/pot-odds': t('nav.potOdds'),
    '/gto-simulator': t('nav.gtoSimulator'),
    '/hand-history': t('nav.handHistory'),
    '/progress': t('nav.progress'),
    '/settings': t('nav.settings'),
    '/daily-challenge': t('nav.dailyChallenge'),
    '/leaderboard': t('nav.leaderboard'),
    '/puzzle': t('nav.puzzle'),
  };

  const currentPageTitle = pageTitle[location.pathname] || APP_NAME;

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'zh' ? 'en' : 'zh');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar — deep walnut card-room rail. Hidden on mobile. */}
      <aside
        className={cn(
          'hidden md:flex flex-col walnut-panel border-r border-[var(--walnut-border)] transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Sidebar header — brass hairline below */}
        <div className="flex items-center h-14 px-4 border-b border-[var(--walnut-border)] relative brass-rail">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <Spade size={28} className="text-[var(--brass)] shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-display text-[15px] text-[var(--ivory)] truncate tracking-wide block leading-tight">
                  PokerLab
                </span>
                <span className="text-[10px] text-[var(--ivory-muted)] truncate block">
                  德州扑克训练平台
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] hover:bg-[var(--walnut-light)] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors',
              collapsed && 'mx-auto'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={16} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {navGroups.map((group) => (
            <div key={group.i18nKey}>
              {!collapsed && (
                <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--ivory-muted)] px-3 mb-2 font-medium">
                  {group.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm transition-colors relative',
                          isActive
                            ? 'text-[var(--brass-bright)] bg-[rgba(201,162,94,0.08)]'
                            : 'text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-light)]/60'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--brass)] rounded-r" />
                          )}
                          <span className="shrink-0">{item.icon}</span>
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {isActive && (
                            <span className="absolute right-2 w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[var(--brass-bright)] to-[var(--brass)] flex items-center justify-center text-[10px] font-display font-bold text-[var(--primary-foreground)]">
                              D
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-[var(--walnut-border)] px-4 py-3">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              {/* User avatar chip */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brass)] to-[var(--brass-deep)] flex items-center justify-center text-[11px] font-display font-bold text-[var(--primary-foreground)] shrink-0">
                玩
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--ivory)] truncate">玩家</div>
                <div className="text-[10px] text-[var(--ivory-muted)] font-numeric">v{APP_VERSION}</div>
              </div>
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] hover:bg-[var(--walnut-light)] transition-colors"
                title="Toggle Language"
              >
                <Globe size={14} />
                <span className="font-numeric">{i18n.language === 'zh' ? 'EN' : '中'}</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center w-full py-1 text-[10px] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors"
                aria-label="Toggle language"
              >
                <Globe size={14} />
              </button>
              <p className="text-[10px] text-[var(--ivory-dim)] font-numeric">v{APP_VERSION}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area — bottle-green felt */}
      <div className="flex flex-col flex-1 overflow-hidden felt-ambient">
        {/* Top bar — surface bg with walnut border below */}
        <header className="flex items-center h-16 px-4 md:px-6 border-b border-[var(--walnut-border)] bg-[var(--surface)] backdrop-blur-sm shrink-0 relative brass-rail">
          <h1 className="font-display text-[17px] text-[var(--ivory)] flex-1 tracking-wide">
            {currentPageTitle}
          </h1>
          {currentStreak > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-md bg-[var(--brass-glow)] border border-[rgba(201,162,94,0.15)]">
              <Flame className="w-4 h-4 text-[var(--brass)]" />
              <span className="text-sm font-semibold text-[var(--brass-bright)] font-numeric">{currentStreak}</span>
            </div>
          )}
          {/* Mobile language toggle */}
          <button
            onClick={toggleLanguage}
            className="md:hidden flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors"
          >
            <Globe size={14} />
            <span className="font-numeric">{i18n.language === 'zh' ? 'EN' : '中'}</span>
          </button>
        </header>

        <TableRail />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ErrorBoundary>
                <OnboardingGate>
                  <Outlet />
                </OnboardingGate>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* P2-5.3: 全局 Tilt 提示 Dialog — 监听 emotion.consecutiveWrongCount */}
      <TiltWarning />

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
