import type { Lesson, LessonSection } from '../../../../../types';

// ===== l4hu-counter-strategies 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L4HU_CTR_U1_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '识别偏离：单挑反制的前提' },
  {
    type: 'text',
    content:
      '单挑反制策略（Counter-Strategy）的核心是：先识别对手偏离均衡的倾向，再用 GTO 基线校准出针对该漏洞的最优应对。常见的单挑偏离有四类：弃牌过多（面对 C-Bet 弃牌率超高）、跟注过松（跟注站）、3-bet 过频、C-Bet 过频。识别依赖跨 50-100 手的频率统计，而非单手牌印象。',
  },
  {
    type: 'key-point',
    content: '反制的正确姿态：方向瞄准对手漏洞（Maximally Exploitative），幅度保持最小（Minimally Exploitative）。每次偏离都打开自己的漏洞，因此幅度要可控、对手调整后及时回基线。',
  },
];

const L4HU_CTR_U2_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '四类偏离的针对性反制' },
  {
    type: 'formula',
    content:
      '针对弃牌过多的对手提高偷盲（SB min-raise 到 2BB，BB 弃牌率 f，以弃牌为基准 1.5/1.5 口径）：\nEV(steal) = f×1.5 − (1−f)×1.5\n\n均衡弃牌率约 40%（f=0.4）→ EV = 0.4×1.5 − 0.6×1.5 = −0.3BB（不盈利，需翻后补）\n若对手弃牌率 60%（f=0.6）→ EV = 0.6×1.5 − 0.4×1.5 = +0.3BB（纯偷盲自动盈利）\n若对手弃牌率 70%（f=0.7）→ EV = 0.7×1.5 − 0.3×1.5 = +0.6BB（利润扩大）\n继续外推：f=0.5 时 EV = 0.5×1.5 − 0.5×1.5 = 0BB（保本）；f=0.8 时 EV = 0.8×1.5 − 0.2×1.5 = +0.9BB\n\n结论：对手弃牌率越高，偷盲频率越应上调，但幅度以"他若修正到 50% 你仍不亏"为限。',
  },
  {
    type: 'text',
    content:
      '四类偏离的反制方向：(1) 弃牌过多 → 提高开池/C-Bet 频率，用更多半诈唬；(2) 跟注过松（跟注站）→ 减少纯诈唬，改用价值下注薄价值（顶对弱踢脚也能下注收钱）；(3) 3-bet 过频 → 收窄开池范围、增加 4Bet 价值；(4) C-Bet 过频 → 提高 x/r 频率与 float。每一类都从"识别 → 反制 → 复核"闭环推进。',
  },
  {
    type: 'example',
    content:
      '实例：你观察到某单挑对手面对 C-Bet 弃牌率高达 60%（均衡约 45%）。这是明确的弃牌过多漏洞。反制：你的翻牌 C-Bet 频率与诈唬密度整体上调，连原本 check 的弱牌也加入下注。幅度的算法是可直接复算的：底池 4BB 下注 1.33BB（1/3 池），弃牌 55% 时 EV = 0.55×4 − 0.45×1.33 = 2.20 − 0.60 ≈ +1.60BB。但仍以"他若收紧到 50% 你仍不亏"为限。这是"以 GTO 为基线、按可观测偏差做有方向、有纪律的偏离"。',
  },
  {
    type: 'example',
    content:
      '实例二（反制跟注站）：对手翻后几乎不弃牌（弃牌率 <25%）。反制：不能用纯诈唬（他不弃），改用价值下注薄价值——顶对弱踢脚也下注收钱，因为他会用更差的牌跟注。同时把诈唬牌转化为半诈唬或过牌。跟注站是单挑最容易榨取的类型，只要你能忍住不诈唬。',
  },
  {
    type: 'example',
    content:
      '实例三（节点锁定实操）：用求解器把"此对手面对转牌二次开火弃牌 55%"锁定为固定频率，重解你的最优应对——求解器会立刻推高你的转牌诈唬频率。这就是让反制从"感觉"变成"计算"的节点锁定。',
  },
];

const L4HU_CTR_U3_SECTIONS: LessonSection[] = [
  {
    type: 'highlight',
    content:
      '反直觉点：反制的最大风险不是"反制得不够"，而是"反制过头"把自己变成漏洞。单挑高手在收割对手漏洞的同时，永远留着一只手握在 GTO 基线的方向盘上——对手一调整，立刻归位。',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：把对手的偏离锁定为固定频率、再重解最优应对的方法，见理论学院 T5『节点锁定与最小偏离』——那一章还给了偏离幅度由正转负的判据，本课所有反制都以它为上限。',
    data: { theoryLevelId: 't5hu', theoryChapterId: 't5hu-node-locking' },
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：从 GTO 基线转向剥削的完整框架、以及"何时必须回基线"的边界，见理论学院 T7『针对性调整』——本课四类反制都只是那一章框架的具体化。',
    data: { theoryLevelId: 't7hu', theoryChapterId: 't7hu-exploit' },
  },
  {
    type: 'pro-tip',
    content:
      '反制执行五步：(1) HUD 收集足够样本确认漏洞；(2) 求解器锁定该节点求最优应对；(3) 对比基线标出被推高的频率与尺度；(4) 实战执行；(5) 每 500 手复核样本是否仍成立。',
  },
  {
    type: 'takeaway',
    content:
      '单挑反制三句总结：\n先统计再反制：跨 50-100 手的弃牌率与 3-bet 率才构成漏洞，单手牌印象是噪声\n每一类偏离都有对应方向，幅度以"对手修正后你仍不亏"为上限（f=0.6 → +0.3BB、f=0.8 → +0.9BB）\n反制过头比反制不足更危险——偏离一开，你自己的漏洞同步打开',
  },
];

