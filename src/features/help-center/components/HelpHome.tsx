import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Zap, BookOpen, Layers, MessageCircle, SearchX } from 'lucide-react';
import { HELP_ARTICLES, CONCEPT_CARDS, FAQ_ITEMS, QUICK_START_STEPS } from '../data/helpContent';
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
  const [pendingAnchor, setPendingAnchor] = useState<HelpHeroAnchor | null>(null);

  const quickStartRef = useRef<HTMLElement>(null);
  const articlesRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  // 检索语料只在语言切换时重建，按键仅过滤预建文本
  const articleCorpus = useMemo(
    () => HELP_ARTICLES.map((article) => ({
      article,
      text: [
        t(`help.${article.titleKey}`),
        t(`help.${article.introKey}`),
        ...article.sections.flatMap((section) => [
          t(`help.${section.key}`),
          ...(section.stepKeys ?? []).map((stepKey) => t(`help.${stepKey}`)),
        ]),
      ].join(' '),
    })),
    [t],
  );

  const conceptCorpus = useMemo(
    () => CONCEPT_CARDS.map((card) => ({
      card,
      text: [t(`help.${card.key}.title`), t(`help.${card.key}.body`)].join(' '),
    })),
    [t],
  );

  const faqCorpus = useMemo(
    () => FAQ_ITEMS.map((item) => ({
      item,
      text: [t(`help.${item.questionKey}`), t(`help.${item.answerKey}`)].join(' '),
    })),
    [t],
  );

  const stepCorpus = useMemo(
    () => QUICK_START_STEPS.map((step) => ({ step, text: t(`help.${step.key}`) })),
    [t],
  );

  const filteredArticles = useMemo(
    () => filterHelpItems(articleCorpus, query, (entry) => entry.text).map((entry) => entry.article),
    [articleCorpus, query],
  );

  const filteredConcepts = useMemo(
    () => filterHelpItems(conceptCorpus, query, (entry) => entry.text).map((entry) => entry.card),
    [conceptCorpus, query],
  );

  const filteredFaq = useMemo(
    () => filterHelpItems(faqCorpus, query, (entry) => entry.text).map((entry) => entry.item),
    [faqCorpus, query],
  );

  const filteredSteps = useMemo(
    () => filterHelpItems(stepCorpus, query, (entry) => entry.text).map((entry) => entry.step),
    [stepCorpus, query],
  );

  const hasQuery = normalizeHelpQuery(query).length > 0;
  const matchCount = filteredSteps.length + filteredArticles.length + filteredConcepts.length + filteredFaq.length;

  const focusAnchor = useCallback((anchor: HelpHeroAnchor) => {
    const target = { quickstart: quickStartRef, articles: articlesRef, faq: faqRef }[anchor].current;
    if (!target) return false;
    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    target.focus({ preventScroll: true });
    return true;
  }, [prefersReducedMotion]);

  const handleRuleClick = (anchor: HelpHeroAnchor) => {
    if (focusAnchor(anchor)) return;
    // 检索态下目标 section 已卸载：先退出检索，待重新挂载后再滚动聚焦
    setQuery('');
    setPendingAnchor(anchor);
  };

  useEffect(() => {
    if (!pendingAnchor) return;
    focusAnchor(pendingAnchor);
    setPendingAnchor(null);
  }, [focusAnchor, pendingAnchor]);

  return (
    <div className="space-y-7">
      <HelpHero onRuleClick={handleRuleClick} />
      <HelpSearch query={query} onQueryChange={setQuery} />

      <p className="help-search-status" role="status" aria-live="polite">
        {hasQuery ? t('help.search.summary', { count: matchCount }) : null}
      </p>

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

        {(!hasQuery || filteredSteps.length > 0) ? (
          <section ref={quickStartRef} className="panel help-anchor" id="help-quickstart" tabIndex={-1} aria-labelledby="help-quickstart-title">
            <SectionHead
              id="help-quickstart-title"
              icon={<Zap size={15} aria-hidden="true" />}
              title={t('help.quickStart.title')}
              subtitle={t('help.quickStart.subtitle')}
              count={hasQuery ? `${filteredSteps.length}/${QUICK_START_STEPS.length}` : undefined}
            />
            <QuickStartPath steps={filteredSteps} />
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
          <section className="help-anchor" id="help-concepts" tabIndex={-1} aria-labelledby="help-concepts-title">
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
