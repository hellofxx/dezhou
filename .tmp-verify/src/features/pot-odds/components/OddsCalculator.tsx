import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { usePotOddsStore } from '../store';
import { useOddsCalculation } from '../hooks/useOddsCalculation';
import { PotSizeInput } from './PotSizeInput';
import { OddsDisplay } from './OddsDisplay';
import type { GameVariant } from '@/shared/types/poker';

// label 存 i18n key，渲染时经 t() 解析（potOdds.calculator.*）
const VARIANT_OPTIONS: { value: GameVariant; label: string }[] = [
  { value: 'standard', label: 'potOdds.calculator.standard' },
  { value: 'short-deck', label: 'potOdds.calculator.shortDeck' },
];

export function OddsCalculator() {
  const { t } = useTranslation();
  const [showImplied, setShowImplied] = useState(false);

  const { potSize, betSize, outs, street, impliedOddsGain, gameVariant } = usePotOddsStore((s) => s.oddsState);
  const setPotSize = usePotOddsStore((s) => s.setPotSize);
  const setBetSize = usePotOddsStore((s) => s.setBetSize);
  const setOuts = usePotOddsStore((s) => s.setOuts);
  const setStreet = usePotOddsStore((s) => s.setStreet);
  const setImpliedOddsGain = usePotOddsStore((s) => s.setImpliedOddsGain);
  const setGameVariant = usePotOddsStore((s) => s.setGameVariant);
  const resetOdds = usePotOddsStore((s) => s.resetOdds);

  const result = useOddsCalculation();

  const betQuickButtons = [
    { label: '1/2 Pot', value: Math.round(potSize * 0.5) },
    { label: '3/4 Pot', value: Math.round(potSize * 0.75) },
    { label: 'Pot', value: potSize },
    { label: '2x Pot', value: potSize * 2 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input section */}
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{t('potOdds.calculator.paramsTitle')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={resetOdds} className="h-11 w-11 text-[var(--ivory-dim)]">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {/* 游戏变体切换 */}
          <div className="space-y-2">
            <label className="text-sm text-[var(--ivory-muted)]">{t('potOdds.calculator.variantLabel')}</label>
            <div className="flex gap-2">
              {VARIANT_OPTIONS.map((v) => (
                <button
                  key={v.value}
                  onClick={() => setGameVariant(v.value)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors border ${
                    gameVariant === v.value
                      ? v.value === 'short-deck'
                        ? 'bg-[var(--sage)]/20 border-[var(--sage)] text-[var(--sage)]'
                        : 'bg-[var(--brass)] border-[var(--brass)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--walnut-raised)]/60 border-transparent text-[var(--ivory-dim)] hover:bg-[var(--brass)]/15'
                  }`}
                >
                  {t(v.label)}
                </button>
              ))}
            </div>
            {gameVariant === 'short-deck' && (
              <p className="text-xs text-[var(--sage)] bg-[var(--sage)]/10 rounded-md px-3 py-1.5">
                {t('potOdds.calculator.shortDeckHint')}
              </p>
            )}
          </div>

          <PotSizeInput
            label={t('potOdds.potSize')}
            value={potSize}
            onChange={setPotSize}
            min={1}
            max={10000}
            step={5}
            prefix="$"
          />

          <PotSizeInput
            label={t('potOdds.calculator.opponentBet')}
            value={betSize}
            onChange={setBetSize}
            min={1}
            max={10000}
            step={5}
            prefix="$"
            quickButtons={betQuickButtons}
          />

          {/* Outs selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--ivory-muted)]">{t('potOdds.outs')}</label>
              <span className="text-lg font-bold font-mono text-[var(--brass)]">{outs}</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={outs}
              onChange={(e) => setOuts(parseFloat(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--walnut-border)] accent-[var(--brass)]"
            />
            <div className="flex justify-between text-xs text-[var(--ivory-dim)] font-mono">
              <span>0</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>

          {/* Street toggle */}
          <div className="space-y-2">
            <label className="text-sm text-[var(--ivory-muted)]">{t('potOdds.calculator.currentStreet')}</label>
            <div className="flex gap-2">
              {(['flop', 'turn'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStreet(s)}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    street === s
                      ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                      : 'bg-[var(--walnut-raised)]/60 text-[var(--ivory-dim)] hover:bg-[var(--brass)]/15'
                  }`}
                >
                  {s === 'flop' ? t('potOdds.calculator.streetFlop') : t('potOdds.calculator.streetTurn')}
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--ivory-dim)]">
              {street === 'flop' ? t('potOdds.calculator.ruleFourHint') : t('potOdds.calculator.ruleTwoHint')}
            </p>
          </div>

          {/* Implied odds (collapsible) */}
          <div className="border-t border-[var(--walnut-border)] pt-3">
            <button
              onClick={() => setShowImplied(!showImplied)}
              className="flex items-center gap-1 text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory-muted)] transition-colors"
            >
              {showImplied ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {t('potOdds.calculator.impliedOdds')}
            </button>
            {showImplied && (
              <div className="mt-3">
                <PotSizeInput
                  label={t('potOdds.calculator.expectedExtra')}
                  value={impliedOddsGain}
                  onChange={setImpliedOddsGain}
                  min={0}
                  max={10000}
                  step={10}
                  prefix="$"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results section */}
      <OddsDisplay
        potOdds={result.potOdds}
        requiredEquity={result.requiredEquity}
        estimatedEquity={result.estimatedEquity}
        isProfitable={result.isProfitable}
        ev={result.ev}
      />
    </div>
  );
}
