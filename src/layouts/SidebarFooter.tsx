import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { APP_VERSION, APP_BUILD_TIME, formatBuildTime } from '@/shared/constants/app';

interface SidebarFooterProps {
  collapsed: boolean;
  switching: boolean;
  onToggleLanguage: () => void;
}

/**
 * 侧边栏底部：玩家信息 + 语言切换 + 版本行。
 * 版本行展示语义版本（部署自动递增）与构建更新时间（测试环境为空串 → 仅显示版本）。
 */
export default function SidebarFooter({
  collapsed,
  switching,
  onToggleLanguage,
}: SidebarFooterProps) {
  const { t, i18n } = useTranslation();
  const updatedAt = formatBuildTime(APP_BUILD_TIME, i18n.language);

  return (
    <div className="border-t border-[var(--walnut-border)] px-4 py-3">
      {!collapsed ? (
        <>
          <div className="flex items-center gap-3">
            {/* User avatar chip */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--brass)] to-[var(--brass-deep)] flex items-center justify-center text-[11px] font-display font-bold text-[var(--primary-foreground)] shrink-0">
              {t('nav.playerDefault').charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[var(--ivory)] truncate">{t('nav.playerDefault')}</div>
            </div>
            <button
              onClick={onToggleLanguage}
              disabled={switching}
              className="flex items-center gap-1 min-h-11 min-w-11 px-3 py-1 rounded-[var(--radius-sm)] text-xs text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] hover:bg-[var(--walnut-light)] transition-colors disabled:opacity-50"
              aria-label={t('nav.toggleLanguage')}
            >
              <Globe size={14} className={cn('transition-transform', switching && 'animate-spin')} />
              <span className="font-numeric">{i18n.language === 'zh' ? 'EN' : '中'}</span>
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[10px] text-[var(--ivory-muted)] font-numeric">
            <span>v{APP_VERSION}</span>
            {updatedAt && (
              <>
                <span aria-hidden="true" className="h-2.5 w-px bg-[var(--walnut-border)]" />
                <span>{t('nav.updatedAt', { time: updatedAt })}</span>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="text-center">
          <button
            onClick={onToggleLanguage}
            disabled={switching}
            className="flex items-center justify-center w-full min-h-11 min-w-11 py-1 text-[10px] text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors disabled:opacity-50"
            aria-label={t('nav.toggleLanguage')}
          >
            <Globe size={14} className={cn('transition-transform', switching && 'animate-spin')} />
          </button>
          <p
            className="text-[10px] text-[var(--ivory-dim)] font-numeric"
            title={updatedAt ? t('nav.updatedAt', { time: updatedAt }) : undefined}
          >
            v{APP_VERSION}
          </p>
        </div>
      )}
    </div>
  );
}
