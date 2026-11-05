import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L7 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel7.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）。
 */
export const LEVEL_7HU_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l7hu-stakes': [
    {
      id: 'l7hu-stakes-q1',
      question: 'HU 中 BTN/SB 的 open 范围约是多少？',
      options: ['20-30%', '30-40%', '50-70%', '约 80%'],
      correctIndex: 3,
      explanation: 'HU 中 BTN/SB open 范围约 80%，比 6-max BTN 开池的最宽档（约三成半）大幅拓宽。',
    },
    {
      id: 'l7hu-stakes-q2',
      question: 'HU 中以下哪类牌的价值提升最多？',
      options: ['72o', '任何对子和 Ax', '同花连牌', '小对子'],
      correctIndex: 1,
      explanation: 'HU 中任何对子都是强牌，Ax 都是强牌。这些牌的价值大幅提升。',
    },
    {
      id: 'l7hu-stakes-q3',
      question: 'HU 中面对紧弱型对手应该？',
      options: ['减少 bluff', '频繁 C-Bet，多 bluff', '只打价值下注', '尊重对手'],
      correctIndex: 1,
      explanation: '面对紧弱型对手应该频繁 C-Bet 和 bluff，因为他们弃牌率高。',
    },
    {
      id: 'l7hu-stakes-q4',
      question: 'HU 中位置价值如何？',
      options: ['不重要', '比 6-max 略大', '极大，BTN 每手牌都有位置优势', '和 6-max 一样'],
      correctIndex: 2,
      explanation: 'HU 中位置价值极大，BTN 每手牌都有位置优势。',
    },
    {
      id: 'l7hu-stakes-q5',
      question: 'HU 中顶对弱踢脚的正确打法是？',
      options: ['Check-Fold', '控制底池', '更宽的价值下注', 'All-in'],
      correctIndex: 2,
      explanation: 'HU 中范围更宽，顶对弱踢脚也是强牌，应该更宽地价值下注。',
    },
  ],
};
