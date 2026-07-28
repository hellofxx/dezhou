import { create } from 'zustand';
import type { HandNotation, RangeAction, GameVariant } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { RangePreset, LearnState, QuizSessionState, QuizQuestion } from './types';
import { PRESET_RANGES, getPresetsForVariantAndPlayerCount } from './constants';
import { getAllHandNotations } from '@/shared/utils/deck';
import { getEasyQuestion } from './hooks/useQuizEngine';

interface RangeTrainerStore {
  // 游戏变体配置
  gameVariant: GameVariant;
  playerCount: number;
  setGameVariant: (variant: GameVariant) => void;
  setPlayerCount: (count: number) => void;

  // 学习模式状态
  learnState: LearnState;

  // 学习 Actions
  setSelectedPreset: (preset: RangePreset | null) => void;
  setSelectedPosition: (position: Position) => void;
  setSelectedActionType: (actionType: string) => void;
  setHighlightedHand: (hand: HandNotation | null) => void;

  // 预设范围（随变体动态变化）
  presets: RangePreset[];
  getPresetsByPosition: (position: Position) => RangePreset[];

  // 测验模式状态
  quizState: QuizSessionState;

  // 测验 Actions
  startQuiz: (position: Position, actionType: string, timeLimit: number, totalQuestions?: number) => void;
  answerQuestion: (action: RangeAction) => void;
  nextQuestion: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  endQuiz: () => void;
  resetQuiz: () => void;
}

const INITIAL_QUIZ_STATE: QuizSessionState = {
  position: null,
  actionType: '',
  timeLimit: 0,
  totalQuestions: 20,
  questions: [],
  currentIndex: 0,
  answers: [],
  isCorrect: [],
  timePerQuestion: [],
  status: 'idle',
  handWeights: {},
  questionStartTime: 0,
  rescueUsed: false,
};

/** 生成短牌81种手牌表示 */
function getShortDeckHandNotations(): HandNotation[] {
  const rankLetters: Record<number, string> = {
    6: '6', 7: '7', 8: '8', 9: '9', 10: 'T',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A',
  };
  const rankValues = [14, 13, 12, 11, 10, 9, 8, 7, 6];
  const notations: HandNotation[] = [];
  for (const r of rankValues) {
    notations.push(`${rankLetters[r]!}${rankLetters[r]!}`);
  }
  for (let i = 0; i < rankValues.length; i++) {
    for (let j = i + 1; j < rankValues.length; j++) {
      const high = rankLetters[rankValues[i]!]!;
      const low = rankLetters[rankValues[j]!]!;
      notations.push(`${high}${low}s`);
      notations.push(`${high}${low}o`);
    }
  }
  return notations;
}

/**
 * 生成测验题目：
 * - 约 50% 来自范围内（正确答案=raise）
 * - 约 50% 来自范围外（正确答案=fold）
 * - 使用加权随机（handWeights）让答错的牌更频繁出现
 */
function generateQuestions(
  position: Position,
  actionType: string,
  totalQuestions: number,
  handWeights: Record<string, number>,
  variant: GameVariant = 'standard',
): QuizQuestion[] {
  const presets = getPresetsForVariantAndPlayerCount(variant, variant === 'heads-up' ? 2 : 6);
  const preset = presets.find(
    (p) => p.position === position && p.actionType === actionType
  );

  if (!preset) return [];

  const rangeHands = new Set(preset.hands);
  const allHands = variant === 'short-deck' ? getShortDeckHandNotations() : getAllHandNotations();

  // 分为范围内和范围外
  const inRange = allHands.filter((h) => rangeHands.has(h));
  const outRange = allHands.filter((h) => !rangeHands.has(h));

  const questions: QuizQuestion[] = [];
  const halfCount = Math.ceil(totalQuestions / 2);

  // 加权随机抽样函数
  function weightedPick(pool: HandNotation[], count: number): HandNotation[] {
    const picked: HandNotation[] = [];
    const used = new Set<string>();
    const maxAttempts = count * 10;
    let attempts = 0;

    while (picked.length < count && attempts < maxAttempts) {
      attempts++;
      // 计算总权重
      const available = pool.filter((h) => !used.has(h));
      if (available.length === 0) break;

      const weights = available.map((h) => handWeights[h] ?? 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let r = Math.random() * totalWeight;

      for (let i = 0; i < available.length; i++) {
        r -= weights[i]!;
        if (r <= 0) {
          picked.push(available[i]!);
          used.add(available[i]!);
          break;
        }
      }
    }
    return picked;
  }

  // 范围内题目（正确答案=raise）
  const inPicks = weightedPick(inRange, halfCount);
  for (const hand of inPicks) {
    questions.push({
      hand,
      position,
      correctAction: 'raise',
      context: `${position} ${actionType}`,
    });
  }

  // 范围外题目（正确答案=fold）
  const outPicks = weightedPick(outRange, totalQuestions - halfCount);
  for (const hand of outPicks) {
    questions.push({
      hand,
      position,
      correctAction: 'fold',
      context: `${position} ${actionType}`,
    });
  }

  // 随机打乱顺序
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j]!, questions[i]!];
  }

  return questions;
}

