import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trans, useTranslation } from 'react-i18next';
import { t } from 'i18next';
import { XCircle, ArrowRight, Trophy, Clock, Target, Zap, Keyboard } from 'lucide-react';
import type { PracticeDrill as PracticeDrillType, PracticeQuestion, PracticeOption, PracticeResult, PracticeAnswerDetail, QuestionDifficulty } from '../types';
import { PokerCard } from '@/shared/components/poker/Card';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { Position } from '@/shared/types/position';
import { stringToCard } from '@/shared/utils/deck';
import { cn } from '@/shared/utils/cn';
import { formatBB } from '@/shared/utils/formatters';
import { Chip } from '@/shared/components/poker/Chip';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { MOTION_DURATION, MOTION_EASE, transitionStandard, transitionSlow } from '@/shared/utils/motion';
import { soundManager } from '@/shared/utils/soundManager';
import { useProgressStore } from '@/features/progress/store';
import { useAcademyStore } from '../store';
import { getCurrentDifficulty, selectQuestionsByDifficulty, shouldRecommendReview } from '../utils/adaptiveDifficulty';
import { orderPracticeOptions } from '../utils/practiceOptionOrder';
import { resolvePracticeQuestion } from '../utils/contentKeys';
// P1E-13: 超时判分口径（超时恒判错，对齐 range-trainer P1A-02）
import { gradePracticeSelection, pickTimeoutFallbackOption } from '../utils/practiceGrading';
// P2-03: 五级反馈呈现（三态诚实渲染，shared 层评级事实源由该 util 内部消费）
import { resolvePracticeFeedbackView } from '../utils/practiceFeedbackView';
// evImpact 自由文本着色（禁 startsWith('+') 误判零值与叙述值）
import { evImpactToneClass } from '../utils/evImpactTone';
// P2-03: 难度变化阶梯图（结果页展示）
import { DifficultyStairChart, type DifficultyChange } from './DifficultyStairChart';

export type DrillMode = 'normal' | 'pressure';

interface PracticeDrillProps {
  drill: PracticeDrillType;
  lessonId: string;
  mode?: DrillMode;
  onComplete: (result: PracticeResult) => void;
  adaptive?: boolean;
  // P3: 降级建议复习 → 常驻提示条（替代 4 秒 toast），点击「返回复习」时携带建议主题回传
  onReviewRequest?: (topics: string[]) => void;
}

// UI-06：brass glow 关键帧（--brass 色相 rgba(201,162,94)）。framer-motion 插值需数值 keyframes，
// CSS 变量无法用于动画插值，故集中为命名常量并锚定语义（仅此一处动画阴影）。
const BRASS_GLOW_KEYFRAMES: string[] = [
  '0 0 0px rgba(201,162,94,0)',
  '0 0 14px rgba(201,162,94,0.45)',
  '0 0 0px rgba(201,162,94,0)',
];

// P2-05: 动作按钮语义分类（题库 action 值多样：'fold'/'raise 2.5BB'/'Bet 4BB（33% pot）'/中文等，
// 精确匹配会让绝大多数选项落入 fallback；按语义关键词归类到 §5.5 平权色阶）
const ACTION_STYLES: Record<string, string> = {
  Fold: 'action-mini act-fold !px-4 !py-3 !text-sm !font-bold !rounded-lg',
  Call: 'action-mini act-call !px-4 !py-3 !text-sm !font-bold !rounded-lg',
  Raise: 'action-mini act-raise !px-4 !py-3 !text-sm !font-bold !rounded-lg',
  'All-in': 'action-mini act-allin !px-4 !py-3 !text-sm !font-bold !rounded-lg',
  Check: 'action-mini !px-4 !py-3 !text-sm !font-bold !rounded-lg border border-[var(--poker-info)]/50 bg-[var(--poker-info-bg)] text-[var(--poker-info)] hover:bg-[var(--poker-info)]/20',
};

type ActionKind = 'fold' | 'call' | 'raise' | 'allin' | 'check';

function classifyActionKind(action: string): ActionKind {
  const a = action.toLowerCase();
  // 英文关键词匹配（与数据层语义对齐）
  if (a.includes('all-in') || a.includes('allin') || a.startsWith('push')) return 'allin';
  if (a.startsWith('fold') || a.startsWith('tank then')) return 'fold';
  if (a.startsWith('call') || a.startsWith('limp')) return 'call';
  if (a.startsWith('check')) return 'check';
  // raise 类（覆盖 bet / squeeze / open / min-raise / overbet / donk / 加注 等）
  if (
    a.startsWith('raise') || a.startsWith('bet') ||
    a.startsWith('squeeze') || a.startsWith('open') ||
    a.startsWith('min-raise') || a.startsWith('overbet') || a.startsWith('donk') ||
    a.includes('raise')
  ) return 'raise';
  // LEGACY: 中文关键词匹配作为数据层迁移前的过渡兼容
  if (a.includes('全下')) return 'allin';
  if (a.startsWith('弃牌')) return 'fold';
  if (a.startsWith('跟注') || a.includes('平跟') || a.startsWith('仅跟注')) return 'call';
  if (a.startsWith('加注') || a.startsWith('下注') || a.includes('价值下注')) return 'raise';
  // 默认退回 raise（最保守分类）
  return 'raise';
}

