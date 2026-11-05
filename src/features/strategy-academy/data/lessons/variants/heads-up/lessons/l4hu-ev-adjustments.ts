import type { Lesson, LessonSection } from '../../../../../types';

// ===== l4hu-ev-adjustments 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L4HU_EV_U1_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '两人底池：EV 计算的简化与放大' },
  {
    type: 'text',
    content:
      '单挑只有两人底池，EV 计算比满员桌简单，但数值意义被放大。简化在于：没有多人分摊、没有"某张 Outs 给另一个对手送同花"的稀释，你的胜率更接近"对单一范围的胜率"。放大在于：死钱占比高（SB 0.5）、对手范围宽，同样的 EV 差异在单挑中被高频重复，累积成更大的长期收益。理解这两个变化，是单挑 EV 调整的核心。',
  },
  {
    type: 'key-point',
    content: '单挑 EV 的核心公式不变，但输入更清晰：EV(call) = E×(P+B) − (1−E)×B。差别在"对手范围更宽、死钱占比更高"，让更多边缘牌跟注变成 +EV。',
  },
];

const L4HU_EV_U2_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '翻前偷盲 EV 与翻后位置 EV' },
  {
    type: 'formula',
    content:
      '翻前偷盲 EV（SB min-raise 到 2BB，BB 弃牌率 f，以弃牌为基准）：\nEV(steal) = f×1.5 − (1−f)×1.5（保本 f = 50%）\n\n翻后位置 EV 锚点：\n单挑位置价值约 0.5-1BB/手（SB 每手翻后 IP）\n\n实例：BB 面对 SB min-raise（SB 总投入 2BB，BB 已投 1BB）：\n通式：所需胜率 = 跟注额 ÷（当前底池 + 对手下注 + 跟注额）\n代入：1 ÷ (1.5 + 1.5 + 1) = 1 ÷ 4 = 25%\n（当前底池 1.5 = SB 0.5 + BB 自己已投的 1，这 1BB 是死钱但仍在分母里，不可漏算；对手下注 1.5 = SB 补到 2BB 的加注额；跟注额 1 = BB 需补的差额。等价于跟注后总底池 4BB，1÷4=25%）\nBB 面对 SB 约 80% 开池范围，边缘牌胜率常超 40% → 跟注 +EV\n\n翻后同式复用（下注前底池 P、对手下注 b）：\n半池（P=4、b=2）：2 ÷ (4 + 2 + 2) = 25%\n1/3 池（P=6、b=2）：2 ÷ (6 + 2 + 2) = 20%\n满池（P=4、b=4）：4 ÷ (4 + 4 + 4) = 33.3%\n\nEV(call) 对照：E×(P+B) − (1−E)×B\nE=30%、P=4、B=2 → 0.30×6 − 0.70×2 = 1.8 − 1.4 = +0.4BB',
  },
  {
    type: 'text',
    content:
      '单挑 EV 调整的实践含义：面对 SB 的宽范围，BB 的跟注门槛大幅降低。满员桌面对 UTG 范围 15% 时 40% 的跟注线，在单挑面对 SB 范围 80% 时降到 25%（再跟 1BB ÷ 跟注后总底池 4BB），且对手范围宽到约 80% 时，边缘牌的现实胜率本身就更高。这就是为什么单挑 BB 能防守 60%+——不是"宽松"，而是"EV 计算的结果"。',
  },
  {
    type: 'example',
    content:
      '实例：单挑盲注 0.5/1，翻前 SB min-raise 2BB，你（BB）持 K♠7♠。跟注 1BB，跟注后总底池 = SB 2 + BB 已投 1 + 你的跟注 1 = 4BB，所需胜率 = 1 ÷ 4 = 25%。K7s 对 SB 约 80% 的开池范围胜率约 48%，富余约 23 个百分点。翻后你先过牌、以 check-call 为主：出 K 可薄价值、出同花/顺子可便宜追、完全 miss 可放弃。跟注的 EV 为正——满员桌 K7s 面对 UTG 是弃牌，但单挑面对 SB 宽范围是 +EV 跟注。',
  },
  {
    type: 'example',
    content:
      '实例二（翻后 EV 决策）：翻牌底池 4BB，你（BB）先行动，SB 下注 2BB（半池）。你跟注所需胜率 = 2 ÷ (4 + 2 + 2) = 25%。你的 76 在 9♠8♦3♣ 面有双卡顺 + 后门同花，约 8 个 Outs 单街 17%——单看不足 25%，但加隐含赔率（中顺后能再赢 2.5BB）跟注转 +EV。单挑听牌跟注更常依赖隐含赔率，因为对手范围宽、支付意愿高。',
  },
];

