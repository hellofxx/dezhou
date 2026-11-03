/**
 * 移动端底部导航（<768px 取代侧边栏，DESIGN.md §5.7）
 *
 * 六项：首页 / 训练 / 学院 / 理论 / 题库 / 进度。
 * 「训练」是 Sheet 触发器（aria-haspopup="dialog"），四个训练入口收敛到
 * MobileQuickNavSheet；设置移到顶栏齿轮（见 AppLayout），不再占底栏一格。
 * 底栏项触摸目标 ≥44×44（DESIGN.md §5.7）。
 */

import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { Home, Target, GraduationCap, Library, Puzzle, BarChart3 } from 'lucide-react';
import MobileQuickNavSheet from './MobileQuickNavSheet';

/** 「训练」按钮高亮判据：当前路径属于四个训练入口（含子路由） */
const TRAINING_PREFIXES = ['/range-trainer', '/pot-odds', '/gto-simulator', '/hand-history'];

/** 底栏项共用样式：图标 + 截断文字，44px 命中区 */
const ITEM_CLASS =
  'flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] text-[10px] transition-colors';

type MobileNavEntry =
  | { kind: 'link'; label: string; path: string; icon: React.ReactNode }
  | { kind: 'training'; label: string; icon: React.ReactNode };

export default function MobileNav() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [quickNavOpen, setQuickNavOpen] = useState(false);

  const trainingActive = TRAINING_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const entries: MobileNavEntry[] = [
    { kind: 'link', label: t('nav.dashboard'), path: '/', icon: <Home size={20} /> },
    { kind: 'training', label: t('nav.training'), icon: <Target size={20} /> },
    { kind: 'link', label: t('nav.academy'), path: '/academy', icon: <GraduationCap size={20} /> },
    { kind: 'link', label: t('nav.theory'), path: '/theory', icon: <Library size={20} /> },
    { kind: 'link', label: t('nav.puzzle'), path: '/puzzle', icon: <Puzzle size={20} /> },
    { kind: 'link', label: t('nav.progress'), path: '/progress', icon: <BarChart3 size={20} /> },
  ];

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 walnut-panel border-t border-[var(--walnut-border)] safe-area-bottom pb-[env(safe-area-inset-bottom,0px)]"
        aria-label={t('nav.mobileNavAria')}
      >
        <ul className="flex items-center justify-around h-14">
          {entries.map((entry) =>
            entry.kind === 'training' ? (
              <li key="training">
                <button
                  type="button"
                  onClick={() => setQuickNavOpen(true)}
                  aria-label={entry.label}
                  aria-haspopup="dialog"
                  aria-expanded={quickNavOpen}
                  className={cn(
                    ITEM_CLASS,
                    trainingActive ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory-dim)]',
                  )}
                >
                  {entry.icon}
                  <span className="truncate max-w-[48px]">{entry.label}</span>
                </button>
              </li>
            ) : (
              <li key={entry.path}>
                <NavLink
                  to={entry.path}
                  end={entry.path === '/'}
                  aria-label={entry.label}
                  className={({ isActive }) =>
                    cn(ITEM_CLASS, isActive ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory-dim)]')
                  }
                >
                  {entry.icon}
                  <span className="truncate max-w-[48px]">{entry.label}</span>
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>
      <MobileQuickNavSheet open={quickNavOpen} onOpenChange={setQuickNavOpen} />
    </>
  );
}
