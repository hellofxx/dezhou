import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L7 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel7.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）；
 * q6–q10 为本批扩容新增（每题四选项、唯一正确答案，解析含推导或边界）。
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
    {
      id: 'l7hu-stakes-q6',
      question:
        '单挑 100BB：SB min-raise 2BB、BB 跟注，翻牌圈底池 4BB、双方身后 98BB。此刻的 SPR 约为：',
      options: ['约 4.3', '约 12', '约 24.5', '约 98'],
      correctIndex: 2,
      explanation:
        'SPR = 有效筹码 ÷ 翻牌圈底池 = 98 ÷ 4 = 24.5。约 4.3 是 3-bet 底池（80 ÷ 18.5）的口径；约 12 用 100 ÷ 8 把双方翻前投入重复算进底池；约 98 只是有效筹码，忘了除以底池。',
    },
    {
      id: 'l7hu-stakes-q7',
      question:
        '翻牌圈底池 4BB，你下注 2BB（半池）；对手弃牌率 40%，被跟注时你的胜率 70%。这手薄价值下注的 EV 约为：',
      options: ['+3.76BB', '+1.60BB', '+2.16BB', '+0.60BB'],
      correctIndex: 0,
      explanation:
        'EV = f×P + (1−f)×[e×(P+b) − (1−e)×b] = 0.4×4 + 0.6×(0.7×6 − 0.3×2) = 1.60 + 0.6×3.60 = +3.76BB。+1.60 只算了弃牌分支；+2.16 只算了被跟注分支；+0.60 把净收益写成 (e−f)×b。',
    },
    {
      id: 'l7hu-stakes-q8',
      question:
        '面对 3-bet 的一方在 K-8-3 面击中 KQ（顶对好踢脚），底池 18.5BB、有效筹码 80BB。SPR ≈ 4.3 时的正确思路是：',
      options: [
        '两三条街把筹码打光，翻牌下约 45% 池建立底池',
        '翻牌 check，等河牌再决定',
        '只有转牌改进后才继续',
        '翻牌直接全下收池',
      ],
      correctIndex: 0,
      explanation:
        'SPR = 80 ÷ 18.5 ≈ 4.3，顶对好踢脚两三条街就能打光（约 8BB → 约 20BB → 全下），翻牌用约 45% 池建立底池最自然。翻牌全下会挤走对手的诈唬与弱 K；check 到河牌等于放弃三条街价值；只在改进后才继续，是把低 SPR 的承诺优势还给了对手。',
    },
    {
      id: 'l7hu-stakes-q9',
      question: '单挑中 SB（按钮位）的位置优势具体来自：',
      options: [
        '翻前最后行动，每条街都后说话',
        '翻后最后行动，每条街都多一手信息',
        '起手牌总是更强',
        '可以免费看翻牌',
      ],
      correctIndex: 1,
      explanation:
        'SB 是按钮位：翻前它先行动（反而是 BB 最后行动），翻后才是它最后行动（IP）。位置优势指翻后每条街多一手信息——看对手先表态再决定价值下注、控池还是诈唬。翻前最后行动是 BB 的权利，把两者搞混就会把位置优势算到错误的街。',
    },
    {
      id: 'l7hu-stakes-q10',
      question: '同一手 A2s 在 6-max 的 UTG 是弃牌，在单挑 SB 却是标准开池。差别来自：',
      options: [
        '单挑的发牌更有利',
        '只面对一个对手、任何 Ax 都强，且翻后有位置',
        '单挑的下注尺度更小',
        '单挑不能用 GTO 打法',
      ],
      correctIndex: 1,
      explanation:
        '边界在"对手数量 + 位置"：6-max UTG 后面还有五个人可能拿到强牌，A2s 的 A 高与踢脚风险被放大；单挑只面对一个人、任何 Ax 都是强牌，SB 翻后还有位置。注意这条迁移只在单挑成立——同样的 A2s 在多人底池依旧是边缘牌，不能把 HU 的 80% 开池宽度搬回满员桌。',
    },
  ],
};
