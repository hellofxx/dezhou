import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
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
import type { HelpArticle } from '../types';

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

interface Props {
  article: HelpArticle;
}

/** 模块入口卡片 — 复用 globals.css module-card / module-icon 类（强调色走 data-accent 变体） */
export default function ModuleEntryCard({ article }: Props) {
  const { t } = useTranslation();
  const Icon = ICON_MAP[article.icon];

  return (
    <Link
      to={`/help/article/${article.id}`}
      className="module-card w-full text-left min-h-[44px]"
    >
      <span className="module-icon" data-accent={article.accent}>
        <Icon size={20} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-[var(--ivory)] truncate">
          {t(`help.${article.titleKey}`)}
        </span>
        <span className="block text-xs text-[var(--ivory-muted)] truncate mt-0.5">
          {t(`help.${article.introKey}`)}
        </span>
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />
    </Link>
  );
}
