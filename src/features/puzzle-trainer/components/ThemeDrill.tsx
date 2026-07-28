/**
 * 主题训练：从 URL params 读取 themeId，加载该主题的全部题目。
 *
 * - 完成后显示该主题的正确率与建议
 * - 主题题目数 15-30 题（P1 阶段每主题 15 题）
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { PuzzleCard } from './PuzzleCard';
import { PuzzleResult } from './PuzzleResult';
import { usePuzzleEngine } from '../hooks/usePuzzleEngine';
import { PUZZLE_THEMES, getThemeMeta } from '../data/puzzleBank';
import { usePuzzleStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingResult } from '@/shared/types/common';
import type { PuzzleResult as PuzzleResultType, PuzzleTheme } from '../types';

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
  const submitResult = usePuzzleStore((s) => s.submitResult);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);

  const [finalResult, setFinalResult] = useState<PuzzleResultType | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedOptionId(null);
  }, [engine.state.currentIndex]);

  // 记录答题到 progress store（用于自适应难度判定）
  useEffect(() => {
    if (engine.state.answers.length > 0) {
      const lastAnswer = engine.state.answers[engine.state.answers.length - 1];
      if (lastAnswer) {
        recordAnswer(lastAnswer.isCorrect);
      }
    }
  }, [engine.state.answers.length]);

  useEffect(() => {
    if (engine.state.status !== 'playing' && !finalResult) {
      const result = engine.buildResult();
      const submitRes = submitResult(result);
      recordTrainingDay();
      setFinalResult({ ...result, _isNewRecord: submitRes.isNewRecord } as PuzzleResultType & { _isNewRecord: boolean });
      // 发布训练事件到 progress store
      trainingEvents.emit(puzzleResultToTrainingRecord(result));
    }
  }, [engine.state.status, engine, finalResult, submitResult, recordTrainingDay]);

  const handleSelect = (optionId: string) => {
    if (engine.isCurrentAnswered) return;
    setSelectedOptionId(optionId);
    engine.answer(optionId);
  };

  const handleNext = () => {
    engine.next();
  };

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
    const enriched = finalResult as PuzzleResultType & { _isNewRecord?: boolean };
    return (
      <PuzzleResult
        result={enriched}
        isNewRecord={Boolean(enriched._isNewRecord)}
        onRetry={() => {
          setFinalResult(null);
          engine.reset();
        }}
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

/** 将 PuzzleResult 转换为 TrainingRecord 用于 trainingEvents.emit */
function puzzleResultToTrainingRecord(result: PuzzleResultType) {
  const trainingResult: TrainingResult = {
    sessionId: result.sessionId,
    module: 'puzzle-trainer',
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctCount,
    accuracy: result.accuracy,
    averageTime: result.averageTime / 1000, // 转换为秒
    timestamp: result.timestamp,
    details: result.answers.map((a) => ({
      question: a.questionId,
      isCorrect: a.isCorrect,
      timeTaken: a.timeTaken,
      userAnswer: a.selectedOptionId,
      correctAnswer: '',
    })),
  };
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    module: 'puzzle-trainer' as const,
    mode: result.mode,
    result: trainingResult,
    createdAt: Date.now(),
  };
}
