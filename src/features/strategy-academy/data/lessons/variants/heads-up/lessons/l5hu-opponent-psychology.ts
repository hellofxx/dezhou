import type { Lesson } from '../../../../../types';

export const HEADS_UP_LESSON: Lesson = {
  id: 'l5hu-opponent-psychology',
  level: 5,
  order: 2,
  title: '对手心理',
  subtitle: '单挑心理博弈：下注节奏、反应时间与行为模式解读',
  duration: '8 min',
  objectives: [
    '区分单挑读人的两类信号（行为模式与实时信号），并说明读人是估范围 + 估情绪而非猜手牌',
    '判断「下注过快」「思考太久」的多义解读，并说明样本不足时须与跨 50-100 手的频率统计交叉验证',
    '运用反读取练习（动作不泄露范围：节奏一致或刻意打乱），判断「强牌快、弱牌慢」的暴露模式',
    '说明读取的可持续态度（承认「60% 把握」这类不确定性并折入胜率与赔率计算）',
  ],
  variant: 'heads-up',
  variantContext: { anteStructure: 'sb_ante' },
  content: [
    { type: 'heading', content: '单挑：读人的战场' },
    {
      type: 'text',
      content:
        '单挑只面对一个对手，读人的价值被无限放大——你无需兼顾多桌的多重形象，只需吃透眼前这一位。对手心理（Reading）分为两类：行为模式（下注尺度、跟注倾向、tilt 倾向）与实时信号（下注节奏、反应时间）。单挑中这两者结合，帮助你推断对手的范围与情绪状态。',
    },
    {
      type: 'key-point',
      content: '读人不是猜手牌，是估范围 + 估情绪。对手"跟注过快"可能表示边缘牌或强牌，"思考太久"可能表示艰难决策或演戏。把观察转化为概率，而非确定性。',
    },
    { type: 'heading', content: '下注节奏与反应时间的解读' },
    {
      type: 'text',
      content:
        '单挑中下注节奏与反应时间是重要信号（尤其线上）。常见解读：下注过快 = 可能强牌（急于价值）或弱牌（不想多想）；思考太久 = 艰难决策（边缘牌/听牌）或演戏；跟注犹豫 = 边缘牌。但样本不足时这些信号不可靠——必须与跨 50-100 手的频率统计交叉验证，单独一次节奏不作数。',
    },
    {
      type: 'example',
      content:
        '实例：单挑对手转牌面对你的下注思考了 20 秒才跟注。频率读取：思考时间长 = 艰难决策，可能边缘牌（跟注站特征）或听牌。但样本不足时可能是演戏。正确做法是交叉验证：他面对大注的跟注倾向、他河牌的摊牌选择，综合判断而非单独依赖一次节奏。',
    },
    {
      type: 'example',
      content:
        '实例二（反读取）：你持 AA，翻牌下注时注意自己的节奏。若你因为"有强牌"下注飞快、又因"在诈唬"下注犹豫，对手会很快破解。反读取练习：规定所有下注用相同思考时间，或关键时刻刻意打乱节奏（强牌也犹豫、诈唬也果断）。你在读对手，对手也在读你。',
    },
    {
      type: 'highlight',
      content: '反直觉点：读取的敌人不是"读错"，而是"过度自信"。单挑高手会承认"这个读取只有 60% 把握"并据此下注，而不是"我确定他有什么"。把读取转化为概率而非确定性，才是可持续的策略。',
    },
    {
      type: 'pro-tip',
      content: '读取纪律：(1) 只用统计显著的频率（50+ 手样本）下结论；(2) 结合下注节奏与频率交叉验证；(3) 承认读取的不确定性，把它折入胜率与赔率计算。三件事做完，读取就从玄学变成数学。',
    },
  ],
  quiz: [],
  examples: [
    {
      id: 'l5hu-opponent-psychology-ex1',
      title: '结合节奏与频率的读取',
      heroHand: ['Kc', 'Qc'],
      heroPosition: 'SB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
      ],
      board: ['Kd', '8h', '3c'],
      street: 'flop',
      effectiveStack: 95,
      potSize: 4,
      correctDecision: {
        action: 'Bet',
        amount: '1.3BB（1/3 pot）',
        reasoning: [
          'KQ 在 K-8-3 干燥面是顶对',
          'BB 面对 C-Bet 弃牌率 50%（跨 60 手统计）',
          '结合 BB 的跟注倾向交叉验证后，1/3 池薄价值',
        ],
      },
      commonMistake: {
        action: '只凭 BB 某次思考慢就判定他弱',
        reasoning: '单次节奏信号不可靠，应结合跨 60 手统计的弃牌率交叉验证，而非单独依赖一次反应时间。',
        evLoss: '-1.0 BB/100',
      },
    },
  ],
  practice: {
    id: 'l5hu-opponent-psychology-practice',
    questions: [
      {
        id: 'l5hu-opponent-psychology-p1',
        difficulty: 'beginner',
        scenario: {
          heroHand: ['Ad', 'Qd'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: '3-bet to 6BB' },
            { player: 'SB', action: 'call' },
          ],
          board: ['Qh', '8c', '3s'],
          street: 'flop',
          potSize: 12,
          effectiveStack: 90,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'AQ 顶对顶踢脚，3-bet 底池主动小注薄价值。', evImpact: '+1.5 BB/100', evLoss: 0 },
          { action: 'Check', isCorrect: false, explanation: '顶对顶踢脚应下注，check 太被动。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'All-in', isCorrect: false, explanation: '干燥面顶对 All-in 过度，小注即可。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
        ],
        relatedLessonId: 'l5hu-opponent-psychology',
      },
      {
        id: 'l5hu-opponent-psychology-p2',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['Js', 'Ts'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['Th', '7c', '2d'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 面对 x/r 弃牌率高' },
        },
        options: [
          { action: 'Check-Call', isCorrect: true, explanation: 'JT 顶对，结合 SB 弃牌率高可考虑 x/r，但顶对跟注控池也合理。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'Check-Raise', isCorrect: false, explanation: '顶对 x/r 赶走弱牌，干燥面应跟注控池。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
          { action: 'Fold', isCorrect: false, explanation: 'JT 顶对是强牌，fold 太弱。', evImpact: '-2.0 BB/100', evLoss: 2 },
        ],
        relatedLessonId: 'l5hu-opponent-psychology',
      },
      {
        id: 'l5hu-opponent-psychology-p3',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['9c', '8c'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['Jd', '8h', '5c'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 下注节奏反常' },
        },
        options: [
          { action: 'Check-Call', isCorrect: true, explanation: '98 中对（88），跟注控池，结合 SB 节奏反常保持谨慎。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'Check-Raise', isCorrect: false, explanation: '中对牌力不足以 x/r，跟注更合理。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          { action: 'Fold', isCorrect: false, explanation: '中有对子有改进空间，fold 太弱。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
        ],
        relatedLessonId: 'l5hu-opponent-psychology',
      },
    ],
  },
};
