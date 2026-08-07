import type { Lesson } from '../../../../types';

export const SHORT_DECK_LEVEL_8_LESSONS: Lesson[] = [
  {
    id: 'l8sd-exploit-i',
    level: 8,
    order: 1,
    title: '短牌剥削（一）',
    subtitle: '针对短牌休闲玩家的范围剥削、下注尺度与频率调整',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌剥削：针对休闲玩家的认知偏差' },
      {
        type: 'text',
        content:
          '短牌休闲玩家大多是标准德州转来的，带着满员桌的认知偏差：outs 算错、低估同花、高估 AK、set mining 过松。短牌剥削的核心是识别这些偏差，用针对性策略收割。识别依赖跨 50-100 手的频率统计，而非单手牌印象。',
      },
      {
        type: 'key-point',
        content: '短牌剥削铁律：识别对手的"标准德州惯性"（outs 算错/低估同花/高估 AK），用针对性策略收割。方向瞄准漏洞，幅度最小，对手调整后回基线。',
      },
      { type: 'heading', content: '范围剥削与下注尺度调整' },
      {
        type: 'text',
        content:
          '短牌剥削的两个杠杆：(1) 范围剥削——识别对手追听过松（outs 算错）、价值排序错（低估同花）后，针对性调整你的价值/诈唬；(2) 下注尺度——对手低估同花时，你成同花的价值下注可更大；对手追听过松时，你的保护下注可更大。频率统计支撑每个调整。',
      },
      {
        type: 'example',
        content:
          '实例：你发现对手用满员桌 outs 表追听（同花当 9 outs，实际短牌 5）。他的追听过松、实际胜率被高估。剥削：你的价值下注可以更大、跟注更紧——他追听成本高、成功率低。识别这个认知偏差后，你能针对性地榨取。',
      },
      {
        type: 'example',
        content:
          '实例二（低估同花）：对手用标准德州排序，以为葫芦 > 同花。当你成同花、他成葫芦时，他会误以为葫芦更大而继续跟注你的大注。剥削：你在同花面（beats 葫芦）的价值下注可以更积极，因为对手会误判强度。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌中"对手用满员桌直觉"是最可剥削的漏洞。他们的 outs 算错、牌型排序错、起手牌高估——这些偏差让你的价值下注更值钱、你的跟注更有利。识别偏差比记住更多 GTO 更重要。',
      },
      {
        type: 'pro-tip',
        content: '短牌剥削速记：观察对手的四个信号——追听用不用短牌 outs、同花面是否误判强弱、AK 是否全下过频、set mining 是否过松。每个信号都对应一个剥削方向。',
      },
    ],
    quiz: [
      {
        id: 'l8sd-exploit-i-q1',
        question: '短牌剥削的核心是：',
        options: [
          '记住更多 GTO',
          '识别对手的"标准德州惯性"认知偏差并用针对性策略收割',
          '更激进',
          '运气',
        ],
        correctIndex: 1,
        explanation: '短牌剥削核心是识别对手的满员桌惯性偏差（outs 算错/低估同花/高估 AK）。',
      },
      {
        id: 'l8sd-exploit-i-q2',
        question: '发现对手用满员桌 outs 表追听（同花当 9 outs），正确剥削是：',
        options: [
          '减少下注',
          '价值下注更大、跟注更紧，他追听成本高',
          '只玩坚果',
          '无脑全下',
        ],
        correctIndex: 1,
        explanation: '对手高估追听胜率、追听过松，你的价值下注可更大、跟注更紧，榨取他的错误。',
      },
      {
        id: 'l8sd-exploit-i-q3',
        question: '对手用标准德州排序以为葫芦 > 同花，你成同花时的剥削是：',
        options: [
          '过牌',
          '积极价值下注，对手会误判强度继续跟注',
          '弃牌',
          '无脑诈唬',
        ],
        correctIndex: 1,
        explanation: '对手误以为葫芦 > 同花，你成同花（实际 beats 葫芦）时可积极价值下注，他会误判强度继续跟。',
      },
      {
        id: 'l8sd-exploit-i-q4',
        question: '短牌剥削依赖的数据基础是：',
        options: [
          '单手牌印象',
          '跨 50-100 手的频率统计',
          '对手外貌',
          '随机猜测',
        ],
        correctIndex: 1,
        explanation: '短牌剥削识别依赖跨 50-100 手的频率统计，单手牌印象是噪声。',
      },
      {
        id: 'l8sd-exploit-i-q5',
        question: '短牌休闲玩家最典型的可剥削偏差是：',
        options: [
          'outs 算错、低估同花、高估 AK',
          '玩得太紧',
          '从不追听',
          '没有偏差',
        ],
        correctIndex: 0,
        explanation: '短牌休闲玩家多为标准德州转来，带 outs 算错、低估同花、高估 AK 等认知偏差。',
      },
    ],
    examples: [
      {
        id: 'l8sd-exploit-i-ex1',
        title: '剥削追听过松的对手',
        heroHand: ['Ac', 'Kc'],
        heroPosition: 'BTN',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['Kd', '9h', '3c'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 5,
        correctDecision: {
          action: 'Bet',
          amount: '3.3 ante（2/3 pot）',
          reasoning: [
            'AK 顶对顶踢脚，对手追听过松（outs 算错）',
            '加大价值下注尺度，让追听过松的对手付更多',
            '短牌成牌价值高，对手低估同花时大注更有效',
          ],
        },
        commonMistake: {
          action: 'Bet 1/3 pot',
          reasoning: '对手追听过松应加大价值下注尺度，1/3 池小注让对手追听成本太低。',
          evLoss: '-0.8 ante',
        },
      },
    ],
    practice: {
      id: 'l8sd-exploit-i-practice',
      questions: [
        {
          id: 'l8sd-exploit-i-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Qd', 'Qc'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '8s', '3d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BB 追听过松' },
          },
          options: [
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: false, explanation: '对手追听过松应大注榨取，小注让他追听太便宜。', evImpact: '-0.5 ante', evLoss: 0.5 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'QQ 超对 + 对手追听过松，2/3 池大注让追听付费榨取。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '超对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l8sd-exploit-i',
        },
        {
          id: 'l8sd-exploit-i-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ah', 'Qh'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Qh', '7h', '2c'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BB 低估同花价值' },
          },
          options: [
            { action: 'Check', isCorrect: false, explanation: 'AQ 顶对 + 同花听牌，应下注建立底池。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'AQ 顶对 + 同花听牌，对手低估同花，大注建立底池榨取。', evImpact: '+1.8 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '顶对 + 听牌 All-in 过度，2/3 池即可。', evImpact: '-1.0 ante', evLoss: 1 },
          ],
          relatedLessonId: 'l8sd-exploit-i',
        },
        {
          id: 'l8sd-exploit-i-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Ks', 'Qs'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Kh', '8c', '3d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BTN 面对 x/r 弃牌率高' },
          },
          options: [
            { action: 'Check-Call', isCorrect: false, explanation: 'BTN 弃牌率高，KQ 顶对可 x/r 榨取而非跟注。', evImpact: '-0.5 ante', evLoss: 0.5 },
            { action: 'Check-Raise', isCorrect: true, explanation: 'KQ 顶对 + BTN 面对 x/r 弃牌率高，x/r 榨取。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'KQ 顶对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l8sd-exploit-i',
        },
      ],
    },
  },
  {
    id: 'l8sd-exploit-ii',
    level: 8,
    order: 2,
    title: '短牌剥削（二）',
    subtitle: '高波动环境的牌桌动态利用与针对性反制',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌剥削（二）：高波动的动态博弈' },
      {
        type: 'text',
        content:
          '短牌高波动让剥削成为动态博弈：波动大、胜负交替快、对手调整频繁。短牌剥削（二）聚焦于利用牌桌动态（谁在 tilt、谁筹码深、谁在被动）与针对性反制（对手调整后回基线）。剥削不是一次性的，而是"偏离-被察觉-回基线"的循环。',
      },
      {
        type: 'key-point',
        content: '短牌动态剥削铁律：识别牌桌动态（tilt/筹码/被动），用针对性策略收割；对手调整后及时回 GTO 基线。剥削是动态博弈，方向瞄准漏洞、幅度最小。',
      },
      { type: 'heading', content: '牌桌动态利用与针对性反制' },
      {
        type: 'text',
        content:
          '短牌牌桌动态利用：(1) tilt 对手——识别后激进施压，因为他会玩边缘牌追回损失；(2) 短筹码对手——用宽范围施压，因为他们害怕被淘汰；(3) 被动对手——高频下注榨取，因为他们不会反加。针对性反制：你被对手反向调整后（如他提高 3Bet），回到 GTO 基线收窄范围。',
      },
      {
        type: 'example',
        content:
          '实例：短牌你发现某对手连续输牌后开始 tilt——玩边缘牌、追听无脑、尺度失控。剥削：你对他用更宽的范围价值下注与更紧的跟注——他追听过度，你价值下注被超额支付。识别 tilt 对手并收割，是短牌动态剥削的典型。',
      },
      {
        type: 'example',
        content:
          '实例二（针对性反制）：你提高对某对手的偷盲频率后，他开始频繁 3Bet 反击——说明他发现了你的偏离。此时必须回到 GTO 基线（收窄偷盲范围、减少纯诈唬），否则你新打开的漏洞会被他反向收割。剥削是动态博弈：偏离-被察觉-回基线。',
      },
      {
        type: 'example',
        content:
          '实例三（短筹码施压）：短牌你深筹码（100 ante），对手短筹码（30 ante）。短筹码怕淘汰，你用宽范围全下/加注施压——他 ICM 压力大、不敢冒险。短牌高波动让深筹码对短筹码的施压更有效。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌动态剥削的最大风险是"剥削过头"把自己变成漏洞。识别到对手调整后必须回基线——单挑/短牌高手在收割漏洞的同时，永远留着一只手握在 GTO 基线的方向盘上。',
      },
      {
        type: 'pro-tip',
        content: '短牌动态剥削五步：(1) 识别牌桌动态（谁 tilt/谁短筹码/谁被动）；(2) 针对漏洞调整（施压/价值/反制）；(3) 观察对手反应；(4) 对手调整后回基线；(5) 每 500 手复核。动态博弈，循环推进。',
      },
    ],
    quiz: [
      {
        id: 'l8sd-exploit-ii-q1',
        question: '短牌动态剥削的核心是：',
        options: [
          '一次性收割',
          '利用牌桌动态（tilt/筹码/被动）并针对性反制，偏离-被察觉-回基线',
          '永远激进',
          '只玩坚果',
        ],
        correctIndex: 1,
        explanation: '短牌高波动让剥削成为动态博弈：利用牌桌动态，对手调整后回基线。',
      },
      {
        id: 'l8sd-exploit-ii-q2',
        question: '识别到对手开始 tilt（玩边缘牌追回损失），正确剥削是：',
        options: [
          '减少进攻',
          '用更宽范围价值下注 + 更紧跟注，他追听过度',
          '只玩坚果',
          '完全停手',
        ],
        correctIndex: 1,
        explanation: 'tilt 对手玩边缘牌、追听无脑，用更宽价值下注与更紧跟注收割。',
      },
      {
        id: 'l8sd-exploit-ii-q3',
        question: '你提高偷盲后对手开始频繁 3Bet 反击，正确做法是：',
        options: [
          '继续加大偷盲',
          '回到 GTO 基线，收窄范围',
          '完全停止开池',
          '忽略对手反应',
        ],
        correctIndex: 1,
        explanation: '对手发现你的偏离，你新打开的漏洞会被反向收割。必须回到基线。',
      },
      {
        id: 'l8sd-exploit-ii-q4',
        question: '深筹码对短筹码施压有效的原因是：',
        options: [
          '深筹码牌更好',
          '短筹码怕淘汰、ICM 压力大不敢冒险',
          '短筹码更激进',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '短筹码 ICM 压力大、怕淘汰，深筹码用宽范围施压有效。',
      },
      {
        id: 'l8sd-exploit-ii-q5',
        question: '短牌动态剥削的最大风险是：',
        options: [
          '剥削不够',
          '剥削过头把自己变成漏洞，需及时回基线',
          '底池太大',
          '对手太强',
        ],
        correctIndex: 1,
        explanation: '剥削过头会打开自己的漏洞，识别到对手调整后必须回基线。',
      },
    ],
    examples: [
      {
        id: 'l8sd-exploit-ii-ex1',
        title: '剥削 tilt 对手',
        heroHand: ['Qh', 'Qd'],
        heroPosition: 'BTN',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['9h', '8s', '3d'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 5,
        correctDecision: {
          action: 'Bet',
          amount: '3.3 ante（2/3 pot）',
          reasoning: [
            'BB 已 tilt（玩边缘牌、追听过度）',
            'QQ 超对 + 对手 tilt，大注价值下注被超额支付',
            '短牌高波动下识别 tilt 对手并收割',
          ],
        },
        commonMistake: {
          action: 'Bet 1/3 pot',
          reasoning: 'tilt 对手追听过度，应大注价值下注榨取，小注浪费剥削机会。',
          evLoss: '-0.8 ante',
        },
      },
    ],
    practice: {
      id: 'l8sd-exploit-ii-practice',
      questions: [
        {
          id: 'l8sd-exploit-ii-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Kd', 'Kc'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Jh', '7c', '2d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BB 已 tilt' },
          },
          options: [
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: false, explanation: 'tilt 对手应大注榨取，小注浪费剥削机会。', evImpact: '-0.5 ante', evLoss: 0.5 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'KK 超对 + BB tilt，大注价值下注被超额支付。', evImpact: '+1.8 ante', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '超对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l8sd-exploit-ii',
        },
        {
          id: 'l8sd-exploit-ii-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['As', 'Ks'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 3,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BB 短筹码 25 ante' },
          },
          options: [
            { action: 'Limp', isCorrect: false, explanation: '深筹码 AK 应对短筹码施压，limp 太被动。', evImpact: '+0.3 ante', evLoss: 0.3 },
            { action: 'Raise 2 ante', isCorrect: true, explanation: '深筹码 AK 加注施压短筹码，他 ICM 压力大不敢冒险。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'AK 顶级强牌，fold 荒谬。', evImpact: '-3.0 ante', evLoss: 3 },
          ],
          relatedLessonId: 'l8sd-exploit-ii',
        },
        {
          id: 'l8sd-exploit-ii-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Qd', 'Jd'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Jh', '8c', '3d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BTN 开始频繁 3-Bet 反制你的偷盲' },
          },
          options: [
            { action: 'Check-Raise', isCorrect: false, explanation: 'BTN 已开始反制，QJ 顶对可价值下注但不必过度 x/r。', evImpact: '+0.5 ante', evLoss: 0.5 },
            { action: 'Check-Call', isCorrect: true, explanation: 'BTN 反制你的偷盲，应回到较紧的防守，QJ 顶对跟注控池。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'QJ 顶对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l8sd-exploit-ii',
        },
      ],
    },
  },
];
