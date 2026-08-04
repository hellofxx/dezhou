import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { HandExample as HandExampleType } from '../types';
import {
  calculateGrade,
  GRADE_DISPLAY_CONFIG,
  type DecisionGrade,
} from '@/shared/types/decisionFeedback';
import { cn } from '@/shared/utils/cn';

export interface ActionChoice {
  label: string;
  isCorrect: boolean;
}

/** 干扰项通用池：取第一个与正确/错误决策（含 amount 拼接后的完整标签）均不同者 */
const DISTRACTOR_POOL = ['Fold', 'Call', 'Check', 'All-in'] as const;

/** 五级反馈中文兜底（t() 缺失时使用，与 PracticeDrill GRADE_FALLBACK_LABELS 语义对齐） */
const GRADE_FALLBACK_LABELS: Record<DecisionGrade, string> = {
  best: '最优决策',
  correct: '正确',
  inaccuracy: '小幅偏差',
  wrong: '错误',
  blunder: '重大错误',
};

/** 动作标签：含 amount 时拼接（"Raise 2.5BB"） */
export function formatActionLabel(action: string, amount?: string): string {
  return amount ? `${action} ${amount}` : action;
}

/**
 * 从 HandExample 数据派生预测选项（确定性纯函数，零新数据字段）：
 * 正确决策 / 常见错误 / 干扰项三选。
 */
export function buildActionChoices(example: HandExampleType): ActionChoice[] {
  const correct = formatActionLabel(example.correctDecision.action, example.correctDecision.amount);
  const mistake = formatActionLabel(example.commonMistake.action);
  const distractor =
    DISTRACTOR_POOL.find((a) => a !== correct && a !== mistake) ?? DISTRACTOR_POOL[0];
  return [
    { label: correct, isCorrect: true },
    { label: mistake, isCorrect: false },
    { label: distractor, isCorrect: false },
  ];
}

/**
 * 解析 EV 损失字符串（'-0.8 BB/100' / '-2BB（失去偷盲机会）'）取绝对值；
 * 缺失/解析失败兜底 3（与 buildDecisionFeedback 答错默认值语义一致）。
 */
export function parseEvLoss(raw: string | undefined): number {
  if (!raw) return 3;
  const match = raw.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 3;
  return Math.abs(parseFloat(match[0]));
}

interface PredictionPromptProps {
  example: HandExampleType;
  /** 已答状态（父层按 unitId 维护，受控）；为 true 且本地未选择时视为已答 */
  answered: boolean;
  onAnswered: (answered: boolean) => void;
}

const BUTTON_BASE =
  'px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer';
const BUTTON_IDLE =
  'border-[var(--walnut-border)] bg-[var(--surface)] text-[var(--ivory)] hover:border-[var(--brass)]/50 hover:bg-[var(--brass)]/10';
const BUTTON_CORRECT =
  'border-[var(--poker-success)] bg-[var(--poker-success)]/10 font-semibold text-[var(--poker-success)]';
const BUTTON_WRONG =
  'border-[var(--poker-danger)] bg-[var(--poker-danger)]/10 font-semibold text-[var(--poker-danger)]';
const BUTTON_DIM =
  'border-[var(--walnut-border)] bg-[var(--surface)] text-[var(--ivory)] opacity-40';

/**
 * 互动示例的「预测暂停」checkpoint：牌桌场景之后，先让学习者预测动作，
 * 选择后再揭示五级反馈 + 正确决策推理。纯本地 state，不计分不接外部系统。
 */
export function PredictionPrompt({ example, answered, onAnswered }: PredictionPromptProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ActionChoice | null>(null);
  const choices = useMemo(() => buildActionChoices(example), [example]);

  const revealed = answered || selected !== null;

  const handleSelect = (choice: ActionChoice) => {
    setSelected(choice);
    onAnswered(true);
  };

  const handleRetry = () => {
    setSelected(null);
    onAnswered(false);
  };

  // 预测区：问题卡 + 3 个动作按钮（grid，sm 以上三列）
  if (!revealed) {
    return (
      <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--surface)]/60 p-4">
        <p className="text-sm font-medium text-[var(--ivory)] mb-3">
          🎯 {t('academy.checkpoint.predictPrompt')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {choices.map((choice) => (
            <button
              key={choice.label}
              type="button"
              onClick={() => handleSelect(choice)}
              className={cn(BUTTON_BASE, BUTTON_IDLE)}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 揭示区：五级徽章 + 正确决策 + reasoning + 对手策略提示
  const grade: DecisionGrade | null = selected
    ? calculateGrade(selected.isCorrect ? 0 : parseEvLoss(example.commonMistake.evLoss))
    : null;
  const gradeConfig = grade ? GRADE_DISPLAY_CONFIG[grade] : null;

  return (
    <div className="space-y-4">
      {/* 选择回显：禁用按钮，正确项绿色高亮、选中错误项红色、其余降透明度 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {choices.map((choice) => {
          const isSelectedWrong = selected?.label === choice.label && !choice.isCorrect;
          return (
            <button
              key={choice.label}
              type="button"
              disabled
              className={cn(
                BUTTON_BASE,
                'cursor-default',
                choice.isCorrect && BUTTON_CORRECT,
                isSelectedWrong && BUTTON_WRONG,
                !choice.isCorrect && !isSelectedWrong && BUTTON_DIM,
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>

      {/* 反馈卡 */}
      <div className="rounded-lg border-l-4 border-[var(--success)] bg-[var(--success)]/5 p-4 overflow-hidden break-words">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {gradeConfig && grade && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium',
                gradeConfig.color,
                gradeConfig.textColor,
              )}
            >
              {gradeConfig.icon}{' '}
              {t(gradeConfig.titleKey, { defaultValue: GRADE_FALLBACK_LABELS[grade] })}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--success)]">
            <CheckCircle2 className="w-4 h-4" />
            {t('academy.checkpoint.revealCorrect')}
          </span>
          <button
            type="button"
            onClick={handleRetry}
            className="ml-auto inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('academy.checkpoint.retry')}
          </button>
        </div>
        <p className="text-sm font-bold text-[var(--ivory)] mb-2">
          {formatActionLabel(example.correctDecision.action, example.correctDecision.amount)}
        </p>
        <ol className="space-y-1.5">
          {example.correctDecision.reasoning.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-xs text-[var(--ivory-dim)] leading-relaxed"
            >
              <span className="shrink-0 w-4 h-4 rounded-full bg-[var(--success)]/20 text-[var(--success)] flex items-center justify-center text-[10px] font-bold mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* 对手策略提示 */}
      {example.opponent && (
        <div className="pt-3 border-t border-[var(--walnut-border)]">
          <p className="text-xs text-[var(--ivory-dim)]">
            💡 {t('academy.checkpoint.opponentHint', { shortName: example.opponent.shortName, tip: example.opponent.exploitableBy[0] })}
          </p>
        </div>
      )}
    </div>
  );
}
