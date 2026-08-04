import { useState } from 'react';

interface StepProps {
  title: string;
  children: React.ReactNode;
}

function Step({ title, children }: StepProps) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="font-semibold text-[var(--brass)] mb-2">{title}</h4>
      <div className="pl-4 border-l-2 border-[var(--walnut-border)] space-y-2">
        {children}
      </div>
    </div>
  );
}

interface FormulaBlockProps {
  children: React.ReactNode;
}

function FormulaBlock({ children }: FormulaBlockProps) {
  return (
    <div className="bg-[var(--surface)] rounded p-3 font-mono text-sm overflow-x-auto">
      <pre className="text-[var(--ivory)] whitespace-pre-wrap">{children}</pre>
    </div>
  );
}

interface NoteProps {
  children: React.ReactNode;
}

function Note({ children }: NoteProps) {
  return (
    <div className="mt-2 flex items-start gap-2 text-sm bg-[var(--brass-deep)]/20 rounded p-2">
      <span className="text-[var(--brass-bright)]">ℹ</span>
      <span className="text-[var(--ivory-muted)]">{children}</span>
    </div>
  );
}

interface WarningProps {
  children: React.ReactNode;
}

function Warning({ children }: WarningProps) {
  return (
    <div className="mt-2 flex items-start gap-2 text-sm bg-[var(--danger)]/10 rounded p-2">
      <span className="text-[var(--danger)]">⚠</span>
      <span className="text-[var(--ivory-dim)]">{children}</span>
    </div>
  );
}

interface InteractiveSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

function InteractiveSlider({ label, value, onChange, min, max, step }: InteractiveSliderProps) {
  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[var(--ivory-muted)]">{label}</label>
        <span className="font-mono text-sm text-[var(--brass)]">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--brass)]"
        aria-label={label}
      />
    </div>
  );
}

interface MDFDerivationProps {
  pot: number;
  bet: number;
}

export function MDFDerivation({ pot, bet }: MDFDerivationProps) {
  const [displayPot, setDisplayPot] = useState(pot);
  const [displayBet, setDisplayBet] = useState(bet);

  // Calculate values
  const mdf = displayPot / (displayPot + displayBet);
  const requiredEquity = displayBet / (displayPot + displayBet);

  return (
    <div className="bg-[var(--felt-raised)]/30 rounded-lg p-6 border border-[var(--brass-deep)]/30">
      <h3 className="font-display font-semibold text-lg mb-4 text-[var(--ivory)]">
        MDF 推导过程
      </h3>

      <Step title="步骤 1：计算防御频率 (MDF)">
        <FormulaBlock>
          MDF = pot / (pot + bet)
            = {displayPot} / ({displayPot} + {displayBet})
            = {(mdf * 100).toFixed(1)}%
        </FormulaBlock>
        <Note>
          你需要用 top {(mdf * 100).toFixed(0)}% 的范围继续防守，以防止对手利用 bluff 获利
        </Note>
      </Step>

      <Step title="步骤 2：计算跟注所需胜率 (Required Equity)">
        <FormulaBlock>
          Required Equity = bet / (pot + bet)
            = {displayBet} / ({displayPot} + {displayBet})
            = {(requiredEquity * 100).toFixed(1)}%
        </FormulaBlock>
        <Warning>注意：这和 MDF 不同！不要混淆。</Warning>
        <Note>
          这是你跟注所需的最低胜率。如果你的实际胜率高于这个值，跟注就是有利可图的
        </Note>
      </Step>

      <div className="border-t border-[var(--walnut-border)] pt-4 space-y-4">
        <InteractiveSlider
          label="底池大小"
          value={displayPot}
          onChange={setDisplayPot}
          min={5}
          max={100}
          step={1}
        />
        <InteractiveSlider
          label="下注额"
          value={displayBet}
          onChange={setDisplayBet}
          min={1}
          max={200}
          step={1}
        />
      </div>

      {/* Results summary */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-[var(--surface)] rounded p-3 text-center">
          <div className="text-xs text-[var(--ivory-muted)] mb-1">MDF (防御频率)</div>
          <div className="text-xl font-bold text-[var(--brass-bright)]">{(mdf * 100).toFixed(1)}%</div>
        </div>
        <div className="bg-[var(--surface)] rounded p-3 text-center">
          <div className="text-xs text-[var(--ivory-muted)] mb-1">跟注所需胜率</div>
          <div className="text-xl font-bold text-[var(--success)]">{(requiredEquity * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}
