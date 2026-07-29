// P0-3.3: 牌力排名闪电战 题库
// 10 道题，最后 2 题为简单题（仅比较口袋对 / 起手牌文字标签）
//
// 题目类型：
// - compare-hands    : 显示两手 5 张牌，选择更大者（题 1-3）
// - identify-rank    : 显示 5 张牌，判断牌型名称（题 4-8）
// - simple-compare   : 简单文字比较（题 9-10）
//
// 所有 promptKey / optionsKeys / explanationKey 均为 i18n key，
// 见 src/i18n/locales/zh.json 中 drills.handRanking.questions.*

import type { ChoiceDrillQuestion } from './types';

export type HandRankingQuestionType = 'compare-hands' | 'identify-rank' | 'simple-compare';

export interface HandRankingQuestion extends ChoiceDrillQuestion {
  type: HandRankingQuestionType;
  // compare-hands: 两手 5 张牌（已是最终 5 张组合）
  handA?: string[]; // e.g. ['As', 'Ks', 'Qh', 'Jd', 'Tc']
  handB?: string[];
  // identify-rank: 5 张待识别的牌
  cards?: string[];
  // simple-compare: 文字标签（如 "AA"、"72o"）
  labelA?: string;
  labelB?: string;
}

export const HAND_RANKING_QUESTIONS: HandRankingQuestion[] = [
  // ===== 题 1-3: 两手牌比大小 =====
  {
    id: 'hr-q1',
    type: 'compare-hands',
    promptKey: 'drills.handRanking.comparePrompt',
    handA: ['As', 'Ks', 'Qd', 'Jd', 'Tc'], // AKQJT 顺子
    handB: ['Ah', 'Kh', 'Qh', 'Jh', 'Th'], // 皇家同花顺
    optionsKeys: [
      'drills.handRanking.options.handA',
      'drills.handRanking.options.handB',
      'drills.handRanking.options.tie',
    ],
    correctIndex: 1,
    explanationKey: 'drills.handRanking.questions.q1.explanation',
  },
  {
    id: 'hr-q2',
    type: 'compare-hands',
    promptKey: 'drills.handRanking.comparePrompt',
    handA: ['9h', '9d', '9c', 'Ac', 'Ks'], // 三条 9
    handB: ['As', 'Ah', 'Kd', 'Kh', 'Kc'], // 葫芦 AKK
    optionsKeys: [
      'drills.handRanking.options.handA',
      'drills.handRanking.options.handB',
      'drills.handRanking.options.tie',
    ],
    correctIndex: 1,
    explanationKey: 'drills.handRanking.questions.q2.explanation',
  },
  {
    id: 'hr-q3',
    type: 'compare-hands',
    promptKey: 'drills.handRanking.comparePrompt',
    handA: ['2h', '3h', '4h', '5h', '7h'], // 同花
    handB: ['3c', '4d', '5d', '6s', '7c'], // 顺子（混合花色）
    optionsKeys: [
      'drills.handRanking.options.handA',
      'drills.handRanking.options.handB',
      'drills.handRanking.options.tie',
    ],
    correctIndex: 0,
    explanationKey: 'drills.handRanking.questions.q3.explanation',
  },
  // ===== 题 4-6: 显示 5 张牌判断牌型 =====
  {
    id: 'hr-q4',
    type: 'identify-rank',
    promptKey: 'drills.handRanking.identifyPrompt',
    cards: ['As', 'Ks', 'Qs', 'Js', 'Ts'], // 皇家同花顺
    optionsKeys: [
      'drills.handRanking.options.royalFlush',
      'drills.handRanking.options.straightFlush',
      'drills.handRanking.options.flush',
      'drills.handRanking.options.straight',
    ],
    correctIndex: 0,
    explanationKey: 'drills.handRanking.questions.q4.explanation',
  },
  {
    id: 'hr-q5',
    type: 'identify-rank',
    promptKey: 'drills.handRanking.identifyPrompt',
    cards: ['9h', '8h', '7h', '6h', '5h'], // 同花顺
    optionsKeys: [
      'drills.handRanking.options.royalFlush',
      'drills.handRanking.options.straightFlush',
      'drills.handRanking.options.flush',
      'drills.handRanking.options.straight',
    ],
    correctIndex: 1,
    explanationKey: 'drills.handRanking.questions.q5.explanation',
  },
  {
    id: 'hr-q6',
    type: 'identify-rank',
    promptKey: 'drills.handRanking.identifyPrompt',
    cards: ['Kh', 'Kd', 'Kc', '9s', '9h'], // 葫芦
    optionsKeys: [
      'drills.handRanking.options.twoPair',
      'drills.handRanking.options.threeOfAKind',
      'drills.handRanking.options.fullHouse',
      'drills.handRanking.options.fourOfAKind',
    ],
    correctIndex: 2,
    explanationKey: 'drills.handRanking.questions.q6.explanation',
  },
  // ===== 题 7-8: 5 张牌判断牌型 =====
  {
    id: 'hr-q7',
    type: 'identify-rank',
    promptKey: 'drills.handRanking.identifyPrompt',
    cards: ['Th', '9h', '8c', '7d', '6s'], // 顺子
    optionsKeys: [
      'drills.handRanking.options.flush',
      'drills.handRanking.options.straight',
      'drills.handRanking.options.onePair',
      'drills.handRanking.options.highCard',
    ],
    correctIndex: 1,
    explanationKey: 'drills.handRanking.questions.q7.explanation',
  },
  {
    id: 'hr-q8',
    type: 'identify-rank',
    promptKey: 'drills.handRanking.identifyPrompt',
    cards: ['As', 'Ad', 'Ac', 'Qh', '2d'], // 三条
    optionsKeys: [
      'drills.handRanking.options.onePair',
      'drills.handRanking.options.twoPair',
      'drills.handRanking.options.threeOfAKind',
      'drills.handRanking.options.fullHouse',
    ],
    correctIndex: 2,
    explanationKey: 'drills.handRanking.questions.q8.explanation',
  },
  // ===== 题 9-10: 简单文字比较（简单题）=====
  {
    id: 'hr-q9',
    type: 'simple-compare',
    promptKey: 'drills.handRanking.simpleComparePrompt',
    labelA: 'AA',
    labelB: '22',
    optionsKeys: [
      'drills.handRanking.options.labelA',
      'drills.handRanking.options.labelB',
      'drills.handRanking.options.tie',
    ],
    correctIndex: 0,
    explanationKey: 'drills.handRanking.questions.q9.explanation',
  },
  {
    id: 'hr-q10',
    type: 'simple-compare',
    promptKey: 'drills.handRanking.simpleComparePrompt',
    labelA: 'AKs',
    labelB: '72o',
    optionsKeys: [
      'drills.handRanking.options.labelA',
      'drills.handRanking.options.labelB',
      'drills.handRanking.options.tie',
    ],
    correctIndex: 0,
    explanationKey: 'drills.handRanking.questions.q10.explanation',
  },
];
