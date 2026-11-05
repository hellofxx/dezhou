import type { Lesson, LessonSection } from '../../../../../types';

// ===== l3hu-sb-continuation 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L3HU_SB_U1_SECTIONS: LessonSection[] = [
  { type: 'heading', content: 'SB 的 C-Bet：有位置的持续施压纪律' },
  {
    type: 'text',
    content:
      '单挑中 SB 翻后最后行动、持有位置，这意味着你的 C-Bet 不是"代表强牌"，而是"用正确的范围与尺度让宽范围的 BB 弃牌或付费"。BB 必须先做决定，你把决策留在手里：可以对过牌下注薄价值，可以控制底池，也可以在危险面便宜收手。SB 的 C-Bet 频率由牌面与范围优势决定——干燥高牌面高频、湿润连接面降频，并混合 check 控制底池。',
  },
  {
    type: 'key-point',
    content: '有位置的 C-Bet 核心纪律：先判断"这个牌面击中谁的范围"。干燥面 SB 范围优势大 → 高频小注；湿润面 BB 坚果优势 → 降频控池。不要因为"我是 aggressor"就无脑开火。',
  },
];

const L3HU_SB_U2_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '尺度与范围：何时继续、何时 check' },
  {
    type: 'text',
    content:
      'SB 翻后持续下注的选择分三层：(1) 干燥高牌面（如 K♠7♦2♣）——SB 开池范围含大量 Kx，范围优势明显，用 1/3 池小注高频 C-Bet（约 70%-80%），让 BB 的宽范围弱牌弃牌或薄价值；(2) 湿润连接面（如 9♠8♥6♣）——BB 防守范围含大量顺子/听牌，坚果优势倒向 BB，SB 应降频（约 30%-40%）并混合 check；(3) 无范围优势的中性面——SB 用强牌与好听牌下中小注薄价值，空气与弱对 check 过牌收池，构建平衡范围。',
  },
  {
    type: 'example',
    content:
      '实例：单挑 100BB 深，你（SB）min-raise 到 2BB，BB 跟注，底池 4BB。翻牌 Q♦8♣3♠（干燥）。BB 先过牌，轮到你最后决策。你的开池范围含大量 Qx，BB 防守范围难中 Q，范围优势在你。下注 1/3 池约 1.3BB：QJ/QT 薄价值、A 高半诈唬、小对子也下注——整个范围高频 C-Bet，BB 的弱牌只能弃牌。',
  },
  {
    type: 'example',
    content:
      '实例二（湿润面降频）：同一底池，翻牌 9♠8♥6♣。BB 防守范围含 87/65/97 等大量顺子与听牌，坚果优势倒向 BB。你持 K♠K♦（超对）：仍领先但易被反超，下注 2/3 池保护权益，但 A 高、小对子等弱牌应 check 控池——SB 此面 C-Bet 频率大幅下降。',
  },
  {
    type: 'formula',
    content:
      '下注尺度决定对手必须防守的比例（MDF）与你可以带入的诈唬密度（b = 下注额 ÷ 底池）：\nMDF = P ÷ (P + b) = 1 ÷ (1 + b)\n诈唬密度 = b ÷ (1 + 2b)\n\n1/3 池：MDF = 1 ÷ (1 + 1/3) = 75%，诈唬密度 = 0.33 ÷ 1.67 ≈ 20%\n1/2 池：MDF = 1 ÷ (1 + 1/2) ≈ 66.7%，诈唬密度 = 0.5 ÷ 2 = 25%\n2/3 池：MDF = 1 ÷ (1 + 2/3) = 60%，诈唬密度 = 0.67 ÷ 2.33 ≈ 28.6%\n\n读法：尺度越大，对手只需要守住 60% 就够了，但你能合法带入的诈唬也更多；\n干燥面用 1/3 池要求 BB 守到 75% 才不亏，这就是高频小注的数学基础。',
  },
];

