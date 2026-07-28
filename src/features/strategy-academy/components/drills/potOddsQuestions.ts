// P0-3.6: 底池赔率直觉 题库
// 6 道题，图形化赔率计算
//
// 题型分布：
// - q1-2: 基础赔率计算（pot / bet / call → 底池赔率百分比）
// - q3-4: 胜率 vs 底池赔率 → 跟注 / 弃牌决策
// - q5  : 图形化底池与跟注金额（progress bar 可视化）
// - q6  : 简单题：最简单的赔率判断

import type { ChoiceDrillQuestion } from './types';

export interface PotOddsQuestion extends ChoiceDrillQuestion {
  // 图形化显示用（BB 单位）
  potSize?: number;
  betSize?: number;   // 对手下注金额
  callSize?: number;  // hero 需要跟注的金额（通常等于 betSize）
  equity?: number;    // 已知胜率（百分比，0-100）
  // 是否显示图形化可视化（progress bar 形式）
  showGraphical?: boolean;
}

export const POT_ODDS_QUESTIONS: PotOddsQuestion[] = [
  // ===== q1-2: 基础赔率计算 =====
  {
    id: 'po-q1',
    promptKey: 'drills.potOdds.questions.q1.prompt',
    potSize: 100,
    betSize: 50,
    callSize: 50,
    optionsKeys: [
      'drills.potOdds.options.potOdds20',
      'drills.potOdds.options.potOdds25',
      'drills.potOdds.options.potOdds33',
      'drills.potOdds.options.potOdds50',
    ],
    correctIndex: 1,
    explanationKey: 'drills.potOdds.questions.q1.explanation',
  },
  {
    id: 'po-q2',
    promptKey: 'drills.potOdds.questions.q2.prompt',
    potSize: 80,
    betSize: 40,
    callSize: 40,
    optionsKeys: [
      'drills.potOdds.options.potOdds20',
      'drills.potOdds.options.potOdds25',
      'drills.potOdds.options.potOdds33',
      'drills.potOdds.options.potOdds50',
    ],
    correctIndex: 1,
    explanationKey: 'drills.potOdds.questions.q2.explanation',
  },
  // ===== q3-4: 胜率 vs 底池赔率 → 决策 =====
  {
    id: 'po-q3',
    promptKey: 'drills.potOdds.questions.q3.prompt',
    potSize: 100,
    betSize: 50,
    callSize: 50,
    equity: 36,
    optionsKeys: [
      'drills.potOdds.options.call',
      'drills.potOdds.options.fold',
    ],
    correctIndex: 0,
    explanationKey: 'drills.potOdds.questions.q3.explanation',
  },
  {
    id: 'po-q4',
    promptKey: 'drills.potOdds.questions.q4.prompt',
    potSize: 100,
    betSize: 50,
    callSize: 50,
    equity: 16,
    optionsKeys: [
      'drills.potOdds.options.call',
      'drills.potOdds.options.fold',
    ],
    correctIndex: 1,
    explanationKey: 'drills.potOdds.questions.q4.explanation',
  },
  // ===== q5: 图形化显示 =====
  {
    id: 'po-q5',
    promptKey: 'drills.potOdds.questions.q5.prompt',
    potSize: 120,
    betSize: 60,
    callSize: 60,
    showGraphical: true,
    optionsKeys: [
      'drills.potOdds.options.potOdds20',
      'drills.potOdds.options.potOdds25',
      'drills.potOdds.options.potOdds33',
      'drills.potOdds.options.potOdds50',
    ],
    correctIndex: 1,
    explanationKey: 'drills.potOdds.questions.q5.explanation',
  },
  // ===== q6: 简单题 =====
  {
    id: 'po-q6',
    promptKey: 'drills.potOdds.questions.q6.prompt',
    equity: 40,
    optionsKeys: [
      'drills.potOdds.options.call',
      'drills.potOdds.options.fold',
    ],
    correctIndex: 0,
    explanationKey: 'drills.potOdds.questions.q6.explanation',
  },
];