const ACTION_KIND_STYLES: Record<ActionKind, string> = {
  fold: ACTION_STYLES['Fold']!,
  call: ACTION_STYLES['Call']!,
  raise: ACTION_STYLES['Raise']!,
  allin: ACTION_STYLES['All-in']!,
  check: ACTION_STYLES['Check']!,
};

function classifyAction(action: string): string {
  return ACTION_KIND_STYLES[classifyActionKind(action)];
}

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  beginner: 'text-[var(--success)]',
  intermediate: 'text-[var(--info)]',
  advanced: 'text-[var(--warning)]',
};

const DIFFICULTY_ORDER: QuestionDifficulty[] = ['beginner', 'intermediate', 'advanced'];

// P2-03: 难度 pill 常驻样式（12% 透底 + 1px 对应色 30% 边框；文字色沿用 DIFFICULTY_COLORS）
const DIFFICULTY_PILL_BG: Record<QuestionDifficulty, string> = {
  beginner: 'bg-[var(--poker-success-bg)]',
  intermediate: 'bg-[var(--poker-info-bg)]',
  advanced: 'bg-[var(--warning)]/10',
};

const DIFFICULTY_PILL_BORDER: Record<QuestionDifficulty, string> = {
  beginner: 'border-[var(--poker-success)]/30',
  intermediate: 'border-[var(--poker-info)]/30',
  advanced: 'border-[var(--warning)]/30',
};

// P2-03: 五级反馈 i18n 兜底（纯 key 调用，与 i18n academy.feedback.grade* 语义对齐）
const GRADE_FALLBACK_LABELS = {
  best: t('academy.feedback.gradeBest'),
  correct: t('academy.feedback.gradeCorrect'),
  inaccuracy: t('academy.feedback.gradeInaccuracy'),
  wrong: t('academy.feedback.gradeWrong'),
  blunder: t('academy.feedback.gradeBlunder'),
};

// ===== 倒计时圆环组件 =====
function CountdownRing({ timeRemaining, timeLimit, isPressure }: { timeRemaining: number; timeLimit: number; isPressure: boolean }) {
  const size = isPressure ? 72 : 56;
  const strokeWidth = isPressure ? 6 : 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLimit > 0 ? timeRemaining / timeLimit : 1;

  const getColor = () => {
    if (progress > 0.5) return 'var(--success)';
    if (progress > 0.2) return 'var(--warning)';
    return 'var(--danger)';
  };

  const strokeDashoffset = circumference * (1 - progress);
  const isCritical = progress <= 0.2 && timeRemaining > 0;

  return (
    <div className={cn('relative inline-flex items-center justify-center', isCritical && 'animate-pulse')}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          animate={{ strokeDashoffset, stroke: getColor() }}
          transition={transitionStandard}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn('font-bold tabular-nums', isPressure ? 'text-xl' : 'text-base')} style={{ color: getColor() }}>
          {Math.ceil(timeRemaining)}
        </span>
      </div>
    </div>
  );
}