const L4HU_EV_U3_SECTIONS: LessonSection[] = [
  {
    type: 'highlight',
    content:
      '反直觉点：单挑中"小牌"不是废牌。9-high 在单挑翻后仍可赢牌——对手跟注范围极宽，9-high 的摊牌价值远超满员桌。同样的底池赔率 25%，单挑中 9-high 可能在 40%+ 时机领先，满员桌只有 15%-20%。',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：EV 的 fold / call / raise 三分支比较与位置价值量化，见理论学院 T2『期望值优化』——本课把那条框架搬进两人底池，用死钱占比与对手范围宽度重新标定输入。',
    data: { theoryLevelId: 't2hu', theoryChapterId: 't2hu-ev' },
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：翻后位置劣势方的风险定价与隐含赔率变化，见理论学院 T2『风险评估』——单挑听牌之所以更依赖隐含赔率，正是因为宽范围把单街权益压得很低。',
    data: { theoryLevelId: 't2hu', theoryChapterId: 't2hu-risk' },
  },
  {
    type: 'pro-tip',
    content:
      '单挑 EV 速算锚点：半池下注所需胜率 25%、1/3 池 20%、满池 33.3%；limp 看翻牌 25%、开池跟注 3BB 33.3%。背熟这些数字，牌桌上比数更快。',
  },
  {
    type: 'takeaway',
    content:
      '单挑 EV 三句总结：\n跟注线 = 跟注额 ÷ 跟注后总底池，分母必须含自己已投的死钱（min-raise 1 ÷ 4 = 25%）\n尺度决定门槛：半池 25%、1/3 池 20%、满池 33.3%，背熟三档比现场算快\n位置价值的 0.5-1BB/手 是统计期望差、属于持有 IP 的一方，不是单手保证',
  },
];

