/**
 * 顶栏快捷入口（设置 / 帮助）
 *
 * @module layouts/HeaderQuickActions
 * @description 批次 3 起设置从侧栏与底栏移出，顶栏齿轮成为全端唯一设置入口；
 * 帮助在窄屏（<768px）保留顶栏图标，宽屏由侧栏「帮助」项承接。
 * 图标按钮统一 44×44 命中区（DESIGN.md §5.7 / §5.11）。
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Settings } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/** 图标入口共用样式：44px 命中区，颜色随 token（不写 display，避免与可见性类冲突） */
const ACTION_CLASS =
  'items-center justify-center min-h-[44px] min-w-[44px] rounded-[var(--radius-sm)] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors';

type Visibility = 'always' | 'mobile';

interface HeaderAction {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  /** 可见性面：全端（设置齿轮）或仅移动端（帮助，宽屏由侧栏承接） */
  visibility: Visibility;
}

const VISIBILITY_CLASS: Record<Visibility, string> = {
  always: 'flex',
  mobile: 'flex md:hidden',
};

export default function HeaderQuickActions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const actions: HeaderAction[] = [
    { key: 'settings', label: t('nav.settings'), path: '/settings', icon: <Settings size={16} />, visibility: 'always' },
    { key: 'help', label: t('nav.help'), path: '/help', icon: <HelpCircle size={16} />, visibility: 'mobile' },
  ];

  return (
    <>
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => navigate(action.path)}
          aria-label={action.label}
          className={cn(ACTION_CLASS, VISIBILITY_CLASS[action.visibility])}
        >
          {action.icon}
        </button>
      ))}
    </>
  );
}
