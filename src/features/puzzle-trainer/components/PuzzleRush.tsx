/**
 * Puzzle Rush：3/5 分钟限时模式。
 *
 * - 顶部倒计时（mm:ss 格式，每秒更新）
 * - 3 条命显示
 * - 连对 5 题奖励 +10 秒（视觉反馈"⚡ +10s"）
 * - 答错扣 1 条命，命耗尽或时间到结束
 * - 题目难度递增
 * - 结束后跳转到 PuzzleResult
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { PuzzleCard } from './PuzzleCard';
import { PuzzleResult } from './PuzzleResult';
import { usePuzzleEngine } from '../hooks/usePuzzleEngine';
import { RUSH_DURATIONS } from '../data/rushQuestions';
import { usePuzzleStore } from '../store';
import type { PuzzleResult as PuzzleResultType } from '../types';
import { useProgressStore } from '@/features/progress/store';

export default function PuzzleRush() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 解析时长参数：?duration=3 | 5（分钟）
  const durationMinutes = (() => {
    const raw = searchParams.get('duration');
    if (raw === '5') return 5;
    return 3; // 默认 3 分钟
  })();
  const durationMs = durationMinutes === 5
    ? RUSH_DURATIONS.fiveMinutes
    : RUSH_DURATIONS.threeMinutes;

  const engine = usePuzzleEngine({ mode: 'rush', duration: durationMs });
  const submitResult = usePuzzleStore((s) => s.submitResult);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);

  // 完成后的结果（在组件内显示，避免路由跳转的瞬时白屏）
  const [finalResult, setFinalResult] = useState<PuzzleResultType | null>(null);

  // 选择状态：跟踪当前题用户选中的 optionId
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // 当题切换时重置 selectedOptionId
  useEffect(() => {
    setSelectedOptionId(null);
  }, [engine.state.currentIndex]);

  // 引擎结束时构建结果并提交
  useEffect(() => {
    if (engine.state.status !== 'playing' && !finalResult) {
      const result = engine.buildResult();
      const submitRes = submitResult(result);
      // 计入 Streak（一次完整 Puzzle Rush 算一次训练）
      recordTrainingDay();
      setFinalResult({ ...result, _isNewRecord: submitRes.isNewRecord } as PuzzleResultType & { _isNewRecord: boolean });
    }
  }, [engine.state.status, engine, finalResult, submitResult, recordTrainingDay]);

  // 倒计时格式化
  const timeDisplay = useMemo(() => {
    const total = Math.max(0, engine.state.timeRemaining);
    const minutes = Math.floor(total / 60000);
    const seconds = Math.floor((total % 60000) / 1000);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [engine.state.timeRemaining]);

  const totalTimeMs = durationMs;
  const progressValue = totalTimeMs > 0
    ? Math.max(0, Math.min(100, (engine.state.timeRemaining / totalTimeMs) * 100))
    : 0;

  // 时间紧急提示（< 30 秒变红）
  const isUrgent = engine.state.timeRemaining <= 30000;

  const handleSelect = (optionId: string) => {
    if (engine.isCurrentAnswered) return;
    setSelectedOptionId(optionId);
    engine.answer(optionId);
  };

  const handleNext = () => {
    engine.clearBonus();
    engine.next();
  };

  // 显示结果页
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
        {t('puzzle.rush.noQuestions')}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {/* 顶部栏：返回 / 标题 / 倒计时 */}
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
          <h2 className="font-display text-base text-[var(--ivory)] tracking-wide">
            {t('puzzle.rush.title', { minutes: durationMinutes })}
          </h2>
          <motion.div
            animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
            className={cnInline(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full font-numeric text-lg tracking-wider',
              isUrgent
                ? 'bg-[var(--clay)]/20 text-[var(--clay)] border border-[var(--clay)]/40'
                : 'bg-[var(--walnut)]/60 text-[var(--brass-bright)] border border-[var(--walnut-border)]'
            )}
          >
            <Clock className="w-4 h-4" />
            {timeDisplay}
          </motion.div>
        </div>

        {/* 倒计时进度条 */}
        <Progress
          value={progressValue}
          className={cnInline(
            'h-1.5',
            isUrgent ? '[&_[class*=indicator]]:bg-[var(--clay)]' : '[&_[class*=indicator]]:bg-[var(--brass-bright)]'
          )}
        />

        {/* 题目卡片 */}
        <PuzzleCard
          question={engine.currentQuestion}
          answerRecord={engine.currentAnswer}
          selectedOptionId={selectedOptionId}
          onSelectOption={handleSelect}
          onNext={handleNext}
          isLastQuestion={engine.state.currentIndex >= engine.state.questions.length - 1}
          rushMode
          lives={engine.state.lives}
          streak={engine.state.streak}
          questionProgress={{
            current: engine.state.currentIndex + 1,
            total: engine.state.questions.length,
          }}
          bonusFeedback={engine.lastBonus}
        />

        {/* 实时分数 */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[var(--ivory-dim)]">
          <span>
            {t('puzzle.rush.correct')}: <span className="font-numeric text-[var(--success)]">{engine.state.correctCount}</span>
          </span>
          <span>
            {t('puzzle.rush.wrong')}: <span className="font-numeric text-[var(--clay)]">{engine.state.wrongCount}</span>
          </span>
          <span>
            {t('puzzle.rush.streak')}: <span className="font-numeric text-[var(--brass-bright)]">{engine.state.streak}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/** 简易 cn 内联（避免循环导入问题，仅用于此处动态拼接） */
function cnInline(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
