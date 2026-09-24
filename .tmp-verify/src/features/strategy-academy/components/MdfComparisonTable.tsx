import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MDF_COMPARISON_DATA, CalculationResult, calculateComparisonValues } from '../data/mdfComparison';

interface MdfComparisonTableProps {
  initialPot?: number;
  initialBet?: number;
}

const MdfComparisonTable: React.FC<MdfComparisonTableProps> = ({
  initialPot = 100,
  initialBet = 50,
}) => {
  const { t } = useTranslation();
  const [displayPot, setDisplayPot] = useState(initialPot);
  const [displayBet, setDisplayBet] = useState(initialBet);

  const calculationResult: CalculationResult = calculateComparisonValues(
    displayPot,
    displayBet
  );

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="bg-[var(--felt-raised)]/30 rounded-lg p-6 border border-[var(--brass-deep)]/30">
      {/* Tab Navigation */}
      <div className="border-b border-[var(--walnut-border)] mb-4">
        <div className="flex space-x-4">
          <button className="px-4 py-2 text-sm font-medium text-[var(--ivory)] bg-[var(--brass-dark)]/50 rounded-t">
            {t('academy.mdf.tabComparison')}
          </button>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--walnut-border)]">
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--ivory-muted)]">
                {t('academy.mdf.tableConcept')}
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--ivory-muted)]">
                {t('academy.mdf.tableFormula')}
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--ivory-muted)]">
                {t('academy.mdf.tableApplication')}
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--ivory-muted)]">
                {t('academy.mdf.tableWrongPoint')}
              </th>
            </tr>
          </thead>
          <tbody>
            {MDF_COMPARISON_DATA.map((row, index) => (
              <tr
                key={row.englishName}
                className={`border-b border-[var(--walnut-border)] ${
                  index % 2 === 0 ? 'bg-[var(--surface)]' : ''
                }`}
              >
                <td className="py-3 px-4 text-sm">
                  <div className="font-medium text-[var(--ivory)]">{t(row.conceptName)}</div>
                  <div className="text-xs text-[var(--ivory-muted)]">{row.englishName}</div>
                </td>
                <td className="py-3 px-4 text-sm">
                  <code className="text-[var(--brass-bright)] bg-[var(--brass-dark)]/20 px-2 py-1 rounded">
                    {row.formula}
                  </code>
                </td>
                <td className="py-3 px-4 text-sm text-[var(--ivory)] max-w-md">
                  {t(row.applicationScenario)}
                </td>
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-[var(--brass)] text-lg mt-0.5">⚠️</span>
                    <span className="text-[var(--warning)]">{t(row.wrongPoint)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Interactive Sliders */}
      <div className="border-t border-[var(--walnut-border)] pt-4 space-y-4">
        <div>
          <label className="block text-sm text-[var(--ivory-muted)] mb-2">
            {t('academy.mdf.sliderPotLabel', { value: displayPot })}
          </label>
          <input
            type="range"
            min="5"
            max="200"
            step="1"
            value={displayPot}
            onChange={(e) => setDisplayPot(Number(e.target.value))}
            className="w-full h-2 bg-[var(--walnut-border)] rounded-lg appearance-none cursor-pointer accent-[var(--brass-bright)]"
          />
        </div>

        <div>
          <label className="block text-sm text-[var(--ivory-muted)] mb-2">
            {t('academy.mdf.sliderBetLabel', { value: displayBet })}
          </label>
          <input
            type="range"
            min="1"
            max="300"
            step="1"
            value={displayBet}
            onChange={(e) => setDisplayBet(Number(e.target.value))}
            className="w-full h-2 bg-[var(--walnut-border)] rounded-lg appearance-none cursor-pointer accent-[var(--brass-bright)]"
          />
        </div>
      </div>

      {/* Real-time Calculation Results */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-[var(--surface)] rounded p-3 text-center border border-[var(--brass-deep)]/20">
          <div className="text-xs text-[var(--ivory-muted)] mb-1">
            {t('academy.mdf.resultMdf')}
          </div>
          <div className="text-xl font-bold text-[var(--brass-bright)]">
            {formatPercentage(calculationResult.mdf)}
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded p-3 text-center border border-[var(--brass-deep)]/20">
          <div className="text-xs text-[var(--ivory-muted)] mb-1">
            {t('academy.mdf.resultReqEquity')}
          </div>
          <div className="text-xl font-bold text-[var(--success)]">
            {formatPercentage(calculationResult.requiredEquity)}
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded p-3 text-center border border-[var(--brass-deep)]/20">
          <div className="text-xs text-[var(--ivory-muted)] mb-1">
            {t('academy.mdf.resultBluff')}
          </div>
          <div className="text-xl font-bold text-[var(--warning)]">
            {formatPercentage(calculationResult.bluffFrequency)}
          </div>
        </div>
      </div>

      {/* Example Result Display */}
      <div className="mt-4 p-4 bg-[var(--brass-dark)]/10 rounded-lg border border-[var(--brass-deep)]/20">
        <p className="text-sm text-[var(--ivory)] text-center">
          {t('academy.mdf.exampleIntro', {
            bet: displayBet,
            pot: displayPot,
            ratio: (displayBet / displayPot).toFixed(2),
          })}
        </p>
        {MDF_COMPARISON_DATA[0] && MDF_COMPARISON_DATA[1] && (
          <p className="text-xs text-[var(--ivory-muted)] text-center mt-1">
            {MDF_COMPARISON_DATA[0].exampleResult.split('=')[0]} = {(displayPot / (displayPot + displayBet)).toFixed(1)}% |
            {MDF_COMPARISON_DATA[1].exampleResult.split('=')[0]} = {(displayBet / (displayPot + 2 * displayBet) * 100).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
};

export default MdfComparisonTable;
