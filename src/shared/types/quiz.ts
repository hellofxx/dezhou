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
  /** 题目稳定标识：QuizCard 动画 key 为 hand+id 复合，相邻同 hand 题目也能正常切换 */
  id?: string;
}

/** 单题答题反馈 */
export interface QuestionFeedback {
  isCorrect: boolean;
  correctAction: RangeAction;
  userAction: QuizAnswer;
}
