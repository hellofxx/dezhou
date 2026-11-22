import { useTranslation } from 'react-i18next';
import type { CalcDrill } from '../utils/theoryCalcDrills';
import { buildDrillSolution, type DrillSolutionStep } from '../utils/calcDrillSolution';

/**
 * CalcDrill 分步解答卡（错 2 次自动展开 / 错 1 次手动展开，D6）。
 * 三步：公式陈述 → 数值代入（语言中立 mono）→ 答案。
 * 零持久：只读渲染，不触碰 store / 事件（口径随 TheoryCalcDrill）。
 * 刻意不用 ol/li：演练槽位计数测试按 li 取槽，嵌套列表会污染计数。
 */
export function CalcDrillSolution({ drill }: { drill: CalcDrill }) {
  const { t } = useTranslation();
  const steps = buildDrillSolution(drill, t);
  const stepLabel = (kind: DrillSolutionStep['kind']): string | null => {
    switch (kind) {
      case 'substitute':
        return t('theory.drill.solutionSubstitute');
      case 'answer':
        return t('theory.drill.solutionAnswer');
      case 'formula':
        return null;
    }
  };
  return (
    <div
      role="region"
      aria-label={t('theory.drill.solutionTitle')}
      className="rounded-md border border-[var(--brass)]/30 bg-[var(--brass)]/5 p-3 space-y-2"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--brass-text)]">
        {t('theory.drill.solutionTitle')}
      </p>
      <div className="space-y-1.5">
        {steps.map((step, index) => (
          <div key={step.kind} className="flex items-start gap-2 text-xs leading-relaxed">
            <span aria-hidden="true" className="font-numeric text-[var(--brass-bright)] shrink-0">
              {index + 1}.
            </span>
            <p className="min-w-0 text-[var(--ivory-dim)]">
              {stepLabel(step.kind) !== null ? (
                <span className="text-[var(--ivory-muted)]">{stepLabel(step.kind)}: </span>
              ) : null}
              <span
                className={
                  step.kind === 'formula'
                    ? 'text-[var(--ivory-dim)]'
                    : 'font-mono text-[var(--ivory)]'
                }
              >
                {step.text}
              </span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}