/**
 * 主题训练：从 URL params 读取 themeId，加载该主题的全部题目。
 *
 * - 完成后显示该主题的正确率与建议
 * - 主题题目数 15-30 题（P1 阶段每主题 15 题）
 */
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { PuzzleCard } from './PuzzleCard';
import { PuzzleResult } from './PuzzleResult';
import { usePuzzleEngine } from '../hooks/usePuzzleEngine';
// 会话接线（选中项 / recordAnswer / 完成提交 / emit）下沉至 usePuzzleSession
import { usePuzzleSession } from '../hooks/usePuzzleSession';
import { PUZZLE_THEMES, getThemeMeta } from '../data/puzzleBank';
import { useProgressStore } from '@/features/progress/store';
// P2-5.4: Session 止损守卫（谜题三模式与其他训练模块同口径）
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/gate/SessionLimitGuard';
import type { PuzzleTheme } from '../types';

export default function ThemeDrill() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { themeId } = useParams<{ themeId: string }>();

  // 验证 themeId 是否有效
  const theme = useMemo<PuzzleTheme | null>(() => {
    if (!themeId) return null;
    const valid = PUZZLE_THEMES.find((th) => th.id === themeId);
    return valid ? (valid.id as PuzzleTheme) : null;
  }, [themeId]);

  const themeMeta = useMemo(() => (theme ? getThemeMeta(theme) : null), [theme]);
  const themeLabel = themeMeta
    ? t(themeMeta.nameKey, themeMeta.fallbackName)
    : t('puzzle.theme.unknownTheme');

  const engine = usePuzzleEngine({ mode: 'theme', theme: theme ?? undefined });
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  // P2-5.4: 每日题量上限（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

  // 会话接线：选中状态 / recordAnswer / 完成提交（submitResult + recordTrainingDay + emit）
  const { finalResult, selectedOptionId, handleSelect, handleRetry } = usePuzzleSession(engine);

  const handleNext = () => {
    engine.next();
  };

  // 每日题量上限（P1D-06 专批 B：开局判定）：挂载时已达上限则拦在开始前；
  // 进行中会话不再中途拦断（hook 内 mount 快照冻结），走完结算后下次进入再拦；
  // 早退位于全部 hooks 之后，避免守卫翻转触发 hooks 数量变化崩溃
  if (!finalResult && sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  if (!theme) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--ivory-muted)]">
        <p>{t('puzzle.theme.unknownTheme')}</p>
        <Button variant="outline" onClick={() => navigate('/puzzle')}>
          {t('puzzle.common.backHome')}
        </Button>
      </div>
    );
  }

  if (finalResult) {
    return (
      <PuzzleResult
        result={finalResult}
        isNewRecord={Boolean(finalResult._isNewRecord)}
        onRetry={handleRetry}
        onBackHome={() => navigate('/puzzle')}
      />
    );
  }

  if (!engine.currentQuestion) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--ivory-muted)]">
        {t('puzzle.theme.noQuestions')}
      </div>
    );
  }

  const progressValue =
    engine.state.questions.length > 0
      ? ((engine.state.currentIndex + (engine.isCurrentAnswered ? 1 : 0)) / engine.state.questions.length) * 100
      : 0;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ivory-dim)] hover:text-[var(--ivory)]"
            onClick={() => navigate('/puzzle')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('puzzle.common.exit')}
          </Button>
          <h2 className="font-display text-base text-[var(--ivory)] tracking-wide flex items-center gap-2">
            {themeMeta?.icon && <span>{themeMeta.icon}</span>}
            {themeLabel}
          </h2>
          <div className="text-xs text-[var(--ivory-dim)] font-numeric">
            {engine.state.currentIndex + 1}/{engine.state.questions.length}
          </div>
        </div>

        {/* 进度条 */}
        <Progress
          value={progressValue}
          className="h-1.5 [&_[class*=indicator]]:bg-[var(--brass-bright)]"
        />

        {/* 连续答错降级提示 */}
        {shouldDownshiftDifficulty() && (
          <div className="px-4 py-2 rounded-lg bg-[var(--clay)]/15 border border-[var(--clay)]/30 text-xs text-[var(--clay)]">
            {t('puzzle.common.downshiftHint')}
          </div>
        )}

        {/* 题目卡片 */}
        <PuzzleCard
          question={engine.currentQuestion}
          answerRecord={engine.currentAnswer}
          selectedOptionId={selectedOptionId}
          onSelectOption={handleSelect}
          onNext={handleNext}
          isLastQuestion={engine.state.currentIndex >= engine.state.questions.length - 1}
          questionProgress={{
            current: engine.state.currentIndex + 1,
            total: engine.state.questions.length,
          }}
        />

        {/* 实时分数 */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[var(--ivory-dim)]">
          <span>
            {t('puzzle.common.correct')}: <span className="font-numeric text-[var(--success)]">{engine.state.correctCount}</span>
          </span>
          <span>
            {t('puzzle.common.wrong')}: <span className="font-numeric text-[var(--clay)]">{engine.state.wrongCount}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
