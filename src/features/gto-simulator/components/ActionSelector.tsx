import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActionType } from '@/shared/types/action';
import type { Decision } from '@/shared/types/action';
import { cn } from '@/shared/utils/cn';
import { actionTerm, actionLabel } from '../utils/actionTerms';

interface ActionSelectorProps {
  potSize: number;
  effectiveStack: number;
  callAmount?: number;
  /** 无下注可过牌语境：中间按钮展示 Check 并提交 Check（优先于 callAmount） */
  canCheck?: boolean;
  /** 场景给定的最小加注**到**的总额；缺省沿用 2×callAmount / 2 */
  minRaiseTo?: number;
  /** 场景给定的加注可用性；缺省由 minRaiseTo 与筹码推导 */
  canRaise?: boolean;
  onDecision: (decision: Decision) => void;
  disabled?: boolean;
}

export function ActionSelector({
  potSize,
  effectiveStack,
  callAmount,
  canCheck = false,
  minRaiseTo,
  canRaise,
  onDecision,
  disabled = false,
}: ActionSelectorProps) {
  const { t } = useTranslation();
  const maxRaise = effectiveStack;

  /** 未钳制的最小加注（判断「最小加注是否已超过有效筹码」用原始值） */
  const rawMinRaise = minRaiseTo ?? (callAmount ? callAmount * 2 : 2);
  /** 滑块 / 提交用的最小加注：始终不超过有效筹码，避免 min > max 的非法区间 */
  const minRaise = Math.min(rawMinRaise, maxRaise);
  /** 最小加注超过有效筹码 → 没有合法加注空间 */
  const raiseBlocked = canRaise === false || rawMinRaise > maxRaise;
  const raiseDisabled = disabled || raiseBlocked;

  const [raiseAmount, setRaiseAmount] = useState(() => Math.min(Math.max(2.5, minRaise), maxRaise));
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  /** 提交前把加注尺寸约束到合法区间 [minRaise, maxRaise] */
  const clampRaise = useCallback(
    (v: number) => Math.min(Math.max(v, minRaise), maxRaise),
    [minRaise, maxRaise]
  );

  /** 当前展示 / 提交的加注尺寸（prop 变化导致区间收窄时保持合法） */
  const raiseValue = clampRaise(raiseAmount);

  const showCheck = canCheck || !callAmount;

  /** 中间按钮语义：可过牌时提交 Check，否则提交 Call 带跟注额 */
  const commitMiddle = useCallback(() => {
    onDecision(
      showCheck ? { action: ActionType.Check } : { action: ActionType.Call, amount: callAmount }
    );
  }, [showCheck, callAmount, onDecision]);

  // 快捷键
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case '1':
          onDecision({ action: ActionType.Fold });
          break;
        case '2':
          commitMiddle();
          break;
        case '3':
          // 无可加注空间：不展开面板、不提交
          if (raiseBlocked) return;
          if (!showRaiseSlider) {
            setShowRaiseSlider(true);
          } else {
            onDecision({ action: ActionType.Raise, amount: clampRaise(raiseAmount) });
          }
          break;
        case '4':
          onDecision({ action: ActionType.AllIn, amount: effectiveStack });
          break;
      }
    },
    [
      disabled,
      commitMiddle,
      raiseBlocked,
      effectiveStack,
      raiseAmount,
      showRaiseSlider,
      onDecision,
      clampRaise,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const quickRaises = [
    { label: '1/2 Pot', value: potSize * 0.5 },
    { label: '3/4 Pot', value: potSize * 0.75 },
    { label: 'Pot', value: potSize },
    { label: '2x Pot', value: potSize * 2 },
  ];

  const handleRaiseSubmit = () => {
    if (raiseBlocked) return;
    onDecision({ action: ActionType.Raise, amount: raiseValue });
    setShowRaiseSlider(false);
  };

  // BUG-GTO-010：动作词统一取 shared 级扑克动作术语源（actionTerms），刻意保留英文。
  const callLabel = showCheck
    ? actionTerm(ActionType.Check)
    : actionLabel(ActionType.Call, callAmount);

  return (
    <div className="space-y-4">
      {/* 主按钮 — Fold=陶土赭 danger 系 · Call=深胡桃实底 · Raise=brass (card-room action semantics) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Fold */}
        <button
          onClick={() => onDecision({ action: ActionType.Fold })}
          disabled={disabled}
          aria-label={actionTerm(ActionType.Fold)}
          className={cn(
            'relative py-4 rounded-md font-display font-semibold text-lg transition-all',
            'bg-[var(--poker-terra)]/15 text-[var(--poker-terra-bright)] border border-[var(--poker-terra)]/50',
            'hover:bg-[var(--poker-terra)]/25 hover:border-[var(--poker-terra)]/70',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span className="absolute top-1 left-2 text-[10px] text-[var(--ivory-muted)] font-numeric">1</span>
          {actionTerm(ActionType.Fold)}
        </button>

        {/* Call / Check */}
        <button
          onClick={commitMiddle}
          disabled={disabled}
          aria-label={callLabel}
          className={cn(
            'relative py-4 rounded-md font-display font-semibold text-lg transition-all',
            'bg-[var(--walnut-raised)] text-[var(--ivory-dim)] border border-[var(--walnut-light)]',
            'hover:bg-[var(--walnut-light)] hover:text-[var(--ivory)]',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span className="absolute top-1 left-2 text-[10px] text-[var(--ivory-muted)] font-numeric">2</span>
          {callLabel}
        </button>

        {/* Raise — 最小加注超过有效筹码时无加注空间，原生 disabled + aria-disabled 双语义 */}
        <button
          onClick={() => setShowRaiseSlider(!showRaiseSlider)}
          aria-expanded={showRaiseSlider}
          aria-controls="gto-raise-panel"
          aria-label={actionTerm(ActionType.Raise)}
          aria-disabled={raiseDisabled || undefined}
          disabled={raiseDisabled}
          className={cn(
            'relative py-4 rounded-md font-display font-semibold text-lg transition-all',
            showRaiseSlider
              ? 'bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] border border-[var(--brass-fill-border)]'
              : 'bg-[var(--brass)]/20 text-[var(--brass-bright)] border border-[var(--brass)]/40',
            'hover:bg-[var(--brass)]/30 hover:border-[var(--brass)]/60',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span className="absolute top-1 left-2 text-[10px] text-[var(--ivory-muted)] font-numeric">3</span>
          {actionTerm(ActionType.Raise)}
        </button>
      </div>

      {/* Raise 面板 */}
      {showRaiseSlider && (
        <div id="gto-raise-panel" className="p-4 rounded-md bg-[var(--felt)] border border-[var(--walnut-border)] space-y-3">
          {/* 快捷加注 */}
          <div className="flex gap-2">
            {quickRaises.map((qr) => (
              <button
                key={qr.label}
                onClick={() => setRaiseAmount(clampRaise(qr.value))}
                className={cn(
                  'flex-1 py-1.5 rounded text-xs font-medium transition-all font-numeric',
                  Math.abs(raiseValue - qr.value) < 0.1
                    ? 'bg-[var(--brass-fill)] text-[var(--brass-fill-ink)]'
                    : 'bg-[var(--walnut-raised)]/60 text-[var(--ivory-dim)] hover:bg-[var(--brass)]/15'
                )}
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* 滑块（a11y：aria-valuetext 读屏播报当前加注尺寸，遵循 WCAG 与 DESIGN.md） */}
          <div className="space-y-1">
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              step={0.5}
              value={raiseValue}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              aria-label={t('gto.action.raiseSlider')}
              aria-valuetext={`${raiseValue.toFixed(1)} BB`}
              className="w-full h-2 bg-[var(--felt-deep)] rounded-full appearance-none cursor-pointer accent-[var(--brass)]"
            />
            <div className="flex justify-between text-xs text-[var(--ivory-muted)] font-numeric">
              <span>{minRaise.toFixed(1)} BB</span>
              <span className="text-[var(--brass-bright)] font-bold">{raiseValue.toFixed(1)} BB</span>
              <span>{maxRaise.toFixed(1)} BB</span>
            </div>
          </div>

          {/* 确认加注 */}
          <button
            onClick={handleRaiseSubmit}
            disabled={raiseDisabled}
            aria-disabled={raiseDisabled || undefined}
            className="w-full py-2.5 rounded-md bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-display font-semibold hover:[background:var(--brass-fill-gradient-hover)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionTerm(ActionType.Raise)} {raiseValue.toFixed(1)} BB
          </button>
        </div>
      )}

      {/* All-In — gold gradient, the highest aggression */}
      <button
        onClick={() => onDecision({ action: ActionType.AllIn, amount: effectiveStack })}
        disabled={disabled}
        aria-label={actionLabel(ActionType.AllIn, effectiveStack)}
        className={cn(
          'relative w-full py-3 rounded-md font-display font-semibold text-lg transition-all',
          '[background:var(--action-allin-bg)] text-[var(--stable-ivory)] border border-[var(--brass)]/40',
          'hover:[background:var(--action-allin-bg-hover)]',
          'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <span className="absolute top-1 left-3 text-[10px] text-[var(--ivory-muted)] font-numeric">4</span>
        {actionLabel(ActionType.AllIn, effectiveStack)}
      </button>
    </div>
  );
}
