import type { Lesson } from '../../../../../types';

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
  variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
  content: [
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
      type: 'highlight',
      content: '反直觉点：有位置的 C-Bet 不等于"主动权的宣告"。你最后行动，check 就不是示弱，而是主动收池、消化 BB 翻后先行动透露的信息。x/r 杠杆真正握在 OOP 的 BB 手里——SB 混合 check 恰恰是为了让自己的高频 C-Bet 更难被反打，这才是单挑 SB 的成熟打法。',
    },
    {
      type: 'pro-tip',
      content: 'SB C-Bet 决策三问：(1) 牌面击中谁的范围？(2) 我的牌是价值、半诈唬还是纯空气？(3) 翻后 BB 先行动反打时我能否应对？三问走完，有位置的持续下注就从惯性变成结构。',
    },
  ],
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
    ],
  },
};
