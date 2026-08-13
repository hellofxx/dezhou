/**
 * 首次微训练（FirstDrill）纯状态机 — P2A-03/04/05 统一治本方案。
 *
 * 设计要点：
 * - 显式 rescueUsed 标志替代旧的 isLast/lastAnswerCorrect 推断式判定
 *   （旧实现 append 补救题后 isLast 立即变 false，产生死分支与提示失效，P2A-05）
 * - 补救题 append 带双守卫：仅原题库末题 + rescueUsed 未用过 → 补救仅追加一次，
 *   补救题再答错不会再 append，不会出现"第 5 题/共 6 题"（P2A-04）
 * - rescueHint 按「原题库末题」判定（currentIdx === DRILL_QUESTIONS.length - 1），
 *   与 append 后 questions.length 变化无关，末题答错时正确显示（P2A-03）
 */
import { Position } from '@/shared/types/position';
import type { RangeAction } from '@/shared/types/poker';
import type { QuizQuestion, QuestionFeedback } from '@/shared/types/quiz';

// 首次微训练题目（从简单到稍难，最后一题必须是最简单的"必对题"）
export const DRILL_QUESTIONS: QuizQuestion[] = [
  { hand: 'AA', position: Position.BTN, correctAction: 'raise', context: 'BTN Open' },
  { hand: '72o', position: Position.UTG, correctAction: 'fold', context: 'UTG Open' },
  { hand: 'KK', position: Position.UTG, correctAction: 'raise', context: 'UTG Open' },
  // 最后一题：超级简单，确保用户以正确收尾
  { hand: 'AA', position: Position.CO, correctAction: 'raise', context: 'CO Open' },
];

// 补救题：如果用户最后一题答错，追加这道更简单的题（仅一次）
export const RESCUE_QUESTION: QuizQuestion = {
  hand: 'AA',
  position: Position.BTN,
  correctAction: 'raise',
  context: 'BTN Open',
};

export interface DrillState {
  questions: QuizQuestion[];
  currentIdx: number;
  feedback: QuestionFeedback | null;
  /** 补救题是否已追加（显式状态，保证补救仅一次） */
  rescueUsed: boolean;
}

export function createDrillState(): DrillState {
  return { questions: DRILL_QUESTIONS, currentIdx: 0, feedback: null, rescueUsed: false };
}

/** 当前是否停在补救题上（原题库之外的追加题） */
export function isOnRescueQuestion(state: DrillState): boolean {
  return state.currentIdx >= DRILL_QUESTIONS.length;
}

/** 当前是否为整组题的最后一题（决定按钮文案「完成/下一题」） */
export function isOnFinalQuestion(state: DrillState): boolean {
  return state.currentIdx === state.questions.length - 1;
}

/**
 * 作答当前题。原题库末题答错且未用过补救时追加补救题
 * （双守卫：currentIdx 锚定原题库末题 + rescueUsed，P2A-04 补救仅一次）。
 */
export function answerCurrentQuestion(state: DrillState, action: RangeAction): DrillState {
  if (state.feedback) return state; // 已作答，忽略重复提交
  const current = state.questions[state.currentIdx];
  if (!current) return state;
  const isCorrect = action === current.correctAction;
  const feedback: QuestionFeedback = {
    isCorrect,
    correctAction: current.correctAction,
    userAction: action,
  };
  const shouldAppendRescue =
    !isCorrect && state.currentIdx === DRILL_QUESTIONS.length - 1 && !state.rescueUsed;
  return {
    ...state,
    feedback,
    questions: shouldAppendRescue ? [...state.questions, RESCUE_QUESTION] : state.questions,
    rescueUsed: state.rescueUsed || shouldAppendRescue,
  };
}

/**
 * 是否显示补救提示（P2A-03）：按「原题库末题答错」判定，
 * 不受 append 后 questions.length 变化影响（旧条件恒 false 的根因）。
 */
export function shouldShowRescueHint(state: DrillState): boolean {
  return (
    !!state.feedback &&
    !state.feedback.isCorrect &&
    state.currentIdx === DRILL_QUESTIONS.length - 1
  );
}

/**
 * 前进（P2A-05 无死分支）：还有下一题 → 推进并清反馈；
 * 否则完成（原题库末题答对未追加补救，或补救题已作答——对错均以此收尾，补救仅一次）。
 */
export function advanceDrill(
  state: DrillState,
): { done: true } | { done: false; state: DrillState } {
  if (!state.feedback) return { done: false, state }; // 未作答不可前进
  if (state.currentIdx < state.questions.length - 1) {
    return {
      done: false,
      state: { ...state, currentIdx: state.currentIdx + 1, feedback: null },
    };
  }
  return { done: true };
}
