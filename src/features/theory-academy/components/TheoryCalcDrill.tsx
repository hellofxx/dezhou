import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calculator, RotateCw, ShieldCheck } from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { cn } from '@/shared/utils';
import { transitionStandard } from '@/shared/utils/motion';
import {
  CHAPTER_DRILL_SLOTS,
  buildCalcDrill,
  gradeCalcDrill,
  type CalcDrill,
} from '../utils/theoryCalcDrills';

type Verdict = 'correct' | 'incorrect' | 'invalid';

interface SlotState {
  attempt: number;
  draft: string;
  verdict: Verdict | null;
}

const initialSlotState = (): SlotState => ({ attempt: 0, draft: '', verdict: null });

function formatExpected(drill: CalcDrill): string {
  return drill.expected.toFixed(drill.precision);
}

/**
 * 章内即时计算演练（读→算→测的"算"环节）。
 *
 * 零持久：本组件刻意不调用 recordAnswer / updateElo / completeChapter / addReviewItem，
 * 也不发训练事件。理由是 recordAnswer 无幂等且直连全局连错计数（自适应难度唯一入口）
 * 与每日题量预算，而演练语义是"允许试错、可换题"，计入会污染测评口径。
 * 该约束由 components/TheoryCalcDrill.test.tsx 与源码守卫双向锁定。
 *
 * 反馈严格二态：无 EV 标定，故不渲染五级徽章与 EV 数值（PRD §6.7.1 / §5.27.5）。
 */
export function TheoryCalcDrill({ chapterId }: { chapterId: string }) {
  const { t } = useTranslation();
  const formulas = CHAPTER_DRILL_SLOTS[chapterId];
  const [slots, setSlots] = useState<SlotState[]>(() => (formulas ?? []).map(initialSlotState));

  const drills = useMemo(
    () => slots.map((state, index) => buildCalcDrill(chapterId, index, state.attempt)),
    [chapterId, slots]
  );

  const visibleDrills = drills.filter((drill): drill is CalcDrill => drill !== null);
  if (visibleDrills.length === 0) return null;

  const patch = (index: number, next: Partial<SlotState>) => {
    setSlots((current) =>
      current.map((state, i) => (i === index ? { ...state, ...next } : state))
    );
  };

  const handleCheck = (index: number, drill: CalcDrill) => {
    patch(index, { verdict: gradeCalcDrill(drill, slots[index]?.draft ?? '') });
  };

  const handleReroll = (index: number) => {
    patch(index, { attempt: (slots[index]?.attempt ?? 0) + 1, draft: '', verdict: null });
  };

  const answeredCount = slots.filter((state) => state.verdict === 'correct' || state.verdict === 'incorrect').length;
  const correctCount = slots.filter((state) => state.verdict === 'correct').length;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionStandard}
      aria-label={t('theory.drill.title')}
      className="panel space-y-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Calculator className="w-4 h-4 text-[var(--brass-bright)]" />
        <h2 className="font-display text-[16px] text-[var(--ivory)]">{t('theory.drill.title')}</h2>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--walnut-border)] px-2.5 py-1 text-[11px] text-[var(--ivory-dim)]">
          <ShieldCheck className="w-3 h-3" />
          {t('theory.drill.disclaimer')}
        </span>
      </div>
      <p className="text-xs text-[var(--ivory-muted)]">{t('theory.drill.subtitle')}</p>

      <ul className="space-y-3">
        {drills.map((drill, index) => {
          if (!drill) return null;
          const state = slots[index] ?? initialSlotState();
          const unitLabel = t(`theory.drill.unit.${drill.unit}`);
          const inputId = `calc-input-${chapterId}-${index}`;
          const hintId = `calc-hint-${chapterId}-${index}`;
          const verdictId = `calc-verdict-${chapterId}-${index}`;
          const promptId = `calc-prompt-${chapterId}-${index}`;

          return (
            <li
              key={drill.drillId}
              className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)] p-4 space-y-3"
            >
              <p id={promptId} className="text-sm text-[var(--ivory)] leading-relaxed">
                {t(drill.templateKey, drill.params)}
              </p>
              <p id={hintId} className="font-numeric text-xs text-[var(--brass-bright)]">
                {t(drill.hintKey)}
              </p>

              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor={inputId} className="text-[11px] uppercase tracking-[0.18em] text-[var(--ivory-dim)]">
                    {t('theory.drill.answerLabel')}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      id={inputId}
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={state.draft}
                      onChange={(event) => patch(index, { draft: event.target.value })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') handleCheck(index, drill);
                      }}
                      aria-describedby={`${hintId} ${verdictId}`}
                      className="w-32 bg-[var(--felt)]"
                    />
                    <span className="text-xs text-[var(--ivory-muted)]">{unitLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCheck(index, drill)}
                    className="inline-flex min-h-11 items-center rounded-lg bg-[var(--brass-bright)] px-4 py-2 text-sm font-semibold text-[var(--felt-deep)] hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                  >
                    {t('theory.drill.submit')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReroll(index)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--walnut-border)] px-3 py-2 text-sm text-[var(--ivory-dim)] hover:border-[var(--brass)]/50 hover:text-[var(--ivory)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    {t('theory.drill.nextProblem')}
                  </button>
                </div>
              </div>

              <p
                id={verdictId}
                role="status"
                aria-live="polite"
                className={cn(
                  'text-xs',
                  state.verdict === 'correct' && 'text-[var(--brass-bright)] font-semibold',
                  state.verdict === 'incorrect' && 'text-[var(--poker-terra-bright)]',
                  state.verdict === 'invalid' && 'text-[var(--ivory-dim)]',
                  state.verdict === null && 'sr-only'
                )}
              >
                {state.verdict === 'correct' && `${t('theory.drill.correct')} · ${formatExpected(drill)}${unitLabel}`}
                {state.verdict === 'incorrect' && t('theory.drill.incorrect')}
                {state.verdict === 'invalid' && t('theory.drill.invalidInput')}
              </p>
            </li>
          );
        })}
      </ul>

      {answeredCount > 0 && (
        <p className="text-xs text-[var(--ivory-muted)]">
          {t('theory.drill.summaryTitle')}：{t('theory.drill.answered', { correct: correctCount, total: answeredCount })}
        </p>
      )}
    </motion.section>
  );
}
