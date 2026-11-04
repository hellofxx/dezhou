import type { QuizQuestion } from '../../../../../types';
import { LEVEL_1_QUIZ_BANK } from './level1';
import { LEVEL_2_QUIZ_BANK } from './level2';
import { LEVEL_3_QUIZ_BANK } from './level3';
import { LEVEL_4_QUIZ_BANK } from './level4';
import { LEVEL_5_QUIZ_BANK } from './level5';
import { LEVEL_6_QUIZ_BANK } from './level6';
import { LEVEL_7_QUIZ_BANK } from './level7';
import { LEVEL_8_QUIZ_BANK } from './level8';
import { LOCAL_QUIZ_BANK } from './local';

/** 标准变体 L1-L8 题库（lessonId → questions）。 */
export const STANDARD_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  ...LEVEL_1_QUIZ_BANK,
  ...LEVEL_2_QUIZ_BANK,
  ...LEVEL_3_QUIZ_BANK,
  ...LEVEL_4_QUIZ_BANK,
  ...LEVEL_5_QUIZ_BANK,
  ...LEVEL_6_QUIZ_BANK,
  ...LEVEL_7_QUIZ_BANK,
  ...LEVEL_8_QUIZ_BANK,
};

/** 本土课题库（并入 L7，单独维护）。 */
export { LOCAL_QUIZ_BANK };
