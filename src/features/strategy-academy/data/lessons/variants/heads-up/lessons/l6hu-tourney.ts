import type { Lesson, LessonSection } from '../../../../../types';

// ===== l6hu-tourney 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L6HU_TOURNEY_U1_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '单挑锦标赛：筹码与盲注的博弈' },
  {
    type: 'text',
    content:
      '单挑锦标赛（SNG 决赛桌 / MTT 最终两人）与前注制、固定筹码深度的现金桌截然不同：盲注随时间上涨、筹码是有限资源、ICM 压力主导决策。单挑锦标赛中，筹码节奏（Stack Rhythm）成为核心——深筹码阶段（40BB+）可维持现金桌式的翻后打法，浅筹码阶段（20BB 以下）则转向翻前全下博弈。',
  },
  {
    type: 'key-point',
    content:
      '单挑锦标赛的黄金原则：筹码越浅、盲注占比越高，翻前全下越频繁。ICM 与盲注压力让"生存"和"进攻"成为同等重要的目标。',
  },
];

const L6HU_TOURNEY_U2_SECTIONS: LessonSection[] = [
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
    type: 'formula',
    content:
      '单挑全下的筹码 EV 与保本弃牌率（P = 全下前底池，S = 全下额，f = 对手弃牌率，E = 被跟注时的胜率）：\nEV(全下) = f × P + (1 − f) × [E × (P + S) − (1 − E) × S]\n例：P = 1.5BB、S = 12BB、f = 50%、E = 45%\n被跟注分支 = 0.45 × 13.5 − 0.55 × 12 = 6.075 − 6.6 = −0.525BB\nEV = 0.5 × 1.5 + 0.5 × (−0.525) = 0.75 − 0.2625 ≈ +0.49BB\n保本弃牌率 f ≥ 0.525 ÷ (1.5 + 0.525) ≈ 25.9%\n读法：盲注越涨（P 相对 S 越大）、对手越爱弃牌，全下越划算——这就是浅筹码必须转向全下的数学原因，也是 20-40BB 仍值得保留 min-raise 的原因：S 太大时 E 会被跟注范围压下去。',
  },
];

const L6HU_TOURNEY_U3_SECTIONS: LessonSection[] = [
  {
    type: 'highlight',
    content:
      '反直觉点：单挑锦标赛中"领先时保守"与"落后时激进"的 ICM 逻辑，与现金桌"永远最大 EV"不同。深筹码领先时避免大波动，落后时用激进翻盘——因为锦标赛只有第一名才有意义。',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：单挑 ICM 的边界（筹码线性、前注与盲注阈值）见理论学院 T9『单挑 ICM 与锦标赛 HU』——赢家通吃让单挑的奖金份额近似随筹码线性变化，但泡沫临近与盲注结构会把这条直线推出弯折，本课的三档筹码节奏就是在弯折处换挡。',
    data: { theoryLevelId: 't9hu', theoryChapterId: 't9hu-icm' },
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：现金单挑与锦标赛单挑的两套效用函数见理论学院 T9『现金单挑 vs 锦标赛单挑』——同一手牌在两种赛制下的正确动作可以相反，差别不在牌力而在筹码的边际价值：现金桌的筹码可以随时再买，锦标赛的筹码买不回来。',
    data: { theoryLevelId: 't9hu', theoryChapterId: 't9hu-cash-vs-mtt' },
  },
  {
    type: 'pro-tip',
    content:
      '单挑锦标赛筹码节奏速记：(1) 40BB+ 深筹码可维持现金桌打法；(2) 20-40BB 中筹码，min-raise + 翻后；(3) 15BB 以下浅筹码，全下为主。每级别盲注上涨后重新评估你的策略，不要让旧节奏害你。',
  },
  {
    type: 'takeaway',
    content:
      '单挑锦标赛三句总结：\n筹码节奏分三档：40BB+ 走现金桌式、20-40BB 用 min-raise + 翻后、15BB 以下以全下为主\n等待有价格：每圈盲注合计 1.5BB，12BB 的筹码等 4 圈就只剩 6BB（减半）\n全下是否成立只看保本弃牌率：f ≥ |被跟注分支| ÷ (P + |被跟注分支|)，示例 0.525 ÷ 2.025 ≈ 25.9%',
  },
];

