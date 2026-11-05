import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L6 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel6.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）；
 * q6–q10 为本批扩容新增（每题四选项、唯一正确答案，解析含推导或边界）。
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
    {
      id: 'l6hu-tourney-q6',
      question:
        '你在 SB 全下 12BB，全下前底池 1.5BB；对手弃牌率 50%，被跟注时你的胜率 45%。按 EV(全下) = f × P + (1 − f) × [E × (P + S) − (1 − E) × S] 计算，这一手的期望约为：',
      options: ['约 +0.75BB', '约 +0.49BB', '约 +0.23BB', '约 −0.53BB'],
      correctIndex: 1,
      explanation:
        '被跟注分支 = 0.45 × 13.5 − 0.55 × 12 = 6.075 − 6.6 = −0.525BB；EV = 0.5 × 1.5 + 0.5 × (−0.525) = 0.75 − 0.2625 ≈ +0.49BB。+0.75 只算弃牌分支；+0.23 漏乘被跟注概率；−0.53 只算被跟注分支。',
    },
    {
      id: 'l6hu-tourney-q7',
      question: '同一手（全下 12BB、全下前底池 1.5BB、被跟注时胜率 45%），保本弃牌率约为：',
      options: ['约 25.9%', '约 35%', '约 50%', '约 12.5%'],
      correctIndex: 0,
      explanation:
        '被跟注分支 = −0.525BB，保本弃牌率 = 0.525 ÷ (1.5 + 0.525) ≈ 25.9%。约 35% 是只除以底池 1.5、漏加分母第二项；50% 是题目给的弃牌率输入，不是门槛。',
    },
    {
      id: 'l6hu-tourney-q8',
      question:
        '盲注每 10 分钟一圈，每圈盲注合计 1.5BB（小盲 0.5 + 大盲 1）。你持 12BB，"等好牌"再等 4 圈，光盲注要付多少、还剩多少？',
      options: ['付 2BB，剩 10BB', '付 4BB，剩 8BB', '付 6BB，剩 6BB', '付 12BB，剩 0BB'],
      correctIndex: 2,
      explanation:
        '1.5BB/圈 × 4 圈 = 6BB，12BB − 6BB = 6BB，等于筹码减半。2BB 与 4BB 分别是只算单一盲注、以及漏算圈数的口径；12BB 对应 8 圈盲注（1.5 × 8），是把 4 圈翻倍的口径。',
    },
    {
      id: 'l6hu-tourney-q9',
      question: '20-40BB 与 15BB 以下两个筹码档的分界策略是：',
      options: [
        '20-40BB 用 min-raise + 翻后，15BB 以下以全下为主',
        '两个档位都应以全下为主',
        '两个档位都应坚持 min-raise',
        '筹码越浅越应该等好牌',
      ],
      correctIndex: 0,
      explanation:
        '全下的筹码 EV 取决于 P/S 与被跟注时的胜率 E：S 越大，跟注范围越窄、E 越低，保本弃牌率随之抬高，所以 20-40BB 保留 min-raise，15BB 以下才切换到全下为主。',
    },
    {
      id: 'l6hu-tourney-q10',
      question: '单挑 SNG 决赛桌赢家通吃，你 60BB、对手 20BB。按筹码线性的 ICM 近似，你当前的奖金份额约为：',
      options: ['约 50%', '约 60%', '约 75%', '约 90%'],
      correctIndex: 2,
      explanation:
        '赢家通吃时单挑 ICM 近似随筹码线性：60 ÷ (60 + 20) = 75%。50% 是均分口径；60% 把"60BB"直接当份额而漏除总筹码 80BB。',
    },
  ],
};