export const HEADS_UP_LESSON: Lesson = {
  id: 'l4hu-counter-strategies',
  level: 4,
  order: 4,
  title: '反制策略',
  subtitle: '针对单挑对手常见偏离的 GTO 反制与再调整框架',
  duration: '9 min',
  objectives: [
    '识别四类单挑偏离（弃牌过多、跟注过松、3-bet 过频、C-Bet 过频），并说明识别依赖跨 50-100 手的频率统计',
    '针对弃牌过多的对手推导偷盲 EV 的变化（f=0.6 时 EV ≈ +0.3BB、f=0.7 时 +0.6BB），并判断偏离幅度以「对手修正后你仍不亏」为限',
    '区分四类偏离的对应反制（弃牌多→提开池/C-Bet 频率、跟注松→薄价值减诈唬、3-bet 频→收窄范围+4Bet 价值、C-Bet 频→提高 x/r 与 float）',
    '说明节点锁定（Node Locking）的作用（把对手偏离锁定为固定频率重解最优应对），并判断反制过头的风险',
  ],
  variant: 'heads-up',
  variantContext: { anteStructure: 'sb_ante', stackDepth: 100 },
  content: [...L4HU_CTR_U1_SECTIONS, ...L4HU_CTR_U2_SECTIONS, ...L4HU_CTR_U3_SECTIONS],
  quiz: [],
  examples: [
    {
      id: 'l4hu-counter-strategies-ex1',
      title: '反制弃牌过多的对手',
      heroHand: ['Jc', '8c'],
      heroPosition: 'SB',
      previousActions: [],
      street: 'preflop',
      effectiveStack: 100,
      potSize: 1.5,
      correctDecision: {
        action: 'Min-raise',
        amount: '2BB',
        reasoning: [
          'BB 面对 min-raise 弃牌 65%（偏离均衡 40%）',
          'J8s 面对高频弃牌对手是可开池牌，min-raise 偷盲 EV 上升',
          '反制弃牌过多：提高开池频率',
        ],
      },
      commonMistake: {
        action: 'Fold（"J8s 不够好"）',
        reasoning: '面对弃牌过多的对手，边缘牌也能通过偷盲盈利，fold 浪费反制机会。',
        evLoss: '-1.0 BB/100',
      },
    },
    {
      id: 'l4hu-counter-strategies-ex2',
      title: '反制跟注站：薄价值而不是诈唬',
      heroHand: ['Kc', 'Qd'],
      heroPosition: 'SB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
      ],
      board: ['Kh', '9s', '4d'],
      street: 'flop',
      effectiveStack: 98,
      potSize: 4,
      correctDecision: {
        action: 'Bet',
        amount: '1.3BB（1/3 pot）',
        reasoning: [
          'BB 翻后不弃牌（弃牌率 <25%）：纯诈唬没有弃牌率可赚，价值下注才是唯一有收益的方向',
          'KQ 顶对好踢脚在 K-9-4 面就是薄价值牌，1/3 池让更弱的对子、9x 与听牌用便宜价格跟注',
          '对手愿意支付时，小尺度提高被跟注的次数，长期期望胜过一次性大注',
        ],
      },
      commonMistake: {
        action: 'Bet 4BB（满池诈唬）',
        reasoning:
          '面对跟注站用满池去诈唬，等于把筹码交给从不弃牌的人；他不弃牌时，你的诈唬密度就是纯亏损项。',
        evLoss: '-1.6 BB/100',
      },
    },
    {
      id: 'l4hu-counter-strategies-ex3',
      title: '反制 C-Bet 过频：用超对过牌加注',
      heroHand: ['9d', '9c'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' }, { player: 'SB', action: 'bet 1.3BB' },
      ],
      board: ['8h', '5s', '2c'],
      street: 'flop',
      effectiveStack: 95,
      potSize: 5.3,
      correctDecision: {
        action: 'Check-Raise',
        amount: 'to 4BB',
        reasoning: [
          'SB 的 C-Bet 频率 80%（均衡约 45%-55%）：它的下注范围里混了大量空气，超对在这里是价值加注',
          '底池 5.3BB，加注到 4BB 只需对手弃牌 4 ÷ (5.3 + 4) ≈ 43% 就保本，而它面对加注的弃牌率高于 50%',
          '99 在 8-5-2 面大幅领先下注范围的中段，价值加注既能收池也能在转牌继续施压',
        ],
      },
      commonMistake: {
        action: 'Call（"超对慢慢打"）',
        reasoning:
          '面对高频 C-Bet 的对手，只跟注把主动权还给它：翻牌跟注后转牌还要面对第二次开火，反而更容易被诈唬赶走。',
        evLoss: '-1.1 BB/100',
      },
    },
  ],
  practice: {
    id: 'l4hu-counter-strategies-practice',
    questions: [
      {
        id: 'l4hu-counter-strategies-p1',
        difficulty: 'beginner',
        scenario: {
          heroHand: ['Qd', '8d'],
          heroPosition: 'SB',
          previousActions: [],
          street: 'preflop',
          potSize: 1.5,
          effectiveStack: 100,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 面对 min-raise 弃牌 65%' },
        },
        options: [
          { action: 'Fold', isCorrect: false, explanation: '面对弃牌 65% 的 BB，Q8s 是可开池牌，fold 太紧。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Min-raise', isCorrect: true, explanation: 'BB 弃牌过多，Q8s min-raise 偷盲 EV 上升，标准反制。', evImpact: '+1.2 BB/100', evLoss: 0 },
          { action: 'Call', isCorrect: false, explanation: 'Limp 太被动，面对弃牌多的对手应积极 min-raise。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
        ],
        relatedLessonId: 'l4hu-counter-strategies',
      },
      {
        id: 'l4hu-counter-strategies-p2',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['As', '9s'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: 'call' },
          ],
          board: ['Kh', '8d', '3c'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 面对 C-Bet 弃牌 60%' },
        },
        options: [
          { action: 'Check', isCorrect: false, explanation: '面对弃牌 60% 的 BB，A 高应下注反制，check 太被动。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
          { action: 'Bet 1.3BB（1/3 pot）', isCorrect: true, explanation: 'BB 弃牌过多，A 高 + 后门同花 1/3 池持续施压反制。', evImpact: '+1.5 BB/100', evLoss: 0 },
          { action: 'All-in', isCorrect: false, explanation: 'A 高 All-in 过度，小注反制即可。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
        ],
        relatedLessonId: 'l4hu-counter-strategies',
      },
      {
        id: 'l4hu-counter-strategies-p3',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['7h', '6h'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: 'call' },
          ],
          board: ['8c', '5d', '2s'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 面对 x/r 弃牌 55%' },
        },
        options: [
          { action: 'Check-Fold', isCorrect: false, explanation: '76 有双卡顺，且 SB 弃牌率高，应 x/r 反制。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: 'SB 面对 x/r 弃牌 55%，双卡顺半诈唬 x/r 反制，弃牌率支撑盈利。', evImpact: '+1.5 BB/100', evLoss: 0 },
          { action: 'Donk Bet', isCorrect: false, explanation: 'BB 应先 Check，面对 SB 的 C-Bet 再 x/r，Donk 不是标准打法。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
        ],
        relatedLessonId: 'l4hu-counter-strategies',
      },
      {
        id: 'l4hu-counter-strategies-p4',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['Ah', 'Ks'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: '3-bet to 6BB' },
          ],
          street: 'preflop',
          potSize: 8,
          effectiveStack: 100,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 3-bet 频率 22%（均衡约 12%-15%）' },
        },
        options: [
          { action: '4-Bet to 15BB', isCorrect: true, explanation: '22% 的 3-bet 是明确偏离：AK 在它的宽 3-bet 范围里明显领先，4-Bet 既兑现价值又收窄它继续的范围。', evImpact: '+2.2 BB/100', evLoss: 0 },
          { action: 'Call', isCorrect: false, explanation: '面对高频 3-bet 只跟注，等于用 4BB 的价格让它的宽范围便宜看翻牌，AK 的胜率优势没有兑现成筹码。', evImpact: '-0.9 BB/100', evLoss: 0.9 },
          { action: 'Fold', isCorrect: false, explanation: 'AK 面对 22% 的宽 3-bet 范围是明确领先牌，弃牌把最赚钱的一段让给对手。', evImpact: '-2.6 BB/100', evLoss: 2.6 },
        ],
        relatedLessonId: 'l4hu-counter-strategies',
      },
    ],
  },
  units: [
    { id: 'u1', title: '识别偏离与反制姿态', sections: L4HU_CTR_U1_SECTIONS, exampleId: 'l4hu-counter-strategies-ex1' },
    { id: 'u2', title: '四类偏离的针对方向', sections: L4HU_CTR_U2_SECTIONS, exampleId: 'l4hu-counter-strategies-ex2' },
    { id: 'u3', title: '理论支撑与回基线纪律', sections: L4HU_CTR_U3_SECTIONS, exampleId: 'l4hu-counter-strategies-ex3' },
  ],
};
