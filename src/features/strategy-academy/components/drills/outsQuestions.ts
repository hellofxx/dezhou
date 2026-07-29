// P0-3.5: Outs 速算 题库
// 8 道题，覆盖同花听牌 / OESD / Gutshot / 二四法则 / 高牌听牌
//
// 题型分布：
// - q1-2: 同花听牌 → 9 outs
// - q3-4: OESD 两端顺子听牌 → 8 outs
// - q5-6: Gutshot 卡顺听牌 → 4 outs
// - q7  : 二四法则应用（8 outs, turn→river 胜率约 16%）
// - q8  : 简单题：高牌听牌（AK 命中顶对 → 6 outs）

import type { ChoiceDrillQuestion } from './types';

export interface OutsQuestion extends ChoiceDrillQuestion {
  // 图形化牌面（hero 底牌 + 公共牌）
  heroHand?: string[]; // e.g. ['Ah', 'Kh']
  board?: string[];    // e.g. ['2h', '7h', '9c']
}

export const OUTS_QUESTIONS: OutsQuestion[] = [
  // ===== q1-2: 同花听牌 → 9 =====
  {
    id: 'outs-q1',
    promptKey: 'drills.outs.questions.q1.prompt',
    heroHand: ['Ah', 'Kh'],
    board: ['2h', '7h', '9c'],
    optionsKeys: [
      'drills.outs.options.count6',
      'drills.outs.options.count9',
      'drills.outs.options.count12',
      'drills.outs.options.count15',
    ],
    correctIndex: 1,
    explanationKey: 'drills.outs.questions.q1.explanation',
  },
  {
    id: 'outs-q2',
    promptKey: 'drills.outs.questions.q2.prompt',
    heroHand: ['8h', '9h'],
    board: ['Th', '4h', '2c'],
    optionsKeys: [
      'drills.outs.options.count6',
      'drills.outs.options.count9',
      'drills.outs.options.count12',
      'drills.outs.options.count15',
    ],
    correctIndex: 1,
    explanationKey: 'drills.outs.questions.q2.explanation',
  },
  // ===== q3-4: OESD → 8 =====
  {
    id: 'outs-q3',
    promptKey: 'drills.outs.questions.q3.prompt',
    heroHand: ['8c', '9d'],
    board: ['7h', 'Tc', '2s'],
    optionsKeys: [
      'drills.outs.options.count4',
      'drills.outs.options.count6',
      'drills.outs.options.count8',
      'drills.outs.options.count12',
    ],
    correctIndex: 2,
    explanationKey: 'drills.outs.questions.q3.explanation',
  },
  {
    id: 'outs-q4',
    promptKey: 'drills.outs.questions.q4.prompt',
    heroHand: ['5d', '6s'],
    board: ['4h', '7c', '9d'],
    optionsKeys: [
      'drills.outs.options.count4',
      'drills.outs.options.count6',
      'drills.outs.options.count8',
      'drills.outs.options.count12',
    ],
    correctIndex: 2,
    explanationKey: 'drills.outs.questions.q4.explanation',
  },
  // ===== q5-6: Gutshot → 4 =====
  {
    id: 'outs-q5',
    promptKey: 'drills.outs.questions.q5.prompt',
    heroHand: ['7c', '9d'],
    board: ['5h', '6c', 'Kh'],
    optionsKeys: [
      'drills.outs.options.count2',
      'drills.outs.options.count4',
      'drills.outs.options.count6',
      'drills.outs.options.count8',
    ],
    correctIndex: 1,
    explanationKey: 'drills.outs.questions.q5.explanation',
  },
  {
    id: 'outs-q6',
    promptKey: 'drills.outs.questions.q6.prompt',
    heroHand: ['Tc', 'Jd'],
    board: ['7h', '9c', '2s'],
    optionsKeys: [
      'drills.outs.options.count2',
      'drills.outs.options.count4',
      'drills.outs.options.count6',
      'drills.outs.options.count8',
    ],
    correctIndex: 1,
    explanationKey: 'drills.outs.questions.q6.explanation',
  },
  // ===== q7: 二四法则 =====
  {
    id: 'outs-q7',
    promptKey: 'drills.outs.questions.q7.prompt',
    optionsKeys: [
      'drills.outs.options.equity8',
      'drills.outs.options.equity16',
      'drills.outs.options.equity32',
      'drills.outs.options.equity36',
    ],
    correctIndex: 1,
    explanationKey: 'drills.outs.questions.q7.explanation',
  },
  // ===== q8: 简单题（高牌听牌）=====
  {
    id: 'outs-q8',
    promptKey: 'drills.outs.questions.q8.prompt',
    heroHand: ['As', 'Kh'],
    board: ['7c', '9d', '2h'],
    optionsKeys: [
      'drills.outs.options.count3',
      'drills.outs.options.count6',
      'drills.outs.options.count9',
      'drills.outs.options.count12',
    ],
    correctIndex: 1,
    explanationKey: 'drills.outs.questions.q8.explanation',
  },
];