export const HEADS_UP_LESSON: Lesson = {
  id: 'l6hu-tourney',
  level: 6,
  order: 1,
  title: '单挑锦标赛',
  subtitle: '单挑 SNG / MTT 决赛桌的筹码节奏、ICM 与盲注攻防',
  duration: '8 min',
  objectives: [
    '区分单挑锦标赛与现金桌的三个差异（盲注上涨、筹码有限、ICM 压力），并说出筹码节奏三阶段策略（40BB+ 现金桌式、20-40BB min-raise+翻后、15BB 以下全下为主）',
    '判断浅筹码下全下替代复杂翻后打法的原因（盲注上涨让等待成本飙升、全下抢盲自动盈利）',
    '说明单挑 SNG 决赛桌 ICM 的特点（赢家拿全部奖金、压力相对满员桌低但仍影响决策），并判断深筹码领先时保守、落后时激进的取舍',
  ],
  variant: 'heads-up',
  variantContext: { anteStructure: 'sb_ante', stackDepth: 40 },
  content: [
    ...L6HU_TOURNEY_U1_SECTIONS,
    ...L6HU_TOURNEY_U2_SECTIONS,
    ...L6HU_TOURNEY_U3_SECTIONS,
  ],
  quiz: [],
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
    {
      id: 'l6hu-tourney-ex2',
      title: '中筹码 25BB：全下与 min-raise 的分界',
      heroHand: ['Ks', 'Qs'],
      heroPosition: 'SB',
      previousActions: [],
      street: 'preflop',
      effectiveStack: 25,
      potSize: 1.5,
      correctDecision: {
        action: 'Min-raise',
        amount: '2BB',
        reasoning: [
          '25BB 仍在 20-40BB 中筹码档，min-raise + 翻后是主策略，全下要到 15BB 以下才成为默认',
          '若直接全下 25BB：被跟注分支 = 0.45 × 26.5 − 0.55 × 25 = 11.925 − 13.75 = −1.825BB，保本弃牌率 = 1.825 ÷ (1.5 + 1.825) ≈ 54.9%',
          '全下会把对手的跟注范围压到只剩强牌，E 从对宽范围的约 58% 掉到约 45%——正是这个下跌把保本线抬到 54.9%，而 min-raise 保留翻后与偷盲两条收益',
        ],
      },
      commonMistake: {
        action: 'All-in（25BB 直接推）',
        reasoning:
          '25BB 全下要求对手弃牌超过一半才保本，等于用整叠筹码赌一个对手未必给出的频率；min-raise 把同一手 KQs 的可实现权益留在翻后。',
        evLoss: '-1.3 BB/100',
      },
    },
    {
      id: 'l6hu-tourney-ex3',
      title: '盲注上涨后的 8BB 推/弃边界',
      heroHand: ['As', '5s'],
      heroPosition: 'SB',
      previousActions: [],
      street: 'preflop',
      effectiveStack: 8,
      potSize: 1.5,
      correctDecision: {
        action: 'All-in',
        amount: '8BB',
        reasoning: [
          '8BB 已进入"15BB 以下全下为主"档：min-raise 后只剩 6BB、底池约 4BB，翻后没有可操作空间',
          '被跟注时 A5s 对跟注范围约 42%：被跟注分支 = 0.42 × 9.5 − 0.58 × 8 = 3.99 − 4.64 = −0.65BB',
          '保本弃牌率 = 0.65 ÷ (1.5 + 0.65) ≈ 30.2%；这个深度对手弃牌约 35%，EV = 0.35 × 1.5 − 0.65 × 0.65 ≈ +0.10BB',
        ],
      },
      commonMistake: {
        action: 'Fold（"等更好的牌"）',
        reasoning:
          '每圈盲注合计 1.5BB，等 4 圈就烧掉 6BB——相当于 8BB 筹码的 75%。盲注上涨把等待的价格直接写在桌面上。',
        evLoss: '-1.5 BB/100',
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
      {
        id: 'l6hu-tourney-p4',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['As', '9s'],
          heroPosition: 'SB',
          previousActions: [],
          street: 'preflop',
          potSize: 1.5,
          effectiveStack: 9,
          gameContext: {
            gameType: 'sng',
            tableDescription: '单挑 SNG 决赛桌，盲注即将上涨，你 9BB、对手 41BB',
          },
        },
        options: [
          {
            action: 'All-in 9BB',
            isCorrect: true,
            explanation:
              '9BB 属全下档：被跟注分支 = 0.44 × 10.5 − 0.56 × 9 = 4.62 − 5.04 = −0.42BB，保本弃牌率 = 0.42 ÷ (1.5 + 0.42) ≈ 21.9%；这个深度的弃牌率约 45%，EV = 0.45 × 1.5 − 0.55 × 0.42 ≈ +0.44BB，已过线。',
            evImpact: '+1.5 BB/100',
            evLoss: 0,
          },
          {
            action: 'Min-raise 2BB',
            isCorrect: false,
            explanation:
              '9BB 下 min-raise 后只剩 7BB、底池约 5BB：翻后任何下注都接近套池却不构成全下威胁，等于把决策权交给筹码更多的一方。',
            evImpact: '-1.2 BB/100',
            evLoss: 1.2,
          },
          {
            action: 'Fold',
            isCorrect: false,
            explanation:
              '每圈盲注合计 1.5BB，9BB 只够撑 6 圈；A9s 对任何跟注范围都有约 44% 胜率，fold 等于把 0.44 的权益换成一次不存在的"更好的牌"。',
            evImpact: '-2.5 BB/100',
            evLoss: 2.5,
          },
        ],
        relatedLessonId: 'l6hu-tourney',
      },
    ],
  },
  units: [
    {
      id: 'u1',
      title: '筹码节奏与盲注压力',
      sections: L6HU_TOURNEY_U1_SECTIONS,
      exampleId: 'l6hu-tourney-ex1',
    },
    {
      id: 'u2',
      title: 'ICM、盲注攻防与全下数学',
      sections: L6HU_TOURNEY_U2_SECTIONS,
      exampleId: 'l6hu-tourney-ex2',
    },
    {
      id: 'u3',
      title: '理论支撑与筹码节奏换挡',
      sections: L6HU_TOURNEY_U3_SECTIONS,
      exampleId: 'l6hu-tourney-ex3',
    },
  ],
};
