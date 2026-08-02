import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FAQ_ITEMS } from '../data/helpContent';

/** 自研轻量 FAQ 折叠面板（无 accordion 依赖） */
export default function FaqAccordion() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        const panelId = `faq-panel-${idx}`;
        const buttonId = `faq-button-${idx}`;
        return (
          <div
            key={idx}
            className="rounded-lg border border-[var(--walnut-border)] bg-[var(--surface)] overflow-hidden"
          >
            <button
              id={buttonId}
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-[var(--ivory)] hover:bg-[var(--walnut-light)]/30 transition-colors min-h-[44px]"
            >
              <span>{t(`help.${item.questionKey}`)}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-[var(--ivory-dim)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-3 text-sm text-[var(--ivory-muted)] leading-relaxed">
                    {t(`help.${item.answerKey}`)}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
