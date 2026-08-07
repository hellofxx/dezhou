import type { Lesson } from '../../../../types';

export const SHORT_DECK_LEVEL_5_LESSONS: Lesson[] = [
  {
    id: 'l5sd-bankroll',
    level: 5,
    order: 1,
    title: '短牌资金管理',
    subtitle: '高波动短牌局的风险控制、资金规则与升/降级纪律',
    duration: '7 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌资金管理：高波动的必然要求' },
      {
        type: 'text',
        content:
          '短牌波动显著高于标准德州（翻牌率/听牌/底池大），资金管理必须更保守。标准德州现金桌约 50-100 个买入，短牌建议 ≥150 个买入。原因：短牌标准差更高（全下胜率多落在 45%-55%），需要更大缓冲才能在波动中生存并让期望收敛。',
      },
      {
        type: 'key-point',
        content: '短牌资金铁律：≥150 个买入（标准差更高）。资金是你在短牌波动中生存的缓冲，不遵守资金纪律，短期波动会击穿你。',
      },
      { type: 'heading', content: '升/降级纪律' },
      {
        type: 'formula',
        content:
          '短牌资金升/降级规则：\n\n升级：资金达到当前级别买入数的 2 倍以上（如 150 买入 → 升到 75 买入级别）\n降级：资金跌破当前级别买入数（如 75 买入 → 降到 150 买入级别）\n\n实例：短牌你打 5 ante 级别，需 150×5 = 750 ante 资金；\n资金涨到 1500 ante → 可考虑升到 10 ante 级别；\n资金跌破 750 ante → 降回更小级别\n\n纪律：升级要慢（2 倍才升），降级要快（破线即降）。（概念源自：短牌高波动资金管理框架）',
      },
      {
        type: 'text',
        content:
          '短牌资金管理实践：升级要慢、降级要快。因为短牌波动大，一次下风期可能消耗 20-30 个买入，资金缓冲不足会迫使你在最差时刻降级。同时遵守"止损重开"纪律——输到预算点暂停，而非翻本追加。',
      },
      {
        type: 'example',
        content:
          '实例：短牌你带 150 个买入（1500 ante）打 10 ante 级别。一场 session 输 30 个买入（300 ante）——虽未破线但接近波动预算。正确做法：暂停复盘，而非"再打一场翻本"。短牌波动大，一次追回可能连输更多。',
      },
      {
        type: 'example',
        content:
          '实例二（降级纪律）：短牌你资金跌破 75 个买入（750 ante）。虽然"牌势不错"，但按纪律应降级到更小级别重建资金。短牌玩家最容易在资金不足时加注翻本——这是违反资金纪律的危险行为。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌资金管理最难的是"盈利时升级过快"。赢了几个买入就升级到更高级别，会把自己置于更大的波动中。短牌升级要慢（2 倍资金才升），降级要快。',
      },
      {
        type: 'pro-tip',
        content: '短牌资金管理三件套：(1) ≥150 个买入；(2) 升级 2 倍、降级破线即降；(3) 输到波动预算暂停复盘，不翻本追加。三件事守住，波动不再击穿你。',
      },
    ],
    quiz: [
      {
        id: 'l5sd-bankroll-q1',
        question: '短牌现金桌建议的资金管理门槛约为：',
        options: ['50 个买入', '100 个买入', '150 个以上买入', '20 个买入'],
        correctIndex: 2,
        explanation: '短牌标准差更高，资金门槛需更保守，建议 ≥150 个买入。',
      },
      {
        id: 'l5sd-bankroll-q2',
        question: '短牌资金管理需要更保守的原因是：',
        options: [
          '短牌更容易赢',
          '短牌标准差高（全下胜率 45%-55%），波动更大',
          '短牌买入更贵',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '短牌波动大，需要更大资金缓冲才能在波动中生存并让期望收敛。',
      },
      {
        id: 'l5sd-bankroll-q3',
        question: '短牌升级级别的资金标准是：',
        options: [
          '资金翻倍就升',
          '达到当前级别买入数的 2 倍以上',
          '赢一场就升',
          '随时升',
        ],
        correctIndex: 1,
        explanation: '短牌升级要慢，达到当前级别买入数的 2 倍以上才考虑升级。',
      },
      {
        id: 'l5sd-bankroll-q4',
        question: '短牌资金跌破级别买入数时应：',
        options: [
          '加注翻本',
          '降级重建资金',
          '继续硬扛',
          '忽略',
        ],
        correctIndex: 1,
        explanation: '短牌降级要快，资金破线即降级重建，避免加注翻本的危险行为。',
      },
      {
        id: 'l5sd-bankroll-q5',
        question: '短牌资金管理最难的情况是：',
        options: [
          '连续输牌',
          '盈利时升级过快，把自己置于更大波动',
          '平局',
          '牌发得慢',
        ],
        correctIndex: 1,
        explanation: '盈利时升级过快最危险——把自己置于更大的波动中，短牌升级要慢。',
      },
    ],
    examples: [
      {
        id: 'l5sd-bankroll-ex1',
        title: '短牌资金降级纪律',
        heroHand: ['Ah', 'Kh'],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 1.5,
        correctDecision: {
          action: '遵守资金纪律',
          amount: '降级重建资金',
          reasoning: [
            '短牌资金跌破级别买入数，即使牌势不错也应降级',
            '资金纪律优先于短期牌势',
            '避免在资金不足时加注翻本',
          ],
        },
        commonMistake: {
          action: '继续硬扛加注翻本',
          reasoning: '短牌资金不足时加注翻本是违反纪律的危险行为，波动会击穿你。',
          evLoss: '-3.0 ante',
        },
      },
    ],
    practice: {
      id: 'l5sd-bankroll-practice',
      questions: [
        {
          id: 'l5sd-bankroll-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Qc', 'Qd'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'QQ 短牌顶级强牌，fold 荒谬。', evImpact: '-3.0 ante', evLoss: 3 },
            { action: 'Raise', isCorrect: true, explanation: 'QQ 短牌顶级对子，标准开池加注。', evImpact: '+2.0 ante', evLoss: 0 },
            { action: 'Call', isCorrect: false, explanation: 'QQ 应加注而非 limp，limp 太被动。', evImpact: '+0.5 ante', evLoss: 0.5 },
          ],
          relatedLessonId: 'l5sd-bankroll',
        },
        {
          id: 'l5sd-bankroll-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Jd', 'Jc'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '8s', '3d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，湿滑连接面' },
          },
          options: [
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: false, explanation: '湿滑面小注给听牌太便宜，短牌应大注保护。', evImpact: '-0.5 ante', evLoss: 0.5 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'JJ 超对湿润面 2/3 池大注保护，让听牌付费。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '超对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l5sd-bankroll',
        },
        {
          id: 'l5sd-bankroll-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['As', 'Ks'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，已输 30 买入接近波动预算' },
          },
          options: [
            { action: 'All-in', isCorrect: false, explanation: '已接近波动预算，应先考虑暂停而非激进行动。', evImpact: '-1.5 ante', evLoss: 1.5 },
            { action: 'Raise', isCorrect: false, explanation: 'AK 可正常开池，但接近波动预算应先暂停复盘。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: '暂停复盘', isCorrect: true, explanation: '已输 30 买入接近波动预算，应暂停复盘而非继续。', evImpact: '+0 ante', evLoss: 0 },
          ],
          relatedLessonId: 'l5sd-bankroll',
        },
      ],
    },
  },
  {
    id: 'l5sd-tilt-control',
    level: 5,
    order: 2,
    title: '短牌情绪控制',
    subtitle: '短牌大底池波动的情绪管理、下风期识别与纪律训练',
    duration: '7 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌情绪控制：高波动的挑战' },
      {
        type: 'text',
        content:
          '短牌是情绪控制的高发区：高波动、大底池、胜负交替剧烈。短牌中 tilt（情绪失控）源于结果依赖、期望落空、报复心理，且因连败常见（45%-55% 全下）更容易触发。tilt 会扭曲你的范围（开池过松、跟注过宽、追听过凶），系统性偏离基线。',
      },
      {
        type: 'key-point',
        content: '短牌情绪控制三防线：自我觉察（情绪红灯）、预设纪律（止损点）、过程归因（只问 EV）。防线在桌外建立，tilt 时才来得及用。',
      },
      { type: 'heading', content: '下风期识别与纪律训练' },
      {
        type: 'text',
        content:
          '短牌下风期识别：连续输掉多个 45%-55% 全下是数学常态（0.5^8 ≈ 0.4%），但短牌每小时全下频繁，下风期会更快到来。识别后要区分"数学波动"与"策略错误"——用决策日志记录每个关键决策的推理，只问 EV 不问结果。纪律训练：预设止损点、到点离桌、复盘只看过程。',
      },
      {
        type: 'example',
        content:
          '实例：短牌你连输 6 个 50% 全下（概率 0.5^6 ≈ 1.6%，短牌每小时遇到几次）。理智知道"打对了"，情绪想"翻本"。若你加大尺度追回损失，就是 tilt 循环。正确做法：识别报复冲动 → 暂停 10 分钟 → 重新用"这手牌 EV 是多少"决策。',
      },
      {
        type: 'example',
        content:
          '实例二（过程 vs 结果）：短牌你持 AK 对 55 全下（短牌 AK 对 55 约 43%-45%），55 胜出。结果你输了，但过程：若底池赔率合适，跟注 +EV，打对了。短牌高手复盘只看过程："这个决策 EV 对吗？"而 tilt 玩家只看结果："我又输给垃圾牌了。"',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌 tilt 最危险的不是"输钱时的冲动"，而是"赢钱后的松懈"。赢了几手后放松警惕、玩边缘牌，把优势送回去。短牌纪律必须全程一致，无论牌势顺逆。',
      },
      {
        type: 'pro-tip',
        content: '短牌情绪控制三件套：(1) 情绪红灯——连续 N 手想报复即暂停；(2) 预设止损——输 40-50BB 离桌；(3) 过程归因——复盘只问 EV。三件事在桌外建立，tilt 时才来得及用。',
      },
    ],
    quiz: [
      {
        id: 'l5sd-tilt-control-q1',
        question: '短牌是情绪控制高发区的原因是：',
        options: [
          '牌发得慢',
          '高波动、大底池、胜负交替剧烈',
          '规则复杂',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '短牌高波动、大底池、胜负交替剧烈，tilt 更容易触发。',
      },
      {
        id: 'l5sd-tilt-control-q2',
        question: 'tilt 对范围最典型的破坏是：',
        options: [
          '让范围收紧',
          '开池过松、跟注过宽、追听过凶',
          '让打法更保守',
          '没有影响',
        ],
        correctIndex: 1,
        explanation: 'tilt 扭曲范围：开池过松、跟注过宽、追听过凶，系统性偏离均衡基线。',
      },
      {
        id: 'l5sd-tilt-control-q3',
        question: '"过程 vs 结果"分离的核心是：',
        options: [
          '赢钱才算对',
          '复盘只看决策 EV，不因结果改变打法',
          '输钱就改策略',
          '过程不重要',
        ],
        correctIndex: 1,
        explanation: '复盘只看过程（决策 EV）而非结果（输赢），才能保持长期质量。',
      },
      {
        id: 'l5sd-tilt-control-q4',
        question: '短牌下风期识别的关键是：',
        options: [
          '只看输多少',
          '区分数学波动与策略错误，用决策日志记录推理',
          '加注翻本',
          '完全停手',
        ],
        correctIndex: 1,
        explanation: '下风期要区分数学波动（45%-55% 全下连败）与策略错误，用决策日志只问 EV。',
      },
      {
        id: 'l5sd-tilt-control-q5',
        question: '关于短牌 tilt 的高发时点，正确的说法是：',
        options: [
          '只在连续输牌时',
          '赢钱后的松懈同样危险',
          '从不发生',
          '只在锦标赛',
        ],
        correctIndex: 1,
        explanation: '赢钱后的松懈同样危险——放松警惕玩边缘牌，把优势送回去。纪律须全程一致。',
      },
    ],
    examples: [
      {
        id: 'l5sd-tilt-control-ex1',
        title: '短牌 tilt 时的暂停纪律',
        heroHand: ['Ac', 'Kc'],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 1.5,
        correctDecision: {
          action: '暂停复盘',
          amount: '',
          reasoning: [
            '已连输多个全下，识别到报复冲动',
            '情绪红灯触发，强制暂停 10 分钟',
            '重新用 EV 而非"翻本"决策',
          ],
        },
        commonMistake: {
          action: '加大尺度追回损失',
          reasoning: 'tilt 循环——加大尺度追回损失会让范围扭曲，输更多。',
          evLoss: '-3.0 ante',
        },
      },
    ],
    practice: {
      id: 'l5sd-tilt-control-practice',
      questions: [
        {
          id: 'l5sd-tilt-control-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Kh', 'Qh'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'KQs 短牌可玩性好，fold 太紧。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Raise', isCorrect: true, explanation: 'KQs 同花连牌可玩性好，标准开池加注。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'KQs 深筹码 All-in 过度。', evImpact: '-1.5 ante', evLoss: 1.5 },
          ],
          relatedLessonId: 'l5sd-tilt-control',
        },
        {
          id: 'l5sd-tilt-control-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Jd', 'Jc'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '8s', '3d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，连输后情绪不稳' },
          },
          options: [
            { action: 'All-in', isCorrect: false, explanation: '情绪不稳时 All-in 是 tilt 信号，超对应正常下注。', evImpact: '-1.5 ante', evLoss: 1.5 },
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: 'JJ 超对湿润面大注保护，正常决策不因情绪扭曲。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '超对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l5sd-tilt-control',
        },
        {
          id: 'l5sd-tilt-control-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['As', 'Ks'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，已输 45BB 接近止损点' },
          },
          options: [
            { action: 'All-in', isCorrect: false, explanation: '接近止损点，应先暂停而非激进行动。', evImpact: '-1.5 ante', evLoss: 1.5 },
            { action: 'Raise', isCorrect: false, explanation: 'AK 可正常开池，但接近止损点应先暂停。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: '暂停离桌', isCorrect: true, explanation: '输 45BB 接近止损点，执行预设纪律暂停离桌。', evImpact: '+0 ante', evLoss: 0 },
          ],
          relatedLessonId: 'l5sd-tilt-control',
        },
      ],
    },
  },
];
