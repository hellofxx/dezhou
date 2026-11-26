import { useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Zap, BookOpen, Layers, MessageCircle, SearchX } from 'lucide-react';
import { HELP_ARTICLES, CONCEPT_CARDS, FAQ_ITEMS } from '../data/helpContent';
import { filterHelpItems, normalizeHelpQuery } from '../utils/helpSearch';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import HelpHero, { type HelpHeroAnchor } from './HelpHero';
import HelpSearch from './HelpSearch';
import QuickStartPath from './QuickStartPath';
import ModuleEntryCard from './ModuleEntryCard';
import FaqAccordion from './FaqAccordion';
import ConceptCard from './ConceptCard';

export default function HelpHome() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [query, setQuery] = useState('');

  const quickStartRef = useRef<HTMLElement>(null);
  const articlesRef = useRef<HTMLElement>(null);
  const conceptsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  const anchorMap: Record<HelpHeroAnchor, RefObject<HTMLElement | null>> = {
    quickstart: quickStartRef,
    articles: articlesRef,
    faq: faqRef,
  };

  const filteredArticles = useMemo(() => filterHelpItems(HELP_ARTICLES, query, (article) => [
    t(`help.${article.titleKey}`),
    t(`help.${article.introKey}`),
    ...article.sections.flatMap((section) => [
      t(`help.${section.key}`),
      ...(section.stepKeys ?? []).map((stepKey) => t(`help.${stepKey}`)),
    ]),
  ].join(' ')), [query, t]);

  const filteredConcepts = useMemo(() => filterHelpItems(CONCEPT_CARDS, query, (card) => [
    t(`help.${card.key}.title`),
    t(`help.${card.key}.body`),
  ].join(' ')), [query, t]);

  const filteredFaq = useMemo(() => filterHelpItems(FAQ_ITEMS, query, (item) => [
    t(`help.${item.questionKey}`),
    t(`help.${item.answerKey}`),
  ].join(' ')), [query, t]);

  const hasQuery = normalizeHelpQuery(query).length > 0;
  const matchCount = filteredArticles.length + filteredConcepts.length + filteredFaq.length;

  const handleRuleClick = (anchor: HelpHeroAnchor) => {
    const target = anchorMap[anchor].current;
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    target.focus({ preventScroll: true });
  };

  return (
    <div className="space-y-7">
      <HelpHero onRuleClick={handleRuleClick} />
      <HelpSearch query={query} onQueryChange={setQuery} />

      {hasQuery ? (
        <p className="help-search-status" role="status" aria-live="polite">
          {t('help.search.summary', { count: matchCount })}
        </p>
      ) : null}

      <div id="help-results" className="space-y-7">
        {hasQuery && matchCount === 0 ? (
          <EmptyState
            icon={<SearchX size={26} aria-hidden="true" />}
            title={t('help.search.noResultsTitle')}
            description={t('help.search.noResultsDescription')}
            action={{ label: t('help.search.clear'), onClick: () => setQuery('') }}
            compact
          />
        ) : null}

        {!hasQuery ? (
          <section ref={quickStartRef} className="panel help-anchor" id="help-quickstart" tabIndex={-1} aria-labelledby="help-quickstart-title">
            <SectionHead
              id="help-quickstart-title"
              icon={<Zap size={15} aria-hidden="true" />}
              title={t('help.quickStart.title')}
              subtitle={t('help.quickStart.subtitle')}
            />
            <QuickStartPath />
          </section>
        ) : null}

        {(!hasQuery || filteredArticles.length > 0) ? (
          <section ref={articlesRef} className="help-anchor" id="help-articles" tabIndex={-1} aria-labelledby="help-articles-title">
            <SectionHead
              id="help-articles-title"
              icon={<BookOpen size={15} aria-hidden="true" />}
              title={t('help.articles.title')}
              subtitle={t('help.articles.subtitle')}
              count={hasQuery ? `${filteredArticles.length}/${HELP_ARTICLES.length}` : undefined}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredArticles.map((article) => (
                <ModuleEntryCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ) : null}

        {(!hasQuery || filteredConcepts.length > 0) ? (
          <section ref={conceptsRef} className="help-anchor" id="help-concepts" tabIndex={-1} aria-labelledby="help-concepts-title">
            <SectionHead
              id="help-concepts-title"
              icon={<Layers size={15} aria-hidden="true" />}
              title={t('help.concepts.title')}
              subtitle={t('help.concepts.subtitle')}
              count={hasQuery ? `${filteredConcepts.length}/${CONCEPT_CARDS.length}` : undefined}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredConcepts.map((card) => (
                <ConceptCard key={card.key} cardKey={card.key} iconKey={card.iconKey} />
              ))}
            </div>
          </section>
        ) : null}

        {(!hasQuery || filteredFaq.length > 0) ? (
          <section ref={faqRef} className="help-anchor" id="help-faq" tabIndex={-1} aria-labelledby="help-faq-title">
            <SectionHead
              id="help-faq-title"
              icon={<MessageCircle size={15} aria-hidden="true" />}
              title={t('help.faq.title')}
              subtitle={t('help.faq.subtitle')}
              count={hasQuery ? `${filteredFaq.length}/${FAQ_ITEMS.length}` : undefined}
            />
            <FaqAccordion items={filteredFaq} />
          </section>
        ) : null}
      </div>
    </div>
  );
}

interface SectionHeadProps {
  id: string;
  icon: ReactNode;
  title: string;
  subtitle?: string;
  count?: string;
}

function SectionHead({ id, icon, title, subtitle, count }: SectionHeadProps) {
  return (
    <header className="help-section-head">
      <span className="help-section-head-icon" aria-hidden="true">
        {icon}
      </span>
      <h2 id={id} className="help-section-head-title">{title}</h2>
      {count ? <span className="help-section-count font-numeric">{count}</span> : null}
      {subtitle ? <span className="help-section-head-sub">{subtitle}</span> : null}
    </header>
  );
}
