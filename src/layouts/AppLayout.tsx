import { useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { PAGE_TRANSITION } from '@/shared/utils/motion';
import { APP_NAME, APP_VERSION } from '@/shared/constants/app';
import { switchLanguage } from '@/i18n/preload';
import { ErrorBoundary } from '@/shared/components/business/ErrorBoundary';
import OnboardingGate from '@/features/progress/components/gate/OnboardingGate';
// P2-5.3: 全局 Tilt 提示组件（监听连续答错数）
import TiltWarning from '@/features/progress/components/gate/TiltWarning';
import MilestoneCelebrationHost from '@/features/progress/components/celebration/MilestoneCelebrationHost';
import MobileNav from './MobileNav';
import { useThemeApplier } from './useThemeApplier';
import TableRail from '@/shared/components/layout/TableRail';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/components/ui/tooltip';
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
  Globe,
  GraduationCap,
  Library,
  Puzzle,
  Flame,
  Spade,
  HelpCircle,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  i18nKey: string;
  /** 悬停提示（用于双学院定位区分等需要副文案的导航项） */
  hint?: string;
}

interface NavGroup {
  title: string;
  i18nKey: string;
  items: NavItem[];
}

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [switching, setSwitching] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const currentStreak = useProgressStore((s) => s.streak.currentStreak);
  const navigate = useNavigate();

  // 主题应用器：settings.theme（含 system）→ <html data-theme> / color-scheme
  useThemeApplier();

  // 导航层级精简：Dashboard 置顶去分组（原"概览"单项目分组冗余），
  // 其余按 训练 / 研习 / 数据 / 设置 四组；图标统一 18px 线性风格（DESIGN_LANGUAGE §7）
  const navGroups = useMemo<NavGroup[]>(() => [
    {
      title: t('nav.training'),
      i18nKey: 'nav.training',
      items: [
        { label: t('nav.rangeTrainer'), path: '/range-trainer', icon: <Target size={18} />, i18nKey: 'nav.rangeTrainer' },
        { label: t('nav.potOdds'), path: '/pot-odds', icon: <Calculator size={18} />, i18nKey: 'nav.potOdds' },
        { label: t('nav.gtoSimulator'), path: '/gto-simulator', icon: <Bot size={18} />, i18nKey: 'nav.gtoSimulator' },
        { label: t('nav.puzzle'), path: '/puzzle', icon: <Puzzle size={18} />, i18nKey: 'nav.puzzle' },
      ],
    },
    {
      title: t('nav.study'),
      i18nKey: 'nav.study',
      items: [
        { label: t('nav.academy'), path: '/academy', icon: <GraduationCap size={18} />, i18nKey: 'nav.academy', hint: t('academy.positioning') },
        { label: t('nav.theory'), path: '/theory', icon: <Library size={18} />, i18nKey: 'nav.theory', hint: t('theory.positioning') },
        { label: t('nav.handHistory'), path: '/hand-history', icon: <ClipboardList size={18} />, i18nKey: 'nav.handHistory' },
      ],
    },
    {
      title: t('nav.data'),
      i18nKey: 'nav.data',
      items: [
        { label: t('nav.progress'), path: '/progress', icon: <BarChart3 size={18} />, i18nKey: 'nav.progress' },
        { label: t('nav.leaderboard'), path: '/leaderboard', icon: <Trophy size={18} />, i18nKey: 'nav.leaderboard' },
      ],
    },
    {
      title: t('nav.settingsGroup'),
      i18nKey: 'nav.settingsGroup',
      items: [
        { label: t('nav.settings'), path: '/settings', icon: <Settings size={18} />, i18nKey: 'nav.settings' },
        { label: t('nav.help'), path: '/help', icon: <HelpCircle size={18} />, i18nKey: 'nav.help' },
      ],
    },
  ], [t]);

  // 置顶首页项（不归属任何分组，降低导航层级噪音）
  const dashboardItem: NavItem = {
    label: t('nav.dashboard'),
    path: '/',
    icon: <Home size={18} />,
    i18nKey: 'nav.dashboard',
  };

  const isPathActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const renderNavItem = (item: NavItem) => {
    const active = isPathActive(item.path);
    // R1: 不用函数式 className/children —— TooltipTrigger asChild 的 Radix Slot 会把函数 className 字符串化，导致激活态失效
    const link = (
      <NavLink
        to={item.path}
        aria-label={item.label}
        title={collapsed ? undefined : item.hint}
        className={cn(
          'flex items-center gap-3 px-3 h-9 rounded-[var(--radius-sm)] text-sm transition-all duration-150 relative',
          active
            ? 'text-[var(--brass-bright)] bg-[var(--brass-glow)] font-medium'
            : 'text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-light)]/40'
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[var(--brass)] rounded-r" />
        )}
        <span className="shrink-0">{item.icon}</span>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {/* 庄码 D（DESIGN_LANGUAGE §5.3）：展开态斜体 Fraunces；折叠态降级为黄铜小圆点避免与图标重叠 */}
        {active && !collapsed && (
          <span aria-hidden="true" className="absolute right-2 w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[var(--brass-bright)] to-[var(--brass)] flex items-center justify-center text-[10px] font-display font-bold italic text-[var(--primary-foreground)]">
            D
          </span>
        )}
        {active && collapsed && (
          <span aria-hidden="true" className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-[var(--brass)]" />
        )}
      </NavLink>
    );
    return (
      <li key={item.path}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : (
          link
        )}
      </li>
    );
  };

  const pageTitle: Record<string, string> = {
    '/': t('dashboard.title', '训练仪表盘'),
    '/academy': t('nav.academy'),
    '/academy/basics': t('nav.basics'),
    '/theory': t('nav.theory'),
    '/range-trainer': t('nav.rangeTrainer'),
    '/pot-odds': t('nav.potOdds'),
    '/gto-simulator': t('nav.gtoSimulator'),
    '/hand-history': t('nav.handHistory'),
    '/progress': t('nav.progress'),
    '/settings': t('nav.settings'),
    '/leaderboard': t('nav.leaderboard'),
    '/puzzle': t('nav.puzzle'),
    '/help': t('nav.help'),
  };

  // 子路由前缀兑底（带参数路由如 /academy/lesson/:id 回退到模块名，避免页名断档到 APP_NAME）
  const prefixTitles: [string, string][] = [
    ['/academy', t('nav.academy')],
    ['/theory', t('nav.theory')],
    ['/puzzle', t('nav.puzzle')],
    ['/progress', t('nav.progress')],
    ['/range-trainer', t('nav.rangeTrainer')],
    ['/pot-odds', t('nav.potOdds')],
    ['/gto-simulator', t('nav.gtoSimulator')],
    ['/hand-history', t('nav.handHistory')],
    ['/help', t('nav.help')],
  ];

  const currentPageTitle =
    pageTitle[location.pathname] ??
    prefixTitles.find(([prefix]) => location.pathname.startsWith(`${prefix}/`))?.[1] ??
    APP_NAME;

  const toggleLanguage = async () => {
    if (switching) return;
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    setSwitching(true);
    try {
      // 预加载目标语言资源后再切换，消除"先 fallback 后跳变"闪烁
      await switchLanguage(next);
      // 语言偏好事实源：progress store settings.language，顶栏切换同步写入以便跨刷新恢复
      useProgressStore.getState().updateSettings({ language: next });
    } finally {
      setSwitching(false);
    }
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
                  {t('nav.appSubtitle')}
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
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          <TooltipProvider delayDuration={200}>
            {/* 置顶首页 —— 无分组标签，保持导航层级扁平 */}
            <ul className="space-y-0.5">{renderNavItem(dashboardItem)}</ul>
            <div className={cn('hairline-brass mx-2', collapsed && 'opacity-40')} />
            {navGroups.map((group) => (
              <div key={group.i18nKey}>
                {!collapsed && (
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--ivory-dim)] px-3 mb-2 font-medium">
                    {group.title}
                  </p>
                )}
                <ul className="space-y-0.5">{group.items.map(renderNavItem)}</ul>
              </div>
            ))}
          </TooltipProvider>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-[var(--walnut-border)] px-4 py-3">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              {/* User avatar chip */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brass)] to-[var(--brass-deep)] flex items-center justify-center text-[11px] font-display font-bold text-[var(--primary-foreground)] shrink-0">
                {t('nav.playerDefault').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--ivory)] truncate">{t('nav.playerDefault')}</div>
                <div className="text-[10px] text-[var(--ivory-muted)] font-numeric">v{APP_VERSION}</div>
              </div>
              <button
                onClick={toggleLanguage}
                disabled={switching}
                className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-sm)] text-xs text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] hover:bg-[var(--walnut-light)] transition-colors disabled:opacity-50"
                aria-label={t('nav.toggleLanguage')}
              >
                <Globe size={14} className={cn('transition-transform', switching && 'animate-spin')} />
                <span className="font-numeric">{i18n.language === 'zh' ? 'EN' : '中'}</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={toggleLanguage}
                disabled={switching}
                className="flex items-center justify-center w-full py-1 text-[10px] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors disabled:opacity-50"
                aria-label={t('nav.toggleLanguage')}
              >
                <Globe size={14} className={cn('transition-transform', switching && 'animate-spin')} />
              </button>
              <p className="text-[10px] text-[var(--ivory-dim)] font-numeric">v{APP_VERSION}</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main content area — bottle-green felt */}
      <div className="flex flex-col flex-1 overflow-hidden felt-ambient">
        {/* Top bar — surface bg with walnut border below */}
        <header className="flex items-center h-12 md:h-16 px-4 md:px-6 border-b border-[var(--walnut-border)] bg-[var(--surface)] backdrop-blur-sm shrink-0 relative brass-rail">
          <p
            aria-hidden="true"
            className="font-display text-[17px] text-[var(--ivory)] flex-1 tracking-wide"
          >
            {currentPageTitle}
          </p>
          {currentStreak > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mr-2 rounded-md bg-[var(--brass-glow)] border border-[var(--brass-cell-1)]">
              <Flame className="w-4 h-4 text-[var(--brass)]" />
              <span className="text-sm font-semibold text-[var(--brass-bright)] font-numeric">{currentStreak}</span>
            </div>
          )}
          {/* Mobile language toggle */}
          <button
            onClick={toggleLanguage}
            disabled={switching}
            aria-label={t('nav.toggleLanguage')}
            className="md:hidden flex items-center justify-center gap-1 px-2 py-1 min-h-[44px] min-w-[44px] rounded-[var(--radius-sm)] text-xs text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors disabled:opacity-50"
          >
            <Globe size={14} className={cn('transition-transform', switching && 'animate-spin')} />
            <span className="font-numeric">{i18n.language === 'zh' ? 'EN' : '中'}</span>
          </button>
          {/* Mobile help button */}
          <button
            onClick={() => navigate('/help')}
            aria-label={t('nav.help')}
            className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-sm)] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors"
          >
            <HelpCircle size={16} />
          </button>
          {/* Desktop help button */}
          <button
            onClick={() => navigate('/help')}
            aria-label={t('nav.help')}
            className="hidden md:flex items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-sm)] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors"
          >
            <HelpCircle size={16} />
          </button>
        </header>

        <TableRail />

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
          {/* G1: 全局限宽——操作台/统计页随 main 收敛；阅读型页面正文由各模块 agent 单独 max-w-3xl */}
          <div className="mx-auto w-full max-w-[1400px] h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_TRANSITION}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-full"
            >
              <ErrorBoundary>
                <OnboardingGate>
                  <Outlet />
                </OnboardingGate>
              </ErrorBoundary>
            </motion.div>
          </AnimatePresence>
          </div>
        </main>
      </div>

      {/* P2-5.3: 全局 Tilt 提示 Dialog — 监听 emotion.consecutiveWrongCount */}
      <TiltWarning />

      {/* 里程碑庆典全局 Host — 监听 pendingMilestone */}
      <MilestoneCelebrationHost />

      {/* Mobile bottom navigation */}
      <MobileNav />
    </div>
  );
}
