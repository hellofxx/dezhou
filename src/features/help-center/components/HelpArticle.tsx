import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, FileQuestion } from 'lucide-react';
import { BackLink } from '@/shared/components/layout/BackLink';
import { Button } from '@/shared/components/ui/button';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { HELP_ARTICLES } from '../data/helpContent';
import type { HelpSection } from '../types';

export default function HelpArticle() {
  const { articleId } = useParams<{ articleId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const articleIndex = HELP_ARTICLES.findIndex((item) => item.id === articleId);
  const article = HELP_ARTICLES[articleIndex];

  if (!article) {
    return (
      <EmptyState
        icon={<FileQuestion size={28} aria-hidden="true" />}
        title={t('help.article.notFound')}
        description={t('help.article.notFoundHint')}
        action={{ label: t('help.article.back'), onClick: () => navigate('/help') }}
      />
    );
  }

  const previousArticle = HELP_ARTICLES[articleIndex - 1];
  const nextArticle = HELP_ARTICLES[articleIndex + 1];

  return (
    <article className="help-article-shell max-w-3xl mx-auto" aria-labelledby="help-article-title">
      <header className="space-y-3">
        <BackLink to="/help" label={t('help.article.back')} size="md" />
        <h2 id="help-article-title" className="help-article-title font-display text-2xl text-[var(--ivory)] tracking-wide">
          {t(`help.${article.titleKey}`)}
        </h2>
        <p className="help-article-intro text-sm text-[var(--ivory-muted)] leading-relaxed">
          {t(`help.${article.introKey}`)}
        </p>
      </header>

      <div className="help-article-content space-y-5">
        {article.sections.map((section, index) => (
          <SectionRenderer key={`${section.type}-${section.key}-${index}`} section={section} />
        ))}
      </div>

      <nav className="help-article-nav" aria-label={t('help.article.relatedTitle')}>
        {previousArticle ? (
          <Button asChild variant="outline" size="sm" className="help-article-nav-link justify-start">
            <Link
              to={`/help/article/${previousArticle.id}`}
              title={t(`help.${previousArticle.titleKey}`)}
              aria-label={t('help.article.previousNamed', { title: t(`help.${previousArticle.titleKey}`) })}
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span className="min-w-0">
                <span className="help-article-nav-label">{t('help.article.previous')}</span>
                <span className="help-article-nav-title">{t(`help.${previousArticle.titleKey}`)}</span>
              </span>
            </Link>
          </Button>
        ) : <span />}
        {nextArticle ? (
          <Button asChild variant="outline" size="sm" className="help-article-nav-link justify-end text-right">
            <Link
              to={`/help/article/${nextArticle.id}`}
              title={t(`help.${nextArticle.titleKey}`)}
              aria-label={t('help.article.nextNamed', { title: t(`help.${nextArticle.titleKey}`) })}
            >
              <span className="min-w-0">
                <span className="help-article-nav-label">{t('help.article.next')}</span>
                <span className="help-article-nav-title">{t(`help.${nextArticle.titleKey}`)}</span>
              </span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </nav>
    </article>
  );
}

function SectionRenderer({ section }: { section: HelpSection }) {
  const { t } = useTranslation();

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
            {(section.stepKeys ?? []).map((stepKey, index) => (
              <li key={stepKey} className="flex items-start gap-2 text-sm text-[var(--ivory-muted)]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--brass)]/15 text-[10px] font-bold text-[var(--brass-bright)] mt-0.5" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="leading-relaxed">{t(`help.${stepKey}`)}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case 'tip':
      return (
        <div role="note" className="border-l-2 border-[var(--brass)] pl-3 py-1">
          <p className="text-sm text-[var(--ivory-muted)] leading-relaxed">
            {t(`help.${section.key}`)}
          </p>
        </div>
      );

    case 'link': {
      const to = section.to;
      return (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-[var(--ivory-muted)] flex-1 min-w-0">
            {t(`help.${section.key}`)}
          </p>
          {to ? (
            <Button variant="outline" size="sm" asChild>
              <Link to={to}>{t('help.article.useModule')}</Link>
            </Button>
          ) : null}
        </div>
      );
    }

    default:
      return null;
  }
}
