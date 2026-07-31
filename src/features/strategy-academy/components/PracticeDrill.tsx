import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Trophy, Clock, Target, Zap, Keyboard } from 'lucide-react';
import type { PracticeDrill as PracticeDrillType, PracticeQuestion, PracticeOption, PracticeResult, PracticeAnswerDetail, QuestionDifficulty } from '../types';
import { PokerCard } from '@/shared/components/Card';
import { PositionBadge } from '@/shared/components/PositionBadge';
import { Position } from '@/shared/types/position';
import { stringToCard } from '@/shared/utils/deck';
import { cn } from '@/shared/utils/cn';
import { formatBB } from '@/shared/utils/formatters';
import { Chip } from '@/shared/components/Chip';
import { soundManager } from '@/shared/utils/soundManager';
import { useProgressStore } from '@/features/progress/store';
import { useAcademyStore } from '../store';
import { getCurrentDifficulty, selectQuestionsByDifficulty, shouldRecommendReview } from '../utils/adaptiveDifficulty';
import { orderPracticeOptions } from '../utils/practiceOptionOrder';
// P1E-13: 超时判分口径（超时恒判错，对齐 range-trainer P1A-02）
import { gradePracticeSelection, pickTimeoutFallbackOption } from '../utils/practiceGrading';

export type DrillMode = 'normal' | 'pressure';

interface PracticeDrillProps {
  drill: PracticeDrillType;
  lessonId: string;
  mode?: DrillMode;
  onComplete: (result: PracticeResult) => void;
  adaptive?: boolean;
}

const ACTION_STYLES: Record<string, string> = {
  Fold: 'bg-[var(--clay)]/80 hover:bg-[var(--clay)] border-[var(--clay)]/40 text-[var(--ivory)]',
  Call: 'bg-[var(--brass-dark)]/80 hover:bg-[var(--brass-dark)] border-[var(--brass-dark)]/40 text-[var(--ivory)]',
  Raise: 'bg-[var(--felt-light)]/80 hover:bg-[var(--felt-light)] border-[var(--felt-light)]/40 text-[var(--ivory)]',
  Check: 'bg-[var(--info)]/60 hover:bg-[var(--info)]/80 border-[var(--info)]/40 text-[var(--ivory)]',
};

const DIFFICULTY_LABELS: Record<QuestionDifficulty, string> = {
  beginner: '基础',
  intermediate: '进阶',
  advanced: '高级',
};

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  beginner: 'text-[var(--success)]',
  intermediate: 'text-[var(--info)]',
  advanced: 'text-[var(--warning)]',
};

const DIFFICULTY_ORDER: QuestionDifficulty[] = ['beginner', 'intermediate', 'advanced'];

