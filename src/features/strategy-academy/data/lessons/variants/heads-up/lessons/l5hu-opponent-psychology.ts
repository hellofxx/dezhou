import type { Lesson, LessonSection } from '../../../../../types';

// ===== l5hu-opponent-psychology 分段常量（引用相等契约：content 与 units.sections 共享同一批对象） =====
const L5HU_OPP_U1_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '单挑：读人的战场' },
  {
    type: 'text',
    content:
      '单挑只面对一个对手，读人的价值被无限放大——你无需兼顾多桌的多重形象，只需吃透眼前这一位。对手心理（Reading）分为两类：行为模式（下注尺度、跟注倾向、tilt 倾向）与实时信号（下注节奏、反应时间）。单挑中这两者结合，帮助你推断对手的范围与情绪状态。',
  },
  {
    type: 'key-point',
    content:
      '读人不是猜手牌，是估范围 + 估情绪。对手"跟注过快"可能表示边缘牌或强牌，"思考太久"可能表示艰难决策或演戏。把观察转化为概率，而非确定性。',
  },
];

const L5HU_OPP_U2_SECTIONS: LessonSection[] = [
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
];

const L5HU_OPP_U3_SECTIONS: LessonSection[] = [
  {
    type: 'highlight',
    content:
      '反直觉点：读取的敌人不是"读错"，而是"过度自信"。单挑高手会承认"这个读取只有 60% 把握"并据此下注，而不是"我确定他有什么"。把读取转化为概率而非确定性，才是可持续的策略。',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：逐街收窄范围与挡牌过滤的完整流程见理论学院 T7『单挑读牌流程』——先按翻前行动划出起点范围，再用每条街的动作做贝叶斯式收窄，最后用挡牌删掉不可能的强牌组合；本课把它压缩成"读人是估范围"这一句，完整流程在那一章逐街走一遍。',
    data: { theoryLevelId: 't7hu', theoryChapterId: 't7hu-hand-reading' },
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：观察与反观察的技巧见理论学院 T8『心理读取』——那一章把"我读他"和"他读我"放在同一张表上，说明单方面的读取为什么会被对手的反读取抵消，以及节奏一致为什么是反读取里成本最低的方案。',
    data: { theoryLevelId: 't8hu', theoryChapterId: 't8hu-reads' },
  },
  {
    type: 'pro-tip',
    content:
      '读取纪律：(1) 只用统计显著的频率（50+ 手样本）下结论；(2) 结合下注节奏与频率交叉验证；(3) 承认读取的不确定性，把它折入胜率与赔率计算。三件事做完，读取就从玄学变成数学。',
  },
  {
    type: 'takeaway',
    content:
      '读取三句总结：\n读人是估范围 + 估情绪，把观察写成概率（"他约 45% 在诈唬"）而不是结论（"他在诈唬"）\n单次节奏不可靠：按每小时约 200 手算，凑够 50 手样本只要约 15 分钟——先攒样本再下结论\n反读取的代价是放弃节奏带来的即时信息优势，换来长期不可被读取，两笔账要一起算',
  },
];

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
  content: [...L5HU_OPP_U1_SECTIONS, ...L5HU_OPP_U2_SECTIONS, ...L5HU_OPP_U3_SECTIONS],
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
    {
      id: 'l5hu-opponent-psychology-ex2',
      title: '河牌抓诈：频率读取压过单次节奏',
      heroHand: ['Ad', '6d'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 5BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 9BB（1/2 pot）' },
      ],
      board: ['Kc', '9h', '4s', '2d', 'Qc'],
      street: 'river',
      effectiveStack: 91,
      potSize: 27,
      correctDecision: {
        action: 'Call',
        amount: '9BB',
        reasoning: [
          '底池 18BB、对手河牌下注 9BB：跟注所需胜率 = 9 ÷ (18 + 9 + 9) = 25%',
          '跨 120 手统计并核对摊牌后，这一档半池尺度下他的河牌下注约 45% 是诈唬——45% 高于 25% 的门槛',
          'EV(跟注) = 0.45 × 27 − 0.55 × 9 = +7.2BB；若读取偏差到 20% 立刻翻成 0.20 × 27 − 0.80 × 9 = −1.8BB，说明这个跟注吃的是频率不是感觉',
        ],
      },
      commonMistake: {
        action: 'Fold（"他下注节奏很果断，一定是价值"）',
        reasoning:
          '单次节奏是弱信号：果断既可能是价值也可能是"早就决定好的诈唬"。用它覆盖掉 120 手的频率统计，等于把可验证的证据换成一次印象。',
        evLoss: '-1.5 BB/100',
      },
    },
    {
      id: 'l5hu-opponent-psychology-ex3',
      title: '频率读取驱动的转牌过牌加注',
      heroHand: ['Qc', 'Jc'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 4BB（1/2 pot）' },
      ],
      board: ['9c', '5c', '2d', 'Th'],
      street: 'turn',
      effectiveStack: 96,
      potSize: 12,
      correctDecision: {
        action: 'Check-Raise',
        amount: '12BB',
        reasoning: [
          '跨 80 手统计：这一档对手面对 x/r 弃牌约 55%，且他连续两条街都用半池小尺度，属于可压制的宽下注档',
          'x/r 到 12BB 的保本弃牌率 f ≥ 12 ÷ (12 + 12) = 50%，读取给出的 55% 已过线',
          '15 outs（同花 9 + 顺子 8 − 重叠的 8♣/K♣ 共 2 张），单街约 15 ÷ 46 ≈ 33%，被跟注也仍有后路',
        ],
      },
      commonMistake: {
        action: 'Check-Call（4BB）',
        reasoning:
          '只用 4BB 跟注把 55% 的弃牌率白白丢掉：对手每弃牌一次你就少收 12BB 的底池，而 15 outs 的强听牌本可以承担被跟注的风险。',
        evLoss: '-1.2 BB/100',
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
      {
        id: 'l5hu-opponent-psychology-p4',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['As', 'Qs'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
            { player: 'BB', action: 'check' },
            { player: 'SB', action: 'bet 2BB' },
            { player: 'BB', action: 'check-raise to 7BB' },
          ],
          board: ['Qd', '7h', '2c'],
          street: 'flop',
          potSize: 13,
          effectiveStack: 94,
          gameContext: {
            gameType: 'cash',
            tableDescription: 'HU 现金桌，上一手摊牌时看到对手用 7-5 在类似牌面 x/r 诈唬',
          },
        },
        options: [
          { action: 'Call 5BB，把上一手的亮牌当作待验证假设', isCorrect: true, explanation: '跟注所需胜率 = 5 ÷ (13 + 5) ≈ 27.8%；AQ 顶对顶踢脚远超这条线。单手亮牌只能提出假设（"他可能高频 x/r 诈唬"），要 50-100 手样本才能改成结论，此前按基线继续。', evImpact: '+1.5 BB/100', evLoss: 0 },
          { action: 'All-in 94BB，因为他刚刚用 7-5 诈唬过', isCorrect: false, explanation: '把一次观察外推成频率，是读取里最常见的过度自信。全下只会让价值组合跟注、把诈唬打跑，等于用一手证据赌掉整叠筹码。', evImpact: '-3.5 BB/100', evLoss: 3.5 },
          { action: 'Fold，顶对顶踢脚面对 x/r 一定落后', isCorrect: false, explanation: '干燥面 Q-7-2 上 AQ 顶对顶踢脚远未到弃牌档；面对 x/r 直接弃牌等于把对手的每一次诈唬都送成收益。', evImpact: '-2.0 BB/100', evLoss: 2 },
        ],
        relatedLessonId: 'l5hu-opponent-psychology',
      },
    ],
  },
  units: [
    { id: 'u1', title: '单挑读人的两类信号', sections: L5HU_OPP_U1_SECTIONS, exampleId: 'l5hu-opponent-psychology-ex1' },
    { id: 'u2', title: '节奏与反应时间的解读', sections: L5HU_OPP_U2_SECTIONS, exampleId: 'l5hu-opponent-psychology-ex2' },
    { id: 'u3', title: '理论支撑与读取纪律', sections: L5HU_OPP_U3_SECTIONS, exampleId: 'l5hu-opponent-psychology-ex3' },
  ],
};
