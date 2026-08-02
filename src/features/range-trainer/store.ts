import { create } from 'zustand';
import type { HandNotation, GameVariant } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { RangePreset, QuizSessionState, LearnState, QuizSlice } from './types';
import { PRESET_RANGES, getPresetsForVariantAndPlayerCount } from './constants';
import { generateQuestions } from './utils/questionGenerator';
import { getEasyQuestion } from './hooks/useQuizEngine';

interface RangeTrainerCoreSlice {
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
}

export type RangeTrainerStore = RangeTrainerCoreSlice & QuizSlice;

// 测验模式初始状态
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
  pausedElapsed: 0,
  rescueUsed: false,
};

export { INITIAL_QUIZ_STATE };

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

  // ─── 测验模式 ───────────────────────────────────────────
  quizState: INITIAL_QUIZ_STATE,

  startQuiz: (position, actionType, timeLimit, totalQuestions = 20) => {
    const { quizState, presets } = get();
    const generated = generateQuestions(presets, position, actionType, totalQuestions, quizState.handWeights);

    if (generated.length === 0) return false;

    const questions = [...generated.slice(0, generated.length - 1), getEasyQuestion()];

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
        handWeights: quizState.handWeights,
        questionStartTime: Date.now(),
        pausedElapsed: 0,
        rescueUsed: false,
      },
    });
    return true;
  },

  answerQuestion: (action) => {
    const { quizState } = get();
    const { currentIndex, questions, answers, isCorrect, timePerQuestion, handWeights, questionStartTime, pausedElapsed } = quizState;

    if (currentIndex >= questions.length || answers[currentIndex] !== null) return;

    const question = questions[currentIndex]!;
    const correct = action !== 'timeout' && action === question.correctAction;
    const elapsed = pausedElapsed + (Date.now() - questionStartTime);

    const newWeights = { ...handWeights };
    const hand = question.hand;
    if (!correct) {
      newWeights[hand] = Math.min((newWeights[hand] ?? 1) + 1, 3);
    } else {
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

    if (currentIndex < questions.length - 1) {
      set({
        quizState: {
          ...quizState,
          currentIndex: currentIndex + 1,
          questionStartTime: Date.now(),
          pausedElapsed: 0,
        },
      });
      return;
    }

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
          pausedElapsed: 0,
        },
      });
      return;
    }

    set({
      quizState: { ...quizState, status: 'completed' },
    });
  },

  pauseQuiz: () => {
    const { quizState } = get();
    if (quizState.status === 'running') {
      set({
        quizState: {
          ...quizState,
          status: 'paused',
          pausedElapsed: quizState.pausedElapsed + (Date.now() - quizState.questionStartTime),
        },
      });
    }
  },

  resumeQuiz: () => {
    const { quizState } = get();
    if (quizState.status === 'paused') {
      set({
        quizState: {
          ...quizState,
          status: 'running',
          questionStartTime: Date.now(),
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
    set((state) => ({
      quizState: { ...INITIAL_QUIZ_STATE, handWeights: state.quizState.handWeights },
    }));
  },
}));
