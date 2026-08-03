/**
 * 每日谜题：基于日期种子，当天题目固定。
 *
 * - 完成后显示详细解析（已在 PuzzleCard 内实现）
 * - 完成状态持久化（在 store 中记录 dailyCompleted: { [dateKey]: true }）
 * - 当日重复做不改变完成状态（已完成时显示"今日已完成 ✓"但仍可查看题目）
 * - 显示"今日已有 XXX 人完成"（基于 dateSeed 生成 100-999 之间）
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { PuzzleCard } from './PuzzleCard';
import { PuzzleResult } from './PuzzleResult';
import { usePuzzleEngine } from '../hooks/usePuzzleEngine';
// 会话接线（选中项 / recordAnswer / 完成提交 / emit）下沉至 usePuzzleSession
import { usePuzzleSession } from '../hooks/usePuzzleSession';
import { getDailyKey } from '../data/dailyPuzzles';
import { getDailyCompletionCount } from '../utils/dateSeed';
import { usePuzzleStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
// P2-5.4: Session 止损守卫（谜题三模式与其他训练模块同口径）
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/gate/SessionLimitGuard';

export default function DailyPuzzle() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 获取今日题目（用于引擎初始化前显示日期信息）
  // P1D-07 修复：today/dateKey 改为 state，重试时刷新；旧实现 mount 时冻结，
  // 跨午夜 retry 会抽今天的题却 markDailyCompleted(昨天)
  const [today, setToday] = useState(() => new Date());
  const dateKey = useMemo(() => getDailyKey(today), [today]);
  const completionCount = useMemo(() => getDailyCompletionCount(today), [today]);

  const engine = usePuzzleEngine({ mode: 'daily' });
  const isDailyCompleted = usePuzzleStore((s) => s.isDailyCompleted);
  const markDailyCompleted = usePuzzleStore((s) => s.markDailyCompleted);
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  // P2-5.4: 每日题量上限（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

  const alreadyCompleted = isDailyCompleted(dateKey);

  // 会话接线：选中状态 / recordAnswer / 完成提交（submitResult + recordTrainingDay + emit）
  const { finalResult, selectedOptionId, handleSelect, handleRetry } = usePuzzleSession(engine, {
    // P1D-07 修复：完成时实时计算 dateKey（不用 mount 时冻结值），
    // 避免跨午夜会话把完成标记写到错误日期；标记本身幂等
    onComplete: () => markDailyCompleted(getDailyKey(new Date())),
    // P1D-07 修复：重试时同步刷新 today/dateKey，与 engine.reset()
    // 重抽的题目（内部用 new Date()）保持同一天
    onRetry: () => setToday(new Date()),
  });

  const handleNext = () => {
    engine.next();
  };

  // 每日题量上限（P1D-06 专批 B：开局判定）：挂载时已达上限则拦在开始前；
  // 进行中会话不再中途拦断（hook 内 mount 快照冻结），走完结算后下次进入再拦；
  // 早退位于全部 hooks 之后，避免守卫翻转触发 hooks 数量变化崩溃
  if (!finalResult && sessionLimitReached) {
    return <SessionLimitGuard />;
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
        {t('puzzle.daily.noQuestions')}
      </div>
    );
  }

  const progressValue =
    engine.state.questions.length > 0
      ? ((engine.state.currentIndex + (engine.isCurrentAnswered ? 1 : 0)) / engine.state.questions.length) * 100
      : 0;

  return (
    <div className="h-full overflow-auto">
      <div className="py-4 space-y-3">
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
          <h2 className="font-display text-base text-[var(--ivory)] tracking-wide">
            {t('puzzle.daily.title')}
          </h2>
          <div className="text-xs text-[var(--ivory-dim)] font-numeric">{dateKey}</div>
        </div>

        {/* 状态卡片：完成人数 + 今日已完成 */}
        <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-[var(--brass-bright)]" />
              <span className="text-[var(--ivory-muted)]">
                {t('puzzle.daily.completionCount', { count: completionCount })}
              </span>
            </div>
            {alreadyCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--success)]/15 text-[var(--success)] text-xs font-display"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('puzzle.daily.alreadyCompleted')}
              </motion.div>
            )}
          </CardContent>
        </Card>

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

        {/* 提示：今日题目固定 */}
        <p className="text-center text-[10px] text-[var(--ivory-dim)]/70 pt-1">
          {t('puzzle.daily.fixedHint')}
        </p>
      </div>
    </div>
  );
}