export const useRangeTrainerStore = create<RangeTrainerStore>((set, get) => ({
  // ─── 游戏变体配置 ────────────────────────────────────────
  gameVariant: 'standard',
  playerCount: 6,

  setGameVariant: (variant) => {
    const defaultPlayers = variant === 'heads-up' ? 2 : variant === 'short-deck' ? 6 : 6;
    set((state) => ({
      gameVariant: variant,
      playerCount: defaultPlayers,
      presets: getPresetsForVariantAndPlayerCount(variant, defaultPlayers),
      learnState: { ...state.learnState, selectedPreset: null },
    }));
  },

  setPlayerCount: (count) => {
    set((state) => ({
      playerCount: count,
      presets: getPresetsForVariantAndPlayerCount(state.gameVariant, count),
      learnState: { ...state.learnState, selectedPreset: null },
    }));
  },

  learnState: {
    selectedPreset: null,
    selectedPosition: Position.UTG,
    selectedActionType: 'open',
    highlightedHand: null,
  },

  setSelectedPreset: (preset) =>
    set((state) => ({
      learnState: { ...state.learnState, selectedPreset: preset },
    })),

  setSelectedPosition: (position) =>
    set((state) => ({
      learnState: {
        ...state.learnState,
        selectedPosition: position,
        selectedPreset: null,
      },
    })),

  setSelectedActionType: (actionType) =>
    set((state) => ({
      learnState: {
        ...state.learnState,
        selectedActionType: actionType,
        selectedPreset: null,
      },
    })),

  setHighlightedHand: (hand) =>
    set((state) => ({
      learnState: { ...state.learnState, highlightedHand: hand },
    })),

  presets: PRESET_RANGES,

  getPresetsByPosition: (position) => {
    return get().presets.filter((p) => p.position === position);
  },

  // ─── 测验模式 ────────────────────────────────────────

  quizState: INITIAL_QUIZ_STATE,

  startQuiz: (position, actionType, timeLimit, totalQuestions = 20) => {
    const { quizState, gameVariant } = get();
    const generated = generateQuestions(position, actionType, totalQuestions, quizState.handWeights, gameVariant);

    // "最后一题简单"策略：将末题替换为最简单的 AA@BTN open 题
    // （仅当生成出至少 1 道题时；用户答对即可"以正确结束"）
    const questions =
      generated.length > 0
        ? [...generated.slice(0, generated.length - 1), getEasyQuestion()]
        : generated;

    set({
      quizState: {
        ...INITIAL_QUIZ_STATE,
        position,
        actionType,
        timeLimit,
        totalQuestions: questions.length,
        questions,
        answers: new Array(questions.length).fill(null),
        isCorrect: new Array(questions.length).fill(false),
        timePerQuestion: new Array(questions.length).fill(0),
        status: 'running',
        handWeights: quizState.handWeights, // 保留已有权重
        questionStartTime: Date.now(),
        rescueUsed: false,
      },
    });
  },

  answerQuestion: (action) => {
    const { quizState } = get();
    const { currentIndex, questions, answers, isCorrect, timePerQuestion, handWeights, questionStartTime } = quizState;

    if (currentIndex >= questions.length || answers[currentIndex] !== null) return;

    const question = questions[currentIndex]!;
    const correct = action === question.correctAction;
    const elapsed = Date.now() - questionStartTime;

    // 更新间隔重复权重
    const newWeights = { ...handWeights };
    const hand = question.hand;
    if (!correct) {
      // 答错：权重增加（首次 2x，连续错 3x）
      newWeights[hand] = Math.min((newWeights[hand] ?? 1) + 1, 3);
    } else {
      // 答对：恢复正常权重
      newWeights[hand] = 1;
    }

    const newAnswers = [...answers];
    newAnswers[currentIndex] = action;

    const newIsCorrect = [...isCorrect];
    newIsCorrect[currentIndex] = correct;

    const newTimes = [...timePerQuestion];
    newTimes[currentIndex] = elapsed;

    set({
      quizState: {
        ...quizState,
        answers: newAnswers,
        isCorrect: newIsCorrect,
        timePerQuestion: newTimes,
        handWeights: newWeights,
      },
    });
  },

  nextQuestion: () => {
    const { quizState } = get();
    const { currentIndex, questions, answers, isCorrect, timePerQuestion, rescueUsed } = quizState;

    // 不是最后一题：正常前进
    if (currentIndex < questions.length - 1) {
      set({
        quizState: {
          ...quizState,
          currentIndex: currentIndex + 1,
          questionStartTime: Date.now(),
        },
      });
      return;
    }

    // 最后一题已答完：检查是否答对，未答对且未用过补救 → 追加一道简单题作为"补救"
    const lastAnswered = answers[currentIndex] !== null;
    const lastCorrect = isCorrect[currentIndex] ?? false;

    if (lastAnswered && !lastCorrect && !rescueUsed) {
      const rescueQuestion = getEasyQuestion();
      set({
        quizState: {
          ...quizState,
          questions: [...questions, rescueQuestion],
          answers: [...answers, null],
          isCorrect: [...isCorrect, false],
          timePerQuestion: [...timePerQuestion, 0],
          totalQuestions: questions.length + 1,
          currentIndex: currentIndex + 1,
          rescueUsed: true,
          questionStartTime: Date.now(),
        },
      });
      return;
    }

    // 否则结束测验
    set({
      quizState: { ...quizState, status: 'completed' },
    });
  },

  pauseQuiz: () => {
    const { quizState } = get();
    if (quizState.status === 'running') {
      set({ quizState: { ...quizState, status: 'paused' } });
    }
  },

  resumeQuiz: () => {
    const { quizState } = get();
    if (quizState.status === 'paused') {
      set({
        quizState: {
          ...quizState,
          status: 'running',
          questionStartTime: Date.now(), // 重置当前题计时
        },
      });
    }
  },

  endQuiz: () => {
    set((state) => ({
      quizState: { ...state.quizState, status: 'completed' },
    }));
  },

  resetQuiz: () => {
    set({ quizState: INITIAL_QUIZ_STATE });
  },
}));
