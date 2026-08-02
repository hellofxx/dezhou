import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { HELP_ARTICLES, CONCEPT_CARDS } from '../data/helpContent';
import QuickStartPath from './QuickStartPath';
import ModuleEntryCard from './ModuleEntryCard';
import FaqAccordion from './FaqAccordion';

/** 帮助中心首页 */
export default function HelpHome() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mr-auto space-y-8">
      {/* 标题 */}
      <div className="panel-title">
        <HelpCircle size={18} />
        <span>{t('help.title')}</span>
      </div>

      {/* 快速上手 */}
      <section className="panel">
        <h2 className="panel-title">
          <span>{t('help.quickStart.title')}</span>
        </h2>
        <QuickStartPath />
      </section>

      {/* 模块教程卡片网格 */}
      <section>
        <h2 className="panel-title">
          <span>{t('help.articles.title')}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {HELP_ARTICLES.map((article) => (
            <ModuleEntryCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      {/* 概念卡片 */}
      <section>
        <h2 className="panel-title">
          <span>{t('help.concepts.title')}</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {CONCEPT_CARDS.map((card) => (
            <div
              key={card.key}
              className="rounded-lg border border-[var(--walnut-border)] bg-[var(--surface)] p-4"
            >
              <h3 className="text-sm font-medium text-[var(--ivory)] mb-1">
                {t(`help.${card.key}.title`)}
              </h3>
              <p className="text-xs text-[var(--ivory-muted)] leading-relaxed">
                {t(`help.${card.key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="panel-title">
          <span>{t('help.faq.title')}</span>
        </h2>
        <FaqAccordion />
      </section>
    </div>
  );
}
