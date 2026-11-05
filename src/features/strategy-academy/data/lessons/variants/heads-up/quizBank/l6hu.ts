import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L6 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel6.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）。
 */
export const LEVEL_6HU_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l6hu-tourney': [
    {
      id: 'l6hu-tourney-q1',
      question: '单挑锦标赛与现金桌的核心差异是：',
      options: [
        '没有差异',
        '盲注上涨、筹码有限、ICM 压力主导',
        '单挑锦标赛牌更大',
        '现金桌盲注更高',
      ],
      correctIndex: 1,
      explanation: '单挑锦标赛盲注上涨、筹码是有限资源、ICM 压力主导，策略随筹码深度动态调整。',
    },
    {
      id: 'l6hu-tourney-q2',
      question: '单挑锦标赛浅筹码（15BB 以下）的正确策略是：',
      options: [
        '复杂翻后打法',
        '翻前全下为主，任何有权益的牌抢盲',
        '等好牌',
        '完全过牌',
      ],
      correctIndex: 1,
      explanation: '浅筹码时翻前全下成为主武器，因为盲注上涨让偷盲自动盈利，且等待成本飙升。',
    },
    {
      id: 'l6hu-tourney-q3',
      question: '单挑 SNG 决赛桌的 ICM 特点是：',
      options: [
        'ICM 压力极高，接近满员桌',
        '赢家拿全部奖金，ICM 压力相对低，但仍影响决策',
        '没有 ICM',
        'ICM 只在泡沫期存在',
      ],
      correctIndex: 1,
      explanation: '单挑决赛桌赢家拿全部奖金，ICM 压力相对满员桌低，但仍影响决策——深筹码避免波动、落后时激进。',
    },
    {
      id: 'l6hu-tourney-q4',
      question: '盲注上涨对单挑锦标赛策略的影响是：',
      options: [
        '没有影响',
        '等待成本飙升，应提高行动频率而非等好牌',
        '应该更保守',
        '只影响现金桌',
      ],
      correctIndex: 1,
      explanation: '盲注上涨让你的等待成本飙升，正确策略是提高全下/偷盲频率，在盲注吞噬之前行动。',
    },
    {
      id: 'l6hu-tourney-q5',
      question: '单挑锦标赛 20-40BB 中筹码阶段的策略是：',
      options: [
        '完全全下',
        'min-raise + 翻后，兼顾偷盲与翻后',
        '纯等牌',
        '只打坚果',
      ],
      correctIndex: 1,
      explanation: '中筹码阶段（20-40BB）兼顾偷盲与翻后，min-raise 加翻后是合理策略，区别于浅筹码的全下为主。',
    },
  ],
};
