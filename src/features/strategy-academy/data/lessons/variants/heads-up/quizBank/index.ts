import type { QuizQuestion } from '../../../../../types';
import { LEVEL_3HU_QUIZ_BANK } from './l3hu';
import { LEVEL_4HU_QUIZ_BANK } from './l4hu';
import { LEVEL_5HU_QUIZ_BANK } from './l5hu';
import { LEVEL_6HU_QUIZ_BANK } from './l6hu';
import { LEVEL_7HU_QUIZ_BANK } from './l7hu';
import { LEVEL_8HU_QUIZ_BANK } from './l8hu';

/** 单挑全部题库（按 Level 文件聚合）。 */
export const HEADS_UP_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  ...LEVEL_3HU_QUIZ_BANK,
  ...LEVEL_4HU_QUIZ_BANK,
  ...LEVEL_5HU_QUIZ_BANK,
  ...LEVEL_6HU_QUIZ_BANK,
  ...LEVEL_7HU_QUIZ_BANK,
  ...LEVEL_8HU_QUIZ_BANK,
};
