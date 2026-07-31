import type { DrawInfo } from './types';

export const COMMON_DRAWS: DrawInfo[] = [
  { name: '顺子听牌（两头）', outs: 8, description: '如 56 在 78x 面' },
  { name: '同花听牌', outs: 9, description: '持有4张同花，还需1张' },
  { name: '同花+顺子组合听牌', outs: 15, description: '同花听牌+两头顺' },
  { name: '高牌（两张overcard）', outs: 6, description: '两张高牌配对' },
  { name: '顺子听牌（卡顺）', outs: 4, description: '如 56 在 79x 面' },
  { name: '口袋对凑三条', outs: 2, description: '口袋对子凑set' },
  { name: '单张凑对', outs: 3, description: '单张高牌配对' },
  { name: '后门同花听牌', outs: 1.5, description: '需要两张同花' },
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
