import type { Lesson } from '../../../../types';

export const HEADS_UP_LEVEL_7_LESSONS: Lesson[] = [
  {
    id: 'l7hu-stakes',
    level: 7,
    order: 1,
    title: '单挑策略基础',
    subtitle: '位置价值更大、范围更宽、决策更频繁',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante', stackDepth: 100 },
    content: [
      { type: 'heading', content: 'HU 的独特性' },
      {
        type: 'text',
        content:
          '单挑（Heads-Up）是德州扑克中最纯粹的形式。与 6-max 或全桌相比，HU 有以下特点：\n\n1. 位置价值更大：BTN 每手牌都有位置优势\n2. 范围大幅拓宽：任何对子都是强牌，Ax 都是强牌\n3. 翻后决策更频繁：更多时候只有两人争夺底池\n4. 剥削调整更重要：可以快速识别并剥削对手弱点',
      },
      {
        type: 'key-point',
        content: '核心概念：HU 中位置价值极大。BTN 每手牌都有位置优势。任何对子在 HU 中都是强牌，Ax 都是强牌。',
      },
      { type: 'heading', content: '翻前范围调整' },
      {
        type: 'text',
        content:
          'HU 翻前范围比 6-max 大幅拓宽：\n\nBTN open 范围：约 50-70%（vs 6-max 的 30-40%）\n- 任何对子都是强牌\n- 任何 Ax 都是强牌\n- 同花连牌、小对子都可以 open\n\n3-Bet 范围：\n- 更宽（约 10-15%）\n- 包括强牌 + 部分 bluff\n- 平衡性更重要',
      },
      { type: 'heading', content: '翻后策略调整' },
      {
        type: 'text',
        content:
          'HU 翻后策略的关键调整：\n\n1. 更多 C-Bet：BTN 有范围优势，应该高频 C-Bet\n2. 更宽的价值下注：顶对弱踢脚也是强牌\n3. 更多 bluff：对手范围更宽，更容易被 bluff 走\n4. 位置利用：有位置时可以更频繁地价值下注和 bluff',
      },
      { type: 'heading', content: '适应不同 HU 对手类型' },
      {
        type: 'text',
        content:
          'HU 中快速识别对手类型并调整：\n\n1. 紧弱型：频繁 C-Bet，多 bluff\n2. 松被动型：多价值下注，少 bluff\n3. 松凶型：平衡打法，适当陷阱\n4. 紧凶型：尊重对手，避免过度冲突',
      },
      {
        type: 'pro-tip',
        content: 'HU 中最重要的技能是快速识别对手类型并调整。前 20 手牌就要建立对手的基本画像，然后开始剥削。',
      },
      {
        type: 'highlight',
        content: '警告：不要用 6-max 的标准打 HU。很多在 6-max 中是 fold 的牌，在 HU 中都是 call 或 raise。',
      },
    ],
    quiz: [
      {
        id: 'l7hu-stakes-q1',
        question: 'HU 中 BTN 的 open 范围约是多少？',
        options: ['20-30%', '30-40%', '50-70%', '80%+'],
        correctIndex: 2,
        explanation: 'HU 中 BTN open 范围约 50-70%，比 6-max 的 30-40% 大幅拓宽。',
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
    examples: [
      {
        id: 'l7hu-stakes-ex1',
        title: 'HU 中 BTN 的宽 open',
        heroHand: ['7h', '6h'],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 1.5,
        correctDecision: {
          action: 'Open raise',
          reasoning: [
            'HU 中 76s 可玩性好，应该 open',
            'BTN 有位置优势，翻后可以利用',
            '同花连牌有很好的翻后潜力',
            '在 HU 中这比 6-max 中的相对价值高得多',
          ],
        },
        commonMistake: {
          action: 'Fold（"只是 76s"）',
          reasoning: '用 6-max 的标准打 HU 会错过很多盈利机会。76s 在 HU 中是标准 open。',
          evLoss: '-1.5 BB/100',
        },
      },
    ],
    practice: {
      id: 'l7hu-stakes-practice',
      questions: [
        {
          id: 'l7hu-stakes-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['8s', '7s'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Open raise', isCorrect: true, explanation: 'HU 中 87s 可玩性好，BTN 有位置优势，应该 open。', evImpact: '+1.0 BB/100' },
            { action: 'Limp', isCorrect: false, explanation: 'HU 中应该积极 open，limp 太被动。', evImpact: '-0.5 BB/100' },
            { action: 'Fold', isCorrect: false, explanation: '87s 在 HU 中可玩性好，fold 太紧。', evImpact: '-1.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['As', '2h'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Ac', '8d', '3c'],
            street: 'flop',
            potSize: 5.5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'C-Bet 2BB（33% pot）', isCorrect: true, explanation: 'A2 在 A-8-3 面是顶对，HU 中应该小注 C-Bet 获取价值。', evImpact: '+1.0 BB/100' },
            { action: 'Check', isCorrect: false, explanation: 'HU 中顶对应该下注获取价值，check 太被动。', evImpact: '-0.8 BB/100' },
            { action: 'All-in', isCorrect: false, explanation: 'A2 顶对弱踢脚，All-in 过度。小注获取价值即可。', evImpact: '-1.0 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p3',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Qd', 'Jd'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: 'call' },
              { player: 'BB', action: 'check' },
            ],
            board: ['Kd', '7c', '2h'],
            street: 'flop',
            potSize: 5.5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，对手是紧弱型' },
          },
          options: [
            { action: 'C-Bet 4BB（75% pot）', isCorrect: true, explanation: '面对紧弱型对手应该高频 C-Bet，QJ 有高牌胜率，应该下注。', evImpact: '+1.5 BB/100' },
            { action: 'Check', isCorrect: false, explanation: '面对紧弱型对手应该多 bluff，check 错失机会。', evImpact: '-0.8 BB/100' },
            { action: 'All-in', isCorrect: false, explanation: 'QJ 高牌 All-in 过度。中等下注即可。', evImpact: '-1.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p4',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['9h', '8h'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Th', '7c', '2d'],
            street: 'flop',
            potSize: 5.5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '98 在 T-7-2 面有卡顺 + 后门同花，Check-Raise 半诈唬是标准打法。', evImpact: '+1.5 BB/100' },
            { action: 'Check-Fold', isCorrect: false, explanation: '98 有卡顺听牌，fold 太弱。应该 Check-Raise 半诈唬。', evImpact: '-1.0 BB/100' },
            { action: 'Donk Bet', isCorrect: false, explanation: 'Donk Bet 不是标准打法。应该 Check 让对手先行动，然后 Check-Raise。', evImpact: '-0.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p5',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Ks', 'Qs'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: '3-bet to 9BB' },
              { player: 'BTN', action: 'call' },
              { player: 'BB', action: 'check' },
            ],
            board: ['Kh', '8c', '3h'],
            street: 'flop',
            potSize: 18.5,
            effectiveStack: 80,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，3-Bet 底池' },
          },
          options: [
            { action: 'Bet 8BB（约45% pot）', isCorrect: true, explanation: 'KQ 在 K-8-3 面是顶对好踢脚，3-Bet 底池 SPR 低，应该下注获取价值。', evImpact: '+2.0 BB/100' },
            { action: 'Check', isCorrect: false, explanation: 'KQ 在干燥面是强牌，check 太被动。应该下注获取价值。', evImpact: '-1.0 BB/100' },
            { action: 'All-in', isCorrect: false, explanation: 'SPR 4.3，All-in 过度。中等下注即可，让对手用更宽范围跟注。', evImpact: '-0.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
      ],
    },
  },
];
