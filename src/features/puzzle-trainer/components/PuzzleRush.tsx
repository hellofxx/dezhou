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
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { MOTION_DURATION } from '@/shared/utils/motion';
// PZL-06：复用共享 cn 工具，消除本地 cnInline 重复实现
import { cn } from '@/shared/utils/cn';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { PuzzleCard } from './PuzzleCard';
import { PuzzleResult } from './PuzzleResult';
import { usePuzzleEngine } from '../hooks/usePuzzleEngine';
// 会话接线（选中项 / recordAnswer / 完成提交 / emit）下沉至 usePuzzleSession
import { usePuzzleSession } from '../hooks/usePuzzleSession';
import { RUSH_DURATIONS } from '../data/rushQuestions';
import { useProgressStore } from '@/features/progress/store';
// P2-5.4: Session 止损守卫（谜题三模式与其他训练模块同口径）
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/gate/SessionLimitGuard';

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
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  // P2-5.4: 每日题量上限（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

  // 会话接线：选中状态 / recordAnswer / 完成提交（submitResult + recordTrainingDay + emit）
  const { finalResult, selectedOptionId, handleSelect, handleRetry } = usePuzzleSession(engine);

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

  const handleNext = () => {
    engine.clearBonus();
    engine.next();
  };

  // 每日题量上限（P1D-06 专批 B：开局判定）：挂载时已达上限则拦在开始前；
  // 进行中会话不再中途拦断（hook 内 mount 快照冻结），走完结算后下次进入再拦；
  // 早退位于全部 hooks 之后，避免守卫翻转触发 hooks 数量变化崩溃
  if (!finalResult && sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  // 显示结果页
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
        {t('puzzle.rush.noQuestions')}
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="py-4 space-y-3 max-w-3xl mx-auto">
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
            transition={{ duration: MOTION_DURATION.slow, repeat: isUrgent ? Infinity : 0 }}
            className={cn(
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
          className={cn(
            'h-1.5',
            isUrgent ? '[&_[class*=indicator]]:bg-[var(--clay)]' : '[&_[class*=indicator]]:bg-[var(--brass-bright)]'
          )}
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
