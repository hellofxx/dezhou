import type { Lesson } from '../../../../../types';

export const HEADS_UP_LESSON: Lesson = {
  id: 'l4hu-counter-strategies',
  level: 4,
  order: 2,
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
  variantContext: { anteStructure: 'sb_ante' },
  content: [
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
    { type: 'heading', content: '四类偏离的针对性反制' },
    {
      type: 'formula',
      content:
        '针对弃牌过多的对手提高偷盲（SB min-raise 到 2BB，BB 弃牌率 f，以弃牌为基准 1.5/1.5 口径）：\nEV(steal) = f×1.5 − (1−f)×1.5\n\n均衡弃牌率约 40%（f=0.4）→ EV = 0.4×1.5 − 0.6×1.5 = −0.3BB（不盈利，需翻后补）\n若对手弃牌率 60%（f=0.6）→ EV = 0.6×1.5 − 0.4×1.5 = +0.3BB（纯偷盲自动盈利）\n若对手弃牌率 70%（f=0.7）→ EV = 0.7×1.5 − 0.3×1.5 = +0.6BB（利润扩大）\n\n结论：对手弃牌率越高，偷盲频率越应上调，但幅度以"他若修正到 50% 你仍不亏"为限。',
    },
    {
      type: 'text',
      content:
        '四类偏离的反制方向：(1) 弃牌过多 → 提高开池/C-Bet 频率，用更多半诈唬；(2) 跟注过松（跟注站）→ 减少纯诈唬，改用价值下注薄价值（顶对弱踢脚也能下注收钱）；(3) 3-bet 过频 → 收窄开池范围、增加 4Bet 价值；(4) C-Bet 过频 → 提高 x/r 频率与 float。每一类都从"识别 → 反制 → 复核"闭环推进。',
    },
    {
      type: 'example',
      content:
        '实例：你观察到某单挑对手面对 C-Bet 弃牌率高达 60%（均衡约 45%）。这是明确的弃牌过多漏洞。反制：你的翻牌 C-Bet 频率与诈唬密度整体上调，连原本 check 的弱牌也加入下注。但幅度以"他若收紧到 50% 你仍不亏"为限。这是"以 GTO 为基线、按可观测偏差做有方向、有纪律的偏离"。',
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
    {
      type: 'highlight',
      content: '反直觉点：反制的最大风险不是"反制得不够"，而是"反制过头"把自己变成漏洞。单挑高手在收割对手漏洞的同时，永远留着一只手握在 GTO 基线的方向盘上——对手一调整，立刻归位。',
    },
    {
      type: 'pro-tip',
      content: '反制执行五步：(1) HUD 收集足够样本确认漏洞；(2) 求解器锁定该节点求最优应对；(3) 对比基线标出被推高的频率与尺度；(4) 实战执行；(5) 每 500 手复核样本是否仍成立。',
    },
  ],
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
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
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
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
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
    ],
  },
};
