import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQ_ITEMS } from '../data/helpContent';
import type { FaqItem } from '../types';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';

interface FaqAccordionProps {
  items?: readonly FaqItem[];
}

export default function FaqAccordion({ items = FAQ_ITEMS }: FaqAccordionProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const panelTransition = {
    duration: prefersReducedMotion ? 0 : MOTION_DURATION.fast,
    ease: MOTION_EASE.standard,
  };
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="faq-list">
      {items.map((item) => {
        const isOpen = openKey === item.questionKey;
        const panelId = `faq-panel-${item.questionKey}`;
        const buttonId = `faq-button-${item.questionKey}`;
        const sourceIndex = FAQ_ITEMS.indexOf(item);
        const num = String(sourceIndex + 1).padStart(2, '0');
        return (
          <div key={item.questionKey} className={`faq-item${isOpen ? ' open' : ''}`}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={isOpen ? panelId : undefined}
              onClick={() => setOpenKey(isOpen ? null : item.questionKey)}
              className="faq-item-button"
            >
              <span className="faq-item-num" aria-hidden="true">
                {num}
              </span>
              <span className="faq-item-question">
                {t(`help.${item.questionKey}`)}
              </span>
              <ChevronDown
                size={16}
                className={`faq-item-chevron${isOpen ? ' open' : ''}`}
                aria-hidden="true"
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={panelTransition}
                  className="faq-item-panel-wrap"
                >
                  <div className="faq-item-panel">
                    {t(`help.${item.answerKey}`)}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
