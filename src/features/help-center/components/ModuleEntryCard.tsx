import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Calculator,
  Gamepad2,
  GraduationCap,
  Library,
  Puzzle,
  ClipboardList,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import type { HelpArticle, HelpAccent } from '../types';

const ICON_MAP: Record<HelpArticle['icon'], React.ComponentType<{ size?: number; className?: string }>> = {
  'target': Target,
  'calculator': Calculator,
  'gamepad2': Gamepad2,
  'graduation-cap': GraduationCap,
  'library': Library,
  'puzzle': Puzzle,
  'clipboard-list': ClipboardList,
  'bar-chart3': BarChart3,
  'book-open': BookOpen,
};

const ACCENT_TOKEN: Record<HelpAccent, string> = {
  brass: 'var(--brass-bright)',
  info: 'var(--poker-info)',
  success: 'var(--poker-success)',
  frost: 'var(--poker-frost)',
  leather: 'var(--poker-leather)',
};

interface Props {
  article: HelpArticle;
}

/** 模块入口卡片 — 复用 globals.css module-card / module-icon 类 */
export default function ModuleEntryCard({ article }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const Icon = ICON_MAP[article.icon];
  const accentColor = ACCENT_TOKEN[article.accent];

  return (
    <button
      type="button"
      onClick={() => navigate(`/help/article/${article.id}`)}
      className="module-card w-full text-left cursor-pointer min-h-[44px]"
    >
      <span
        className="module-icon"
        style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)`, color: accentColor }}
      >
        <Icon size={20} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-[var(--ivory)] truncate">
          {t(`help.${article.titleKey}`)}
        </span>
        <span className="block text-xs text-[var(--ivory-muted)] truncate mt-0.5">
          {t(`help.${article.introKey}`)}
        </span>
      </span>
    </button>
  );
}
