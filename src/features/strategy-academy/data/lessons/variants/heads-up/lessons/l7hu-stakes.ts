import type { Lesson, LessonSection } from '../../../../../types';

// ===== l7hu-stakes 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L7HU_STAKES_U1_SECTIONS: LessonSection[] = [
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
];

const L7HU_STAKES_U2_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '翻前与翻后：范围与频率的两条拓宽线' },
  {
    type: 'text',
    content:
      'HU 翻前范围比 6-max 大幅拓宽：\n\nBTN/SB open 范围：约 80%（远高于 6-max BTN 开池的最宽档）\n- 任何对子都是强牌\n- 任何 Ax 都是强牌\n- 同花连牌、小对子都可以 open\n\n3-bet 范围：\n- 更宽（约 10-15%）\n- 包括强牌 + 部分 bluff\n- 平衡性更重要\n\nHU 翻后策略的关键调整：\n\n1. 更多 C-Bet：BTN 有范围优势，应该高频 C-Bet\n2. 更宽的价值下注：顶对弱踢脚也是强牌\n3. 更多 bluff：对手范围更宽，更容易被 bluff 走\n4. 位置利用：有位置时可以更频繁地价值下注和 bluff',
  },
  {
    type: 'formula',
    content:
      '翻后筹码预算用 SPR 度量（SPR = 有效筹码 ÷ 翻牌圈底池）：\n\n单挑 100BB，SB min-raise 2BB、BB 跟注 → 翻牌圈底池 4BB、有效筹码 98BB：\nSPR = 98 ÷ 4 = 24.5（深筹码：三条街都能打，顶对要控池）\n\n同一手牌走 3-bet 底池：SB 2BB → BB 加注到 9BB → SB 跟注，翻牌圈底池 18.5BB、有效筹码 80BB：\nSPR = 80 ÷ 18.5 ≈ 4.3（低 SPR：顶对好踢脚两条街就能打光）\n\n读法：单挑范围宽、对手用宽范围支付，所以同样的顶对在 SPR 24.5 只能打两三条小注，在 SPR 4.3 就该把筹码送进去——HU 的"更宽价值下注"由 SPR 与范围宽度共同决定，不是单纯"打得更凶"。',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：把位置、范围与频率读成一张整体地图而不是四条孤立规则，见理论学院 T9『全面整合』——那一章把单挑的开池宽度、翻后频率与尺度归到同一套决策树，本课的四条 HU 差异正是它的入门层。',
    data: { theoryLevelId: 't9hu', theoryChapterId: 't9hu-mastery' },
  },
];

const L7HU_STAKES_U3_SECTIONS: LessonSection[] = [
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
  {
    type: 'theory-reference',
    content:
      '理论支撑：为什么既要守住基线、又要按对手类型偏离，见理论学院 T9『GTO-剥削统一框架』——基线负责信息不足时不被剥削，偏离负责信息充分时多拿期望，本课的四类对手画像就是它的执行入口。',
    data: { theoryLevelId: 't9hu', theoryChapterId: 't9hu-unified' },
  },
  {
    type: 'takeaway',
    content:
      'HU 基础三句总结：\n先按约 80% 的宽度开池，再按范围宽度而不是绝对牌力决定价值下注\n同样的顶对在 SPR 24.5 只打小注控池，在 SPR 4.3 就把筹码送进去\n对手类型决定偏离方向：紧弱多诈唬、松被动多价值、松凶平衡带陷阱、紧凶少冲突',
  },
];

