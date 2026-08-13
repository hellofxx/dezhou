import type { HandNotation, RangeAction } from '@/shared/types/poker';
import type { Position } from '@/shared/types/position';

/** 测验答题动作（超时作为特殊答案） */
export type QuizAnswer = RangeAction | 'timeout';

/** 范围测验单题（range-trainer 与 onboarding 首训共用） */
export interface QuizQuestion {
  hand: HandNotation;
  position: Position;
  context?: string;
  correctAction: RangeAction;
}

/** 单题答题反馈 */
export interface QuestionFeedback {
  isCorrect: boolean;
  correctAction: RangeAction;
  userAction: QuizAnswer;
}