interface DifficultyChange {
  from: QuestionDifficulty;
  to: QuestionDifficulty;
  questionIndex: number;
}

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
          transition={{ duration: 0.3, ease: 'linear' }}
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
export function PracticeDrillComponent({ drill, lessonId, mode = 'normal', onComplete, adaptive = true }: PracticeDrillProps) {
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
  const soundInitRef = useRef(false);

  const navigate = useNavigate();
  const { adaptiveConfig, updateAbility, recentPracticeResults } = useAcademyStore();
  const { settings } = useProgressStore();
  // P2-5.2: 情绪管理 — 记录答题用于连续答错检测与每日题量统计
  const recordAnswerForEmotion = useProgressStore((s) => s.recordAnswer);

  // 同步音效开关
  useEffect(() => {
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

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
  // P0B-01：渲染前统一走 orderPracticeOptions 排序出口（动作类 canonical /
  // 数值类单调 / 文字类 id 种子洗牌），禁止按题库原序渲染；源题库数据不改。
  const questions = useMemo(() => {
    if (isPressure) {
      // 压力模式：循环题目到 20 题
      const base = drill.questions;
      if (base.length === 0) return base;
      const result: PracticeQuestion[] = [];
      for (let i = 0; i < PRESSURE_TOTAL_QUESTIONS; i++) {
        result.push(base[i % base.length]!);
      }
      return result.map(orderPracticeOptions);
    }
    if (!adaptive || !adaptiveConfig.enabled) return drill.questions.map(orderPracticeOptions);
    return selectQuestionsByDifficulty(drill.questions, currentDifficulty, drill.questions.length)
      .map(orderPracticeOptions);
  }, [adaptive, adaptiveConfig.enabled, drill.questions, currentDifficulty, isPressure]);

  const totalQuestions = questions.length;
  const currentQuestion: PracticeQuestion | undefined = questions[currentIndex];

  // 获取当前题目的限时
  const getTimeLimit = useCallback(() => {
    if (isPressure) return PRESSURE_TIME_LIMIT;
    return currentQuestion?.timeLimit || 0;
  }, [isPressure, currentQuestion]);

  const timeLimit = getTimeLimit();

  // 压力模式：每 5 题难度递增
  useEffect(() => {
    if (!isPressure) return;
    const level = Math.min(Math.floor(currentIndex / 5), 2);
    const newDiff = DIFFICULTY_ORDER[level]!;
    if (newDiff !== currentDifficulty) {
      setCurrentDifficulty(newDiff);
    }
  }, [currentIndex, isPressure, currentDifficulty]);

  // 倒计时逻辑
  useEffect(() => {
    if (isAnswered || finished || !currentQuestion) return;
    if (timeLimit <= 0) return;

    setTimeRemaining(timeLimit);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        // 最后 5 秒播放滴答声
        if (next <= 5 && next > 0) {
          soundManager.playTick();
        }
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isAnswered, finished, timeLimit, currentQuestion]);

  // 超时处理（P1E-13: 系统代选仅用于展示，判分强制计错 — 见 handleSelect 的 gradedCorrect）
  useEffect(() => {
    if (timeRemaining === 0 && timeLimit > 0 && !isAnswered && !finished && currentQuestion) {
      // 自动选择 fold（最保守动作）作为展示用代选项
      const fallbackOption = pickTimeoutFallbackOption(currentQuestion);
      if (fallbackOption) {
        setIsTimedOut(true);
        setShowTimeoutFlash(true);
        setTimeoutCount(c => c + 1);
        soundManager.playTimeout();
        setTimeout(() => setShowTimeoutFlash(false), 1500);
        handleSelect(fallbackOption, true);
      }
    }
  }, [timeRemaining, timeLimit, isAnswered, finished, currentQuestion]);

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
      if (newIndex > currentIndex) {
        setDifficultyMessage('📈 你的表现很好！接下来的题目会更有挑战性');
      } else if (newIndex < currentIndex) {
        if (review.shouldReview) {
          setDifficultyMessage('💡 建议复习一下相关理论后再继续');
        } else {
          setDifficultyMessage('📉 建议巩固基础，降低难度有助于建立信心');
        }
      } else {
        setDifficultyMessage('');
      }

      setTimeout(() => setDifficultyMessage(null), 4000);
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
          setTimeout(() => setShowCooldown(false), 3000);
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
        const recentResults = newTimes.slice(-5).map((t, i) => ({
          isCorrect: i === newTimes.length - 1 ? gradedCorrect : true,
          timeTaken: t,
        }));
        checkDifficultyAdjustment(recentResults);
      }
    },
    [isAnswered, currentQuestion, times, currentIndex, adaptive, updateAbility, checkDifficultyAdjustment, initSound, timeLimit, consecutiveWrong, isPressure, recordAnswerForEmotion]
  );

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
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="text-center py-8"
      >
        <Trophy className="w-14 h-14 text-[var(--brass-bright)] mx-auto mb-4" />
        <h3 className="font-display text-2xl text-[var(--ivory)] mb-6">
          {isPressure ? '压力测试完成！' : '练习完成！'}
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--brass-bright)]">{accuracy}%</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1">正确率</p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--ivory)]">{avgTime}s</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> 平均用时
            </p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--ivory)]">{correctCount}/{totalQuestions}</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
              <Target className="w-3 h-3" /> 答对
            </p>
          </div>
        </div>

        {/* 压力模式额外统计 */}
        {isPressure && (
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
            <div className="rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 p-3">
              <p className="font-numeric text-2xl text-[var(--danger)]">{timeoutCount}</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">超时次数</p>
            </div>
            <div className="rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 p-3">
              <p className="font-numeric text-2xl text-[var(--success)]">{maxStreak}</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">最长连续</p>
            </div>
            <div className="rounded-lg bg-[var(--brass-bright)]/10 border border-[var(--brass-bright)]/30 p-3">
              <p className="font-numeric text-2xl text-[var(--brass-bright)]">
                {Math.round(Math.max(0, accuracy - timeoutCount * 5 + maxStreak * 2))}
              </p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">压力评分</p>
            </div>
          </div>
        )}

        {/* 难度变化曲线 */}
        {adaptive && !isPressure && difficultyChanges.length > 0 && (
          <div className="mb-6 max-w-sm mx-auto">
            <p className="text-xs text-[var(--ivory-muted)] mb-2">难度变化：</p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className={cn('text-xs font-medium', DIFFICULTY_COLORS[difficultyChanges[0]!.from])}>
                {DIFFICULTY_LABELS[difficultyChanges[0]!.from]}
              </span>
              {difficultyChanges.map((change, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-[var(--ivory-dim)]" />
                  <span className={cn('text-xs font-medium', DIFFICULTY_COLORS[change.to])}>
                    {DIFFICULTY_LABELS[change.to]}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {weakPoints.length > 0 && (
          <div className="mb-6 text-left max-w-sm mx-auto">
            <p className="text-xs text-[var(--ivory-muted)] mb-2">薄弱点：</p>
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
            <span>快捷键：<b className="text-[var(--ivory)]">1-4</b> 选择动作，<b className="text-[var(--ivory)]">空格/回车</b> 下一题</span>
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
            🧊 冷静一下！连续答错 3 题，深呼吸，回顾一下策略要点再继续。
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
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="text-xs text-[var(--ivory-muted)] shrink-0">
          {currentIndex + 1} / {totalQuestions}
        </span>
        {currentIndex > 0 && (
          <span className="text-xs text-[var(--success)] shrink-0">
            正确率 {Math.round((correctCount / currentIndex) * 100)}%
          </span>
        )}
        {/* 难度指示器 */}
        {(adaptive || isPressure) && (
          <span className={cn('text-xs shrink-0 font-medium', DIFFICULTY_COLORS[questionDifficulty])}>
            {DIFFICULTY_LABELS[questionDifficulty]}
          </span>
        )}
        {/* 压力模式标记 */}
        {isPressure && (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--danger)] font-bold shrink-0">
            <Zap className="w-3 h-3" /> 压力
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
              {difficultyMessage}
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
            transition={{ duration: 1.5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <span className="text-3xl font-bold text-[var(--danger)] drop-shadow-lg">⏰ 时间到！</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenario display */}
      <div className={cn(
        'rounded-xl border p-5 md:p-6 relative overflow-hidden',
        isPressure ? 'bg-[var(--felt)] border-[var(--danger)]/30' : 'bg-[var(--felt)] border-[var(--felt-light)]'
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />

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
              底池 <b className="text-[var(--brass)] font-mono">{formatBB(scenario.potSize)}</b>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Chip amount={scenario.effectiveStack} color="blue" size="sm" />
              有效筹码 <b className="text-[var(--ivory)] font-mono">{formatBB(scenario.effectiveStack)}</b>
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
                {scenario.gameContext.gameType === 'cash' ? '💰 现金桌' : scenario.gameContext.gameType === 'mtt' ? '🏆 锦标赛' : '🎰 SNG'}
              </span>
              {scenario.gameContext.icmPressure && scenario.gameContext.icmPressure !== 'low' && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--poker-danger)]/20 text-[var(--poker-danger)]">
                  ICM压力: {scenario.gameContext.icmPressure === 'high' ? '高' : '中'}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {options.map((option, i) => {
          const styleKey = option.action;
          const baseStyle = ACTION_STYLES[styleKey] ?? ACTION_STYLES['Call']!;
          const isSelected = selectedOption === option;
          const showCorrect = isAnswered && option.isCorrect;
          const showWrong = isAnswered && isSelected && !option.isCorrect;

          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(option)}
              disabled={isAnswered}
              className={cn(
                'relative min-w-[100px] rounded-lg border px-4 py-3 text-sm font-bold transition-all',
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
              transition={{ duration: 0.4 }}
              whileHover={!isAnswered ? { scale: 1.03 } : {}}
              whileTap={!isAnswered ? { scale: 0.97 } : {}}
            >
              {option.action}
              {option.amount && <span className="ml-1 font-mono text-xs opacity-80">{option.amount}</span>}
              {/* 快捷键标记 */}
              {!isAnswered && (
                <span className="absolute bottom-1 right-1.5 text-[10px] opacity-40 font-mono">{i + 1}</span>
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
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'rounded-lg border p-4',
                selectedOption.isCorrect && !isTimedOut
                  ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
                  : 'border-[var(--danger)]/40 bg-[var(--danger)]/10'
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                {/* P1E-13: 超时路径仅展示"系统代选"，本题计为答错（即使代选项正确） */}
                {isTimedOut ? (
                  <>
                    <XCircle className="w-4 h-4 text-[var(--danger)]" />
                    <span className="text-sm font-bold text-[var(--danger)]">
                      ⏰ 超时！系统代选 {selectedOption.action}，本题计为答错
                    </span>
                    {correctOption && (
                      <span className="text-xs text-[var(--ivory-muted)] ml-2">
                        正确答案：{correctOption.action}{correctOption.amount ? ` ${correctOption.amount}` : ''}
                      </span>
                    )}
                  </>
                ) : selectedOption.isCorrect ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                    <span className="text-sm font-bold text-[var(--success)]">✓ 正确</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-[var(--danger)]" />
                    <span className="text-sm font-bold text-[var(--danger)]">✗ 不正确</span>
                    {correctOption && (
                      <span className="text-xs text-[var(--ivory-muted)] ml-2">
                        正确答案：{correctOption.action}{correctOption.amount ? ` ${correctOption.amount}` : ''}
                      </span>
                    )}
                  </>
                )}
                {selectedOption.evImpact && (
                  <span
                    className={cn(
                      'ml-auto text-xs font-mono',
                      selectedOption.evImpact.startsWith('+') ? 'text-[var(--success)]' : 'text-[var(--danger)]'
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
                  去复习 →
                </button>
              )}

              {/* Opponent Strategy Hint */}
              {scenario.opponent && (
                <p className="text-xs text-[var(--ivory-muted)] mt-2">
                  📊 提示：面对{scenario.opponent.shortName}类型玩家，{
                    selectedOption.isCorrect && !isTimedOut
                      ? '你的决策考虑了对手倾向，很好！'
                      : `此类对手${scenario.opponent.tendencies[0]}，需要相应调整策略。`
                  }
                </p>
              )}
            </div>

            {/* Next button */}
            <div className="flex justify-end mt-3">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {currentIndex + 1 >= totalQuestions ? '查看成绩' : '下一题'}
                <span className="text-xs opacity-60">(空格)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
