import type { DrawInfo } from './types';

// name/description 存 i18n key（potOdds.draws.*），DrawsReference 渲染时经 t() 解析
export const COMMON_DRAWS: DrawInfo[] = [
  { name: 'potOdds.draws.openEndedStraight', outs: 8, description: 'potOdds.draws.openEndedStraightDesc' },
  { name: 'potOdds.draws.flushDraw', outs: 9, description: 'potOdds.draws.flushDrawDesc' },
  { name: 'potOdds.draws.comboDraw', outs: 15, description: 'potOdds.draws.comboDrawDesc' },
  { name: 'potOdds.draws.overcards', outs: 6, description: 'potOdds.draws.overcardsDesc' },
  { name: 'potOdds.draws.gutshot', outs: 4, description: 'potOdds.draws.gutshotDesc' },
  { name: 'potOdds.draws.setMine', outs: 2, description: 'potOdds.draws.setMineDesc' },
  { name: 'potOdds.draws.pairDraw', outs: 3, description: 'potOdds.draws.pairDrawDesc' },
  { name: 'potOdds.draws.backdoorFlush', outs: 1.5, description: 'potOdds.draws.backdoorFlushDesc' },
];

export const DEFAULT_ODDS_STATE = {
  potSize: 100,
  betSize: 50,
  outs: 9,
  street: 'flop' as const,
  impliedOddsGain: 0,
  gameVariant: 'standard' as const,
};

export const DEFAULT_EV_STATE = {
  winRate: 35,
  potSize: 100,
  callAmount: 50,
};

// “末题简单 + 补救”机制的固定题目 id（与题库 1-19 错开）。
// P1B-04：补救题必须用固定 id——SRS 复习项以 `odds:${id}` 去重，
// 旧实现 `10000 + Date.now()` 会每轮补救新增内容相同但 id 不同的 ReviewItem，永不去重。
export const EASY_LAST_QUESTION_ID = 9999;
export const RESCUE_QUESTION_ID = 9998;
