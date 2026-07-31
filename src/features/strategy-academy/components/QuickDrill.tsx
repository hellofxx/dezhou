import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Target, RotateCcw, Trophy, Clock, Award, CheckCircle2, Sparkles, Gift } from 'lucide-react';
import { useAcademyStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
import { usePuzzleStore } from '@/features/puzzle-trainer/store';
import { getQuickDrillQuestions } from '../utils/quickDrill';
// P1-4.2: SRS 复习队列混合
import { composeDailyMix } from '@/features/progress/utils/dailyTrainingMix';
import { getTodayReviewItems } from '@/features/progress/utils/spacedRepetition';
import type { ReviewItem } from '@/features/progress/utils/spacedRepetition';
import { PracticeDrillComponent } from './PracticeDrill';
import type { PracticeResult, PracticeDrill, PracticeQuestion, QuestionDifficulty } from '../types';
// P2-5.4: Session 止损守卫
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/SessionLimitGuard';

type QuickDrillMode = 'range' | 'odds' | 'mixed';

/**
 * P1-4.1: 计算快速训练综合分数。
 *
 * 公式：accuracy * 100 + 时间奖励
 *   - 时间奖励：每比 10s/题 快 1s 得 3 分，最高 30 分（avgTime=0 时）
 *   - 满分约 130（全对 + 极快）
 */
function computeQuickDrillScore(accuracy: number, averageTime: number): number {
  const timeBonus = Math.max(0, Math.round((10 - averageTime) * 3));
  return Math.round(accuracy * 100) + timeBonus;
}

/**
 * P1-4.2: 将 ReviewItem 转换为 PracticeQuestion。
 *
 * 复习题通常没有完整的 scenario（手牌/位置/底池），合成一个占位场景，
 * 把题目文本放在 previousActions 中显示。仅支持带 metadata.options 的选择题。
 */
function reviewItemToPracticeQuestion(item: ReviewItem): PracticeQuestion | null {
  if (!item.metadata?.options || item.metadata.options.length === 0) return null;
  return {
    id: `review-${item.id}`,
    scenario: {
      heroHand: ['As', 'Ks'], // 占位卡片（复习题不依赖具体场景）
      heroPosition: 'BTN',
      previousActions: [
        { player: '📚 复习', action: item.metadata.front ?? item.label },
      ],
      street: 'preflop',
      potSize: 0,
      effectiveStack: 0,
    },
    options: item.metadata.options.map((opt) => ({
      action: opt.text,
      isCorrect: opt.isCorrect,
      explanation: opt.explanation ?? '',
    })),
    difficulty: 'beginner',
  };
}

export default function QuickDrill() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // P0-5: 读取 URL query 参数支持快速模式
  const isQuickMode = searchParams.get('quick') === 'true';
  const modeParam = searchParams.get('mode');
  const mode: QuickDrillMode =
    modeParam === 'range' || modeParam === 'odds' || modeParam === 'mixed'
      ? modeParam
      : 'mixed';

  const { abilityAssessment, recordPracticeScore } = useAcademyStore();
  const onboarding = useProgressStore((s) => s.onboarding);
  const streak = useProgressStore((s) => s.streak);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);
  // P1-4.2: SRS 复习队列
  const reviewItems = useProgressStore((s) => s.reviewItems);
  const getStatsSummary = useProgressStore((s) => s.getStatsSummary);
  // P1-4.3: 快速训练连续打卡
  const recordQuickDrillCompletion = useProgressStore((s) => s.recordQuickDrillCompletion);
  // P1-4.1: Puzzle store 快速训练 Best Record
  const submitQuickDrillResult = usePuzzleStore((s) => s.submitQuickDrillResult);

  // P2-5.4: Session 止损 — 达到每日题量上限时禁止继续训练（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('beginner');
  // P0-5: 记录训练结果用于展示 XP
  const [finalResult, setFinalResult] = useState<PracticeResult | null>(null);
  // P1-4.1: 破纪录标记
  const [isNewRecord, setIsNewRecord] = useState(false);
  // P1-4.3: 连续 7 天奖励标记
  const [freezeRewarded, setFreezeRewarded] = useState(false);
  // P1-4.3: 当前快速训练连续天数（用于结果展示）
  const [currentQuickDrillStreak, setCurrentQuickDrillStreak] = useState(0);

  // 根据能力评估确定弱点领域
  const weakAreas = useMemo(() => {
    const areas: string[] = [];
    const threshold = 60;
    if (abilityAssessment.rangeKnowledge < threshold) areas.push('rangeKnowledge');
    if (abilityAssessment.oddsCalculation < threshold) areas.push('oddsCalculation');
    if (abilityAssessment.gtoUnderstanding < threshold) areas.push('gtoUnderstanding');
    if (abilityAssessment.positionalPlay < threshold) areas.push('positionalPlay');
    if (abilityAssessment.emotionalControl < threshold) areas.push('emotionalControl');
    return areas;
  }, [abilityAssessment]);

  // P0-5: 快速模式下根据 onboarding.initialAbility 与 streak 自适应难度
  const autoDifficulty = useMemo<QuestionDifficulty>(() => {
    const { initialAbility } = onboarding;
    const avgAbility =
      (initialAbility.rangeKnowledge +
        initialAbility.oddsCalculation +
        initialAbility.gtoUnderstanding +
        initialAbility.positionalPlay) / 4;
    if (streak.currentStreak >= 7 && avgAbility >= 70) return 'advanced';
    if (streak.currentStreak < 3 || avgAbility < 50) return 'beginner';
    return 'intermediate';
  }, [onboarding, streak.currentStreak]);

  // P0-5: 根据 mode 映射到对应的弱点领域过滤
  const modeWeakAreas = useMemo<string[]>(() => {
    if (!isQuickMode) return weakAreas;
    switch (mode) {
      case 'range':
        return ['rangeKnowledge'];
      case 'odds':
        return ['oddsCalculation'];
      case 'mixed':
      default:
        return [];
    }
  }, [isQuickMode, mode, weakAreas]);

  // 快速模式优先使用自适应难度；普通模式使用用户选择难度
  // P4 修复（4.5-P1-3）：连续答错 ≥ 3 次时强制降级（不低于 beginner）
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  const effectiveDifficulty: QuestionDifficulty = (() => {
    const base = isQuickMode ? autoDifficulty : difficulty;
    if (shouldDownshiftDifficulty() && base !== 'beginner') {
      return base === 'advanced' ? 'intermediate' : 'beginner';
    }
    return base;
  })();

  // P0-5: 快速模式固定 5 题，普通模式 8 题
  const questionCount = isQuickMode ? 5 : 8;

  // P1-4.2: 今日待复习项（在 quick 模式下用于混合）
  const todayReviewItems = useMemo(() => getTodayReviewItems(reviewItems), [reviewItems]);

  // 用户最近正确率（用于 composeDailyMix 决定复习比例；快速模式下读取）
  const userAccuracy = useMemo(() => {
    if (!isQuickMode) return 1.0;
    return getStatsSummary().overallAccuracy || 1.0;
  }, [isQuickMode, getStatsSummary]);

  // 生成速训题目（P1-4.2: 快速模式下混合 SRS 复习题）
  const { drillQuestions, reviewCount } = useMemo(() => {
    const newQuestions = getQuickDrillQuestions(modeWeakAreas, effectiveDifficulty, questionCount);

    if (!isQuickMode || todayReviewItems.length === 0) {
      return { drillQuestions: newQuestions, reviewCount: 0 };
    }

    // 调用 composeDailyMix 决定复习题/新题比例（默认 30% 复习）
    const mix = composeDailyMix(newQuestions, todayReviewItems, questionCount, userAccuracy);

    // 将复习项转换为 PracticeQuestion（仅保留带 options 的选择题）
    const reviewQuestions: PracticeQuestion[] = todayReviewItems
      .slice(0, mix.reviewCount)
      .map(reviewItemToPracticeQuestion)
      .filter((q): q is PracticeQuestion => q !== null);

    // 复习题在前（作为热身），新题在后
    return {
      drillQuestions: [...reviewQuestions, ...mix.questions],
      reviewCount: reviewQuestions.length,
    };
  }, [modeWeakAreas, effectiveDifficulty, questionCount, isQuickMode, todayReviewItems, userAccuracy]);

  const drill: PracticeDrill = useMemo(() => ({
    id: `quick-drill-${Date.now()}`,
    questions: drillQuestions,
  }), [drillQuestions]);

  // P0-5: XP 计算 — 每题答对 +10 XP，全对额外 +20 XP
  const computeXp = useCallback((result: PracticeResult): number => {
    const base = result.correctAnswers * 10;
    const bonus = result.correctAnswers === result.totalQuestions ? 20 : 0;
    return base + bonus;
  }, []);

  const handleComplete = useCallback(
    (result: PracticeResult) => {
      recordPracticeScore({ ...result, lessonId: 'quick-drill' });
      setFinalResult(result);

      if (isQuickMode) {
        // P0-5: 快速训练完成自动计入 Streak（recordTrainingDay 内部已调用 checkMilestone）
        recordTrainingDay();

        // P1-4.1: 计算综合分数并提交到 puzzle store
        const score = computeQuickDrillScore(result.accuracy, result.averageTime);
        const timeTakenMs = Math.round(result.averageTime * result.totalQuestions * 1000);
        const recordResult = submitQuickDrillResult({
          score,
          accuracy: result.accuracy,
          timeTaken: timeTakenMs,
        });
        setIsNewRecord(recordResult.isNewRecord);

        // P1-4.3: 记录快速训练连续打卡（幂等，触发 7 天奖励）
        const completion = recordQuickDrillCompletion();
        setFreezeRewarded(completion.newBadge);
        setCurrentQuickDrillStreak(completion.quickDrillStreak);
      }

      setIsFinished(true);
    },
    [recordPracticeScore, recordTrainingDay, isQuickMode, submitQuickDrillResult, recordQuickDrillCompletion]
  );

  const handleRestart = () => {
    setIsStarted(false);
    setIsFinished(false);
    setFinalResult(null);
    setIsNewRecord(false);
    setFreezeRewarded(false);
    setCurrentQuickDrillStreak(0);
  };

  // 止损早退必须位于全部 hooks 之后：守卫状态在挂载期间翻转（答题中达上限/
  // 调试开关切换）时，hooks 数量变化会触发 "Rendered fewer hooks" 崩溃
  if (sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  if (isStarted && drill.questions.length > 0) {
    const earnedXp = finalResult ? computeXp(finalResult) : 0;
    const isAllCorrect = finalResult !== null && finalResult.correctAnswers === finalResult.totalQuestions;

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/academy')}
          className="flex items-center gap-1.5 text-sm text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('quickDrill.back', { defaultValue: '返回学院' })}
        </button>
        <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
          <PracticeDrillComponent
            drill={drill}
            lessonId="quick-drill"
            onComplete={handleComplete}
            adaptive
          />
          {isFinished && isQuickMode && finalResult && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6 rounded-lg border border-[var(--brass-bright)]/40 bg-gradient-to-br from-[var(--brass-dark)]/30 to-[var(--brass-bright)]/10 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-[var(--brass-bright)]" />
                <span className="font-display text-lg text-[var(--ivory)]">
                  {t('quickDrill.result.title', { defaultValue: '训练完成' })}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="rounded-md bg-[var(--walnut-raised)] p-3 text-center">
                  <p className="font-numeric text-2xl text-[var(--brass-bright)]">
                    {Math.round(finalResult.accuracy * 100)}%
                  </p>
                  <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                    <Target className="w-3 h-3" />
                    {t('quickDrill.result.accuracy', { defaultValue: '正确率' })}
                  </p>
                </div>
                <div className="rounded-md bg-[var(--walnut-raised)] p-3 text-center">
                  <p className="font-numeric text-2xl text-[var(--ivory)]">
                    {finalResult.averageTime.toFixed(1)}s
                  </p>
                  <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {t('quickDrill.result.time', { defaultValue: '平均用时' })}
                  </p>
                </div>
                <div className="rounded-md bg-[var(--walnut-raised)] p-3 text-center">
                  <p className="font-numeric text-2xl text-[var(--brass-bright)]">+{earnedXp}</p>
                  <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                    <Award className="w-3 h-3" />
                    {t('quickDrill.result.xp', { defaultValue: 'XP 获得' })}
                  </p>
                </div>
              </div>
              {isAllCorrect && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--brass-bright)]">
                  <Award className="w-3.5 h-3.5" />
                  {t('quickDrill.result.allCorrectBonus', { defaultValue: '全对 +20 XP 奖励' })}
                </div>
              )}
              {/* P1-4.2: 复习题提示 */}
              {reviewCount > 0 && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--info)]">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('quickDrill.result.reviewIncluded', {
                    defaultValue: '本次包含 {{count}} 道复习题',
                    count: reviewCount,
                  })}
                </div>
              )}
              {/* P1-4.1: 新纪录提示 */}
              {isNewRecord && (
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)]">
                  <Trophy className="w-3.5 h-3.5" />
                  {t('quickDrill.newRecord', { defaultValue: '🎉 快速训练新纪录！' })}
                </div>
              )}
              {/* P1-4.3: 连续 7 天奖励冻结卡 */}
              {freezeRewarded && (
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--success)]">
                  <Gift className="w-3.5 h-3.5" />
                  {t('quickDrill.freezeReward', {
                    defaultValue: '🎁 连续 7 天快速训练奖励 1 张冻结卡！',
                  })}
                </div>
              )}
              {/* P1-4.3: 连续天数展示（非奖励轮次也显示） */}
              {currentQuickDrillStreak > 0 && !freezeRewarded && (
                <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--ivory-muted)]">
                  <Zap className="w-3.5 h-3.5" />
                  {t('quickDrill.streak.current', {
                    defaultValue: '快速训练连续 {{count}} 天',
                    count: currentQuickDrillStreak,
                  })}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-xs text-[var(--success)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('quickDrill.result.streakRecorded', { defaultValue: '已计入连续训练 ✓' })}
              </div>
            </motion.div>
          )}
          {isFinished && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] text-sm hover:bg-[var(--walnut-raised)]/80"
              >
                <RotateCcw className="w-4 h-4" />
                {t('quickDrill.again', { defaultValue: '再来一轮' })}
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90"
              >
                {t('quickDrill.backHome', { defaultValue: '返回首页' })}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const modeLabel = isQuickMode
    ? t(`quickDrill.mode.${mode}`, {
        defaultValue: mode === 'range' ? '范围练习' : mode === 'odds' ? '赔率速算' : '混合训练',
      })
    : '';

  const difficultyLabel = effectiveDifficulty === 'beginner'
    ? t('quickDrill.difficulty.beginner', { defaultValue: '基础' })
    : effectiveDifficulty === 'intermediate'
      ? t('quickDrill.difficulty.intermediate', { defaultValue: '进阶' })
      : t('quickDrill.difficulty.advanced', { defaultValue: '高级' });

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] relative brass-rail overflow-hidden"
        >
          <div className="p-5 md:p-6">
            <button
              onClick={() => navigate(isQuickMode ? '/' : '/academy')}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isQuickMode
                ? t('quickDrill.backHome', { defaultValue: '返回首页' })
                : t('quickDrill.backAcademy', { defaultValue: '返回策略学院' })}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--brass)]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[var(--brass)]" />
              </div>
              <div>
                <h1 className="font-display text-2xl text-[var(--ivory)]">
                  {isQuickMode
                    ? t('quickDrill.quickTitle', { defaultValue: '3 分钟快速训练' })
                    : t('quickDrill.title', { defaultValue: '5 分钟速训' })}
                </h1>
                <p className="text-sm text-[var(--ivory-dim)] mt-0.5">
                  {isQuickMode
                    ? t('quickDrill.quickSubtitle', {
                        defaultValue: `每天 ${questionCount} 题，保持牌感 — ${modeLabel}`,
                      })
                    : t('quickDrill.subtitle', {
                        defaultValue: '从全局题库精选题目，针对弱点快速强化',
                      })}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Config */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-5 space-y-4"
        >
          {/* P0-5: 快速模式下隐藏难度选择器，显示自适应难度信息 */}
          {isQuickMode ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--ivory-dim)]">
                {t('quickDrill.adaptiveDifficulty', { defaultValue: '自适应难度' })}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--brass-bright)]/15 text-[var(--brass-bright)] font-medium">
                {difficultyLabel}
              </span>
            </div>
          ) : (
            <div>
              <p className="text-xs text-[var(--ivory-dim)] mb-2">
                {t('quickDrill.selectDifficulty', { defaultValue: '选择难度' })}
              </p>
              <div className="flex gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      difficulty === d
                        ? 'bg-[var(--brass-bright)] text-[var(--felt-deep)]'
                        : 'bg-[var(--walnut-raised)] text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
                    }`}
                  >
                    {d === 'beginner'
                      ? t('quickDrill.difficulty.beginner', { defaultValue: '基础' })
                      : d === 'intermediate'
                        ? t('quickDrill.difficulty.intermediate', { defaultValue: '进阶' })
                        : t('quickDrill.difficulty.advanced', { defaultValue: '高级' })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weak areas info */}
          {!isQuickMode && weakAreas.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-[var(--ivory-muted)]">
              <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass)]" />
              <span>{t('quickDrill.weakAreasHint', { defaultValue: '将优先从你的薄弱领域抽取题目' })}</span>
            </div>
          )}

          {/* P0-5: 快速模式下显示 mode 信息 */}
          {isQuickMode && (
            <div className="flex items-start gap-2 text-xs text-[var(--ivory-muted)]">
              <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass)]" />
              <span>
                {t('quickDrill.modeHint', {
                  defaultValue: '当前模式：{{mode}}，已完成今日训练将自动计入连续天数',
                  mode: modeLabel,
                })}
              </span>
            </div>
          )}

          {/* P1-4.2: 快速模式下显示复习题混合提示 */}
          {isQuickMode && todayReviewItems.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-[var(--info)]">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {t('quickDrill.reviewQueueHint', {
                  defaultValue: '今日有 {{count}} 道待复习题，将自动混合 30% 进入本次训练',
                  count: todayReviewItems.length,
                })}
              </span>
            </div>
          )}

          {/* Question count */}
          <div className="text-xs text-[var(--ivory-dim)]">
            {t('quickDrill.questionCount', { defaultValue: '本次速训' })}：
            <span className="font-numeric text-[var(--ivory)]">
              {Math.min(drillQuestions.length, questionCount)}
            </span>{' '}
            {t('quickDrill.questions', { defaultValue: '道题目' })}
          </div>

          {/* Start button */}
          <button
            onClick={() => setIsStarted(true)}
            disabled={drillQuestions.length === 0}
            className="w-full py-3 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {drillQuestions.length > 0
              ? t('quickDrill.start', { defaultValue: '开始速训' })
              : t('quickDrill.noQuestions', { defaultValue: '暂无可用题目' })}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
