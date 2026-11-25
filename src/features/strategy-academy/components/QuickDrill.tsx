import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { motion } from 'framer-motion';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { Zap, Target, Sparkles } from 'lucide-react';
import { useAcademyStore } from '../store';
import { useAcademyCourseI18n } from '../hooks/useAcademyCourseI18n';
import { useAcademyLessonsForQuickDrill } from '../hooks/useAcademyLessons';
import { deriveAcademyCourseFilesForQuickDrill } from '@/i18n/academyCourse';
import { progressCommands, useProgressState } from '@/features/progress';
import { getLessonMeta } from '../data/lessonMeta';
import { computeQuickDrillScore, getQuickDrillQuestions } from '../utils/quickDrill';
// P1-4.2: SRS 复习队列混合（P1E-04: 混合+回填抽出为纯函数 composeQuickDrillQuestions）
import { composeQuickDrillQuestions } from '../utils/quickDrillMix';
import { getTodayReviewItems } from '@/shared/utils/spacedRepetition';
// P1E-05（专批 B）：review-* 复习题作答后回写 SRS（推进 nextReviewDate）
import { computeReviewWriteBacks } from '../utils/quickDrillSrs';
import { PracticeDrillComponent } from './PracticeDrill';
import QuickDrillResultSlip from './QuickDrillResultSlip';
import type { EloDimension } from '@/shared/types/elo';
import type { PracticeResult, PracticeDrill, QuestionDifficulty } from '../types';
// P2-5.4: Session 止损守卫
import { SessionLimitGuard, useSessionLimitReached } from '@/features/progress/sessionLimit';

type QuickDrillMode = 'range' | 'odds' | 'mixed';

/** ELO 五维（弱点维度判定与 mode 映射的遍历源） */
const ELO_DIMENSIONS: readonly EloDimension[] = ['preflop', 'postflop', 'math', 'handReading', 'mental'];

const MODE_LABEL_DEFAULTS: Record<QuickDrillMode, string> = {
  range: '翻前',
  odds: '数学',
  mixed: '混合',
};

const DIFFICULTY_LABEL_DEFAULTS: Record<QuestionDifficulty, string> = {
  beginner: '基础',
  intermediate: '进阶',
  advanced: '高级',
};

export default function QuickDrill() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  // P0-5: 读取 URL query 参数支持快速模式
  const isQuickMode = searchParams.get('quick') !== 'false';
  const modeParam = searchParams.get('mode');
  const mode: QuickDrillMode =
    modeParam === 'range' || modeParam === 'odds' || modeParam === 'mixed'
      ? modeParam
      : 'mixed';

  const { recordPracticeScore } = useAcademyStore();
  // P0 口径：弱点维度与自适应难度改读 progress 标准变体 ELO（eloByVariant 单一事实源），
  // 不再读 strategy 能力评估 / onboarding.initialAbility
  const standardElo = useProgressState((s) => s.eloByVariant.standard);
  const recordTrainingDay = progressCommands.recordTrainingDay;
  // P1-4.2: SRS 复习队列
  const reviewItems = useProgressState((s) => s.reviewItems);
  const getStatsSummary = useProgressState((s) => s.getStatsSummary);
  // 仅订阅记录数：弱项快照由 store 派生，组件不持有全量 records（无上限数组）
  const recordCount = useProgressState((s) => s.records.length);
  const getLearningWeaknessSnapshot = useProgressState((s) => s.getLearningWeakness);
  const weakness = useMemo(
    () => getLearningWeaknessSnapshot(),
    [getLearningWeaknessSnapshot, recordCount],
  );
  // P1-4.3: 快速训练连续打卡
  const recordQuickDrillCompletion = progressCommands.recordQuickDrillCompletion;