// ===== 主组件 =====
export function PracticeDrillComponent({ drill, lessonId, mode = 'normal', onComplete, adaptive = true, onReviewRequest }: PracticeDrillProps) {
  const isPressure = mode === 'pressure';
  const PRESSURE_TIME_LIMIT = 15;
  const PRESSURE_TOTAL_QUESTIONS = 20;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<PracticeOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [weakPoints, setWeakPoints] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [currentDifficulty, setCurrentDifficulty] = useState<QuestionDifficulty>('beginner');
  const [difficultyChanges, setDifficultyChanges] = useState<DifficultyChange[]>([]);
  const [difficultyMessage, setDifficultyMessage] = useState<string | null>(null);
  // P3: 常驻复习建议提示（null = 不显示；仅在答题视图渲染，结果页分支不渲染）
  const [reviewTopics, setReviewTopics] = useState<string[] | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [showTimeoutFlash, setShowTimeoutFlash] = useState(false);
  const [showKeyHint, setShowKeyHint] = useState(true);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const currentStreakRef = useRef(0);
  const [timeoutCount, setTimeoutCount] = useState(0);
  const [showCooldown, setShowCooldown] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  // P1E-05（专批 B）：逐题作答明细（供 QuickDrill 对 review-* 复习题做 SRS 回写）
  const answersRef = useRef<PracticeAnswerDetail[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 倒计时数值 ref（interval tick 内直接读取，避免在 setState updater 内触发副作用）
  const timeRemainingRef = useRef(0);
  // 超时闪烁 timer（换题/卸载时清除，避免悬空回调）
  const timeoutFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // P2-03: 难度消息 timer（竞态修复：新消息设置前清除旧 timer）
  const difficultyMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundInitRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { adaptiveConfig, updateAbility, recentPracticeResults } = useAcademyStore();
  const settings = useProgressStore((s) => s.settings);
  // P2-5.2: 情绪管理 — 记录答题用于连续答错检测与每日题量统计
  const recordAnswerForEmotion = useProgressStore((s) => s.recordAnswer);

  // 同步音效开关
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // P2-03: 卸载时清除难度消息 / 超时闪烁 / cooldown timer，避免悬空回调
  useEffect(() => () => {
    if (difficultyMessageTimerRef.current) clearTimeout(difficultyMessageTimerRef.current);
    if (timeoutFlashTimerRef.current) clearTimeout(timeoutFlashTimerRef.current);
    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
  }, []);

  // 首次交互初始化音频
  const initSound = useCallback(() => {
    if (!soundInitRef.current) {
      soundManager.init();
      soundInitRef.current = true;
    }
  }, []);

  // 快捷键提示 3 秒后消失
  useEffect(() => {
    const t = setTimeout(() => setShowKeyHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // 自适应模式下动态选择题目
  // P0B-01：渲染前先 t() 解析（key 缺失回退数据层中文），再统一走 orderPracticeOptions
  // 排序出口（动作类 canonical / 数值类单调 / 文字类 id 种子洗牌），禁止按题库原序渲染；源题库数据不改。
  const questions = useMemo(() => {
    const resolveOrder = (q: PracticeQuestion) => orderPracticeOptions(resolvePracticeQuestion(t, q));
    if (isPressure) {
      // 压力模式：循环题目到 20 题
      const base = drill.questions;
      if (base.length === 0) return base;
      const result: PracticeQuestion[] = [];
      for (let i = 0; i < PRESSURE_TOTAL_QUESTIONS; i++) {
        result.push(base[i % base.length]!);
      }
      return result.map(resolveOrder);
    }
    if (!adaptive || !adaptiveConfig.enabled) return drill.questions.map(resolveOrder);
    return selectQuestionsByDifficulty(drill.questions, currentDifficulty, drill.questions.length)
      .map(resolveOrder);
  }, [adaptive, adaptiveConfig.enabled, drill.questions, currentDifficulty, isPressure, t]);

  const totalQuestions = questions.length;
  const currentQuestion: PracticeQuestion | undefined = questions[currentIndex];

  // 获取当前题目的限时
  const getTimeLimit = useCallback(() => {
    if (isPressure) return PRESSURE_TIME_LIMIT;
    return currentQuestion?.timeLimit || 0;
  }, [isPressure, currentQuestion]);

  const timeLimit = getTimeLimit();

  // 检查是否需要调整难度（每5题检查一次）
  const checkDifficultyAdjustment = useCallback((newResults: Array<{ isCorrect: boolean; timeTaken: number }>) => {
    if (!adaptive || !adaptiveConfig.enabled || isPressure) return;

    const allResults = [...recentPracticeResults.map(r => ({ isCorrect: r.isCorrect, timeTaken: r.timeTaken })), ...newResults];
    const newDifficulty = getCurrentDifficulty(allResults, adaptiveConfig, currentDifficulty);

    if (newDifficulty !== currentDifficulty) {
      setDifficultyChanges(prev => [...prev, { from: currentDifficulty, to: newDifficulty, questionIndex: currentIndex }]);
      setCurrentDifficulty(newDifficulty);

      const review = shouldRecommendReview(allResults, adaptiveConfig);
      const newIndex = DIFFICULTY_ORDER.indexOf(newDifficulty);
      const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);
      // P2-03: 竞态修复 — 设置新消息前清除旧 timer，连续调整不互相覆盖
      const showDifficultyMessage = (msg: string) => {
        if (difficultyMessageTimerRef.current) clearTimeout(difficultyMessageTimerRef.current);
        setDifficultyMessage(msg);
        difficultyMessageTimerRef.current = setTimeout(() => setDifficultyMessage(null), 4000);
      };
      if (newIndex > currentIndex) {
        showDifficultyMessage('academy.difficulty.msgUp');
      } else if (newIndex < currentIndex) {
        if (review.shouldReview) {
          // P3: 降级建议复习 → 常驻提示条（替代 4 秒 toast），点击「返回复习」后由外部跳转对应小节
          setReviewTopics(review.suggestedTopics);
          setDifficultyMessage(null);
        } else {
          showDifficultyMessage('academy.difficulty.msgDown');
        }
      } else {
        showDifficultyMessage('');
      }
    }
  }, [adaptive, adaptiveConfig, currentDifficulty, currentIndex, recentPracticeResults, isPressure]);

  const handleSelect = useCallback(
    (option: PracticeOption, isTimeout = false) => {
      if (isAnswered) return;
      initSound();

      if (timerRef.current) clearInterval(timerRef.current);

      const elapsed = isTimeout ? (timeLimit || (Date.now() - startTimeRef.current) / 1000) : (Date.now() - startTimeRef.current) / 1000;
      const newTimes = [...times, elapsed];
      setTimes(newTimes);
      setSelectedOption(option);
      setIsAnswered(true);

      const questionDifficulty = currentQuestion?.difficulty ?? 'beginner';

      // P1E-13: 判分唯一事实源 — 超时恒判错（即使代选项恰好正确也不计对、
      // 不加连击、不播答对音效），对齐 range-trainer P1A-02 口径
      const gradedCorrect = gradePracticeSelection(option, isTimeout);

      // P1E-05（专批 B）：记录逐题作答明细（复习题 SRS 回写的数据源）
      if (currentQuestion) {
        answersRef.current.push({
          questionId: currentQuestion.id,
          isCorrect: gradedCorrect,
          timeTaken: elapsed,
        });
      }

      // 更新能力评估
      updateAbility({
        isCorrect: gradedCorrect,
        timeTaken: elapsed,
        difficulty: questionDifficulty,
      });

      // P2-5.2: 情绪管理 — 记录答题
      recordAnswerForEmotion(gradedCorrect);

      if (gradedCorrect) {
        setCorrectCount((c) => c + 1);
        currentStreakRef.current += 1;
        setMaxStreak(m => Math.max(m, currentStreakRef.current));
        setConsecutiveWrong(0);
        soundManager.playCorrect();
      } else {
        currentStreakRef.current = 0;
        const newConsecutiveWrong = consecutiveWrong + 1;
        setConsecutiveWrong(newConsecutiveWrong);
        // 超时路径已在超时 effect 中播报 playTimeout，避免叠加答错音效
        if (!isTimeout) soundManager.playWrong();

        // 压力模式：连续错 3 题显示冷却提示
        if (isPressure && newConsecutiveWrong >= 3) {
          setShowCooldown(true);
          cooldownTimerRef.current = setTimeout(() => setShowCooldown(false), 3000);
          setConsecutiveWrong(0);
        }

        const scenario = currentQuestion?.scenario;
        if (scenario) {
          setWeakPoints((prev) => [
            ...prev,
            `${scenario.heroPosition} ${scenario.street} - ${option.action}`,
          ]);
        }
      }

      // 每5题检查一次难度调整
      const answeredCount = currentIndex + 1;
      if (adaptive && !isPressure && answeredCount % 5 === 0) {
        const recentResults = answersRef.current.slice(-5).map((a) => ({
          isCorrect: a.isCorrect,
          timeTaken: a.timeTaken,
        }));
        checkDifficultyAdjustment(recentResults);
      }
    },
    [isAnswered, currentQuestion, times, currentIndex, adaptive, updateAbility, checkDifficultyAdjustment, initSound, timeLimit, consecutiveWrong, isPressure, recordAnswerForEmotion]
  );

  // 超时处理（P1E-13: 系统代选仅用于展示，判分强制计错 — 见 handleSelect 的 gradedCorrect）
  const handleTimeout = useCallback(() => {
    if (!currentQuestion) return;
    const fallbackOption = pickTimeoutFallbackOption(currentQuestion);
    if (fallbackOption) {
      setIsTimedOut(true);
      setShowTimeoutFlash(true);
      setTimeoutCount((c) => c + 1);
      soundManager.playTimeout();
      if (timeoutFlashTimerRef.current) clearTimeout(timeoutFlashTimerRef.current);
      timeoutFlashTimerRef.current = setTimeout(() => setShowTimeoutFlash(false), 1500);
      handleSelect(fallbackOption, true);
    }
  }, [currentQuestion, handleSelect]);

  // 倒计时逻辑：归零时在 tick 回调内直接触发 handleTimeout，避免 Effect 链
  useEffect(() => {
    if (isAnswered || finished || !currentQuestion) return;
    if (timeLimit <= 0) return;

    timeRemainingRef.current = timeLimit;
    setTimeRemaining(timeLimit);

    timerRef.current = setInterval(() => {
      const next = timeRemainingRef.current - 1;
      timeRemainingRef.current = next;
      // 最后 5 秒播放滴答声
      if (next <= 5 && next > 0) {
        soundManager.playTick();
      }
      if (next <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeRemaining(0);
        handleTimeout();
        return;
      }
      setTimeRemaining(next);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, finished, timeLimit, currentQuestion, handleTimeout]);

  const handleNext = useCallback(() => {
    initSound();
    setIsTimedOut(false);
    if (currentIndex + 1 >= totalQuestions) {
      const finalCorrect = correctCount;
      const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      const result: PracticeResult = {
        lessonId,
        totalQuestions,
        correctAnswers: finalCorrect,
        accuracy: finalCorrect / totalQuestions,
        averageTime: Math.round(avgTime * 10) / 10,
        weakPoints: [...new Set(weakPoints)],
        timestamp: Date.now(),
        // P1E-05（专批 B）：逐题作答明细随结果上报（不入 persist，见 recordPracticeScore）
        answers: [...answersRef.current],
      };
      setFinished(true);
      onComplete(result);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      startTimeRef.current = Date.now();
    }
  }, [currentIndex, totalQuestions, correctCount, times, weakPoints, lessonId, onComplete, initSound]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finished) return;

      if (isAnswered) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          handleNext();
        }
        return;
      }

      if (!currentQuestion) return;
      const opts = currentQuestion.options;
      switch (e.key) {
        case '1': if (opts[0]) handleSelect(opts[0]); break;
        case '2': if (opts[1]) handleSelect(opts[1]); break;
        case '3': if (opts[2]) handleSelect(opts[2]); break;
        case '4': if (opts[3]) handleSelect(opts[3]); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, finished, currentQuestion, handleSelect, handleNext]);

  // Results panel
  if (finished) {
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0';

    return (
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionSlow}
        className="text-center py-8"
      >
        <Trophy className="w-14 h-14 text-[var(--brass-bright)] mx-auto mb-4" />
        <h3 className="font-display text-2xl text-[var(--ivory)] mb-6">
          {isPressure ? t('academy.drill.pressureCompletedTitle') : t('academy.drill.completedTitle')}
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--brass-bright)]">{accuracy}%</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('academy.drill.accuracy')}</p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--ivory)]">{avgTime}s</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> {t('academy.drill.avgTime')}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--ivory)]">{correctCount}/{totalQuestions}</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
              <Target className="w-3 h-3" /> {t('academy.drill.correctCount')}
            </p>
          </div>
        </div>

        {/* 压力模式额外统计 */}
        {isPressure && (
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
            <div className="rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 p-3">
              <p className="font-numeric text-2xl text-[var(--danger)]">{timeoutCount}</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('academy.drill.timeouts')}</p>
            </div>
            <div className="rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 p-3">
              <p className="font-numeric text-2xl text-[var(--success)]">{maxStreak}</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('academy.drill.longestStreak')}</p>
            </div>
            <div className="rounded-lg bg-[var(--brass-bright)]/10 border border-[var(--brass-bright)]/30 p-3">
              <p className="font-numeric text-2xl text-[var(--brass-bright)]">
                {Math.round(Math.max(0, accuracy - timeoutCount * 5 + maxStreak * 2))}
              </p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('academy.drill.pressureScore')}</p>
            </div>
          </div>
        )}

        {/* 难度变化曲线（P2-03：阶梯图，横轴题号 / 纵轴难度档，段终点按难度着色） */}
        {adaptive && !isPressure && difficultyChanges.length > 0 && (
          <DifficultyStairChart
            changes={difficultyChanges}
            totalQuestions={totalQuestions}
          />
        )}

        {weakPoints.length > 0 && (
          <div className="mb-6 text-left max-w-sm mx-auto">
            <p className="text-xs text-[var(--ivory-muted)] mb-2">{t('academy.drill.weakPoints')}</p>
            <div className="flex flex-wrap gap-1.5">
              {[...new Set(weakPoints)].map((wp, i) => (
                <span key={i} className="rounded bg-[var(--danger)]/15 px-2 py-0.5 text-xs text-[var(--danger)]">
                  {wp}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  if (!currentQuestion) return null;

  const { scenario, options } = currentQuestion;
  const heroCards = scenario.heroHand.map(stringToCard);
  const boardCards = scenario.board?.map(stringToCard) ?? [];
  const correctOption = options.find((o) => o.isCorrect);
  const questionDifficulty = currentQuestion.difficulty ?? 'beginner';

  // P2-03 → 三态诚实渲染：仅当数据侧提供真实数值 evLoss 才展示五级等级与 EV 损失。
  // 标准课时 practice 选项的数值型 evLoss 覆盖率为 0（棘轮见 utils/evCalibration.test.ts），
  // 旧实现的 `?? (isCorrect ? 0 : 3)` 兜底会把所有答错一律渲染成 wrong 档 —— 属伪造精度（PRD §5.3.6）。
  // 判分链路（对错 / 连击 / SRS / ELO）不受影响，此处只改呈现。
  const feedbackView = !isTimedOut ? resolvePracticeFeedbackView(selectedOption) : null;
  const gradeLabel = feedbackView?.grade && feedbackView.gradeTitleKey
    ? t(feedbackView.gradeTitleKey, { defaultValue: GRADE_FALLBACK_LABELS[feedbackView.grade] })
    : '';

  return (
    <div className={cn('space-y-5', isPressure && 'relative')}>
      {/* 压力模式脉动边框 */}
      {isPressure && (
        <div className="absolute -inset-2 rounded-2xl border-2 border-[var(--danger)]/40 animate-pulse pointer-events-none" />
      )}

      {/* 快捷键提示 toast */}
      <AnimatePresence>
        {showKeyHint && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 rounded-lg bg-[var(--walnut-raised)] border border-[var(--ivory-dim)]/20 px-4 py-2.5 text-xs text-[var(--ivory-muted)]"
          >
            <Keyboard className="w-4 h-4 shrink-0" />
            <span>
              <Trans
                i18nKey="academy.drill.shortcuts"
                components={{
                  b: <b className="text-[var(--ivory)]" />,
                }}
              />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 冷却提示 */}
      <AnimatePresence>
        {showCooldown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="rounded-lg bg-[var(--warning)]/15 border border-[var(--warning)]/40 px-4 py-3 text-sm text-[var(--warning)] text-center"
          >
            {t('academy.drill.cooldownHint')}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', isPressure ? 'bg-[var(--danger)]' : 'bg-[var(--brass-bright)]')}
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex) / totalQuestions) * 100}%` }}
            transition={transitionStandard}
          />
        </div>
        <span className="text-xs text-[var(--ivory-muted)] shrink-0">
          {currentIndex + 1} / {totalQuestions}
        </span>
        {currentIndex > 0 && (
          <span className="text-xs text-[var(--success)] shrink-0">
            {t('academy.drill.liveAccuracy', {
              accuracy: Math.round((correctCount / currentIndex) * 100),
            })}
          </span>
        )}
        {/* 难度指示器（P2-03：常驻 pill，难度变化时 scale 脉冲 + 黄铜 glow） */}
        {(adaptive || isPressure) && (
          <motion.span
            key={questionDifficulty}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium shrink-0',
              DIFFICULTY_COLORS[questionDifficulty],
              DIFFICULTY_PILL_BG[questionDifficulty],
              DIFFICULTY_PILL_BORDER[questionDifficulty],
            )}
            // UI-06：brass glow 关键帧（--brass 色相 rgba(201,162,94)）——
            // framer-motion 插值需数值 keyframes，CSS 变量无法用于动画插值，故锚定语义常量
            initial={{ scale: 1, boxShadow: BRASS_GLOW_KEYFRAMES[0] }}
            animate={{
              scale: [1, 1.15, 1],
              boxShadow: BRASS_GLOW_KEYFRAMES,
            }}
            transition={transitionSlow}
          >
            {t(`academy.difficulty.${questionDifficulty}`)}
          </motion.span>
        )}
        {/* 压力模式标记 */}
        {isPressure && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--danger)] font-bold shrink-0">
            <Zap className="w-3 h-3" /> {t('academy.drill.pressure')}
          </span>
        )}
      </div>

      {/* 难度调整提示 */}
      <AnimatePresence>
        {difficultyMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg bg-[var(--brass-bright)]/10 border border-[var(--brass-bright)]/30 px-4 py-2.5 text-sm text-[var(--brass-bright)]">
              {difficultyMessage ? t(difficultyMessage) : ''}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* P3: 降级建议复习 — 常驻提示条（替代 4 秒 toast；点击「返回复习」清空并回传主题） */}
      <AnimatePresence>
        {reviewTopics && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 flex-wrap rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-3 text-sm text-[var(--ivory)]">
              <span>{t('academy.practice.reviewBanner')}</span>
              <button
                onClick={() => {
                  const topics = reviewTopics;
                  setReviewTopics(null);
                  onReviewRequest?.(topics);
                }}
                className="text-xs font-semibold text-[var(--brass-bright)] underline underline-offset-2 hover:opacity-80 transition-opacity"
              >
                {t('academy.practice.reviewAction')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 超时闪烁提示 */}
      <AnimatePresence>
        {showTimeoutFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0, 1, 0.5, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_DURATION.loop, ease: MOTION_EASE.standard }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <span className="text-3xl font-bold text-[var(--danger)] drop-shadow-lg">{t('academy.drill.timeUp')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenario display */}
      <div className={cn(
        'scenario-card p-5 md:p-6',
        isPressure && 'border-[var(--danger)]/30'
      )}>

        {/* 倒计时圆环 - 右上角 */}
        {timeLimit > 0 && !isAnswered && (
          <div className="absolute top-3 right-3 z-20">
            <CountdownRing timeRemaining={timeRemaining} timeLimit={timeLimit} isPressure={isPressure} />
          </div>
        )}

        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Board */}
          {boardCards.length > 0 && (
            <div className="flex gap-2">
              {boardCards.map((card, i) => (
                <PokerCard key={i} card={card} size="sm" animationDelay={i * 0.08} />
              ))}
            </div>
          )}

          {/* Actions + Info */}
          {scenario.previousActions.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {scenario.previousActions.map((act, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-full bg-black/30 px-2 py-0.5 text-[11px] text-[var(--ivory-dim)]">
                  <span className="font-bold text-[var(--ivory)]">{act.player}</span>
                  <span className="font-mono">{act.action}</span>
                </span>
              ))}
            </div>
          )}

          {/* Separator */}
          <div className="w-2/3 h-px bg-[var(--walnut-border)] opacity-40" />

          {/* Hero */}
          <div className="flex items-center gap-3">
            <PositionBadge position={scenario.heroPosition as Position} active />
            <div className="flex gap-2.5">
              {heroCards.map((card, i) => (
                <PokerCard key={i} card={card} size="sm" animationDelay={i * 0.1} />
              ))}
            </div>
          </div>

          {/* Pot + Stack */}
          <div className="flex items-center gap-4 text-[11px] text-[var(--ivory-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Chip amount={scenario.potSize} color="green" size="sm" />
              {t('academy.drill.potLabel')} <b className="text-[var(--brass)] font-mono">{formatBB(scenario.potSize)}</b>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Chip amount={scenario.effectiveStack} color="blue" size="sm" />
              {t('academy.drill.stackLabel')} <b className="text-[var(--ivory)] font-mono">{formatBB(scenario.effectiveStack)}</b>
            </span>
          </div>

          {/* Opponent Badge */}
          {scenario.opponent && (
            <div className="flex items-center gap-2 bg-black/25 rounded-md px-3 py-1.5">
              <span className="text-base">{scenario.opponent.icon}</span>
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: scenario.opponent.color + '30', color: scenario.opponent.color }}
              >
                {scenario.opponent.shortName}
              </span>
              <span className="text-[11px] text-[var(--ivory-muted)]">
                VPIP {scenario.opponent.stats.vpip}% · PFR {scenario.opponent.stats.pfr}%
              </span>
            </div>
          )}

          {/* Game Context Tags */}
          {scenario.gameContext && (
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--poker-indigo)]/25 text-[var(--poker-indigo-bright)]">
                {scenario.gameContext.gameType === 'cash'
                  ? t('academy.gameContext.cash')
                  : scenario.gameContext.gameType === 'mtt'
                    ? t('academy.gameContext.mtt')
                    : t('academy.gameContext.sng')}
              </span>
              {scenario.gameContext.icmPressure && scenario.gameContext.icmPressure !== 'low' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--poker-danger)]/20 text-[var(--poker-danger)]">
                  {t('academy.gameContext.icmPressure')}
                  {scenario.gameContext.icmPressure === 'high' ? t('academy.gameContext.icmHigh') : t('academy.gameContext.icmMedium')}
                </span>
              )}
              {scenario.gameContext.tableDescription && (
                <span className="text-[10px] text-[var(--ivory-muted)]">
                  "{scenario.gameContext.tableDescription}"
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2.5">
        {options.map((option, i) => {
          // P2-05: 语义分类取色阶（题库 action 值多样，精确匹配不可靠）
          const baseStyle = classifyAction(option.action);
          const isSelected = selectedOption === option;
          const showCorrect = isAnswered && option.isCorrect;
          const showWrong = isAnswered && isSelected && !option.isCorrect;

          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
              className={cn(
                'relative flex-1 min-w-[120px] rounded-lg border transition-all text-center',
                baseStyle,
                showCorrect && 'ring-2 ring-[var(--success)] shadow-[0_0_12px_rgba(127,184,131,0.4)]',
                showWrong && 'ring-2 ring-[var(--danger)] opacity-70',
                isAnswered && !showCorrect && !showWrong && 'opacity-40',
              )}
              animate={
                showWrong
                  ? { x: [0, -4, 4, -4, 4, 0] }
                  : showCorrect
                    ? { scale: [1, 1.05, 1] }
                    : {}
              }
              transition={transitionSlow}
              whileHover={!isAnswered ? { scale: 1.03 } : {}}
              whileTap={!isAnswered ? { scale: 0.97 } : {}}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <span>{option.action}</span>
                {option.amount && <span className="font-mono text-xs opacity-80">{option.amount}</span>}
              </span>
              {/* 快捷键标记 */}
              {!isAnswered && (
                <span className="ml-2 inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-black/25 text-[10px] font-mono opacity-50">{i + 1}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {isAnswered && selectedOption && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={transitionStandard}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'rounded-lg border p-4',
                isTimedOut
                  ? 'border-[var(--danger)]/40 bg-[var(--danger)]/10'
                  : feedbackView?.containerClass
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {/* P1E-13: 超时路径仅展示"系统代选"，本题计为答错（即使代选项正确）；不显示五级（超时无真实决策） */}
                {isTimedOut ? (
                  <>
                    <XCircle className="w-4 h-4 text-[var(--danger)] shrink-0" />
                    <span className="text-sm font-bold text-[var(--danger)]">
                      {t('academy.drill.timeoutPick', { action: selectedOption.action })}
                    </span>
                    {correctOption && (
                      <span className="text-xs text-[var(--ivory-muted)] ml-2">
                        {t('academy.drill.correctAnswerPrefix')}{correctOption.action}{correctOption.amount ? ` ${correctOption.amount}` : ''}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {/* P2-03 三态诚实渲染：有真实 evLoss → 五级图标 + 等级标签；
                        无 evLoss → 只显示「正确 / 错误」（禁兜底伪造等级），解析文本照常展示 */}
                    {feedbackView?.gradeIcon ? (
                      <>
                        <span className="text-base leading-none">{feedbackView.gradeIcon}</span>
                        <span className="text-sm font-bold">{gradeLabel}</span>
                      </>
                    ) : (
                      <span className="text-sm font-bold">
                        {feedbackView?.mode === 'correct'
                          ? t('academy.drill.correct')
                          : t('academy.drill.incorrect')}
                      </span>
                    )}
                    {!selectedOption.isCorrect && correctOption && (
                      <span className="text-xs text-[var(--ivory-muted)] ml-1">
                        {t('academy.drill.correctAnswerPrefix')}{correctOption.action}{correctOption.amount ? ` ${correctOption.amount}` : ''}
                      </span>
                    )}
                  </>
                )}
                {/* P2-03: evLoss 数值徽章（仅真实标定数据可展示；>0 用 danger 突出损失，0 用 success） */}
                {feedbackView && feedbackView.evLoss !== null && (
                  <span
                    className={cn(
                      'ml-auto text-xs font-numeric font-semibold shrink-0',
                      feedbackView.evLoss > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                    )}
                  >
                    {feedbackView.evLoss > 0 ? '+' : ''}{feedbackView.evLoss.toFixed(1)} {t('academy.drill.evLossBB')}
                  </span>
                )}
                {selectedOption.evImpact && (
                  <span
                    className={cn(
                      'ml-auto text-xs font-mono',
                      evImpactToneClass(selectedOption.evImpact)
                    )}
                  >
                    {selectedOption.evImpact}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ivory-dim)] leading-relaxed">{selectedOption.explanation}</p>

              {/* 去复习链接：答错（含超时计错）且存在关联课程时显示 */}
              {(!selectedOption.isCorrect || isTimedOut) && currentQuestion.relatedLessonId && (
                <button
                  onClick={() => navigate(`/academy/lesson/${currentQuestion.relatedLessonId}`)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--brass-bright)] underline underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  {t('academy.drill.reviewLink')}
                </button>
              )}

              {/* Opponent Strategy Hint */}
              {scenario.opponent && (
                <p className="text-xs text-[var(--ivory-muted)] mt-2">
                  {t('academy.drill.opponentHintPrefix', { name: scenario.opponent.shortName })}
                  {selectedOption.isCorrect && !isTimedOut
                    ? t('academy.drill.opponentTipCorrect')
                    : t('academy.drill.opponentHintTemplate', { tendency: scenario.opponent.tendencies[0] })}
                </p>
              )}
            </div>

            {/* Next button */}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {currentIndex + 1 >= totalQuestions ? t('academy.drill.viewScore') : t('academy.drill.nextQuestion')}
                <span className="text-xs opacity-60">{t('academy.drill.spaceHint')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
