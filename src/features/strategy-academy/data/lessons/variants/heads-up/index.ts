import type { Lesson } from '../../../../types';
import { applyQuizBank } from '../../../../utils/applyQuizBank';
import { HEADS_UP_QUIZ_BANK } from './quizBank';
import { HEADS_UP_LESSON as L3HU_BN_AGGRESSION } from './lessons/l3hu-bn-aggression';
import { HEADS_UP_LESSON as L3HU_SB_CONTINUATION } from './lessons/l3hu-sb-continuation';
import { HEADS_UP_LESSON as L3HU_BB_DEFENSE } from './lessons/l3hu-bb-defense';
import { HEADS_UP_LESSON as L4HU_BN_OPENING } from './lessons/l4hu-bn-opening';
import { HEADS_UP_LESSON as L4HU_EV_ADJUSTMENTS } from './lessons/l4hu-ev-adjustments';
import { HEADS_UP_LESSON as L4HU_GTO_BASICS } from './lessons/l4hu-gto-basics';
import { HEADS_UP_LESSON as L4HU_COUNTER_STRATEGIES } from './lessons/l4hu-counter-strategies';
import { HEADS_UP_LESSON as L5HU_FOCUS } from './lessons/l5hu-focus';
import { HEADS_UP_LESSON as L5HU_OPPONENT_PSYCHOLOGY } from './lessons/l5hu-opponent-psychology';
import { HEADS_UP_LESSON as L6HU_TOURNEY } from './lessons/l6hu-tourney';
import { HEADS_UP_LESSON as L7HU_STAKES } from './lessons/l7hu-stakes';
import { HEADS_UP_LESSON as L8HU_EXPLOITATIVE } from './lessons/l8hu-exploitative';

/**
 * Heads-Up（单挑）策略课程聚合（每课单文件）。
 * 题库独立在 quizBank/lNhu.ts，由 applyQuizBank 注入；课时抽题仍为 5，
 * 重考按 lessonId + attempt 换题。L3 / L4 / L5 / L6 / L7 / L8 的数组导出保留给
 * 既有按 Level 引用的兼容层。
 */
export const HEADS_UP_LEVEL_3_LESSONS: Lesson[] = [
  L3HU_BN_AGGRESSION,
  L3HU_SB_CONTINUATION,
  L3HU_BB_DEFENSE,
];

export const HEADS_UP_LEVEL_4_LESSONS: Lesson[] = [
  L4HU_BN_OPENING,
  L4HU_EV_ADJUSTMENTS,
  L4HU_GTO_BASICS,
  L4HU_COUNTER_STRATEGIES,
];

export const HEADS_UP_LEVEL_5_LESSONS: Lesson[] = [
  L5HU_FOCUS,
  L5HU_OPPONENT_PSYCHOLOGY,
];

export const HEADS_UP_LEVEL_6_LESSONS: Lesson[] = [L6HU_TOURNEY];

export const HEADS_UP_LEVEL_7_LESSONS: Lesson[] = [L7HU_STAKES];

export const HEADS_UP_LEVEL_8_LESSONS: Lesson[] = [L8HU_EXPLOITATIVE];

export const HEADS_UP_STRATEGY_COURSES: Lesson[] = applyQuizBank(
  [
    ...HEADS_UP_LEVEL_3_LESSONS,
    ...HEADS_UP_LEVEL_4_LESSONS,
    ...HEADS_UP_LEVEL_5_LESSONS,
    ...HEADS_UP_LEVEL_6_LESSONS,
    ...HEADS_UP_LEVEL_7_LESSONS,
    ...HEADS_UP_LEVEL_8_LESSONS,
  ],
  HEADS_UP_QUIZ_BANK,
);
