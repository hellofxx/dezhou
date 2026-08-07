import type { Lesson } from '../../../../types';

export const SHORT_DECK_LEVEL_6_LESSONS: Lesson[] = [
  {
    id: 'l6sd-tourney-i',
    level: 6,
    order: 1,
    title: '短牌锦标赛（一）',
    subtitle: '短牌 MTT 的筹码节奏、翻前攻防与生存策略',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 50 },
    content: [
      { type: 'heading', content: '短牌 MTT：筹码节奏与生存' },
      {
        type: 'text',
        content:
          '短牌 MTT（多桌锦标赛）与现金桌不同：盲注随时间上涨、筹码是有限资源、ICM 压力主导。短牌锦标赛的筹码节奏：深筹码阶段（50BB+）可维持现金桌式打法；浅筹码阶段（20BB 以下）转向翻前全下博弈。短牌高波动让锦标赛生存策略更加重要。',
      },
      {
        type: 'key-point',
        content: '短牌 MTT 黄金原则：筹码越浅、盲注占比越高，翻前全下越频繁。短牌波动大，锦标赛要兼顾"生存"与"进攻"，避免不必要的波动。',
      },
      { type: 'heading', content: '筹码节奏与翻前攻防' },
      {
        type: 'text',
        content:
          '短牌 MTT 筹码节奏分阶段：(1) 深筹码（50BB+）——可现金桌式打法，范围宽、翻后多；(2) 中筹码（20-50BB）——min-raise + 翻后兼顾；(3) 短筹码（20BB 以下）——翻前全下为主。短牌因高波动，浅筹码阶段要更积极地用有权益的牌抢盲与翻盘。',
      },
      {
        type: 'example',
        content:
          '实例：短牌 MTT 中筹码，你持 A♠Q♠，对手（BB）3Bet。AQ 短牌次级价值（非对子但强），面对 3Bet 要看筹码深度与对手倾向：深筹码可跟注看翻后，浅筹码（20BB 以下）可直接全下（AQ 对宽范围胜率不错）。筹码节奏决定同一手牌的打法。',
      },
      {
        type: 'example',
        content:
          '实例二（生存策略）：短牌 MTT 泡沫期，你（BB）持 K♦Q♠ 面对 BTN 全下。短牌 KQ 非对子，面对 BTN 的全下范围（含对子/强 Ax）约 35%-40% 胜率。泡沫期 ICM 压力下，若筹码健康应倾向弃牌保生存；若短筹码则跟注翻盘。短牌锦标赛要平衡生存与进攻。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌 MTT 中"领先时保守"与"落后时激进"的 ICM 逻辑，与现金桌"永远最大 EV"不同。锦标赛只有最终名次才有意义，生存有时优先于单手的 EV。',
      },
      {
        type: 'pro-tip',
        content: '短牌 MTT 筹码节奏速记：深筹码 50BB+ 现金桌式、中筹码 20-50BB min-raise+翻后、短筹码 20BB 以下全下为主。泡沫期生存优先，深筹码避免不必要波动。',
      },
    ],
    quiz: [
      {
        id: 'l6sd-tourney-i-q1',
        question: '短牌 MTT 与现金桌的核心差异是：',
        options: [
          '没有差异',
          '盲注上涨、筹码有限、ICM 压力主导',
          '短牌 MTT 牌更大',
          '现金桌盲注更高',
        ],
        correctIndex: 1,
        explanation: '短牌 MTT 盲注上涨、筹码是有限资源、ICM 压力主导，策略随筹码深度动态调整。',
      },
      {
        id: 'l6sd-tourney-i-q2',
        question: '短牌 MTT 深筹码（50BB+）阶段的策略是：',
        options: [
          '全下为主',
          '可现金桌式打法，范围宽、翻后多',
          '纯等牌',
          '只打坚果',
        ],
        correctIndex: 1,
        explanation: '深筹码可维持现金桌式打法，范围宽、翻后空间大。',
      },
      {
        id: 'l6sd-tourney-i-q3',
        question: '短牌 MTT 浅筹码（20BB 以下）阶段的策略是：',
        options: [
          '复杂翻后打法',
          '翻前全下为主，用有权益的牌抢盲翻盘',
          '等好牌',
          '完全过牌',
        ],
        correctIndex: 1,
        explanation: '浅筹码阶段翻前全下为主，用任何有权益的牌（对子/Ax/强同花连张）抢盲与翻盘。',
      },
      {
        id: 'l6sd-tourney-i-q4',
        question: '短牌 MTT 泡沫期，筹码健康时持边缘牌面对全下，正确倾向是：',
        options: [
          '无脑跟注',
          '倾向弃牌保生存（ICM 压力）',
          '加注翻本',
          '直接全下',
        ],
        correctIndex: 1,
        explanation: '泡沫期 ICM 压力下，筹码健康时应倾向弃牌保生存，而非冒不必要的波动风险。',
      },
      {
        id: 'l6sd-tourney-i-q5',
        question: '短牌 MTT 的黄金原则是：',
        options: [
          '永远进攻',
          '筹码越浅、盲注占比越高，翻前全下越频繁，兼顾生存与进攻',
          '永远保守',
          '只看单首 EV',
        ],
        correctIndex: 1,
        explanation: '短牌 MTT 筹码越浅翻前全下越频繁，但高波动下要兼顾生存与进攻。',
      },
    ],
    examples: [
      {
        id: 'l6sd-tourney-i-ex1',
        title: '短牌 MTT 短筹码全下',
        heroHand: ['As', 'Qs'],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 15,
        potSize: 3,
        correctDecision: {
          action: 'All-in',
          amount: '15 ante',
          reasoning: [
            '短筹码（15 ante）下 AQs 是标准全下牌',
            '面对 BB 宽范围胜率不错（约 55%+）',
            '短牌高波动，浅筹码用强牌抢盲翻盘',
          ],
        },
        commonMistake: {
          action: 'Limp',
          reasoning: '短筹码 limp 让对手 isolate，全下更优。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l6sd-tourney-i-practice',
      questions: [
        {
          id: 'l6sd-tourney-i-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Kh', 'Qh'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 3,
            effectiveStack: 15,
            gameContext: { gameType: 'mtt', tableDescription: '短牌 MTT，短筹码 15 ante' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'KQs 短筹码全下牌，fold 太紧。', evImpact: '-1.5 ante', evLoss: 1.5 },
            { action: 'All-in', isCorrect: true, explanation: 'KQs 短筹码全下，面对宽范围胜率不错，抢盲翻盘。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Limp', isCorrect: false, explanation: '短筹码 limp 让对手 isolate，全下更优。', evImpact: '-1.0 ante', evLoss: 1 },
          ],
          relatedLessonId: 'l6sd-tourney-i',
        },
        {
          id: 'l6sd-tourney-i-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Td', '9d'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['8h', '7c', '2s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 45,
            gameContext: { gameType: 'mtt', tableDescription: '短牌 MTT，中筹码 45 ante' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: 'T9 在 8-7-2 面有顺子听牌，fold 太弱。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: 'T9 有顺子听牌，中筹码 x/r 半诈唬保护。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，x/r 建立优势即可。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l6sd-tourney-i',
        },
        {
          id: 'l6sd-tourney-i-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Ac', 'Kd'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'all-in 12 ante' },
            ],
            street: 'preflop',
            potSize: 15,
            effectiveStack: 40,
            gameContext: { gameType: 'mtt', tableDescription: '短牌 MTT，泡沫期，筹码健康' },
          },
          options: [
            { action: 'Call', isCorrect: false, explanation: '泡沫期 AK 对 BTN 全下范围（含对子）约 45%，筹码健康应保生存。', evImpact: '+0.3 ante', evLoss: 0.3 },
            { action: 'Fold', isCorrect: true, explanation: '泡沫期 ICM 压力，AK 对含对子的全下范围约 45% 边缘，筹码健康倾向弃牌保生存。', evImpact: '+0 ante', evLoss: 0 },
            { action: 'Re-raise All-in', isCorrect: false, explanation: '对手已全下，无再反加意义。', evImpact: '-0.5 ante', evLoss: 0.5 },
          ],
          relatedLessonId: 'l6sd-tourney-i',
        },
      ],
    },
  },
  {
    id: 'l6sd-tourney-ii',
    level: 6,
    order: 2,
    title: '短牌锦标赛（二）',
    subtitle: '短牌 MTT 的 ICM、泡沫期与决赛桌调整',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 40 },
    content: [
      { type: 'heading', content: '短牌 MTT：ICM 与泡沫期' },
      {
        type: 'text',
        content:
          '短牌 MTT 的 ICM（独立筹码模型）与泡沫期决策：ICM 衡量筹码的实际价值（越靠近钱圈/名次，筹码价值越非线性）。短牌高波动让 ICM 压力更明显——泡沫期避免不必要的全下波动，保住生存。',
      },
      {
        type: 'key-point',
        content: '短牌 MTT ICM 铁律：泡沫期/钱圈附近，筹码健康时避免不必要的全下波动；短筹码则激进抢盲翻盘。ICM 让"生存"与"进攻"需要平衡。',
      },
      { type: 'heading', content: '泡沫期与决赛桌调整' },
      {
        type: 'text',
        content:
          '泡沫期（钱圈前）策略：筹码健康者倾向保守，避免不必要的全下波动（ICM 压力）；短筹码者激进抢盲，因为等待没有意义。决赛桌（剩少数人）：名次跳跃大，深筹码可施压短筹码，短筹码要果断翻盘。短牌高波动让这些 ICM 决策更关键。',
      },
      {
        type: 'example',
        content:
          '实例：短牌 MTT 泡沫期，你（BB）筹码健康（40 ante），BTN 全下 15 ante。你持 K♦Q♠。短牌 KQ 非对子，面对 BTN 全下范围（含对子/强 Ax）约 35%-40% 胜率。泡沫期 ICM 压力下，筹码健康应倾向弃牌保生存——即使跟注 EV 略正，冒波动风险不值得。',
      },
      {
        type: 'example',
        content:
          '实例二（决赛桌施压）：短牌 MTT 决赛桌剩 3 人，你是深筹码（60 ante），两个短筹码（各 20 ante）。深筹码可施压短筹码——用宽范围全下/加注，因为他们 ICM 压力大、不敢冒险。短牌高波动让深筹码的施压更有效。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌 MTT 中"领先时保守"与"落后时激进"的 ICM 逻辑，与现金桌"永远最大 EV"不同。锦标赛只有最终名次才有意义，泡沫期生存有时优先于单手的 EV。',
      },
      {
        type: 'pro-tip',
        content: '短牌 MTT ICM 速记：泡沫期筹码健康保生存、短筹码激进翻盘；决赛桌深筹码施压短筹码。每阶段先问"我的筹码相对地位"，再决定保守还是激进。',
      },
    ],
    quiz: [
      {
        id: 'l6sd-tourney-ii-q1',
        question: '短牌 MTT 泡沫期，筹码健康时持边缘牌面对全下，正确倾向是：',
        options: [
          '无脑跟注',
          '倾向弃牌保生存（ICM 压力）',
          '加注翻本',
          '直接全下',
        ],
        correctIndex: 1,
        explanation: '泡沫期 ICM 压力下，筹码健康应倾向弃牌保生存，避免不必要的全下波动。',
      },
      {
        id: 'l6sd-tourney-ii-q2',
        question: '短牌 MTT 泡沫期，短筹码的正确策略是：',
        options: [
          '保守等牌',
          '激进抢盲翻盘，等待没有意义',
          '完全过牌',
          '弃牌保名次',
        ],
        correctIndex: 1,
        explanation: '短筹码泡沫期应激进抢盲翻盘，因为等待没有意义，需要翻盘才能进钱圈。',
      },
      {
        id: 'l6sd-tourney-ii-q3',
        question: '短牌 MTT 决赛桌，深筹码对短筹码的正确策略是：',
        options: [
          '保守',
          '施压——宽范围全下/加注，短筹码 ICM 压力大不敢冒险',
          '只玩坚果',
          '平等对待',
        ],
        correctIndex: 1,
        explanation: '决赛桌深筹码可施压短筹码，因为他们 ICM 压力大、不敢冒险。',
      },
      {
        id: 'l6sd-tourney-ii-q4',
        question: '短牌 MTT 中 ICM 的含义是：',
        options: [
          '筹码越多越不值钱',
          '衡量筹码实际价值，越靠近钱圈越非线性',
          '没有意义',
          '只在决赛桌存在',
        ],
        correctIndex: 1,
        explanation: 'ICM 衡量筹码实际价值，越靠近钱圈/名次，筹码价值越非线性，影响决策。',
      },
      {
        id: 'l6sd-tourney-ii-q5',
        question: '短牌 MTT "领先时保守、落后时激进"的原因是：',
        options: [
          '没有原因',
          '锦标赛只有最终名次有意义，生存有时优先于单首 EV',
          '保守更稳',
          '激进更好',
        ],
        correctIndex: 1,
        explanation: '锦标赛只有最终名次才有意义，泡沫期生存优先于单首 EV，领先保守、落后激进。',
      },
    ],
    examples: [
      {
        id: 'l6sd-tourney-ii-ex1',
        title: '短牌 MTT 泡沫期弃牌保生存',
        heroHand: ['Kd', 'Qs'],
        heroPosition: 'BB',
        previousActions: [
          { player: 'BTN', action: 'all-in 15 ante' },
        ],
        street: 'preflop',
        effectiveStack: 40,
        potSize: 18,
        correctDecision: {
          action: 'Fold',
          amount: '',
          reasoning: [
            '泡沫期 ICM 压力，筹码健康应保生存',
            'KQ 非对子面对 BTN 全下范围（含对子/强 Ax）约 35%-40% 胜率',
            '避免不必要的全下波动，保生存进钱圈',
          ],
        },
        commonMistake: {
          action: 'Call',
          reasoning: '泡沫期筹码健康时，跟注 KQ 面对含对子的全下范围是冒不必要波动风险。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l6sd-tourney-ii-practice',
      questions: [
        {
          id: 'l6sd-tourney-ii-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ac', 'Kc'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'all-in 12 ante' },
            ],
            street: 'preflop',
            potSize: 15,
            effectiveStack: 45,
            gameContext: { gameType: 'mtt', tableDescription: '短牌 MTT，泡沫期，筹码健康' },
          },
          options: [
            { action: 'Call', isCorrect: true, explanation: 'AK 对 BTN 全下范围胜率不错（约 45%+），且筹码健康跟注 EV 正。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'AK 是强牌，泡沫期筹码健康也值得跟注（胜率足够）。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Re-raise All-in', isCorrect: false, explanation: '对手已全下，无再反加意义。', evImpact: '-0.5 ante', evLoss: 0.5 },
          ],
          relatedLessonId: 'l6sd-tourney-ii',
        },
        {
          id: 'l6sd-tourney-ii-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Jh', 'Jc'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'all-in 10 ante' },
            ],
            street: 'preflop',
            potSize: 13,
            effectiveStack: 30,
            gameContext: { gameType: 'mtt', tableDescription: '短牌 MTT，钱圈边缘，中筹码' },
          },
          options: [
            { action: 'Call', isCorrect: true, explanation: 'JJ 面对 BTN 全下范围领先，跟注 EV 正，中筹码可跟。', evImpact: '+2.0 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'JJ 是强对子，面对全下跟注明显 +EV。', evImpact: '-2.0 ante', evLoss: 2 },
            { action: 'Re-raise All-in', isCorrect: false, explanation: '对手已全下，直接跟注即可。', evImpact: '-0.5 ante', evLoss: 0.5 },
          ],
          relatedLessonId: 'l6sd-tourney-ii',
        },
        {
          id: 'l6sd-tourney-ii-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Qd', 'Qc'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 3,
            effectiveStack: 60,
            gameContext: { gameType: 'mtt', tableDescription: '短牌 MTT 决赛桌剩 3 人，深筹码，两短筹码' },
          },
          options: [
            { action: 'Limp', isCorrect: false, explanation: '深筹码 QQ 应加注施压短筹码，limp 太被动。', evImpact: '+0.3 ante', evLoss: 0.3 },
            { action: 'Raise 2 ante', isCorrect: true, explanation: '决赛桌深筹码 QQ 加注施压短筹码，他们 ICM 压力大不敢冒险。', evImpact: '+2.0 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'QQ 顶级对子，fold 荒谬。', evImpact: '-3.0 ante', evLoss: 3 },
          ],
          relatedLessonId: 'l6sd-tourney-ii',
        },
      ],
    },
  },
];
