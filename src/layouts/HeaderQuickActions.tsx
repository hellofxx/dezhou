/**
 * 顶栏快捷入口（设置 / 帮助）
 *
 * @module layouts/HeaderQuickActions
 * @description 移动端（<768px）设置齿轮 + 帮助，桌面端帮助（设置常驻侧边栏，不重复出现在顶栏）。
 * 设置从底部导航移出后由这里的齿轮承接。图标按钮统一 44×44 命中区（DESIGN.md §5.7 / §5.11）。
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Settings } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/** 图标入口共用样式：44px 命中区，颜色随 token（不写 display，避免与可见性类冲突） */
const ACTION_CLASS =
  'items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-sm)] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors';

interface HeaderAction {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  /** 可见性面：移动端与桌面端各一个 */
  visibility: 'mobile' | 'desktop';
}

export default function HeaderQuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions: HeaderAction[] = [
    { key: 'settings', label: t('nav.settings'), path: '/settings', icon: <Settings size={16} />, visibility: 'mobile' },
    { key: 'help-mobile', label: t('nav.help'), path: '/help', icon: <HelpCircle size={16} />, visibility: 'mobile' },
    { key: 'help-desktop', label: t('nav.help'), path: '/help', icon: <HelpCircle size={16} />, visibility: 'desktop' },
  ];

  return (
    <>
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => navigate(action.path)}
          aria-label={action.label}
          className={cn(
            ACTION_CLASS,
            action.visibility === 'mobile' ? 'flex md:hidden' : 'hidden md:flex',
          )}
        >
          {action.icon}
        </button>
      ))}
    </>
  );
}
