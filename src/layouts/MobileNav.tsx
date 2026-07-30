import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import {
  Home,
  Library,
  BarChart3,
  Settings,
  Puzzle,
  GraduationCap,
} from 'lucide-react';

interface MobileNavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export default function MobileNav() {
  const { t } = useTranslation();

  const items: MobileNavItem[] = [
    { label: t('nav.dashboard'), path: '/', icon: <Home size={20} /> },
    { label: t('nav.academy'), path: '/academy', icon: <GraduationCap size={20} /> },
    { label: t('nav.theory'), path: '/theory', icon: <Library size={20} /> },
    { label: t('nav.puzzle'), path: '/puzzle', icon: <Puzzle size={20} /> },
    { label: t('nav.progress'), path: '/progress', icon: <BarChart3 size={20} /> },
    { label: t('nav.settings'), path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 walnut-panel border-t border-[var(--walnut-border)] safe-area-bottom pb-[env(safe-area-inset-bottom,0px)]">
      <ul className="flex items-center justify-around h-14">
        {items.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 px-2 py-1 min-h-[44px] min-w-[44px] text-[10px] transition-colors',
                  isActive
                    ? 'text-[var(--brass-bright)]'
                    : 'text-[var(--ivory-dim)]'
                )
              }
            >
              {item.icon}
              <span className="truncate max-w-[48px]">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
