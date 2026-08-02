import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QUICK_START_STEPS } from '../data/helpContent';

/** 5 步快速上手路径 — 横向步骤条 */
export default function QuickStartPath() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {QUICK_START_STEPS.map((step, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(step.to)}
            className="flex items-center gap-2 rounded-lg border border-[var(--walnut-border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ivory)] hover:border-[var(--brass)]/50 hover:bg-[var(--walnut-light)]/30 transition-colors min-h-[44px]"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--brass)] text-xs font-bold text-[var(--primary-foreground)]">
              {idx + 1}
            </span>
            <span className="whitespace-nowrap">{t(`help.${step.key}`)}</span>
          </button>
          {idx < QUICK_START_STEPS.length - 1 && (
            <span className="text-[var(--ivory-dim)] text-xs" aria-hidden="true">→</span>
          )}
        </div>
      ))}
    </div>
  );
}
