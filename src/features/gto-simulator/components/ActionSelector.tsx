import { useState, useEffect, useCallback } from 'react';
import { ActionType } from '@/shared/types/action';
import type { Decision } from '@/shared/types/action';
import { cn } from '@/shared/utils';

interface ActionSelectorProps {
  potSize: number;
  effectiveStack: number;
  callAmount?: number;
  onDecision: (decision: Decision) => void;
  disabled?: boolean;
}

export function ActionSelector({
  potSize,
  effectiveStack,
  callAmount,
  onDecision,
  disabled = false,
}: ActionSelectorProps) {
  const [raiseAmount, setRaiseAmount] = useState(2.5);
  const [showRaiseSlider, setShowRaiseSlider] = useState(false);

  const minRaise = callAmount ? callAmount * 2 : 2;
  const maxRaise = effectiveStack;

  // 快捷键
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;
      switch (e.key) {
        case '1':
          onDecision({ action: ActionType.Fold });
          break;
        case '2':
          onDecision({ action: ActionType.Call, amount: callAmount });
          break;
        case '3':
          if (!showRaiseSlider) {
            setShowRaiseSlider(true);
          } else {
            onDecision({ action: ActionType.Raise, amount: raiseAmount });
          }
          break;
        case '4':
          onDecision({ action: ActionType.AllIn, amount: effectiveStack });
          break;
      }
    },
    [disabled, callAmount, effectiveStack, raiseAmount, showRaiseSlider, onDecision]
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
    onDecision({ action: ActionType.Raise, amount: raiseAmount });
    setShowRaiseSlider(false);
  };

  return (
    <div className="space-y-4">
      {/* 主按钮 — Fold=clay · Call=sage · Raise=brass (card-room action semantics) */}
      <div className="grid grid-cols-3 gap-3">
        {/* Fold */}
        <button
          onClick={() => onDecision({ action: ActionType.Fold })}
          disabled={disabled}
          className={cn(
            'relative py-4 rounded-md font-display font-semibold text-lg transition-all',
            'bg-[var(--clay)]/20 text-[var(--clay)] border border-[var(--clay)]/40',
            'hover:bg-[var(--clay)]/30 hover:border-[var(--clay)]/60',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span className="absolute top-1 left-2 text-[10px] text-[var(--ivory-muted)] font-numeric">1</span>
          Fold
        </button>

        {/* Call */}
        <button
          onClick={() => onDecision({ action: ActionType.Call, amount: callAmount })}
          disabled={disabled}
          className={cn(
            'relative py-4 rounded-md font-display font-semibold text-lg transition-all',
            'bg-[var(--sage)]/20 text-[var(--sage)] border border-[var(--sage)]/40',
            'hover:bg-[var(--sage)]/30 hover:border-[var(--sage)]/60',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span className="absolute top-1 left-2 text-[10px] text-[var(--ivory-muted)] font-numeric">2</span>
          {callAmount ? `Call ${callAmount}BB` : 'Check'}
        </button>

        {/* Raise */}
        <button
          onClick={() => setShowRaiseSlider(!showRaiseSlider)}
          disabled={disabled}
          className={cn(
            'relative py-4 rounded-md font-display font-semibold text-lg transition-all',
            showRaiseSlider
              ? 'bg-[var(--brass)] text-[var(--primary-foreground)] border border-[var(--brass)]'
              : 'bg-[var(--brass)]/20 text-[var(--brass-bright)] border border-[var(--brass)]/40',
            'hover:bg-[var(--brass)]/30 hover:border-[var(--brass)]/60',
            'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <span className="absolute top-1 left-2 text-[10px] text-[var(--ivory-muted)] font-numeric">3</span>
          Raise
        </button>
      </div>

      {/* Raise 面板 */}
      {showRaiseSlider && (
        <div className="p-4 rounded-md bg-[var(--felt)] border border-[var(--walnut-border)] space-y-3">
          {/* 快捷加注 */}
          <div className="flex gap-2">
            {quickRaises.map((qr) => (
              <button
                key={qr.label}
                onClick={() => setRaiseAmount(Math.min(qr.value, maxRaise))}
                className={cn(
                  'flex-1 py-1.5 rounded text-xs font-medium transition-all font-numeric',
                  Math.abs(raiseAmount - qr.value) < 0.1
                    ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--walnut-raised)]/60 text-[var(--ivory-dim)] hover:bg-[var(--brass)]/15'
                )}
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* 滑块 */}
          <div className="space-y-1">
            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              step={0.5}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(Number(e.target.value))}
              className="w-full h-2 bg-[var(--felt-deep)] rounded-full appearance-none cursor-pointer accent-[var(--brass)]"
            />
            <div className="flex justify-between text-xs text-[var(--ivory-muted)] font-numeric">
              <span>{minRaise.toFixed(1)} BB</span>
              <span className="text-[var(--brass-bright)] font-bold">{raiseAmount.toFixed(1)} BB</span>
              <span>{maxRaise.toFixed(1)} BB</span>
            </div>
          </div>

          {/* 确认加注 */}
          <button
            onClick={handleRaiseSubmit}
            disabled={disabled}
            className="w-full py-2.5 rounded-md bg-[var(--brass)] text-[var(--primary-foreground)] font-display font-semibold hover:bg-[var(--brass-bright)] transition-all active:scale-95"
          >
            Raise {raiseAmount.toFixed(1)} BB
          </button>
        </div>
      )}

      {/* All-In — gold gradient, the highest aggression */}
      <button
        onClick={() => onDecision({ action: ActionType.AllIn, amount: effectiveStack })}
        disabled={disabled}
        className={cn(
          'relative w-full py-3 rounded-md font-display font-semibold text-lg transition-all',
          'bg-gradient-to-r from-[var(--clay)]/35 to-[var(--brass)]/35 text-[var(--brass-bright)] border border-[var(--brass)]/40',
          'hover:from-[var(--clay)]/45 hover:to-[var(--brass)]/45',
          'active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        <span className="absolute top-1 left-3 text-[10px] text-[var(--ivory-muted)] font-numeric">4</span>
        All-In ({effectiveStack} BB)
      </button>
    </div>
  );
}