export const HEADS_UP_LESSON: Lesson = {
  id: 'l7hu-stakes',
  level: 7,
  order: 1,
  title: '单挑策略基础',
  subtitle: '位置价值更大、范围更宽、决策更频繁',
  duration: '8 min',
  objectives: [
    '列举单挑与 6-max 的核心差异（位置价值极大、任何对子与 Ax 都是强牌、翻后决策更频繁、剥削调整更重要）',
    '判断 HU BTN/SB 的 open 范围约 80%，并说出顶对弱踢脚在 HU 中应更宽地价值下注',
    '区分四类 HU 对手的应对（紧弱型高频 C-Bet 多 bluff、松被动型多价值少 bluff、松凶型平衡+陷阱、紧凶型避免过度冲突）',
  ],
  variant: 'heads-up',
  variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante', stackDepth: 100 },
  content: [...L7HU_STAKES_U1_SECTIONS, ...L7HU_STAKES_U2_SECTIONS, ...L7HU_STAKES_U3_SECTIONS],
  quiz: [],
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
    {
      id: 'l7hu-stakes-ex2',
      title: '翻后薄价值：中对在 HU 也要下注',
      heroHand: ['9h', '8h'],
      heroPosition: 'SB',
      previousActions: [{ player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: 'call' }, { player: 'BB', action: 'check' }],
      board: ['9c', '5d', '2s'],
      street: 'flop',
      effectiveStack: 98,
      potSize: 4,
      correctDecision: {
        action: 'Bet',
        amount: '1.3BB（1/3 pot）',
        reasoning: [
          '9-5-2 干燥面，BB 的防守范围里 9x 之外很难有比中对更好的牌',
          'HU 中 BB 的范围被 80% 的开池宽度撑宽，中对等于 6-max 里的顶对，必须下注',
          '1/3 池小注让 A 高、后门听牌与未中牌的小对子继续支付，同时保留被过牌加注时的弃牌空间',
        ],
      },
      commonMistake: {
        action: 'Check（"只是中对"）',
        reasoning:
          '把 6-max 的牌力表搬进 HU：中对在宽范围里已经是顶端价值，check 让 BB 的弱范围免费看到转牌。',
        evLoss: '-0.9 BB/100',
      },
    },
    {
      id: 'l7hu-stakes-ex3',
      title: 'OOP 的 3-bet 底池：顶对在低 SPR 打光三条街',
      heroHand: ['As', 'Qs'],
      heroPosition: 'BB',
      previousActions: [{ player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: '3-bet to 7BB' }, { player: 'SB', action: 'call' }],
      board: ['Qc', '7d', '3s'],
      street: 'flop',
      effectiveStack: 93,
      potSize: 14,
      correctDecision: {
        action: 'Bet',
        amount: '4.7BB（1/3 pot）',
        reasoning: [
          'Q 高面 BB 的 3-bet 范围里 AA、KK、QQ、AQ 密度高，范围优势在 BB 一侧',
          '底池 14BB、有效筹码 93BB，SPR ≈ 6.6：顶对好踢脚两三条街就能把筹码打光',
          '翻后 BB 先行动，用 1/3 池小注维持整体范围高频下注，转牌与河牌继续推进',
        ],
      },
      commonMistake: {
        action: 'Check-Call（"没位置就别开火"）',
        reasoning:
          '没位置不等于不下注：把下注权让出去，A/K 掉出时范围优势被还回去，顶对的三条街价值一起丢掉。',
        evLoss: '-1.1 BB/100',
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
          { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '98 在 T-7-2 面有双向卡顺（6/J 各 4 张）+ 同花听牌（10 outs），Check-Raise 半诈唬是标准打法。', evImpact: '+1.5 BB/100' },
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
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，3-bet 底池' },
        },
        options: [
          { action: 'Bet 8BB（约45% pot）', isCorrect: true, explanation: 'KQ 在 K-8-3 面是顶对好踢脚，3-bet 底池 SPR 低，应该下注获取价值。', evImpact: '+2.0 BB/100' },
          { action: 'Check', isCorrect: false, explanation: 'KQ 在干燥面是强牌，check 太被动。应该下注获取价值。', evImpact: '-1.0 BB/100' },
          { action: 'All-in', isCorrect: false, explanation: 'SPR 4.3，All-in 过度。中等下注即可，让对手用更宽范围跟注。', evImpact: '-0.5 BB/100' },
        ],
        relatedLessonId: 'l7hu-stakes',
      },
    ],
  },
  units: [
    {
      id: 'u1',
      title: 'HU 的独特性',
      sections: L7HU_STAKES_U1_SECTIONS,
      exampleId: 'l7hu-stakes-ex1',
    },
    {
      id: 'u2',
      title: '范围与频率的拓宽线',
      sections: L7HU_STAKES_U2_SECTIONS,
      exampleId: 'l7hu-stakes-ex2',
    },
    {
      id: 'u3',
      title: '对手类型与理论支撑',
      sections: L7HU_STAKES_U3_SECTIONS,
      exampleId: 'l7hu-stakes-ex3',
    },
  ],
};
