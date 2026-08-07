import type { Lesson } from '../../../../types';

export const HEADS_UP_LEVEL_6_LESSONS: Lesson[] = [
  {
    id: 'l6hu-tourney',
    level: 6,
    order: 1,
    title: '单挑锦标赛',
    subtitle: '单挑 SNG / MTT 决赛桌的筹码节奏、ICM 与盲注攻防',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante', stackDepth: 40 },
    content: [
      { type: 'heading', content: '单挑锦标赛：筹码与盲注的博弈' },
      {
        type: 'text',
        content:
          '单挑锦标赛（SNG 决赛桌 / MTT 最终两人）与前注制、固定筹码深度的现金桌截然不同：盲注随时间上涨、筹码是有限资源、ICM 压力主导决策。单挑锦标赛中，筹码节奏（Stack Rhythm）成为核心——深筹码阶段（40BB+）可维持现金桌式的翻后打法，浅筹码阶段（20BB 以下）则转向翻前全下博弈。',
      },
      {
        type: 'key-point',
        content: '单挑锦标赛的黄金原则：筹码越浅、盲注占比越高，翻前全下越频繁。ICM 与盲注压力让"生存"和"进攻"成为同等重要的目标。',
      },
      { type: 'heading', content: 'ICM 与盲注攻防' },
      {
        type: 'text',
        content:
          '单挑 SNG 决赛桌的 ICM 很简单：赢家拿全部奖金，所以 ICM 压力相对满员桌低，但仍影响决策——你在深筹码时避免不必要的波动（保护领先），在落后时用高激进度翻盘。盲注攻防：浅筹码时（如 15-20BB），min-raise 偷盲 + 全下成为主武器，因为盲注上涨让你的偷盲自动盈利；而现金桌的复杂翻后打法在浅筹码下失效。',
      },
      {
        type: 'example',
        content:
          '实例：单挑 SNG 决赛桌，你持 18BB，对手 22BB，盲注 0.5/1。你（SB）持 A♠4♠。此筹码深度下，A4s 是标准的推/全下范围：对 BB 约 60% 跟注范围有约 50% 胜率，全下 18BB 的 EV 为正，且盲注上涨让等待的价值降低。若深筹码（60BB+），A4s 仍是开池牌但翻后空间更大。筹码深度的变化直接改变同一手牌的打法。',
      },
      {
        type: 'example',
        content:
          '实例二（盲注上涨的紧迫感）：单挑 MTT 决赛，盲注每 5 分钟上涨，你从 30BB 降到 12BB。此时"等好牌"是错误——盲注上涨让你的等待成本飙升。正确策略是提高全下频率，用任何有权益的牌（对子、Ax、强同花连张）抢盲与翻盘。筹码节奏的关键是：在盲注吞噬你之前行动。',
      },
      {
        type: 'highlight',
        content: '反直觉点：单挑锦标赛中"领先时保守"与"落后时激进"的 ICM 逻辑，与现金桌"永远最大 EV"不同。深筹码领先时避免大波动，落后时用激进翻盘——因为锦标赛只有第一名才有意义。',
      },
      {
        type: 'pro-tip',
        content: '单挑锦标赛筹码节奏速记：(1) 40BB+ 深筹码可维持现金桌打法；(2) 20-40BB 中筹码，min-raise + 翻后；(3) 15BB 以下浅筹码，全下为主。每级别盲注上涨后重新评估你的策略，不要让旧节奏害你。',
      },
    ],
    quiz: [
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
    examples: [
      {
        id: 'l6hu-tourney-ex1',
        title: '浅筹码单挑锦标赛的全下',
        heroHand: ['Ac', '7s'],
        heroPosition: 'SB',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 15,
        potSize: 1.5,
        correctDecision: {
          action: 'All-in',
          amount: '15BB',
          reasoning: [
            '浅筹码（15BB）下，A7o 对 BB 宽范围胜率约 55%',
            '盲注上涨让等待成本高，全下抢盲 + 翻盘',
            'ICM 下落后激进翻盘',
          ],
        },
        commonMistake: {
          action: '等好牌再行动',
          reasoning: '浅筹码 + 盲注上涨时，等待成本飙升，A7o 是标准全下牌，等牌是错误。',
          evLoss: '-2.0 BB/100',
        },
      },
    ],
    practice: {
      id: 'l6hu-tourney-practice',
      questions: [
        {
          id: 'l6hu-tourney-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Kh', 'Qh'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 15,
            gameContext: { gameType: 'sng', tableDescription: '单挑 SNG 决赛桌，浅筹码 15BB' },
          },
          options: [
            { action: 'All-in', isCorrect: true, explanation: 'KQs 浅筹码全下范围，对宽范围胜率约 58%，抢盲翻盘。', evImpact: '+2.0 BB/100', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'KQs 浅筹码是强全下牌，fold 太紧。', evImpact: '-2.0 BB/100', evLoss: 2 },
            { action: 'Limp', isCorrect: false, explanation: '浅筹码 limp 让对手 isolate，全下更优。', evImpact: '-1.0 BB/100', evLoss: 1 },
          ],
          relatedLessonId: 'l6hu-tourney',
        },
        {
          id: 'l6hu-tourney-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ts', '8s'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 12,
            gameContext: { gameType: 'sng', tableDescription: '单挑 SNG 决赛桌，浅筹码 12BB，盲注即将上涨' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: '盲注即将上涨，等待成本高，T8s 有全下权益，fold 太紧。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
            { action: 'All-in', isCorrect: true, explanation: '盲注上涨紧迫，T8s 同花连张有权益，全下抢盲翻盘。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'Min-raise', isCorrect: false, explanation: '浅筹码（12BB）min-raise 后无法覆盖后续全下，直接推更优。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l6hu-tourney',
        },
        {
          id: 'l6hu-tourney-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Ad', 'Kd'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 45,
            gameContext: { gameType: 'mtt', tableDescription: '单挑 MTT 决赛，深筹码 45BB，对手 nit' },
          },
          options: [
            { action: 'Min-raise', isCorrect: true, explanation: '深筹码 AK 应 min-raise，面对 nit 对手，min-raise + 翻后最大化价值。', evImpact: '+2.0 BB/100', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '45BB 深筹码 AK 全下浪费价值，min-raise 更优。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
            { action: 'Fold', isCorrect: false, explanation: 'AK 顶级强牌，fold 荒谬。', evImpact: '-3.0 BB/100', evLoss: 3 },
          ],
          relatedLessonId: 'l6hu-tourney',
        },
      ],
    },
  },
];
