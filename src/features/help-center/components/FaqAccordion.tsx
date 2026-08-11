import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQ_ITEMS } from '../data/helpContent';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';

/**
 * FAQ 折叠面板 — 编号 01-08 + brass 左侧描边 + framer-motion 动效。
 * 左侧 brass 描边在 hover / 展开时由 walnut-border 提亮至 brass。
 */
export default function FaqAccordion() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-button-${idx}`;
        const num = String(idx + 1).padStart(2, '0');
        return (
          <div key={idx} className={`faq-item${isOpen ? ' open' : ''}`}>
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={isOpen ? panelId : undefined}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
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
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
                  className="faq-item-panel-wrap"
                >
                  <div className="faq-item-panel">
                    {t(`help.${item.answerKey}`)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}