const L3HU_SB_U3_SECTIONS: LessonSection[] = [
  {
    type: 'highlight',
    content: '反直觉点：有位置的 C-Bet 不等于"主动权的宣告"。你最后行动，check 就不是示弱，而是主动收池、消化 BB 翻后先行动透露的信息。x/r 杠杆真正握在 OOP 的 BB 手里——SB 混合 check 恰恰是为了让自己的高频 C-Bet 更难被反打，这才是单挑 SB 的成熟打法。',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：下注尺度与对手必须防守的比例（MDF）见理论学院 T6『最优下注尺度』——那一章把 1/3 池到超池的每一档都换算成 MDF 与诈唬密度，本课的 70%-80% 高频小注正是其中的 1/3 池档。',
    data: { theoryLevelId: 't6hu', theoryChapterId: 't6hu-sizing-optimal' },
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：同样的胜率在不同牌面上能兑现成筹码的比例并不相同，见理论学院 T6『权益实现与牌面结构』——湿润连接面之所以要降频，正是因为权益实现率被牌面结构压低了。',
    data: { theoryLevelId: 't6hu', theoryChapterId: 't6hu-equity-realization' },
  },
  {
    type: 'pro-tip',
    content: 'SB C-Bet 决策三问：(1) 牌面击中谁的范围？(2) 我的牌是价值、半诈唬还是纯空气？(3) 翻后 BB 先行动反打时我能否应对？三问走完，有位置的持续下注就从惯性变成结构。',
  },
  {
    type: 'takeaway',
    content:
      'SB 持续下注三句总结：\n先问牌面击中谁的范围，再决定频率与尺度\n干燥高牌面 1/3 池高频（70%-80%，要求 BB 守到 75%），湿润连接面降到 30%-40%\n有位置时的 check 不是示弱，而是给 BB 的 x/r 风险定价后主动收池',
  },
];

