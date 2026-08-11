import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MdfComparisonTable from './MdfComparisonTable';

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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'derivation' | 'comparison'>('derivation');
  const [displayPot, setDisplayPot] = useState(pot);
  const [displayBet, setDisplayBet] = useState(bet);

  // Calculate values
  const mdf = displayPot / (displayPot + displayBet);
  const requiredEquity = displayBet / (displayPot + displayBet);

  return (
    <div className="bg-[var(--felt-raised)]/30 rounded-lg p-6 border border-[var(--brass-deep)]/30">
      {/* Tab Navigation */}
      <div className="border-b border-[var(--walnut-border)] mb-6">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === 'derivation'
                ? 'text-[var(--ivory)] bg-[var(--brass-dark)]/50'
                : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
            }`}
            onClick={() => setActiveTab('derivation')}
          >
            {t('academy.mdf.tabDerivation')}
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
              activeTab === 'comparison'
                ? 'text-[var(--ivory)] bg-[var(--brass-dark)]/50'
                : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
            }`}
            onClick={() => setActiveTab('comparison')}
          >
            {t('academy.mdf.tabComparison')}
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'derivation' ? (
        <>
          <Step title={t('academy.mdf.step1Title')}>
            <FormulaBlock>
              MDF = pot / (pot + bet)
                = {displayPot} / ({displayPot} + {displayBet})
                = {(mdf * 100).toFixed(1)}%
            </FormulaBlock>
            <Note>
              {t('academy.mdf.step1Note', { pct: (mdf * 100).toFixed(0) })}
            </Note>
          </Step>

          <Step title={t('academy.mdf.step2Title')}>
            <FormulaBlock>
              Required Equity = bet / (pot + bet)
                = {displayBet} / ({displayPot} + {displayBet})
                = {(requiredEquity * 100).toFixed(1)}%
            </FormulaBlock>
            <Warning>{t('academy.mdf.step2Warning')}</Warning>
            <Note>
              {t('academy.mdf.step2Note')}
            </Note>
          </Step>

          <div className="border-t border-[var(--walnut-border)] pt-4 space-y-4">
            <InteractiveSlider
              label={t('academy.mdf.potLabel')}
              value={displayPot}
              onChange={setDisplayPot}
              min={5}
              max={100}
              step={1}
            />
            <InteractiveSlider
              label={t('academy.mdf.betLabel')}
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
              <div className="text-xs text-[var(--ivory-muted)] mb-1">{t('academy.mdf.mdfResultLabel')}</div>
              <div className="text-xl font-bold text-[var(--brass-bright)]">{(mdf * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-[var(--surface)] rounded p-3 text-center">
              <div className="text-xs text-[var(--ivory-muted)] mb-1">{t('academy.mdf.reqEquityResultLabel')}</div>
              <div className="text-xl font-bold text-[var(--success)]">{(requiredEquity * 100).toFixed(1)}%</div>
            </div>
          </div>
        </>
      ) : (
        <MdfComparisonTable initialPot={displayPot} initialBet={displayBet} />
      )}
    </div>
  );
}