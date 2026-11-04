import type { AcademyProgress, BasicsProgress } from '../types';

/** store 初始进度（reset 与 persist 迁移共用）。 */
export const initialProgress: AcademyProgress = {
  completedLessons: [],
  quizScores: {},
  currentLesson: null,
  startedAt: 0,
  completedUnits: {},
};

export const initialBasicsProgress: BasicsProgress = {
  currentStep: 0,
  completed: false,
};