export const HEADS_UP_LESSON: Lesson = {
  id: 'l3hu-sb-continuation',
  level: 3,
  order: 2,
  title: 'SB 持续下注',
  subtitle: '单挑 SB 翻后延续下注的尺度、频率与范围',
  duration: '7 min',
  objectives: [
    '说明单挑 SB 翻后最后行动（IP）的 C-Bet 纪律（用范围与尺度让宽范围 BB 弃牌或付费，而非「代表强牌」）',
    '判断干燥高牌面（SB 范围优势 → 高频小注）与湿润连接面（BB 坚果优势 → 降频控池）的频率差异',
    '判断 BB 的 check 语义（OOP 方保留 x/r 杠杆、把决策权交给 IP），并区分它与示弱的差异',
  ],
  variant: 'heads-up',
  variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante', stackDepth: 100 },
  content: [...L3HU_SB_U1_SECTIONS, ...L3HU_SB_U2_SECTIONS, ...L3HU_SB_U3_SECTIONS],
  quiz: [],
  examples: [
    {
      id: 'l3hu-sb-continuation-ex1',
      title: 'SB 干燥面的高频 C-Bet',
      heroHand: ['Qd', 'Jd'],
      heroPosition: 'SB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
      ],
      board: ['Qc', '8h', '3s'],
      street: 'flop',
      effectiveStack: 95,
      potSize: 4,
      correctDecision: {
        action: 'Bet',
        amount: '1.3BB（1/3 pot）',
        reasoning: [
          'QJ 在 Q-8-3 干燥面是顶对，范围优势在 SB',
          '1/3 池小注薄价值 + 让 BB 宽范围弱牌弃牌',
          '翻后你最后行动，翻前主动权与位置共同支持持续施压',
        ],
      },
      commonMistake: {
        action: 'Check',
        reasoning: '干燥面顶对是 SB 范围的标准 C-Bet 牌，check 让 BB 廉价实现弱范围，浪费范围优势。',
        evLoss: '-1.0 BB/100',
      },
    },
    {
      id: 'l3hu-sb-continuation-ex2',
      title: '湿润连接面的超对：2/3 池保护权益',
      heroHand: ['Ah', 'Ad'],
      heroPosition: 'SB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
      ],
      board: ['Ts', '9s', '7d'],
      street: 'flop',
      effectiveStack: 98,
      potSize: 4,
      correctDecision: {
        action: 'Bet',
        amount: '2.7BB（2/3 pot）',
        reasoning: [
          'T-9-7 两花是湿润连接面，BB 防守范围里大量 8x、Jx 与同花/顺子听牌全部活了回来',
          'AA 仍是超对，但每条街都可能被反超：2/3 池下注让 8 张顺子 outs 与 9 张同花 outs 付费',
          '被跟注后转牌遇到空白牌仍可继续施压；被加注时你持有最顶端的超对，有明确的继续标准',
        ],
      },
      commonMistake: {
        action: 'Bet 1.3BB（1/3 pot）',
        reasoning:
          '湿润面照搬干燥面的 1/3 池小注，等于用最便宜的价格让 BB 的听牌买到转牌，超对被反超的概率被自己放大。',
        evLoss: '-0.6 BB/100',
      },
    },
    {
      id: 'l3hu-sb-continuation-ex3',
      title: '被过牌加注后：用底池赔率定价',
      heroHand: ['As', 'Ks'],
      heroPosition: 'SB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 2.7BB（2/3 pot）' },
        { player: 'BB', action: 'check-raise to 9BB' },
      ],
      board: ['9h', '8h', '6c'],
      street: 'flop',
      effectiveStack: 95.3,
      potSize: 15.7,
      correctDecision: {
        action: 'Fold',
        reasoning: [
          '湿润连接面本就是 BB 的坚果优势区，被过牌加注后它的范围进一步两极化为顺子、两对与强听牌',
          '底池赔率：翻前底池 4 + SB 下注 2.7 + BB 的 9 = 15.7BB，SB 需再跟 6.3BB，6.3 ÷ (15.7 + 6.3) ≈ 28.6%',
          'AK 只有两张高牌 6 outs，两街成对概率约 24%（1 − 41/47 × 40/46），低于 28.6% 的跟注线，弃牌',
        ],
      },
      commonMistake: {
        action: 'Call',
        reasoning:
          '用约 24% 的权益去跟 28.6% 的赔率，等于在对手的坚果优势区里继续放大底池，长期亏损。',
        evLoss: '-0.9 BB/100',
      },
    },
  ],
  practice: {
    id: 'l3hu-sb-continuation-practice',
    questions: [
      {
        id: 'l3hu-sb-continuation-p1',
        difficulty: 'beginner',
        scenario: {
          heroHand: ['Ad', 'Jd'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['Qc', '7h', '2s'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Check', isCorrect: false, explanation: 'AJ 高牌在干燥面有下注价值，check 太被动。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
          { action: 'Bet 1.3BB（1/3 pot）', isCorrect: true, explanation: '干燥 Q 高面，AJ 有高牌 + 后门改进空间，1/3 池持续施压。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'All-in', isCorrect: false, explanation: 'AJ 高牌 All-in 过度，深筹码应用小注施压。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
        ],
        relatedLessonId: 'l3hu-sb-continuation',
      },
      {
        id: 'l3hu-sb-continuation-p2',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['Kh', 'Kc'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['9h', '8s', '6c'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，湿润连接面' },
        },
        options: [
          { action: 'Bet 1.3BB（1/3 pot）', isCorrect: false, explanation: '湿润面 BB 坚果优势，超对需大注保护而非小注。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          { action: 'Bet 2.7BB（2/3 pot）', isCorrect: true, explanation: '湿润连接面超对领先但易被反超，2/3 池大注保护权益并让听牌付费。', evImpact: '+1.2 BB/100', evLoss: 0 },
          { action: 'Check-Fold', isCorrect: false, explanation: '超对在湿润面仍是强牌，fold 太弱。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
        ],
        relatedLessonId: 'l3hu-sb-continuation',
      },
      {
        id: 'l3hu-sb-continuation-p3',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['7d', '6d'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['9h', '5s', '4c'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Check-Fold', isCorrect: false, explanation: '76 在 9-5-4 面有卡顺（听 8）+ 后门同花，fold 太弱。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Bet 1.3BB（1/3 pot）', isCorrect: true, explanation: '76 有顺子听牌，1/3 池半诈唬持续施压，湿润面适合保护权益。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，1/3 池半诈唬即可建立优势。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
        ],
        relatedLessonId: 'l3hu-sb-continuation',
      },
      {
        id: 'l3hu-sb-continuation-p4',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['Ac', '4c'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
            { player: 'BB', action: 'check' },
          ],
          board: ['9h', '8h', '6c'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 98,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，湿润连接面' },
        },
        options: [
          { action: 'Bet 1.3BB（1/3 pot）', isCorrect: false, explanation: '9-8-6 两花面是 BB 的坚果优势区，A4 只有 A 高 + 后门花，1/3 池拿不到弃牌率。', evImpact: '-0.6 BB/100', evLoss: 0.6 },
          { action: 'Check', isCorrect: true, explanation: '湿润连接面降频：这手牌没有对子、没有单街顺子听牌，check 控池把下注留给有权益的牌，同时保留被 x/r 时的弃牌空间。', evImpact: '+0.4 BB/100', evLoss: 0 },
          { action: 'All-in', isCorrect: false, explanation: '用零成牌能力的 A 高全下是纯送筹码——BB 的顺子与同花听牌全部乐意跟注。', evImpact: '-2.0 BB/100', evLoss: 2 },
        ],
        relatedLessonId: 'l3hu-sb-continuation',
      },
    ],
  },
  units: [
    {
      id: 'u1',
      title: '有位置的 C-Bet 纪律',
      sections: L3HU_SB_U1_SECTIONS,
      exampleId: 'l3hu-sb-continuation-ex1',
    },
    {
      id: 'u2',
      title: '尺度与范围：何时继续、何时 check',
      sections: L3HU_SB_U2_SECTIONS,
      exampleId: 'l3hu-sb-continuation-ex2',
    },
    {
      id: 'u3',
      title: '理论支撑与收手纪律',
      sections: L3HU_SB_U3_SECTIONS,
      exampleId: 'l3hu-sb-continuation-ex3',
    },
  ],
};
