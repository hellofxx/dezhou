import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ArrowRight, Compass } from 'lucide-react';

/**
 * FirstVisitBanner — 首次访问引导横幅。
 *
 * 仅在 `summary.totalSessions === 0` 时由 Dashboard 渲染，
 * 置于 Hero 下方首屏可见位置，引导新用户从基础入门开始学习。
 *
 * 桌面：左图标 + 中文案 + 右双 CTA（主"开始基础入门" / 次"浏览全部课程"）
 * 移动：纵向堆叠，图标在上、按钮在下。
 */
export default function FirstVisitBanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="panel p-5 mb-5 overflow-hidden first-visit-banner">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* 图标区 */}
        <div className="first-visit-banner-icon shrink-0 w-12 h-12 rounded-full flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-[var(--brass-bright)]" />
        </div>

        {/* 文案 */}
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h3 className="font-display text-base sm:text-lg text-[var(--ivory)] tracking-wide">
            {t('progress.firstVisit.title')}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--ivory-muted)] mt-1 leading-relaxed">
            {t('progress.firstVisit.description')}
          </p>
        </div>

        {/* 按钮组 */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => navigate('/academy/basics')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-[var(--brass-bright)] text-[var(--primary-fg)] font-semibold text-sm hover:brightness-110 transition-all shadow-[var(--shadow-brass)] inline-flex items-center justify-center gap-1.5"
          >
            {t('progress.firstVisit.primaryCta')}
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/academy')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-md border border-[var(--walnut-border)] text-[var(--ivory-muted)] text-sm hover:text-[var(--ivory)] hover:border-[var(--brass)]/40 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            {t('progress.firstVisit.secondaryCta')}
          </button>
        </div>
      </div>
    </div>
  );
}