// P1-4.1: Progress store 快速训练 Best Record
  const submitQuickDrillResult = progressCommands.submitQuickDrillResult;

  // P2-5.4: Session 止损 — 达到每日题量上限时禁止继续训练（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

  const contentReady = useAcademyCourseI18n(deriveAcademyCourseFilesForQuickDrill());
  const lessons = useAcademyLessonsForQuickDrill();
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
  // 弱点维度（ELO）：低于五维均值的维度；五维齐平（新用户）时无弱点，走全题库。
  // 维度 → 课时映射由 getQuickDrillQuestions 经 lessonMeta 完成。
  const weakAreas = useMemo<EloDimension[]>(() => {
    const dimensions = ELO_DIMENSIONS.filter((dimension) => standardElo[dimension] < standardElo.overall);
    // 取最低的 2 个维度：弱点过多时仍保留足够候选池（回填兜底见 getQuickDrillQuestions）
    return [...dimensions]
      .sort((a, b) => standardElo[a] - standardElo[b])
      .slice(0, 2);
  }, [standardElo]);

  // P0-5: 快速模式下按标准变体 ELO 综合分自适应难度（<700 入门 / <1200 进阶 / 其余高级）
  const autoDifficulty = useMemo<QuestionDifficulty>(() => {
    if (standardElo.overall >= 1200) return 'advanced';
    if (standardElo.overall >= 700) return 'intermediate';
    return 'beginner';
  }, [standardElo.overall]);

  // P0-5: 根据 mode 映射到对应的弱点领域过滤
  const modeWeakAreas = useMemo<EloDimension[]>(() => {
    if (!isQuickMode) return weakAreas;
    switch (mode) {
      case 'range':
        return ['preflop'];
      case 'odds':
        return ['math'];
      case 'mixed':
      default:
        return [];
    }
  }, [isQuickMode, mode, weakAreas]);

  // 快速模式优先使用自适应难度；普通模式使用用户选择难度
  // P4 修复（4.5-P1-3）：连续答错 ≥ 3 次时强制降级（不低于 beginner）
  const shouldDownshiftDifficulty = progressCommands.shouldDownshiftDifficulty;
  const effectiveDifficulty: QuestionDifficulty = (() => {
    const base = isQuickMode ? autoDifficulty : difficulty;
    if (shouldDownshiftDifficulty() && base !== 'beginner') {
      return base === 'advanced' ? 'intermediate' : 'beginner';
    }
    return base;
  })();

  // P0-5: 快速模式固定 5 题，普通模式 8 题
  const questionCount = isQuickMode ? 5 : 8;

  // 速训 range/odds 模式下弱项聚焦仍受模式维度约束，避免非该维度课程顶到题首
  const focusLessonIds = useMemo(() => {
    if (!isQuickMode || mode === 'mixed') return weakness.lessonIds;
    return weakness.lessonIds.filter((lessonId) =>
      modeWeakAreas.includes(getLessonMeta(lessonId).eloDimension),
    );
  }, [isQuickMode, mode, modeWeakAreas, weakness.lessonIds]);

  // 仅推荐当前难度确有可用题目的弱项课程，避免展示无法执行的建议
  const focusLesson = useMemo(() => {
    if (lessons === null) return null;
    for (const lessonId of focusLessonIds) {
      const lesson = lessons.find((item) => item.id === lessonId);
      if (lesson?.practice?.questions.some(
        (question) => !question.difficulty || question.difficulty === effectiveDifficulty,
      )) {
        return lesson;
      }
    }
    return null;
  }, [lessons, focusLessonIds, effectiveDifficulty]);

  // P1-4.2: 今日待复习项（在 quick 模式下用于混合）
  const todayReviewItems = useMemo(() => getTodayReviewItems(reviewItems), [reviewItems]);

  // 用户最近正确率（用于 composeDailyMix 决定复习比例；快速模式下读取）
  // P1E-11: 正确率 0 是有效数据，仅无答题记录（totalQuestions === 0）时才用默认值 1.0，
  // 避免 `|| 1.0` 把真实零正确率误判为无数据
  // recordCount 作为失效键：新增记录后重算，避免快速模式跨会话读到陈旧正确率
  const userAccuracy = useMemo(() => {
    if (!isQuickMode) return 1.0;
    const summary = getStatsSummary();
    return summary.totalQuestions > 0 && Number.isFinite(summary.overallAccuracy)
      ? summary.overallAccuracy
      : 1.0;
  }, [isQuickMode, getStatsSummary, recordCount]);

  // 生成速训题目（P1-4.2: 快速模式下混合 SRS 复习题）
  // P1E-04: 混合+缺口回填由 composeQuickDrillQuestions 纯函数完成（无 options 的
  // 复习项被丢弃后按缺口从新题池回填，保证快速 5 题 / 普通 8 题的题数契约）
  const { drillQuestions, reviewCount } = useMemo(() => {
    const newQuestions = getQuickDrillQuestions(
      lessons ?? [],
      modeWeakAreas,
      effectiveDifficulty,
      questionCount,
      [],
      focusLessonIds,
    );

    if (!isQuickMode || todayReviewItems.length === 0) {
      return { drillQuestions: newQuestions, reviewCount: 0 };
    }

    const mixed = composeQuickDrillQuestions(newQuestions, todayReviewItems, questionCount, userAccuracy);
    return { drillQuestions: mixed.questions, reviewCount: mixed.reviewCount };
  }, [lessons, modeWeakAreas, effectiveDifficulty, questionCount, isQuickMode, todayReviewItems, userAccuracy, focusLessonIds]);

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
      recordPracticeScore({ ...result, lessonId: 'quick-drill' }, 'quick-drill');
      setFinalResult(result);

      // P1E-07（专批 B）：训练日 streak 口径统一 — 普通模式完成同样是实质训练，
      // 与快速模式/theory 等模块一致计入训练日（recordTrainingDay 幂等，同日重复安全）
      recordTrainingDay();

      // P1E-05（专批 B）：review-* 复习题 SRS 回写闭环 — 按逐题作答明细推进
      // ReviewItem（SM-2：对+快→5 / 对→4 / 错→1）。普通模式不混复习题，天然无操作。
      const writeBacks = computeReviewWriteBacks(
        progressCommands.getReviewItemsSnapshot(),
        result.answers ?? [],
      );
      writeBacks.forEach((item) => progressCommands.updateReviewItem(item));

      if (isQuickMode) {
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
  if (lessons === null || !contentReady) return <div className="py-6"><PageSkeleton /></div>;

  if (sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  if (isStarted && drill.questions.length > 0) {
    const earnedXp = finalResult ? computeXp(finalResult) : 0;

    return (
      <div className="py-6">
        <BackLink
          onClick={() => navigate(isQuickMode ? '/' : '/academy')}
          label={isQuickMode ? t('quickDrill.backHome', { defaultValue: '返回首页' }) : t('quickDrill.back', { defaultValue: '返回实战地图' })}
          size="md"
          className="mb-4"
        />
        <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-6">
          <PracticeDrillComponent
            drill={drill}
            lessonId="quick-drill"
            onComplete={handleComplete}
            // P1E-06: 题目已由 QuickDrill 按自适应难度选定（含复习题在前的顺序契约），
            // 禁用 PracticeDrill 内部的 adaptive 重选重排，避免复习题前置顺序被打乱
            adaptive={false}
          />
          {finalResult ? (
            <QuickDrillResultSlip
              open={isFinished}
              result={finalResult}
              earnedXp={earnedXp}
              reviewCount={reviewCount}
              isNewRecord={isNewRecord}
              freezeRewarded={freezeRewarded}
              quickDrillStreak={currentQuickDrillStreak}
              onRetry={handleRestart}
              onClose={() => navigate('/')}
            />
          ) : null}
        </div>
      </div>
    );
  }

  const modeLabel = isQuickMode
    ? t(`quickDrill.mode.${mode}`, { defaultValue: MODE_LABEL_DEFAULTS[mode] })
    : '';

  const difficultyLabel = t(`quickDrill.difficulty.${effectiveDifficulty}`, {
    defaultValue: DIFFICULTY_LABEL_DEFAULTS[effectiveDifficulty],
  });

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="walnut-panel rounded-lg border border-[var(--walnut-border)] relative brass-rail overflow-hidden"
        >
          <div className="p-5 md:p-6">
            <BackLink
              onClick={() => navigate(isQuickMode ? '/' : '/academy')}
              label={
                isQuickMode
                  ? t('quickDrill.backHome', { defaultValue: '返回首页' })
                  : t('quickDrill.backAcademy', { defaultValue: '返回实战地图' })
              }
              className="mb-4"
            />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--brass)]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[var(--brass-text)]" />
              </div>
              <div>
                <h2 className="font-display text-2xl text-[var(--ivory)]">
                  {isQuickMode
                    ? t('quickDrill.quickTitle', { defaultValue: '5 题速训' })
                    : t('quickDrill.title', { defaultValue: '5 分钟速训' })}
                </h2>
                <p className="text-sm text-[var(--ivory-dim)] mt-0.5">
                  {isQuickMode
                    ? t('quickDrill.quickSubtitle', {
                        defaultValue: `每天 ${questionCount} 题，课程弱项 + SRS — ${modeLabel}`,
                        count: questionCount,
                        mode: modeLabel,
                      })
                    : t('quickDrill.subtitle', {
                        defaultValue: '从策略课程选题，针对课程弱项快速强化',
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
              <div className="flex flex-wrap gap-2">
                {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      difficulty === d
                        ? 'bg-[var(--brass-fill)] text-[var(--brass-fill-ink)]'
                        : 'bg-[var(--walnut-raised)] text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
                    }`}
                  >
                    {t(`quickDrill.difficulty.${d}`, { defaultValue: DIFFICULTY_LABEL_DEFAULTS[d] })}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Weak areas info */}
          {!isQuickMode && weakAreas.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-[var(--ivory-muted)]">
              <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass-text)]" />
              <span>{t('quickDrill.weakAreasHint', { defaultValue: '将优先从你的薄弱领域抽取题目' })}</span>
            </div>
          )}

          {/* 训练弱项回流：仅展示当前难度有可用题目的课程 */}
          {focusLesson ? (
            <div className="flex items-start gap-2 text-xs text-[var(--ivory-muted)]">
              <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass-text)]" />
              <span>
                {t('quickDrill.recommendation.focusLesson', {
                  defaultValue: '优先复习你在扑克谜题中暴露的弱项：{{lessonTitle}}',
                  lessonTitle: t(`academy.lessonTitle.${focusLesson.id}`, {
                    defaultValue: focusLesson.title,
                  }),
                })}
              </span>
            </div>
          ) : null}

          {/* P0-5: 快速模式下显示 mode 信息 */}
          {isQuickMode && (
            <div className="flex items-start gap-2 text-xs text-[var(--ivory-muted)]">
              <Target className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brass-text)]" />
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
            {t('quickDrill.questionCount', { defaultValue: '本次速训：' })}
            <span className="font-numeric text-[var(--ivory)]">
              {Math.min(drillQuestions.length, questionCount)}
            </span>{' '}
            {t('quickDrill.questions', { defaultValue: '道题目' })}
          </div>

          {/* Start button */}
          <button
            onClick={() => setIsStarted(true)}
            disabled={drillQuestions.length === 0}
            className="w-full py-3 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {drillQuestions.length > 0
              ? t('quickDrill.start', { defaultValue: '开始速训' })
              : t('quickDrill.noQuestions', { defaultValue: '暂无可用题目' })}
          </button>
          <Link
            to={isQuickMode ? '/quick?quick=false' : '/quick'}
            className="block text-center text-xs text-[var(--ivory-muted)] underline-offset-4 hover:text-[var(--brass-bright)] hover:underline"
          >
            {isQuickMode
              ? t('quickDrill.fullPractice', { defaultValue: '完整练习（8 题）' })
              : t('quickDrill.quickPractice', { defaultValue: '返回 5 题速训' })}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
