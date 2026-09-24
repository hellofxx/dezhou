/**
 * 谜题引擎纯函数核心（P1-D 修复批从 usePuzzleEngine.ts 拆出）。
 *
 * 拆分动机：
 *  1. usePuzzleEngine.ts 超 200 行上限，纯逻辑下沉此处；
 *  2. 分数口径（P1D-02）与统计口径（P1D-05）需要纯函数级回归测试锁定。
 *
 * 所有函数均为纯函数（buildInitialState / applyAnswer 内部取 Date.now() 由入参注入）。
 */
import { calculateGrade } from '@/shared/types/decisionFeedback';
import type {
  PuzzleAnswerRecord,
  PuzzleEngineState,
  PuzzleMode,
  PuzzleQuestion,
  PuzzleResult,
  PuzzleTheme,
  UsePuzzleEngineOptions,
} from '../types';
import { getDailyPuzzles } from '../data/dailyPuzzles';
import {
  getRushQuestions,
  RUSH_INITIAL_LIVES,
  RUSH_STREAK_THRESHOLD,
  RUSH_STREAK_BONUS,
} from '../data/rushQuestions';
import { getPuzzlesByTheme } from '../data/puzzleBank';

/** Rush 默认时长：3 分钟 */
export const RUSH_DEFAULT_DURATION = 3 * 60 * 1000;

/** 构建引擎初始状态（reset 时复用） */
export function buildInitialState(opts: UsePuzzleEngineOptions): PuzzleEngineState {
  let questions: PuzzleQuestion[] = [];

  if (opts.mode === 'rush') {
    questions = getRushQuestions(30);
  } else if (opts.mode === 'daily') {
    questions = getDailyPuzzles();
  } else if (opts.mode === 'theme' && opts.theme) {
    questions = getPuzzlesByTheme(opts.theme);
    if (opts.questionCount && opts.questionCount > 0) {
      questions = questions.slice(0, opts.questionCount);
    }
  }

  const duration = opts.mode === 'rush' ? (opts.duration ?? RUSH_DEFAULT_DURATION) : 0;
  const enableLives = opts.mode === 'rush' && (opts.enableLives ?? true);

  return {
    questions,
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    lives: enableLives ? RUSH_INITIAL_LIVES : 0,
    streak: 0,
    startTime: Date.now(),
    endTime: null,
    timeRemaining: duration,
    status: 'playing',
    answers: [],
    bonusAwarded: 0,
  };
}

/** applyAnswer 入参 */
export interface ApplyAnswerInput {
  optionId: string;
  mode: PuzzleMode;
  /** 当前题开始时间戳（用于计算单题用时） */
  questionStartedAt: number;
  /** 当前时间戳（由调用方注入，便于测试） */
  now: number;
  /**
   * 主题 → 课程 ID 推导。由 hook 注入（映射表唯一事实源保留在
   * usePuzzleEngine.ts 的 inferPuzzleLessonId，此处不复制映射）。
   */
  inferLessonId: (theme: string) => string | undefined;
}

/**
 * 结算一次作答，返回新状态（无效输入 / 重复作答返回原状态引用，幂等）。
 *
 * Rush 模式：答错扣 1 命；连对 RUSH_STREAK_THRESHOLD 题奖励 RUSH_STREAK_BONUS 时间
 * （奖励累计入 bonusAwarded，供计时基准换算，见 usePuzzleEngine 的 P1D-03 注释）。
 */
export function applyAnswer(prev: PuzzleEngineState, input: ApplyAnswerInput): PuzzleEngineState {
  if (prev.status !== 'playing') return prev;
  const q = prev.questions[prev.currentIndex];
  if (!q) return prev;
  // 已答过当前题，幂等
  if (prev.answers.some((a) => a.questionId === q.id)) return prev;

  const option = q.options.find((o) => o.id === input.optionId);
  if (!option) return prev;

  const evLoss = option.evLoss ?? 0;
  const record: PuzzleAnswerRecord = {
    questionId: q.id,
    selectedOptionId: input.optionId,
    isCorrect: option.isCorrect,
    timeTaken: input.now - input.questionStartedAt,
    grade: calculateGrade(evLoss),
    evLoss,
    // P4 修复（4.2-P1-2）：附加相关课程 ID，供 UI 显示"去复习"链接
    relatedLessonId: input.inferLessonId(q.theme),
  };

  const newStreak = option.isCorrect ? prev.streak + 1 : 0;
  const newLives =
    input.mode === 'rush' && !option.isCorrect ? Math.max(0, prev.lives - 1) : prev.lives;

  // Rush 模式：连对 5 题奖励 +10 秒
  let bonus = 0;
  if (input.mode === 'rush' && newStreak > 0 && newStreak % RUSH_STREAK_THRESHOLD === 0) {
    bonus = RUSH_STREAK_BONUS;
  }

  return {
    ...prev,
    answers: [...prev.answers, record],
    correctCount: prev.correctCount + (option.isCorrect ? 1 : 0),
    wrongCount: prev.wrongCount + (option.isCorrect ? 0 : 1),
    streak: newStreak,
    lives: newLives,
    timeRemaining: input.mode === 'rush' ? prev.timeRemaining + bonus : prev.timeRemaining,
    bonusAwarded: prev.bonusAwarded + bonus,
  };
}

/**
 * 会话分数。
 *
 * Rush：答对 × 100 + 剩余时间(秒) × 10 + 剩余命 × 200。
 * P1D-02 修复：命耗尽（status='failed'）不计剩余时间分——旧口径下
 * "快速送掉 3 条命"保留大量剩余时间，反而比认真打满分高（激励反常），
 * 且 failed 会话可借此刷 rushBest。failed 时剩余时间分归 0（命分此时也为 0）。
 */
export function computeSessionScore(
  mode: PuzzleMode,
  state: Pick<PuzzleEngineState, 'correctCount' | 'timeRemaining' | 'lives' | 'status'>
): number {
  if (mode !== 'rush') return state.correctCount * 100;
  const timeComponent =
    state.status === 'failed' ? 0 : Math.floor(state.timeRemaining / 1000) * 10;
  return state.correctCount * 100 + timeComponent + state.lives * 200;
}

/**
 * 由引擎状态构建结果对象。
 *
 * P1D-05 修复：Rush 的题池固定 30 题但会话通常提前结束（时间到/命耗尽），
 * 旧口径 totalQuestions 恒取 questions.length(30)，导致 emit 到 progress 的
 * 全局正确率被稀释、题数虚增，且结果页 "10/30" 与 accuracy（分母=已答数）自相矛盾。
 * 现 Rush 统一取已答数 answers.length（buildResult → emit 记录 → 结果页三处同源）。
 */
export function buildPuzzleResult(
  state: PuzzleEngineState,
  mode: PuzzleMode,
  theme?: PuzzleTheme
): PuzzleResult {
  const totalAnswered = state.answers.length;
  const accuracy = totalAnswered > 0 ? state.correctCount / totalAnswered : 0;
  const averageTime =
    totalAnswered > 0
      ? state.answers.reduce((sum, a) => sum + a.timeTaken, 0) / totalAnswered
      : 0;

  return {
    sessionId: `puzzle-${mode}-${Date.now()}`,
    mode,
    theme,
    totalQuestions: mode === 'rush' ? totalAnswered : state.questions.length,
    correctCount: state.correctCount,
    wrongCount: state.wrongCount,
    accuracy,
    duration: (state.endTime ?? Date.now()) - state.startTime,
    averageTime,
    score: computeSessionScore(mode, state),
    timestamp: Date.now(),
    answers: state.answers,
    questions: state.questions,
    status: state.status,
  };
}
