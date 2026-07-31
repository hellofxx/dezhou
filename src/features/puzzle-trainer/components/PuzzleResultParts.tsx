/**
 * PuzzleResult 子组件（P1-D 修复批从 PuzzleResult.tsx 拆出以满足单文件 ≤200 行）：
 * - StatCard：核心指标卡片
 * - WrongAnswerList：答错题目列表（含正确答案与解析）
 */
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/shared/components/ui/card';
import type { PuzzleQuestion, PuzzleOption } from '../types';

/** 统计卡片 */
export function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: 'gold' | 'green' | 'default';
}) {
  const accentColor =
    accent === 'gold'
      ? 'text-[var(--brass-bright)]'
      : accent === 'green'
      ? 'text-[var(--success)]'
      : 'text-[var(--ivory)]';

  return (
    <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius)] shadow-[var(--shadow-sm)]">
      <CardContent className="p-3 flex flex-col items-center gap-1 text-center">
        <div className="text-[var(--ivory-dim)]">{icon}</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--ivory-dim)]">
          {label}
        </div>
        <div className={`font-numeric text-xl ${accentColor}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

export interface WrongAnswerEntry {
  question: PuzzleQuestion;
  correctOption: PuzzleOption | undefined;
  selectedOption: PuzzleOption | undefined;
}

/** 答错题目列表（仅有错题时由调用方渲染） */
export function WrongAnswerList({ entries }: { entries: WrongAnswerEntry[] }) {
  const { t } = useTranslation();
  return (
    <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base text-[var(--ivory)]">
            {t('puzzle.result.wrongList', { count: entries.length })}
          </h3>
        </div>
        <div className="space-y-2">
          {entries.map(({ question, correctOption, selectedOption }, idx) => (
            <div
              key={question.id}
              className="rounded-md border border-[var(--walnut-border)]/60 bg-[var(--walnut)]/20 p-3 space-y-1.5"
            >
              <div className="flex items-start gap-2 text-sm">
                <span className="font-numeric text-[var(--ivory-dim)] text-xs mt-0.5">
                  #{idx + 1}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-[var(--ivory)] leading-relaxed text-sm">
                    {question.scenario}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {question.hand && (
                      <span className="text-[var(--ivory-dim)]">
                        {t('puzzle.card.handLabel')}: <span className="font-numeric text-[var(--ivory)]">{question.hand}</span>
                      </span>
                    )}
                    {selectedOption && (
                      <span className="text-[var(--clay)]">
                        {t('puzzle.result.yourAnswer')}: <span className="font-display">{selectedOption.text}</span>
                      </span>
                    )}
                    {correctOption && (
                      <span className="text-[var(--success)]">
                        {t('puzzle.result.correctAnswer')}: <span className="font-display">{correctOption.text}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--ivory-muted)] leading-relaxed pt-1">
                    {question.correctExplanation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
