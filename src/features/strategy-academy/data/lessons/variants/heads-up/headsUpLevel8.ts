import type { Lesson } from '../../../../types';

export const HEADS_UP_LEVEL_8_LESSONS: Lesson[] = [
  {
    id: 'l8hu-exploitative',
    level: 8,
    order: 1,
    title: '单挑剥削打法',
    subtitle: '单挑针对性剥削：频率读取、范围极化与动态调整',
    duration: '9 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante', stackDepth: 100 },
    content: [
      { type: 'heading', content: '单挑剥削：不是抛弃 GTO，是校准 GTO' },
      {
        type: 'text',
        content:
          '单挑剥削打法（Exploitative Play）利用对手偏离均衡的倾向赚取超额利润。但单挑高手不会"抛弃"GTO，而是"校准"它：以均衡频率为基线，针对对手的明确偏离做最小必要偏离。单挑是读人价值最高的形式——只面对一个对手，你能快速识别他的漏洞并用针对性策略收割。',
      },
      {
        type: 'key-point',
        content: '剥削的正确姿态：方向瞄准对手漏洞（Maximally Exploitative），幅度保持最小（Minimally Exploitative）。每次偏离都打开自己的漏洞，因此幅度要可控，对手调整后及时回基线。',
      },
      { type: 'heading', content: '频率读取：从统计到剥削' },
      {
        type: 'text',
        content:
          '频率读取是单挑剥削的地基：识别对手的四维倾向（开池率、面对 C-Bet 弃牌率、3Bet 率、摊牌倾向），再用针对性策略收割。弃牌过多 → 提高 C-Bet/偷盲频率；跟注过松（跟注站）→ 价值下注薄价值、减少纯诈唬；3Bet 过频 → 收窄开池、增加 4Bet；C-Bet 过频 → 提高 x/r。识别依赖跨 50-100 手的统计，单手牌印象不作数。',
      },
      {
        type: 'example',
        content:
          '实例：你观察到某单挑对手面对 C-Bet 弃牌率高达 62%（均衡约 45%）。这是明确的弃牌过多漏洞。剥削：你的翻牌 C-Bet 频率与诈唬密度整体上调，连原本 check 的弱牌也加入下注。但幅度以"他若收紧到 50% 你仍不亏"为限——保留修正空间。这就是"有方向、有纪律"的偏离。',
      },
      {
        type: 'example',
        content:
          '实例二（范围极化）：面对跟注过松的跟注站，你的下注范围应两极化——用坚果打价值、用强听牌半诈唬，中间牌过牌。因为跟注站用弱牌跟注，你的宽价值范围被超额支付。同时减少纯诈唬（他不弃），把诈唬牌转化为半诈唬或过牌。',
      },
      {
        type: 'example',
        content:
          '实例三（动态调整）：你提高偷盲频率后，对手开始频繁 3Bet 反击——说明他发现了你的偏离。此时必须回到 GTO 基线（收窄偷盲范围、减少纯诈唬），否则你新打开的漏洞会被他反向收割。剥削是动态博弈：偏离-被察觉-回基线，循环往复。',
      },
      {
        type: 'highlight',
        content: '反直觉点：剥削的最大风险不是"剥削得不够"，而是"剥削过头"把自己变成漏洞。单挑高手在收割对手漏洞的同时，永远留着一只手握在 GTO 基线的方向盘上——对手一调整，立刻归位。',
      },
      {
        type: 'pro-tip',
        content: '剥削执行五步：(1) HUD 收集足够样本确认漏洞；(2) 求解器锁定该节点求最优应对；(3) 对比基线标出被推高的频率与尺度；(4) 实战执行；(5) 每 500 手复核样本是否仍成立。没有数据支撑的"锁定"只是纸上的剥削。',
      },
    ],
    quiz: [
      {
        id: 'l8hu-exploitative-q1',
        question: '单挑剥削的正确基础是：',
        options: [
          '完全抛弃 GTO',
          '以 GTO 为基线，针对对手明确偏离做最小必要偏离',
          '只用感觉',
          '永远最大程度偏离',
        ],
        correctIndex: 1,
        explanation: '剥削是"校准 GTO"而非抛弃：以均衡频率为基线，针对对手偏离做有方向、有幅度上限的偏离。',
      },
      {
        id: 'l8hu-exploitative-q2',
        question: '面对弃牌过多的对手，单挑剥削是：',
        options: [
          '减少进攻',
          '提高 C-Bet/偷盲频率与诈唬密度',
          '只玩坚果',
          '完全停注',
        ],
        correctIndex: 1,
        explanation: '弃牌过多的对手让偷盲与 C-Bet 的弃牌率成为自动利润，应提高 C-Bet/偷盲频率与诈唬密度。',
      },
      {
        id: 'l8hu-exploitative-q3',
        question: '面对跟注过松的跟注站，正确剥削是：',
        options: [
          '增加纯诈唬',
          '下注范围两极化，价值下注薄价值、减少纯诈唬',
          '完全停止下注',
          '只玩坚果',
        ],
        correctIndex: 1,
        explanation: '跟注站用弱牌跟注，价值下注薄价值被超额支付；纯诈唬无效（他不弃），应转化为半诈唬或过牌。',
      },
      {
        id: 'l8hu-exploitative-q4',
        question: '你提高偷盲后对手开始频繁 3Bet 反击，正确做法是：',
        options: [
          '继续加大偷盲',
          '回到 GTO 基线，收窄范围',
          '完全停止开池',
          '忽略对手反应',
        ],
        correctIndex: 1,
        explanation: '对手发现你的偏离，你新打开的漏洞会被反向收割。必须回到基线，剥削是"偏离-被察觉-回基线"的动态博弈。',
      },
      {
        id: 'l8hu-exploitative-q5',
        question: '单挑剥削的频率读取依赖：',
        options: [
          '单手牌印象',
          '跨 50-100 手的统计',
          '对手外貌',
          '随机猜测',
        ],
        correctIndex: 1,
        explanation: '频率读取依赖跨 50-100 手的统计（开池率/弃牌率/3Bet 率/摊牌倾向），单手牌印象是噪声。',
      },
    ],
    examples: [
      {
        id: 'l8hu-exploitative-ex1',
        title: '剥削弃牌过多的对手',
        heroHand: ['9c', '8c'],
        heroPosition: 'SB',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 1.5,
        correctDecision: {
          action: 'Min-raise',
          amount: '2BB',
          reasoning: [
            'BB 面对 min-raise 弃牌 60%（偏离均衡 40%）',
            '98s 面对弃牌多的对手是可开池牌',
            '反制弃牌过多：提高开池频率',
          ],
        },
        commonMistake: {
          action: 'Fold（"98s 不够好"）',
          reasoning: '面对弃牌过多的对手，边缘牌也能通过偷盲盈利，fold 浪费剥削机会。',
          evLoss: '-1.0 BB/100',
        },
      },
    ],
    practice: {
      id: 'l8hu-exploitative-practice',
      questions: [
        {
          id: 'l8hu-exploitative-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Qc', '6c'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 面对 min-raise 弃牌 65%' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: '面对弃牌 65% 的 BB，Q6s 是可开池牌，fold 太紧。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Min-raise', isCorrect: true, explanation: 'BB 弃牌过多，Q6s min-raise 偷盲 EV 上升，标准剥削。', evImpact: '+1.2 BB/100', evLoss: 0 },
            { action: 'Call', isCorrect: false, explanation: 'Limp 太被动，面对弃牌多的对手应积极 min-raise。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l8hu-exploitative',
        },
        {
          id: 'l8hu-exploitative-p2',
          difficulty: 'intermediate',
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
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 面对 x/r 弃牌 60%' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '76 有双卡顺，且 SB 弃牌率高，应 x/r 剥削。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: 'SB 面对 x/r 弃牌 60%，双卡顺半诈唬 x/r 剥削，弃牌率支撑盈利。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'Donk Bet', isCorrect: false, explanation: 'IP 应 Check 让对手先行动再 x/r，Donk 不是标准打法。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l8hu-exploitative',
        },
        {
          id: 'l8hu-exploitative-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['As', '9s'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: '3-bet to 6BB' },
              { player: 'SB', action: 'call' },
            ],
            board: ['Kh', '8c', '3s'],
            street: 'flop',
            potSize: 12,
            effectiveStack: 90,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 面对 3-Bet 弃牌 40%（偏离）' },
          },
          options: [
            { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'A9 有 A 高 + 后门同花，SB 弃牌率高，1/3 池持续施压剥削。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'Check', isCorrect: false, explanation: 'SB 弃牌率高应下注施压，check 太被动。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'All-in', isCorrect: false, explanation: 'A 高 All-in 过度，小注施压即可。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
          ],
          relatedLessonId: 'l8hu-exploitative',
        },
      ],
    },
  },
];
