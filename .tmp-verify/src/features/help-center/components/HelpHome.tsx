import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, BookOpen, Layers, MessageCircle } from 'lucide-react';
import { HELP_ARTICLES, CONCEPT_CARDS } from '../data/helpContent';
import HelpHero, { type HelpHeroAnchor } from './HelpHero';
import QuickStartPath from './QuickStartPath';
import ModuleEntryCard from './ModuleEntryCard';
import FaqAccordion from './FaqAccordion';
import ConceptCard from './ConceptCard';

/** 帮助中心首页 — Hero（House Rules 立牌）+ 4 个锚点 section */
export default function HelpHome() {
  const { t } = useTranslation();

  const quickStartRef = useRef<HTMLElement>(null);
  const articlesRef = useRef<HTMLElement>(null);
  const conceptsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);

  const anchorMap: Record<HelpHeroAnchor, React.RefObject<HTMLElement | null>> = {
    quickstart: quickStartRef,
    articles: articlesRef,
    concepts: conceptsRef,
    faq: faqRef,
  };

  const handleRuleClick = useCallback((anchor: HelpHeroAnchor) => {
    anchorMap[anchor].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="space-y-7">
      <HelpHero onRuleClick={handleRuleClick} />

      <section ref={quickStartRef} className="panel" id="help-quickstart">
        <SectionHead
          icon={<Zap size={15} aria-hidden />}
          title={t('help.quickStart.title')}
          subtitle={t('help.quickStart.subtitle')}
        />
        <QuickStartPath />
      </section>

      <section ref={articlesRef} id="help-articles">
        <SectionHead
          icon={<BookOpen size={15} aria-hidden />}
          title={t('help.articles.title')}
          subtitle={t('help.articles.subtitle')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HELP_ARTICLES.map((article) => (
            <ModuleEntryCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section ref={conceptsRef} id="help-concepts">
        <SectionHead
          icon={<Layers size={15} aria-hidden />}
          title={t('help.concepts.title')}
          subtitle={t('help.concepts.subtitle')}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONCEPT_CARDS.map((card) => (
            <ConceptCard key={card.key} cardKey={card.key} iconKey={card.iconKey} />
          ))}
        </div>
      </section>

      <section ref={faqRef} id="help-faq">
        <SectionHead
          icon={<MessageCircle size={15} aria-hidden />}
          title={t('help.faq.title')}
          subtitle={t('help.faq.subtitle')}
        />
        <FaqAccordion />
      </section>
    </div>
  );
}

interface SectionHeadProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}

/** section header：brass 图标 + panel-title + 右侧小副标 */
function SectionHead({ icon, title, subtitle }: SectionHeadProps) {
  return (
    <header className="help-section-head">
      <span className="help-section-head-icon" aria-hidden="true">
        {icon}
      </span>
      <h2 className="help-section-head-title">{title}</h2>
      {subtitle && <span className="help-section-head-sub">{subtitle}</span>}
    </header>
  );
}