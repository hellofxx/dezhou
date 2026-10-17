import { useState, useMemo } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { PAGE_TRANSITION } from '@/shared/utils/motion';
import { APP_VERSION } from '@/shared/constants/app';
import { switchLanguage } from '@/i18n/preload';
import { ErrorBoundary } from '@/shared/components/business/ErrorBoundary';
import OnboardingGate from '@/features/progress/components/gate/OnboardingGate';
// P2-5.3: 全局 Tilt 提示组件（监听连续答错数）
import TiltWarning from '@/features/progress/components/gate/TiltWarning';
import MilestoneCelebrationHost from '@/features/progress/components/celebration/MilestoneCelebrationHost';
import PersistErrorNotice from '@/features/progress/components/PersistErrorNotice';
import MobileNav from './MobileNav';
import { useThemeApplier } from './useThemeApplier';
import { useDocumentTitle } from './useDocumentTitle';
import { resolveNavSection, resolvePageTitle } from './navSections';
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
  /** 分组序号（01–04）：分组位置的固定标识，不随语言变化 */
  index: string;
  title: string;
  i18nKey: string;
  items: NavItem[];
}

// 内容宽度分级 L2（DESIGN.md §6.5）：策略学院概览/课程地图视图展宽，
// 消除超宽屏 felt 留白；阅读/作答视图（/academy/lesson、/quick-drill 等）保持 L3 收敛，由模块内部自行限宽
const LAB_OVERVIEW_WIDE_ROUTES = ['/academy', '/academy/tracks', '/academy/concept-graph'];

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
  // 其余按 训练 / 研习 / 数据 / 设置 四组；图标统一 18px 线性风格（DESIGN.md §7）
  const navGroups = useMemo<NavGroup[]>(() => [
    {
      index: '01',
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
      index: '02',
      title: t('nav.study'),
      i18nKey: 'nav.study',
      items: [
        { label: t('nav.academy'), path: '/academy', icon: <GraduationCap size={18} />, i18nKey: 'nav.academy', hint: t('academy.positioning') },
        { label: t('nav.theory'), path: '/theory', icon: <Library size={18} />, i18nKey: 'nav.theory', hint: t('theory.positioning') },
        { label: t('nav.handHistory'), path: '/hand-history', icon: <ClipboardList size={18} />, i18nKey: 'nav.handHistory' },
      ],
    },
    {
      index: '03',
      title: t('nav.data'),
      i18nKey: 'nav.data',
      items: [
        { label: t('nav.progress'), path: '/progress', icon: <BarChart3 size={18} />, i18nKey: 'nav.progress' },
        { label: t('nav.leaderboard'), path: '/leaderboard', icon: <Trophy size={18} />, i18nKey: 'nav.leaderboard' },
      ],
    },
    {
      index: '04',
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

  const currentPageTitle = resolvePageTitle(location.pathname, t);
  const section = resolveNavSection(location.pathname, t);
  useDocumentTitle(currentPageTitle);

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
        end={item.path === '/'}
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
        {/* 庄码 D（DESIGN.md §5.3）：展开态斜体 Fraunces；折叠态降级为黄铜小圆点避免与图标重叠 */}
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
      {/* 跳过导航直达主内容（键盘用户首个可聚焦元素） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[200] focus:rounded-[var(--radius-sm)] focus:bg-[var(--brass)] focus:px-4 focus:py-2 focus:text-[var(--primary-foreground)] focus:font-semibold"
      >
        {t('common.a11y.skipToContent')}
      </a>
      <PersistErrorNotice />
      {/* Sidebar — deep walnut card-room rail. Hidden on mobile. */}
      <aside
        className={cn(
          'hidden md:flex flex-col walnut-panel border-r border-[var(--walnut-border)] transition-all duration-300 shrink-0',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Sidebar header — brass hairline below，高度与顶栏胡桃梁对齐 */}
        <div className="flex items-center h-16 px-4 border-b border-[var(--walnut-border)] relative brass-rail">
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
              'flex items-center justify-center h-11 w-11 rounded-[var(--radius-sm)] hover:bg-[var(--walnut-light)] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors',
              collapsed && 'mx-auto'
            )}
            aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            <ChevronLeft size={16} className={cn('transition-transform duration-300', collapsed && 'rotate-180')} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6" aria-label={t('nav.sidebarNavAria')}>
          <TooltipProvider delayDuration={200}>
            {/* 置顶首页 —— 无分组标签，保持导航层级扁平 */}
            <ul className="space-y-0.5">{renderNavItem(dashboardItem)}</ul>
            <div className={cn('hairline-brass mx-2', collapsed && 'opacity-40')} />
            {navGroups.map((group) => (
              <div key={group.i18nKey}>
                {collapsed ? (
                  <p aria-hidden="true" className="text-center font-numeric text-[9px] text-[var(--brass)] mb-2">
                    {group.index}
                  </p>
                ) : (
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--ivory-dim)] px-3 mb-2 font-medium">
                    <span className="font-numeric text-[var(--brass)] mr-2">{group.index}</span>
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
                className="flex items-center gap-1 min-h-11 min-w-11 px-3 py-1 rounded-[var(--radius-sm)] text-xs text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] hover:bg-[var(--walnut-light)] transition-colors disabled:opacity-50"
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
                className="flex items-center justify-center w-full min-h-11 min-w-11 py-1 text-[10px] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors disabled:opacity-50"
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
        {/* Top bar — 胡桃梁：与侧边栏构成包住绿呢画布的 L 形木框（DESIGN.md §5.7） */}
        <header className="flex items-center h-12 md:h-16 px-4 md:px-6 border-b border-[var(--walnut-border)] walnut-panel shrink-0 relative brass-rail">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="font-numeric text-[9px] uppercase tracking-[0.28em] text-[var(--brass)]">{section.index}</span>
            <span aria-hidden="true" className="h-px w-6 bg-[var(--brass-deep)]/60" />
            <span className="hidden sm:inline font-numeric text-[9px] uppercase tracking-[0.28em] text-[var(--brass)]">
              {section.label}
            </span>
            <h1 className="font-display text-[19px] md:text-[22px] text-[var(--ivory)] tracking-wide truncate">
              {currentPageTitle}
            </h1>
          </div>
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

        {/* 路由播报：SPA 切换后向读屏器播报当前页名 */}
        <div role="status" aria-live="polite" className="sr-only">{currentPageTitle}</div>

        <TableRail />

        {/* Page content */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 outline-none"
        >
          {/* G1: 全局限宽——操作台/统计页随 main 收敛（L1 1400）；策略学院概览视图走 L2 展宽 1680（DESIGN.md §6.5）；阅读型页面正文由各模块 agent 单独 max-w-prose */}
          <div
            className={cn(
              'mx-auto w-full h-full',
              LAB_OVERVIEW_WIDE_ROUTES.includes(location.pathname) ? 'max-w-[1680px]' : 'max-w-[1400px]'
            )}
          >
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
