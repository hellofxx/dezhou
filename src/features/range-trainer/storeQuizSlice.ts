import type { StateCreator } from 'zustand';
import type { QuizSessionState, QuizSlice } from './types';
import { generateQuestions } from './utils/questionGenerator';
import { getEasyQuestion } from './hooks/useQuizEngine';
import type { RangeTrainerStore } from './store';

export type { QuizSlice };

export const INITIAL_QUIZ_STATE: QuizSessionState = {
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

export const createQuizSlice: StateCreator<RangeTrainerStore, [], [], QuizSlice> = (set, get) => ({
  quizState: INITIAL_QUIZ_STATE,

  startQuiz: (position, actionType, timeLimit, totalQuestions = 20) => {
    // P1A-10 修复：题目生成使用 store 中已按 variant + playerCount 变体化的 presets
    const { quizState, gameVariant, presets } = get();
    const generated = generateQuestions(presets, position, actionType, totalQuestions, quizState.handWeights, gameVariant);

    // P1A-01 修复：0 题（无题库组合）不进入 running，停留在配置页
    if (generated.length === 0) return false;

    // "最后一题简单"策略：将末题替换为最简单的 AA@BTN open 题
    // （用户答对即可"以正确结束"）
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
        handWeights: quizState.handWeights, // 保留已有权重
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
    // P1A-02 修复：'timeout' 恒判错（即使正确答案恰为 fold 也不算对）
    const correct = action !== 'timeout' && action === question.correctAction;
    // P1A-14 修复：耗时 = 暂停前已累计耗时 + 恢复后耗时
    const elapsed = pausedElapsed + (Date.now() - questionStartTime);

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
          pausedElapsed: 0,
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
          pausedElapsed: 0,
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
      set({
        quizState: {
          ...quizState,
          status: 'paused',
          // P1A-14 修复：暂停时把当前题已耗时累计到 pausedElapsed
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
          // P1A-14 修复：重置段起点续算，pausedElapsed 保留暂停前耗时
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
    // P1A-09 修复：保留 handWeights，使"再练一次"路径保住间隔重复加权
    set((state) => ({
      quizState: { ...INITIAL_QUIZ_STATE, handWeights: state.quizState.handWeights },
    }));
  },
});