export const HEADS_UP_LESSON: Lesson = {
  id: 'l4hu-ev-adjustments',
  level: 4,
  order: 2,
  title: 'EV 调整',
  subtitle: '单挑两人底池的 EV 计算差异与决策简化',
  duration: '8 min',
  objectives: [
    '用所需胜率 = 跟注额 ÷（当前底池 + 对手下注 + 跟注额）计算 BB 面对 SB min-raise 的跟注线（1÷4 = 25%），并说出分母必须含 BB 已入池的死钱',
    '说明单挑 EV 的三个放大因素（无多人稀释、死钱占比高、对手范围宽），并判断更多边缘牌跟注转 +EV 的原因',
    '判断单挑听牌跟注依赖隐含赔率的机制（对手范围宽、支付意愿高），并给出半池 25%、1/3 池 20%、满池 33.3% 的速算锚点',
    '区分位置价值的统计期望语义（SB 每手约多 0.5-1BB 长期期望，而非单手保证）',
  ],
  variant: 'heads-up',
  variantContext: { anteStructure: 'sb_ante', stackDepth: 100 },
  content: [...L4HU_EV_U1_SECTIONS, ...L4HU_EV_U2_SECTIONS, ...L4HU_EV_U3_SECTIONS],
  quiz: [],
  examples: [
    {
      id: 'l4hu-ev-adjustments-ex1',
      title: 'BB 面对 SB 宽开池的边缘 EV 跟注',
      heroHand: ['Qd', '6d'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
      ],
      street: 'preflop',
      effectiveStack: 100,
      potSize: 3,
      correctDecision: {
        action: 'Call',
        amount: '1BB',
        reasoning: [
          'Q6s 面对 SB 约 80% 开池范围胜率约 45%',
          '跟注 1BB 进入 4BB 总底池（SB 2 + BB 1 + 跟注 1），所需胜率 = 1÷4 = 25%，富余约 20 个百分点',
          'BB 翻前最后做决定、已投死钱带来赔率，边缘牌也可盈利防守',
        ],
      },
      commonMistake: {
        action: 'Fold（"Q6s 太弱"）',
        reasoning: '单挑面对 SB 宽范围，Q6s 的 +EV 跟注被满员桌记忆掩盖。BB 翻前最后做决定与底池赔率让边缘牌可防守。',
        evLoss: '-1.0 BB/100',
      },
    },
    {
      id: 'l4hu-ev-adjustments-ex2',
      title: '翻牌同花听牌：两街权益高于半池跟注线',
      heroHand: ['Ks', 'Qs'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 2BB（1/2 pot）' },
      ],
      board: ['Js', '7s', '2h'],
      street: 'flop',
      effectiveStack: 98,
      potSize: 6,
      correctDecision: {
        action: 'Call',
        amount: '2BB',
        reasoning: [
          '所需胜率 = 2 ÷ (4 + 2 + 2) = 25%，跟注后总底池 8BB',
          'K♠Q♠ 在 J♠7♠2♥ 面有同花听牌 9 个 Outs：两街成花概率 1 − (38/47)×(37/46) ≈ 35%，高于 25%',
          '再加两张高牌与后门顺子，隐含赔率让跟注的长期期望更明确',
        ],
      },
      commonMistake: {
        action: 'Fold（"单街 19% 不到 25%"）',
        reasoning:
          '单街 9/47 ≈ 19% 只是把两街权益砍掉一半的算法；翻牌跟注买的正是转牌与河牌两次机会，用单街数字否定跟注会系统性弃掉 +EV 的听牌。',
        evLoss: '-0.8 BB/100',
      },
    },
    {
      id: 'l4hu-ev-adjustments-ex3',
      title: '面对 2.5BB 开池：跟注线从 25% 抬到 30%',
      heroHand: ['Td', '8d'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2.5BB' },
      ],
      street: 'preflop',
      effectiveStack: 100,
      potSize: 3.5,
      correctDecision: {
        action: 'Call',
        amount: '1.5BB',
        reasoning: [
          '所需胜率 = 1.5 ÷ (1.5 + 2 + 1.5) = 1.5 ÷ 5 = 30%（跟注后总底池 5BB）',
          'T8s 面对 SB 约 80% 开池范围胜率约 42%，仍富余约 12 个百分点',
          '尺度从 2BB 升到 2.5BB 只把跟注线从 25% 抬到 30%，远低于同花连张的现实胜率',
        ],
      },
      commonMistake: {
        action: 'Fold（"2.5BB 太贵了"）',
        reasoning:
          '把"开池尺度变大"误当成"牌价翻倍"：真实价格只是 1.5 ÷ 5 = 30%，而同花连张胜率 42%，弃牌等于把正期望让给对手。',
        evLoss: '-0.7 BB/100',
      },
    },
  ],
  practice: {
    id: 'l4hu-ev-adjustments-practice',
    questions: [
      {
        id: 'l4hu-ev-adjustments-p1',
        difficulty: 'beginner',
        scenario: {
          heroHand: ['Jh', '8h'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
          ],
          street: 'preflop',
          potSize: 3,
          effectiveStack: 100,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Fold', isCorrect: false, explanation: 'J8s 面对 SB 宽范围可玩性好，fold 太紧。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Call', isCorrect: true, explanation: 'J8s 同花连张跟注便宜、可玩性好，跟注 EV 为正。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: '3-bet', isCorrect: false, explanation: 'J8s 偏投机，3-bet 太激进，跟注即可。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
        ],
        relatedLessonId: 'l4hu-ev-adjustments',
      },
      {
        id: 'l4hu-ev-adjustments-p2',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['7d', '6d'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['9h', '8c', '3s'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Fold', isCorrect: false, explanation: '76 有双卡顺 + 后门同花，fold 太弱。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Call', isCorrect: true, explanation: '跟注 2BB 需 25%，双卡顺 8 个 Outs 单街 17% + 隐含赔率，跟注转 +EV。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，跟注利用隐含赔率即可。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
        ],
        relatedLessonId: 'l4hu-ev-adjustments',
      },
      {
        id: 'l4hu-ev-adjustments-p3',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['Ad', '5d'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['Qd', '9d', '2c'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Check', isCorrect: false, explanation: 'A5 同花听牌 9 个 Outs，应积极下注而非 check。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
          { action: 'Bet 2BB（半池）', isCorrect: true, explanation: '坚果同花听牌 + A 高，半池半诈唬让听牌付费 + 建立底池。', evImpact: '+1.5 BB/100', evLoss: 0 },
          { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，半池建立优势即可。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
        ],
        relatedLessonId: 'l4hu-ev-adjustments',
      },
      {
        id: 'l4hu-ev-adjustments-p4',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['Qc', 'Jc'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
            { player: 'BB', action: 'check' },
            { player: 'SB', action: 'bet 2BB（1/3 pot）' },
          ],
          board: ['Qh', '7d', '3s'],
          street: 'flop',
          potSize: 8,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 用 1/3 池持续下注' },
        },
        options: [
          { action: 'Fold（"半池要 25%，1/3 池差不多"）', isCorrect: false, explanation: '1/3 池的跟注线是 20%（2 ÷ 10）；把半池的 25% 当成通用线，会系统性弃掉顶对这一档 +EV 跟注。', evImpact: '-1.4 BB/100', evLoss: 1.4 },
          { action: 'Call', isCorrect: true, explanation: '所需胜率 = 2 ÷ (6 + 2 + 2) = 20%，QJ 顶对好踢脚远超这条线，跟注是明确的正期望。', evImpact: '+1.5 BB/100', evLoss: 0 },
          { action: 'Raise to 8BB', isCorrect: false, explanation: '干燥面用顶对加注只会赶走更差的牌、留下更强的牌，把薄价值变成反向隐含赔率。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
        ],
        relatedLessonId: 'l4hu-ev-adjustments',
      },
    ],
  },
  units: [
    {
      id: 'u1',
      title: '两人底池的 EV 放大效应',
      sections: L4HU_EV_U1_SECTIONS,
      exampleId: 'l4hu-ev-adjustments-ex1',
    },
    {
      id: 'u2',
      title: '跟注线与尺度换算',
      sections: L4HU_EV_U2_SECTIONS,
      exampleId: 'l4hu-ev-adjustments-ex2',
    },
    {
      id: 'u3',
      title: '理论支撑与速算锚点',
      sections: L4HU_EV_U3_SECTIONS,
      exampleId: 'l4hu-ev-adjustments-ex3',
    },
  ],
};
