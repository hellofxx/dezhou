import type { Lesson } from '../../../../types';

export const SHORT_DECK_LEVEL_7_LESSONS: Lesson[] = [
  {
    id: 'l7sd-deep-stack',
    level: 7,
    order: 1,
    title: '短牌深筹码',
    subtitle: '100BB+ 短牌深筹码策略、强牌价值提取与坚果对抗',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 150 },
    content: [
      { type: 'heading', content: '短牌深筹码：价值提取与坚果对抗' },
      {
        type: 'text',
        content:
          '短牌深筹码（100BB+）的策略核心是价值提取与坚果对抗：同花/顺子成牌价值高，深筹码下要连开三枪榨取全程价值；同时深筹码放大 RIO（反向隐含赔率），边缘成牌更容易被更强牌压制，要控池止损。',
      },
      {
        type: 'key-point',
        content: '短牌深筹码铁律：强成牌（同花/顺子/两对）连开三枪榨取价值；边缘成牌控池止损（深筹码放大 RIO）。深筹码用大尺度让底池几何增长，才能在河牌完成全下。',
      },
      { type: 'heading', content: '深筹码的尺度与坚果对抗' },
      {
        type: 'text',
        content:
          '短牌深筹码（SPR 高）下：强成牌需用大尺度（2/3 池以上）让底池逐街几何增长，才能在河牌完成全下榨取价值。同时坚果对抗——短牌同花/顺子价值高，深筹码下要主动构建底池，让对手用弱成牌（顶对/两对）跟注你的坚果。',
      },
      {
        type: 'example',
        content:
          '实例：短牌深筹码 150BB，你（BTN）持 A♥K♥，翻牌 9♥7♥2♣，中同花听牌。转牌 5♥ 成同花！你成坚果同花（beats 葫芦）。深筹码下用大注榨取——翻牌 2/3 池、转牌大注、河牌超池或全下，让对手的顶对/两对跟注你的坚果同花。短牌同花价值高，深筹码下价值提取最大化。',
      },
      {
        type: 'example',
        content:
          '实例二（边缘成牌控池）：短牌深筹码，你持 A♠Q♠，翻牌 Q♦9♣8♠（顶对 + 顺子听牌面）。深筹码下顶对 RIO 高（对手可能有 9x/8x/顺子听牌），应控池止损——小注或 check，避免建立大底池后被反超。深筹码放大 RIO，边缘成牌要保守。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌深筹码下，"强牌快打、边缘牌控池"的对比更极端。深筹码放大成牌价值（强牌多榨取）与 RIO（边缘牌多损失），两者都要走极端。',
      },
      {
        type: 'pro-tip',
        content: '短牌深筹码速记：强成牌连开三枪大注榨取（河牌全下）；边缘成牌控池止损。SPR 高时每街先问"我的牌是坚果级还是边缘"，再决定榨取还是控池。',
      },
    ],
    quiz: [
      {
        id: 'l7sd-deep-stack-q1',
        question: '短牌深筹码（100BB+）的核心策略是：',
        options: [
          '只玩坚果',
          '强牌价值提取（连开三枪）+ 边缘成牌控池止损',
          '无脑全下',
          '完全保守',
        ],
        correctIndex: 1,
        explanation: '深筹码下强成牌连开三枪榨取价值，边缘成牌控池止损（深筹码放大 RIO）。',
      },
      {
        id: 'l7sd-deep-stack-q2',
        question: '短牌深筹码成坚果同花（beats 葫芦），正确做法是：',
        options: [
          '过牌慢玩',
          '大注榨取，让对手弱成牌跟注',
          '立即全下',
          '只下小注',
        ],
        correctIndex: 1,
        explanation: '深筹码下坚果同花用大注榨取，让对手的顶对/两对跟注你的坚果。',
      },
      {
        id: 'l7sd-deep-stack-q3',
        question: '短牌深筹码持顶对在湿润面，正确做法是：',
        options: [
          '激进下注',
          '控池止损（深筹码放大 RIO）',
          '直接全下',
          '立即弃牌',
        ],
        correctIndex: 1,
        explanation: '深筹码下顶对 RIO 高（对手有顺子/两对/听牌），应控池止损。',
      },
      {
        id: 'l7sd-deep-stack-q4',
        question: '短牌深筹码强成牌连开三枪的尺度要求是：',
        options: [
          '小注控池',
          '大尺度（2/3 池以上）让底池几何增长，河牌完成全下',
          '过牌',
          '立即全下',
        ],
        correctIndex: 1,
        explanation: '深筹码强成牌需大尺度让底池逐街几何增长，才能在河牌完成全下榨取价值。',
      },
      {
        id: 'l7sd-deep-stack-q5',
        question: '"深筹码放大成牌价值与 RIO"的含义是：',
        options: [
          '深筹码更保守',
          '强牌多榨取、边缘牌多损失，两者都走极端',
          '深筹码更激进',
          '没有区别',
        ],
        correctIndex: 1,
        explanation: '深筹码放大成牌价值（强牌多榨取）与 RIO（边缘牌多损失），策略走极端。',
      },
    ],
    examples: [
      {
        id: 'l7sd-deep-stack-ex1',
        title: '短牌深筹码坚果同花价值提取',
        heroHand: ['Ah', 'Kh'],
        heroPosition: 'BTN',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['9h', '7h', '2c'],
        street: 'flop',
        effectiveStack: 150,
        potSize: 5,
        correctDecision: {
          action: 'Bet',
          amount: '3.3 ante（2/3 pot）',
          reasoning: [
            'AK 同花听牌 + 高张，深筹码建立底池',
            '若转牌成同花（坚果），大注榨取',
            '短牌同花价值高，深筹码下价值提取最大化',
          ],
        },
        commonMistake: {
          action: 'Check',
          reasoning: '深筹码同花听牌应主动建立底池，check 让翻牌免费看，浪费坚果潜力。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l7sd-deep-stack-practice',
      questions: [
        {
          id: 'l7sd-deep-stack-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ad', 'Kd'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9d', '8d', '2h'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 150,
            gameContext: { gameType: 'cash', tableDescription: '短牌深筹码现金桌' },
          },
          options: [
            { action: 'Check', isCorrect: false, explanation: 'AK 同花听牌 + 高张，深筹码应下注建立底池。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'AK 同花听牌深筹码建立底池，若成同花坚果榨取。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '深筹码听牌 All-in 过度，2/3 池建立即可。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l7sd-deep-stack',
        },
        {
          id: 'l7sd-deep-stack-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ah', 'Kh'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Kh', '9h', '7c'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 150,
            gameContext: { gameType: 'cash', tableDescription: '短牌深筹码现金桌，成坚果同花听牌' },
          },
          options: [
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: false, explanation: '深筹码成牌/强听牌应大注建立底池，小注浪费。', evImpact: '-0.5 ante', evLoss: 0.5 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'AK 顶对 + 坚果同花听牌，深筹码 2/3 池建立底池榨取。', evImpact: '+1.8 ante', evLoss: 0 },
            { action: 'Check', isCorrect: false, explanation: '强牌深筹码应下注建立底池，check 太被动。', evImpact: '-1.0 ante', evLoss: 1 },
          ],
          relatedLessonId: 'l7sd-deep-stack',
        },
        {
          id: 'l7sd-deep-stack-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Qc', 'Qd'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '8s', '6d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 150,
            gameContext: { gameType: 'cash', tableDescription: '短牌深筹码现金桌，湿润连接面' },
          },
          options: [
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: false, explanation: '极湿面小注给听牌太便宜，深筹码超对应大注或控池。', evImpact: '-0.5 ante', evLoss: 0.5 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'QQ 超对湿润面 2/3 池大注保护，深筹码让听牌付费。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '超对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l7sd-deep-stack',
        },
      ],
    },
  },
  {
    id: 'l7sd-shallow-stack',
    level: 7,
    order: 2,
    title: '短牌浅筹码',
    subtitle: '30BB 以下短筹码的 Push/Fold 与翻前全下策略',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 30 },
    content: [
      { type: 'heading', content: '短牌浅筹码：Push/Fold 博弈' },
      {
        type: 'text',
        content:
          '短牌浅筹码（30BB 以下）策略的核心是 Push/Fold（全下/弃牌）博弈：复杂翻后打法失效，翻前全下成为主武器。短牌高波动让浅筹码策略更极端——用有权益的牌积极全下抢盲翻盘，因为等待的成本高（盲注占比大、且短牌听牌翻牌率高）。',
      },
      {
        type: 'key-point',
        content: '短牌浅筹码铁律：30BB 以下翻前全下为主，用任何有权益的牌（对子/Ax/强同花连张）抢盲翻盘。复杂翻后打法在浅筹码下失效。',
      },
      { type: 'heading', content: 'Push/Fold 的数学' },
      {
        type: 'formula',
        content:
          '短牌浅筹码 Push/Fold 的盈亏平衡（全下 S ante，底池盲注）：\n\nEV(shove) = f×Pot − (1−f)×[S × (1−E_win) − E_win × (Pot + S)]\n（f = 对手弃牌率，E_win = 被跟注后的胜率）\n\n实例：你全下 15 ante，底池 3 ante，对手弃牌率 40%、你的 KQs 被跟注后胜率 45%：\nEV = 0.4×3 − 0.6×[15×0.55 − 0.45×18] = 1.2 − 0.6×[8.25 − 8.1] = 1.2 − 0.09 = 1.11\n\n短牌浅筹码下 KQs 全下 EV 为正——有弃牌率 + 被跟注后的胜率支撑。（概念源自：短牌 Push/Fold 数学）',
      },
      {
        type: 'text',
        content:
          '短牌浅筹码 Push/Fold 实践：全下范围分两层——价值（对子/强 Ax，被跟注领先）+ 诈唬/半诈唬（强同花连张，有弃牌率 + 被跟注后的改进空间）。短牌对子密度高，浅筹码下对子全下价值更高。避免用弱非同花牌全下（被对子跟注落后）。',
      },
      {
        type: 'example',
        content:
          '实例：短牌浅筹码 15BB，你（BTN）持 K♠Q♠。KQs 面对 BB 跟注范围（对子/强 Ax）约 45% 胜率，加上弃牌率（BB 可能弃弱牌），全下 15BB 的 EV 为正。短牌浅筹码下 KQs 是标准全下牌——有弃牌率 + 被跟注后的胜率支撑。',
      },
      {
        type: 'example',
        content:
          '实例二（避免弱牌全下）：短牌浅筹码 15BB，你持 K♦8♠（非同花弱牌）。K8o 面对 BB 跟注范围约 30% 胜率，被对子跟注大幅落后，且无改进潜力。全下是负 EV——应弃牌。短牌浅筹码下要避免用弱非同花牌全下。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌浅筹码下"等好牌"是错误。盲注占比大、等待成本高，且短牌听牌翻牌率高，用有权益的牌（对子/Ax/强同花连张）积极全下才是正解。弱非同花牌才弃。',
      },
      {
        type: 'pro-tip',
        content: '短牌浅筹码速记：15BB 以下全下为主；全下范围 = 对子/Ax（价值）+ 强同花连张（半诈唬）；避免弱非同花全下。先数自己筹码（BB 数），再决定 Push 还是 Fold。',
      },
    ],
    quiz: [
      {
        id: 'l7sd-shallow-stack-q1',
        question: '短牌浅筹码（30BB 以下）的核心策略是：',
        options: [
          '复杂翻后打法',
          'Push/Fold，翻前全下为主',
          '等好牌',
          '完全过牌',
        ],
        correctIndex: 1,
        explanation: '短牌浅筹码复杂翻后失效，翻前全下成为主武器。',
      },
      {
        id: 'l7sd-shallow-stack-q2',
        question: '短牌浅筹码全下范围的价值层主要包括：',
        options: [
          '弱非同花牌',
          '对子/强 Ax（被跟注领先）',
          '纯空气',
          '只玩 AA/KK',
        ],
        correctIndex: 1,
        explanation: '短牌浅筹码全下范围价值层是对子/强 Ax，被跟注领先。',
      },
      {
        id: 'l7sd-shallow-stack-q3',
        question: '短牌浅筹码 KQs 全下的 EV 为正的原因是：',
        options: [
          'KQs 牌力最强',
          '有弃牌率 + 被跟注后的胜率支撑',
          'KQs 一定赢',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: 'KQs 有弃牌率（对手弃弱牌）+ 被跟注后的胜率（约 45%），EV 为正。',
      },
      {
        id: 'l7sd-shallow-stack-q4',
        question: '短牌浅筹码持 K8o（弱非同花），正确做法是：',
        options: [
          '全下',
          '弃牌（被对子跟注落后、无改进潜力）',
          '加注翻本',
          '只跟注',
        ],
        correctIndex: 1,
        explanation: 'K8o 面对对子大幅落后且无改进潜力，全下负 EV，应弃牌。',
      },
      {
        id: 'l7sd-shallow-stack-q5',
        question: '短牌浅筹码"等好牌"是错误的原因是：',
        options: [
          '等好牌更稳',
          '盲注占比大、等待成本高，且短牌听牌翻牌率高',
          '等好牌能赢',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '浅筹码下盲注占比大、等待成本高，且短牌听牌翻牌率高，用有权益的牌积极全下才是正解。',
      },
    ],
    examples: [
      {
        id: 'l7sd-shallow-stack-ex1',
        title: '短牌浅筹码 KQs 全下',
        heroHand: ['Ks', 'Qs'],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 15,
        potSize: 3,
        correctDecision: {
          action: 'All-in',
          amount: '15 ante',
          reasoning: [
            'KQs 短牌浅筹码标准全下牌',
            '有弃牌率 + 被跟注后的胜率（约 45%）支撑',
            '浅筹码下复杂翻后失效，全下抢盲翻盘',
          ],
        },
        commonMistake: {
          action: 'Fold（"KQs 不够好"）',
          reasoning: '短牌浅筹码 KQs 是全下牌，有弃牌率与胜率支撑，fold 太紧。',
          evLoss: '-1.5 ante',
        },
      },
    ],
    practice: {
      id: 'l7sd-shallow-stack-practice',
      questions: [
        {
          id: 'l7sd-shallow-stack-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ah', 'Qh'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 3,
            effectiveStack: 12,
            gameContext: { gameType: 'cash', tableDescription: '短牌浅筹码' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'AQs 短牌浅筹码标准全下牌，fold 太紧。', evImpact: '-1.5 ante', evLoss: 1.5 },
            { action: 'All-in', isCorrect: true, explanation: 'AQs 面对宽范围胜率不错，浅筹码全下抢盲翻盘。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Limp', isCorrect: false, explanation: '浅筹码 limp 让对手 isolate，全下更优。', evImpact: '-1.0 ante', evLoss: 1 },
          ],
          relatedLessonId: 'l7sd-shallow-stack',
        },
        {
          id: 'l7sd-shallow-stack-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Kd', '8h'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'all-in 10 ante' },
            ],
            street: 'preflop',
            potSize: 13,
            effectiveStack: 15,
            gameContext: { gameType: 'cash', tableDescription: '短牌浅筹码' },
          },
          options: [
            { action: 'Call', isCorrect: false, explanation: 'K8o 面对 BTN 全下范围约 30% 胜率，被对子大幅落后。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Fold', isCorrect: true, explanation: 'K8o 弱非同花，面对全下负 EV，应弃牌。', evImpact: '+0 ante', evLoss: 0 },
            { action: 'Re-raise All-in', isCorrect: false, explanation: '对手已全下，且 K8o 无价值反加。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l7sd-shallow-stack',
        },
        {
          id: 'l7sd-shallow-stack-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Jc', 'Jd'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 3,
            effectiveStack: 18,
            gameContext: { gameType: 'cash', tableDescription: '短牌浅筹码，BB 面对全下弃牌率高' },
          },
          options: [
            { action: 'Limp', isCorrect: false, explanation: '浅筹码 JJ 应全下，limp 让对手 isolate。', evImpact: '+0.3 ante', evLoss: 0.3 },
            { action: 'All-in', isCorrect: true, explanation: 'JJ 浅筹码强对子，面对宽范围领先，全下抢盲榨取。', evImpact: '+2.0 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'JJ 顶级对子，fold 荒谬。', evImpact: '-3.0 ante', evLoss: 3 },
          ],
          relatedLessonId: 'l7sd-shallow-stack',
        },
      ],
    },
  },
];
