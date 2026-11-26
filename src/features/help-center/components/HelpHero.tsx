import type { MouseEvent } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { SLIDE_DOWN } from '@/shared/utils/motion';
import { HELP_ARTICLES, CONCEPT_CARDS, FAQ_ITEMS } from '../data/helpContent';

export type HelpHeroAnchor = 'quickstart' | 'articles' | 'faq';

interface HelpHeroProps {
  onRuleClick: (anchor: HelpHeroAnchor) => void;
}

const ANCHOR_IDS: Record<HelpHeroAnchor, string> = {
  quickstart: 'help-quickstart',
  articles: 'help-articles',
  faq: 'help-faq',
};

export default function HelpHero({ onRuleClick }: HelpHeroProps) {
  const { t } = useTranslation();

  const rules: Array<{ anchor: HelpHeroAnchor; num: string }> = [
    { anchor: 'quickstart', num: '01' },
    { anchor: 'articles', num: '02' },
    { anchor: 'faq', num: '03' },
  ];

  const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>, anchor: HelpHeroAnchor) => {
    event.preventDefault();
    onRuleClick(anchor);
  };

  return (
    <motion.section
      variants={SLIDE_DOWN}
      initial="hidden"
      animate="visible"
      className="panel brass-rail help-hero"
      aria-label={t('help.hero.ariaLabel')}
    >
      <div className="help-hero-grid">
        <div className="help-hero-copy">
          <p className="font-numeric text-[9px] uppercase tracking-[0.2em] text-[var(--brass-text)]">
            {t('help.hero.eyebrow')}
          </p>
          <h2 className="help-hero-title">{t('help.hero.title')}</h2>
          <p className="help-hero-sub">{t('help.hero.subtitle')}</p>
          <div className="help-hero-actions">
            <Button asChild className="help-hero-cta">
              <a href={`#${ANCHOR_IDS.quickstart}`} onClick={(event) => handleAnchorClick(event, 'quickstart')}>
                {t('help.hero.cta')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </Button>
            <span className="help-hero-meta">
              {t('help.hero.meta', {
                articles: HELP_ARTICLES.length,
                concepts: CONCEPT_CARDS.length,
                faq: FAQ_ITEMS.length,
              })}
            </span>
          </div>
        </div>

        <div className="help-hero-plaque-wrap">
          <div className="house-rules-card" role="group" aria-label={t('help.hero.cardAria')}>
            <div className="house-rules-rail" aria-hidden="true" />
            <div className="house-rules-eyebrow">{t('help.hero.cardEyebrow')}</div>
            <div className="house-rules-divider" aria-hidden="true" />
            <ol className="house-rules-list">
              {rules.map((rule) => (
                <li key={rule.anchor}>
                  <a
                    href={`#${ANCHOR_IDS[rule.anchor]}`}
                    onClick={(event) => handleAnchorClick(event, rule.anchor)}
                    className="house-rules-item"
                  >
                    <span className="house-rules-num" aria-hidden="true">{rule.num}</span>
                    <span className="house-rules-text">
                      <span className="house-rules-text-title">
                        {t(`help.hero.rules.${rule.num}.title`)}
                      </span>
                      <span className="house-rules-text-body">
                        {t(`help.hero.rules.${rule.num}.body`, { articles: HELP_ARTICLES.length })}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ol>
            <div className="house-rules-foot">{t('help.hero.cardFooter')}</div>
          </div>
          <div className="house-rules-stand" aria-hidden="true" />
        </div>
      </div>
    </motion.section>
  );
}
