import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { HELP_ARTICLES } from '../data/helpContent';
import type { HelpSection } from '../types';

/** 教程文章详情页 */
export default function HelpArticle() {
  const { articleId } = useParams<{ articleId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const article = HELP_ARTICLES.find((a) => a.id === articleId);

  if (!article) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--ivory-muted)]">{t('help.article.notFound')}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/help')}>
          <ArrowLeft size={14} className="mr-1" />
          {t('help.article.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 返回按钮 */}
      <button
        type="button"
        onClick={() => navigate('/help')}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--ivory-dim)] hover:text-[var(--brass-bright)] transition-colors min-h-[44px]"
      >
        <ArrowLeft size={16} />
        {t('help.article.back')}
      </button>

      {/* 标题 */}
      <h1 className="font-display text-xl text-[var(--ivory)] tracking-wide">
        {t(`help.${article.titleKey}`)}
      </h1>
      <p className="text-sm text-[var(--ivory-muted)]">
        {t(`help.${article.introKey}`)}
      </p>

      {/* 按 sections 渲染 */}
      <div className="space-y-5">
        {article.sections.map((section, idx) => (
          <SectionRenderer key={idx} section={section} />
        ))}
      </div>

      {/* 底部返回 */}
      <div className="pt-4 border-t border-[var(--walnut-border)]">
        <Button variant="outline" size="sm" onClick={() => navigate('/help')}>
          <ArrowLeft size={14} className="mr-1" />
          {t('help.article.back')}
        </Button>
      </div>
    </div>
  );
}

/** 段落渲染器 */
function SectionRenderer({ section }: { section: HelpSection }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  switch (section.type) {
    case 'paragraph':
      return (
        <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">
          {t(`help.${section.key}`)}
        </p>
      );

    case 'steps':
      return (
        <div>
          <p className="text-sm font-medium text-[var(--ivory)] mb-2">
            {t(`help.${section.key}`)}
          </p>
          <ol className="space-y-1.5 pl-1">
            {(section.stepKeys ?? []).map((stepKey, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--ivory-muted)]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brass)]/15 text-[10px] font-bold text-[var(--brass-bright)] mt-0.5">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{t(`help.${stepKey}`)}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case 'tip':
      return (
        <div className="border-l-2 border-[var(--brass)] pl-3 py-1">
          <p className="text-sm text-[var(--ivory-muted)] leading-relaxed italic">
            {t(`help.${section.key}`)}
          </p>
        </div>
      );

    case 'link':
      return (
        <div className="flex items-center gap-3">
          <p className="text-sm text-[var(--ivory-muted)] flex-1">
            {t(`help.${section.key}`)}
          </p>
          {section.to && (
            <Button variant="outline" size="sm" onClick={() => navigate(section.to!)}>
              {t('help.article.useModule')}
            </Button>
          )}
        </div>
      );

    default:
      return null;
  }
}
