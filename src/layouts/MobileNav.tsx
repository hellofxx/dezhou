/**
 * 移动端底部导航（<768px 取代侧边栏，DESIGN.md §5.7）
 *
 * 五格：路径 / 课程 / 训练 / 速训 / 进度（批次 3 冻结导航）。
 * 帮助与设置不在底栏：帮助走顶栏图标，设置走顶栏齿轮（见 HeaderQuickActions）。
 * 底栏项触摸目标 ≥44×44（DESIGN.md §5.7）。
 */

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { Home, BookOpen, Target, Zap, BarChart3 } from 'lucide-react';

/** 底栏项共用样式：图标 + 截断文字，44px 命中区；标签 11px（功能性微文字下限，DESIGN.md §3.3） */
const ITEM_CLASS =
  'flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] text-[11px] transition-colors';

interface MobileNavEntry {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function MobileNav() {
  const { t } = useTranslation();

  const entries: MobileNavEntry[] = [
    { label: t('nav.path'), path: '/', icon: <Home size={20} /> },
    { label: t('nav.course'), path: '/lesson', icon: <BookOpen size={20} /> },
    { label: t('nav.drill'), path: '/drill', icon: <Target size={20} /> },
    { label: t('nav.quick'), path: '/quick', icon: <Zap size={20} /> },
    { label: t('nav.progressCenter'), path: '/progress', icon: <BarChart3 size={20} /> },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 walnut-panel border-t border-[var(--walnut-border)] safe-area-bottom pb-[env(safe-area-inset-bottom,0px)]"
      aria-label={t('nav.mobileNavAria')}
    >
      <ul className="flex items-center justify-around h-14">
        {entries.map((entry) => (
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
        ))}
      </ul>
    </nav>
  );
}
