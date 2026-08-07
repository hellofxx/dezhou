import type { Lesson } from '../../../../types';

export const SHORT_DECK_LEVEL_3_LESSONS: Lesson[] = [
  {
    id: 'l3sd-intro',
    level: 3,
    order: 0,
    title: '短牌德州入门 (6+ Hold\'em)',
    subtitle: '掌握36张牌组的规则变化和策略调整',
    duration: '12 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100, anteStructure: 'both_ante' },
    content: [
      { type: 'heading', content: '什么是短牌德州？' },
      {
        type: 'text',
        content:
          '短牌德州（Short Deck / 6+ Hold\'em）是德州扑克的流行变体，使用36张牌（6-A），移除了2、3、4、5。这导致了游戏动态的显著变化：更多翻牌率、更多听牌、更多行动。',
      },
      {
        type: 'key-point',
        content:
          '短牌德州在亚洲高额桌和 Triton 系列赛中非常流行。相比标准德州，它的波动更大但行动更多。',
      },
      { type: 'heading', content: '核心规则差异（主流 6+ 口径）' },
      {
        type: 'text',
        content:
          '1. 牌组：36张牌（6-A），移除2-5\n2. 牌型等级变化（与标准德州相反的两处）：\n   - 三条 > 顺子（标准德州中顺子 > 三条）\n   - 同花 > 葫芦（标准德州中葫芦 > 同花）\n3. 最小顺子：A-6-7-8-9（A 低用组成最小顺子）\n4. 前注（Ante）制：通常没有盲注，改用所有人投前注 + BTN 投额外 ante',
      },
      {
        type: 'example',
        content:
          '短牌牌型等级（从弱到强）：\n\n1. 高牌\n2. 一对\n3. 两对\n4. 顺子\n5. 三条\n6. 葫芦\n7. 同花\n8. 四条\n9. 同花顺\n10. 皇家同花顺\n\n对照标准德州：顺子与三条、葫芦与同花的相对位置互换。',
      },
      {
        type: 'highlight',
        content:
          '最容易犯的错误：拿着三条以为自己接近坚果而重注。短牌中三条只压过顺子，输给葫芦和同花——湿润牌面上必须警惕对手的更强成牌。',
      },
      { type: 'heading', content: '短牌策略调整要点' },
      {
        type: 'text',
        content:
          '1. 手牌价值变化:\n' +
          '• 口袋对与大高张（AA/KK/QQ/AK）相对价值上升，AK 是最强的非对子起手牌\n' +
          '• 小口袋对 set mine 价值下降——三条牌级低于葫芦/同花，隐含赔率变差\n' +
          '• 同花连牌（JTs、98s 等）可玩性好、听牌机会多，但不属于顶级梯队，不能按“约等于标准德州 AKs”来对待\n' +
          '• 同花价值显著提升——短牌中同花 beats 葫芦\n\n' +
          '2. 翻牌率更高：\n' +
          '• 36 张牌意味着更容易翻牌击中\n\n' +
          '3. 更多听牌和 action：\n' +
          '• 顺子听牌更常见\n' +
          '• 底池通常更大（前注制 + 更多跟注）\n' +
          '• 波动更大，资金管理需要更保守',
      },
      { type: 'heading', content: '短牌数学修正：Outs 按 36 张牌计' },
      {
        type: 'text',
        content:
          '短牌每个花色只有 9 张牌，听牌 outs 必须重算：\n\n- 同花听牌 outs = 9 - 已见的该花色张数。例：手持 2 张红心、牌面有 2 张红心 → 同花 outs = 9 - 4 = 5（标准德州同口径为 13 - 4 = 9）\n- 2/4 法则仍可粗估胜率，但 outs 基数必须按 36 张牌组计算，直接套用标准德州的 outs 表会系统性高估胜率',
      },
      {
        type: 'pro-tip',
        content:
          '短牌德州的关键是理解牌型等级与手牌价值的同步变化。标准德州中的“标准打法”在短牌中可能是严重错误。建议在低额短牌桌上先练习，适应牌型等级变化和范围调整后再升级。',
      },
    ],
    quiz: [
      {
        id: 'l3sd-intro-q1',
        question: '短牌德州使用多少张牌？',
        options: ['40张', '36张', '32张', '48张'],
        correctIndex: 1,
        explanation: '短牌德州移除 2-5，使用 36 张牌（6-A，每个花色9张）。',
      },
      {
        id: 'l3sd-intro-q2',
        question: '以下哪项符合主流短牌（6+）牌型规则？',
        options: ['三条 > 顺子', '顺子 > 三条', '葫芦 > 同花', '与标准德州完全相同'],
        correctIndex: 0,
        explanation: '主流 6+ 规则中三条 beats 顺子、同花 beats 葫芦，两处均与标准德州相反。',
      },
      {
        id: 'l3sd-intro-q3',
        question: '短牌中最小的合法顺子是？',
        options: ['A-2-3-4-5', 'A-6-7-8-9', '6-7-8-9-T', '2-3-4-5-6'],
        correctIndex: 1,
        explanation: 'A-6-7-8-9 是短牌中最小的顺子（A 低用）。A-2-3-4-5 不合法因为 2-5 被移除了。',
      },
      {
        id: 'l3sd-intro-q4',
        question: '短牌德州中，以下哪类牌价值相对提升最明显？',
        options: ['同花连牌', 'AK 等高牌', '小口袋对', '非同花小牌'],
        correctIndex: 1,
        explanation: '口袋对与大高张在短牌中价值上升，AK 是除 AA/KK/QQ/JJ 等对子外最强的起手牌。同花连牌可玩性好但不属于顶级梯队，小口袋对 set mine 价值反而下降。',
      },
      {
        id: 'l3sd-intro-q5',
        question: '短牌德州中，以下哪种牌型 beats 葫芦？',
        options: ['顺子', '三条', '同花', '两对'],
        correctIndex: 2,
        explanation: '短牌牌级：顺子 < 三条 < 葫芦 < 同花。四种选项中只有同花 beats 葫芦（短牌中同花 > 葫芦，与标准德州相反）。',
      },
    ],
    examples: [
      {
        id: 'l3sd-intro-ex1',
        title: '短牌中同花听牌的价值',
        heroHand: ['9h', '8h'],
        heroPosition: 'BTN',
        previousActions: [{ player: 'CO', action: 'raise 2 ante' }],
        street: 'flop',
        board: ['Ah', '7h', '6c'],
        effectiveStack: 100,
        potSize: 8,
        correctDecision: {
          action: 'Raise',
          amount: '12 ante',
          reasoning: [
            '你持有同花听牌（9h8h）+ 卡顺听牌（需要T组成6-7-8-9-T）',
            '短牌每花色仅 9 张：已见红心 Ah、7h 与手中 9h、8h 共 4 张，同花 outs = 9 - 4 = 5，另加 3 张非红心 T，合计约 8 个 outs',
            '短牌中同花 beats 葫芦，同花听牌价值极高',
            '半诈唬加注可以迫使对手弃牌或建立大底池',
          ],
        },
        commonMistake: {
          action: '仅跟注',
          reasoning:
            '在标准德州中仅跟注可能合理，但短牌中同花价值更高（beats葫芦），应该更积极地玩同花听牌。',
          evLoss: '-2.0 ante',
        },
      },
      {
        id: 'l3sd-intro-ex2',
        title: '短牌中小口袋对的处理',
        heroHand: ['7s', '7c'],
        heroPosition: 'CO',
        previousActions: [{ player: 'UTG', action: 'raise 2 ante' }],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 5,
        correctDecision: {
          action: 'Fold',
          reasoning: [
            '77 在短牌中 set mine 价值大幅下降',
            '短牌中三条牌级低于葫芦与同花，中了 set 也常被更强成牌压制',
            '对手 UTG open 范围在短牌中仍然偏强',
            '隐含赔率不足以支持 set mine',
          ],
        },
        commonMistake: {
          action: 'Call（set mine）',
          reasoning:
            '在标准德州中 77 call UTG open 是标准 set mine。但短牌中三条不再是最强牌型之一（葫芦和同花都 beats 它），set mine 的隐含赔率大幅下降。',
          evLoss: '-0.8 ante',
        },
      },
    ],
    practice: {
      id: 'l3sd-intro-practice',
      questions: [
        {
          id: 'l3sd-intro-p1',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Jh', 'Th'],
            heroPosition: 'BTN',
            previousActions: [{ player: 'CO', action: 'raise 2 ante' }],
            street: 'preflop',
            potSize: 5,
            effectiveStack: 100,
          },
          options: [
            {
              action: 'Fold',
              isCorrect: false,
              explanation: 'JTs 在短牌中可玩性好（顺子/同花听牌机会多），面对 CO open 不应弃牌。',
              evImpact: '-2.0 ante',
            },
            {
              action: 'Call',
              isCorrect: false,
              explanation: 'Call 太被动。JTs 在短牌有足够可玩性做 3-Bet 半诈唬。',
              evImpact: '+0.5 ante',
            },
            {
              action: 'Raise',
              amount: '6 ante',
              isCorrect: true,
              explanation:
                'JTs 可玩性好，3-Bet 建立大底池并利用翻后可玩性。注意：它不属于短牌顶级梯队（AA/KK/QQ/AK），翻后遇到强范围阻力要懂得收手。',
              evImpact: '+2.5 ante',
            },
          ],
          relatedLessonId: 'l3sd-intro',
        },
        {
          id: 'l3sd-intro-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ac', 'Kc'],
            heroPosition: 'BB',
            previousActions: [{ player: 'BTN', action: 'raise 2 ante' }],
            street: 'flop',
            board: ['Qc', '8c', '6h'],
            potSize: 6,
            effectiveStack: 98,
          },
          options: [
            {
              action: 'Check',
              isCorrect: false,
              explanation:
                '你有同花听牌 + 两个高牌，应该主动下注。短牌中同花价值极高。',
              evImpact: '-1.0 ante',
            },
            {
              action: 'Raise',
              amount: '5 ante',
              isCorrect: true,
              explanation:
                'AK 同花听牌 + 两张高牌在短牌翻牌上是强力半诈唬。同花 beats 葫芦使你的听牌价值极高。',
              evImpact: '+3.0 ante',
            },
            {
              action: 'Call',
              isCorrect: false,
              explanation: 'Call 太被动。你的牌有足够的 equity 做加注。',
              evImpact: '+0.5 ante',
            },
          ],
          relatedLessonId: 'l3sd-intro',
        },
        {
          id: 'l3sd-intro-p3',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['As', '6d'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'flop',
            board: ['7s', '8h', '9c'],
            potSize: 4,
            effectiveStack: 96,
          },
          options: [
            {
              action: 'Check',
              isCorrect: false,
              explanation:
                '你有 A-6-7-8-9 顺子！这是短牌中的合法最小顺子，应该价值下注。',
              evImpact: '-2.0 ante',
            },
            {
              action: 'Raise',
              amount: '3 ante',
              isCorrect: true,
              explanation:
                'A-6-7-8-9 是短牌中的合法顺子！下注获取价值。注意这是最小顺子，遭遇加注要警惕更大的顺子或葫芦/同花。',
              evImpact: '+2.0 ante',
            },
            {
              action: 'Fold',
              isCorrect: false,
              explanation: '你有顺子！绝对不要弃牌。',
              evImpact: '-4.0 ante',
            },
          ],
          relatedLessonId: 'l3sd-intro',
        },
        {
          id: 'l3sd-intro-p4',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ks', 'Kc'],
            heroPosition: 'BTN',
            previousActions: [{ player: 'CO', action: 'raise 2 ante' }],
            street: 'preflop',
            potSize: 5,
            effectiveStack: 100,
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'KK在短牌中是顶级强牌，不能弃牌。', evImpact: '-3.0 ante' },
            { action: 'Raise 6 ante', isCorrect: true, explanation: 'KK在短牌中是顶级强牌，3-Bet获取价值。', evImpact: '+2.5 ante' },
            { action: 'Call', isCorrect: false, explanation: 'KK足够强做3-Bet，Call太被动。', evImpact: '+1.0 ante' },
          ],
          relatedLessonId: 'l3sd-intro',
        },
        {
          id: 'l3sd-intro-p5',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['6s', '6c'],
            heroPosition: 'CO',
            previousActions: [{ player: 'UTG', action: 'raise 2 ante' }],
            street: 'flop',
            board: ['6h', '9h', 'Th'],
            potSize: 8,
            effectiveStack: 96,
          },
          options: [
            { action: 'Check', isCorrect: false, explanation: '中了set应该下注保护，听牌很多。', evImpact: '-1.5 ante' },
            { action: 'Raise 5 ante', isCorrect: true, explanation: '短牌中三条只压过顺子，输给葫芦与同花；牌面两张红心听牌很多，必须加注建立底池并保护手牌。', evImpact: '+2.0 ante' },
            { action: 'Fold', isCorrect: false, explanation: '中了set绝不能弃牌。', evImpact: '-4.0 ante' },
          ],
          relatedLessonId: 'l3sd-intro',
        },
      ],
    },
  },
  // ===== L3 翻后策略 =====
  {
    id: 'l3sd-cbet',
    level: 3,
    order: 1,
    title: '短牌持续下注',
    subtitle: '干燥牌面的高频 C-Bet 与短牌特有的湿滑牌面处理',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌 C-Bet：干燥面高频、湿滑面大注' },
      {
        type: 'text',
        content:
          '短牌持续下注（C-Bet）的基本逻辑与标准德州相同，但有两处短牌特有调整：(1) 干燥高牌面（如 K♠7♦2♣）可以高频 C-Bet——对手难中牌，小注即可偷池或薄价值；(2) 湿滑连接面（如 9♦8♣3♥）因短牌听牌密度高，必须用大尺度保护，而不是小注。',
      },
      {
        type: 'key-point',
        content: '短牌 C-Bet 铁律：干燥面 1/3 池高频（约 70%+）；湿滑面 2/3 池以上低频（约 30-40%）。湿润面小注给听牌太便宜，短牌听牌易成，必须大注保护。',
      },
      { type: 'heading', content: '干燥面高频 vs 湿滑面大注' },
      {
        type: 'text',
        content:
          '干燥高牌面（如 A♠9♦2♣）上，加注者范围占优、对手难中牌，用 1/3 池小注高频 C-Bet 让宽范围弱牌弃牌或薄价值。湿滑连接面（如 9♦8♣3♥、6♦7♣5♥）上，短牌顺子/听牌组合密度极高，加注者坚果优势下降，C-Bet 频率下调至 30-40%，且用 2/3 池以上大注保护超对与强成牌，让听牌付费。',
      },
      {
        type: 'example',
        content:
          '实例：短牌你（BTN）开池，BB 跟注，翻牌 K♠7♦2♣（干燥）。你是 aggressor，范围含大量 Kx，对手难中 K。用 1/3 池小注高频 C-Bet：KQ/KJ 薄价值、A 高半诈唬、小对子也下注——整个范围持续施压，BB 弱牌只能弃牌。',
      },
      {
        type: 'example',
        content:
          '实例二（湿滑面大注）：短牌同一底池，翻牌 9♦8♣3♥。此面 BB 防守范围含大量 9x/8x/听牌，坚果优势倒向 BB。你持 K♠K♦（超对）：仍领先但易被顺子/两对反超，用 2/3 池大注（底池 6 下注 4+）保护——让顺子/同花听牌付费，而不是给便宜价格。A 高、小对子等弱牌应 check 控池。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌湿润面小注 C-Bet 是错误。因为听牌密度高、易成，小注给听牌太便宜的价格，等于免费让对手追。湿润面必须用大尺度保护成牌，干燥面才用小注。',
      },
      {
        type: 'pro-tip',
        content: '短牌 C-Bet 速记：干燥面 1/3 池高频、湿滑面 2/3 池以上低频。先判断牌面湿度——牌面越连、越湿，C-Bet 频率越低、尺度越大。',
      },
    ],
    quiz: [
      {
        id: 'l3sd-cbet-q1',
        question: '短牌干燥高牌面（K♠7♦2♣）上，C-Bet 的倾向是：',
        options: [
          '1/3 池小注高频',
          '完全过牌',
          '超池全下',
          '低频只用坚果',
        ],
        correctIndex: 0,
        explanation: '干燥面对手难中牌，1/3 池小注高频 C-Bet 让宽范围弱牌弃牌或薄价值。',
      },
      {
        id: 'l3sd-cbet-q2',
        question: '短牌湿滑连接面（9♦8♣3♥）上，C-Bet 的正确处理是：',
        options: [
          '1/3 池小注高频',
          '2/3 池以上大注低频，保护成牌',
          '完全过牌',
          '无脑全下',
        ],
        correctIndex: 1,
        explanation: '湿滑面听牌密度高，小注给听牌太便宜，应用 2/3 池以上大注低频保护成牌。',
      },
      {
        id: 'l3sd-cbet-q3',
        question: '短牌湿润面 C-Bet 频率下调的原因是：',
        options: [
          '对手更强',
          '短牌听牌密度高，加注者坚果优势下降，且需大注保护',
          '牌发得慢',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '短牌湿润面顺子/听牌组合密度极高，加注者坚果优势下降，C-Bet 频率下调且用大注保护。',
      },
      {
        id: 'l3sd-cbet-q4',
        question: '短牌湿润面持超对（K♠K♦）在 9♦8♣3♥ 面，正确尺度是：',
        options: [
          '1/3 池小注',
          '2/3 池以上大注保护',
          '过牌',
          '立即弃牌',
        ],
        correctIndex: 1,
        explanation: '湿润面超对易被反超、听牌密度高，用 2/3 池以上大注保护，让听牌付费。',
      },
      {
        id: 'l3sd-cbet-q5',
        question: '短牌 C-Bet 尺度的核心判断依据是：',
        options: [
          '牌面湿度',
          '底池大小',
          '自己心情',
          '对手外貌',
        ],
        correctIndex: 0,
        explanation: '牌面越湿、越连，C-Bet 频率越低、尺度越大；干燥面高频小注。',
      },
    ],
    examples: [
      {
        id: 'l3sd-cbet-ex1',
        title: '短牌干燥面高频 C-Bet',
        heroHand: ['Qd', 'Jd'],
        heroPosition: 'BTN',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['Qs', '8h', '3c'],
        street: 'flop',
        effectiveStack: 100,
        potSize: 5,
        correctDecision: {
          action: 'Bet',
          amount: '1.7 ante（1/3 pot）',
          reasoning: [
            'QJ 在 Q-8-3 干燥面是顶对，范围优势在加注者',
            '1/3 池小注薄价值 + 让宽范围弱牌弃牌',
            '短牌干燥面对手中牌率低，高频 C-Bet 有效',
          ],
        },
        commonMistake: {
          action: 'Check',
          reasoning: '干燥面顶对是加注者标准 C-Bet 牌，check 让 BB 免费实现弱范围，浪费范围优势。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l3sd-cbet-practice',
      questions: [
        {
          id: 'l3sd-cbet-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ad', 'Kd'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Qh', '8c', '3s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check', isCorrect: false, explanation: 'AK 高牌在干燥面有下注价值，check 太被动。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: true, explanation: '干燥 Q 高面，AK 有高牌 + 后门改进空间，1/3 池持续施压。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'AK 高牌 All-in 过度，深筹码应用小注施压。', evImpact: '-1.5 ante', evLoss: 1.5 },
          ],
          relatedLessonId: 'l3sd-cbet',
        },
        {
          id: 'l3sd-cbet-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Kc', 'Kd'],
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
            { action: 'Bet 3.3 ante（2/3 pot）', isCorrect: true, explanation: '湿润连接面超对易被反超，2/3 池大注保护并让听牌付费。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '超对在湿润面仍是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l3sd-cbet',
        },
        {
          id: 'l3sd-cbet-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['7h', '8h'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['6d', '9c', '2s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '78 在 6-9-2 面有双卡顺 + 后门同花，fold 太弱。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: true, explanation: '78 有顺子听牌，1/3 池半诈唬持续施压，短牌听牌成牌价值高。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，1/3 池半诈唬即可建立优势。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l3sd-cbet',
        },
      ],
    },
  },
  {
    id: 'l3sd-donk',
    level: 3,
    order: 2,
    title: '短牌 Donk 下注',
    subtitle: '短牌翻牌率更高环境下的主动下注时机与频率',
    duration: '7 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌 Donk：少数但有力的主动下注' },
      {
        type: 'text',
        content:
          'Donk Bet（主动下注）指翻后 OOP 玩家在对手下注前先下注。标准德州中 donk 通常是错误（放弃过牌加注杠杆、范围失衡）；短牌中 donk 仍是少数（约 3%-5%），但在特定牌面（OOP 范围占优、坚果组合密集）是合理甚至最优的选择。短牌翻牌率高、听牌密度大，donk 的保护与价值下注意义被放大。',
      },
      {
        type: 'key-point',
        content: '短牌 Donk 铁律：只在"OOP 范围明显占优、坚果组合密集"的特定牌面使用（如 limp 底池中 OOP 击中两对/顺子密度高）。否则默认过牌保留 x/r 杠杆。',
      },
      { type: 'heading', content: 'Donk 的适用时机与风险' },
      {
        type: 'text',
        content:
          '短牌 donk 的两个适用时机：(1) 牌面利于 OOP 范围——如 OOP 防守范围含更多两对/顺子/同花组合时，主动下注保护权益；(2) 湿润面保护——OOP 击中强牌，donk 让对手听牌付费。风险：donk 范围天然偏强，被加注时无法平衡，且放弃 x/r 杠杆。所以 donk 是例外不是常态。',
      },
      {
        type: 'example',
        content:
          '实例：短牌你（BB）跟注 BTN 开池，翻牌 6♠7♦4♣（湿润连接面）。你持 7♠8♠（中对 + 顺子听牌），你的防守范围含大量 6x/7x/8x 与顺子听牌，坚果组合密集。BTN（IP）范围多是大牌，在此面错过。你主动 donk 下注半池：保护你的中对/听牌，让 BTN 的大牌弃牌或付费。此面 OOP 范围占优，donk 是合理选择。',
      },
      {
        type: 'example',
        content:
          '实例二（donk 风险）：短牌你（BB）跟注，翻牌 A♠K♦2♣（干燥高牌面）。此面 IP 的 BTN 范围含大量 Ax/Kx，你 OOP 范围劣势。若你 donk，被加注时进退两难、且放弃 x/r。正确做法是过牌，让 BTN 下注你再决定跟/加。干燥面 OOP 范围劣势，donk 是错误。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌 donk 不是"激进保护"的通用工具，而是"牌面归属"的特定选择。牌面利于 OOP 范围时 donk 合理，否则过牌保留 x/r。盲目 donk 会把范围失衡免费告示给对手。',
      },
      {
        type: 'pro-tip',
        content: '短牌 Donk 三问：(1) 这个牌面 OOP 范围占优吗？(2) 我 donk 后被加注能否应对？(3) 过牌保留 x/r 是否更优？三问后：范围占优且听牌密度高才 donk，否则过牌。',
      },
    ],
    quiz: [
      {
        id: 'l3sd-donk-q1',
        question: '短牌 Donk Bet 的正确理解是：',
        options: [
          '永远正确的激进打法',
          '只在 OOP 范围占优、坚果组合密集的特定牌面使用',
          '完全错误',
          '只在河牌使用',
        ],
        correctIndex: 1,
        explanation: '短牌 donk 是例外不是常态，只在 OOP 范围占优、坚果密集的特定牌面使用。',
      },
      {
        id: 'l3sd-donk-q2',
        question: '短牌 6♠7♦4♣ 湿润连接面，BB（OOP）持顺子听牌，donk 合理的原因是：',
        options: [
          'BB 牌更强',
          'BB 防守范围含大量两对/顺子/听牌，OOP 范围占优',
          '底池更大',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '湿润连接面 BB 防守范围含大量 6x/7x/顺子听牌，OOP 范围占优，donk 保护权益合理。',
      },
      {
        id: 'l3sd-donk-q3',
        question: '干燥高牌面（A♠K♦2♣）上 BB（OOP）持弱牌，donk 的风险是：',
        options: [
          '没有风险',
          'OOP 范围劣势，被加注进退两难且放弃 x/r 杠杆',
          '底池更小',
          'donk 更好',
        ],
        correctIndex: 1,
        explanation: '干燥面 OOP 范围劣势，donk 被加注进退两难、放弃 x/r，是错误。应过牌让 IP 下注。',
      },
      {
        id: 'l3sd-donk-q4',
        question: '短牌 donk 范围天然偏强，这带来的问题是：',
        options: [
          '没有问题',
          '被加注时无法平衡，且放弃 x/r 杠杆',
          '更容易赢',
          '范围更平衡',
        ],
        correctIndex: 1,
        explanation: 'donk 范围偏强，被加注时无法平衡，且放弃 x/r 杠杆，所以是例外不是常态。',
      },
      {
        id: 'l3sd-donk-q5',
        question: '短牌 donk 决策的核心判断是：',
        options: [
          '牌面归属（OOP 是否占优）',
          '底池大小',
          '自己心情',
          '对手外貌',
        ],
        correctIndex: 0,
        explanation: '短牌 donk 的核心是牌面归属——OOP 范围占优且听牌密度高才 donk，否则过牌。',
      },
    ],
    examples: [
      {
        id: 'l3sd-donk-ex1',
        title: '短牌湿润面 OOP 的 Donk',
        heroHand: ['7s', '8s'],
        heroPosition: 'BB',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['6h', '9c', '4d'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 5,
        correctDecision: {
          action: 'Donk Bet',
          amount: '2.5 ante（半池）',
          reasoning: [
            '78s 在 6-9-4 面有双卡顺 + 后门同花',
            'BB 防守范围含大量 6x/7x/9x，OOP 范围占优',
            '短牌湿润面主动下注保护权益，让 IP 大牌弃牌或付费',
          ],
        },
        commonMistake: {
          action: 'Check-Fold',
          reasoning: '湿润连接面 BB 范围占优，78 有顺子听牌价值，check-fold 太被动，donk 保护更优。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l3sd-donk-practice',
      questions: [
        {
          id: 'l3sd-donk-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['8d', '9d'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['7h', '6c', '2s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，湿润连接面' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '89 在 7-6-2 面有双卡顺 + 后门同花，fold 太弱。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Donk Bet 半池', isCorrect: true, explanation: '湿润连接面 BB 范围占优，89 有顺子听牌价值，donk 保护合理。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，半池 donk 即可建立优势。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l3sd-donk',
        },
        {
          id: 'l3sd-donk-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Jd', 'Th'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Ks', '7c', '2d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，干燥高牌面' },
          },
          options: [
            { action: 'Donk Bet', isCorrect: false, explanation: '干燥高牌面 IP 范围占优，OOP donk 是错误，应过牌保留 x/r。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Check', isCorrect: true, explanation: '干燥面 OOP 范围劣势，过牌让 IP 下注再决定，保留 x/r 杠杆。', evImpact: '+0.8 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'JT 高牌 All-in 过度。', evImpact: '-1.5 ante', evLoss: 1.5 },
          ],
          relatedLessonId: 'l3sd-donk',
        },
        {
          id: 'l3sd-donk-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['6c', '7c'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['8d', '9s', '4h'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check-Raise', isCorrect: false, explanation: '湿润面也可考虑 x/r，但 67 双卡顺价值，donk 保护权益更直接。', evImpact: '+0.5 ante', evLoss: 0.5 },
            { action: 'Donk Bet 半池', isCorrect: true, explanation: '67 在 8-9-4 面有顺子听牌，BB 范围占优，donk 保护合理。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '67 有顺子听牌，fold 太弱。', evImpact: '-1.0 ante', evLoss: 1 },
          ],
          relatedLessonId: 'l3sd-donk',
        },
      ],
    },
  },
  {
    id: 'l3sd-check-raise',
    level: 3,
    order: 3,
    title: '短牌过牌加注',
    subtitle: '用 Check-Raise 构建范围、保护强牌并应对高频下注',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌 Check-Raise：OOP 的关键杠杆' },
      {
        type: 'text',
        content:
          'Check-Raise（过牌加注）是 OOP 玩家翻后最重要的杠杆之一，短牌中尤其重要：因为听牌密度高、对手 C-Bet 频繁，短牌 OOP 用强成牌 + 强听牌构建两极化 x/r 范围，能压制对手下注频率、保护过牌跟注范围。短牌 x/r 半诈唬的价值因听牌成牌价值高而放大。',
      },
      {
        type: 'key-point',
        content: '短牌 x/r 铁律：x/r 范围由强成牌（坚果对子/两对/顺子/同花）+ 强听牌（同花/顺子听牌）构成，两极化。用半诈唬 x/r，被跟注有改进空间。',
      },
      { type: 'heading', content: 'x/r 的数学与应用' },
      {
        type: 'formula',
        content:
          '短牌 x/r 半诈唬的盈亏平衡（底池 P、对手 C-Bet B、你加注额 R）：\n\nEV(x/r) = f×P − (1−f)×[(1−E_win)×R − E_win×(P+R)]\n（f = 对手面对 x/r 的弃牌率，E_win = 被跟注后的胜率）\n\n实例：底池 6、对手 C-Bet 2、你 x/r 到 6，对手弃牌率 50%、你的顺子听牌被跟注后胜率 35%：\nEV = 0.5×6 − 0.5×[0.65×6 − 0.35×(6+6)] = 3 − 0.5×[3.9 − 4.2] = 3 + 0.15 = 3.15\n\n短牌半诈唬 x/r 的 EV 更高，因为听牌成牌价值大（同花/顺子）。（概念源自：《Short Deck Poker》x/r 与半诈唬）',
      },
      {
        type: 'text',
        content:
          '短牌 x/r 的应用场景：湿润面（听牌密度高）OOP 范围占优时，用顺子/同花听牌半诈唬 x/r；干燥面强成牌 x/r 榨取价值。x/r 既保护你的听牌，又让对手的宽范围 C-Bet 付出代价。',
      },
      {
        type: 'example',
        content:
          '实例：短牌你（BB）跟注 BTN 开池，翻牌 9♦7♣3♠。你持 8♠9♠（顶对 + 顺子听牌）。BTN C-Bet 2 ante，你 x/r 到 6 ante。若 BTN 弃牌你直接赢 8 ante；被跟注你有顶对 + 顺子听牌的改进空间。短牌湿润面 x/r 半诈唬保护你的边缘成牌，同时压制 BTN 的 C-Bet 频率。',
      },
      {
        type: 'example',
        content:
          '实例二（干燥面 x/r）：短牌翻牌 A♠K♦2♣，你（BB）持 22（暗三）。BTN C-Bet，你 x/r 榨取价值——对手范围含大量 Ax/Kx 会跟注你的暗三价值。短牌暗三虽非坚果（输给葫芦/同花），但在干燥面是强牌，x/r 价值下注合理。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌 x/r 不是"用强牌反击"，而是"两极化构建范围"。范围里既要强成牌也要强听牌半诈唬，否则对手能猜透你的 x/r 只有坚果并弃牌，或只有听牌并跟注。',
      },
      {
        type: 'pro-tip',
        content: '短牌 x/r 三问：(1) 我的 x/r 范围两极化了吗？（强成牌 + 强听牌）(2) 对手 C-Bet 频率高吗？（高则 x/r 更有效）(3) 被跟注我有改进空间吗？三问后构建平衡 x/r 范围。',
      },
    ],
    quiz: [
      {
        id: 'l3sd-check-raise-q1',
        question: '短牌 Check-Raise 的主要作用是什么？',
        options: [
          '只用强牌反击',
          '构建两极化范围，压制对手下注频率、保护跟注范围',
          '完全过牌',
          '只诈唬',
        ],
        correctIndex: 1,
        explanation: '短牌 x/r 用强成牌 + 强听牌构建两极化范围，压制对手 C-Bet 频率、保护过牌跟注范围。',
      },
      {
        id: 'l3sd-check-raise-q2',
        question: '短牌 x/r 范围的正确构成是：',
        options: [
          '只有强成牌',
          '强成牌 + 强听牌（半诈唬）',
          '只有听牌',
          '只有空气',
        ],
        correctIndex: 1,
        explanation: '短牌 x/r 范围两极化：强成牌榨取价值 + 强听牌半诈唬，被跟注有改进空间。',
      },
      {
        id: 'l3sd-check-raise-q3',
        question: '短牌湿润面（9♦7♣3♠）OOP 持顶对 + 顺子听牌，x/r 的价值是：',
        options: [
          '没有价值',
          '保护边缘成牌并压制对手 C-Bet 频率',
          'x/r 永远错误',
          '只该跟注',
        ],
        correctIndex: 1,
        explanation: '湿润面 OOP 持顶对 + 顺子听牌，x/r 保护边缘成牌、压制对手 C-Bet 频率，半诈唬有改进空间。',
      },
      {
        id: 'l3sd-check-raise-q4',
        question: '短牌干燥面（A♠K♦2♣）持暗三，x/r 的作用是：',
        options: [
          '保护听牌',
          '榨取价值，对手 Ax/Kx 会跟注',
          'x/r 是错误',
          '该弃牌',
        ],
        correctIndex: 1,
        explanation: '干燥面暗三是强牌，x/r 价值下注，对手范围含大量 Ax/Kx 会跟注。',
      },
      {
        id: 'l3sd-check-raise-q5',
        question: '"x/r 不是用强牌反击，而是两极化构建范围"的含义是：',
        options: [
          'x/r 只用强牌',
          '范围里既要有强成牌也要有强听牌半诈唬，否则被对手猜透',
          'x/r 只用听牌',
          'x/r 无意义',
        ],
        correctIndex: 1,
        explanation: 'x/r 范围必须两极化（强成牌 + 强听牌），否则只有坚果被弃牌、只有听牌被跟注。',
      },
    ],
    examples: [
      {
        id: 'l3sd-check-raise-ex1',
        title: '短牌湿润面 x/r 半诈唬',
        heroHand: ['8s', '9s'],
        heroPosition: 'BB',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['9h', '7d', '3c'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 5,
        correctDecision: {
          action: 'Check-Raise',
          amount: '6 ante',
          reasoning: [
            '89s 在 9-7-3 面是顶对 + 顺子听牌',
            '湿润面 BB 范围占优，x/r 保护边缘成牌',
            '被跟注有顶对 + 顺子听牌的改进空间（半诈唬）',
          ],
        },
        commonMistake: {
          action: 'Check-Call',
          reasoning: '湿润面顶对 + 顺子听牌 x/r 更优——保护权益、压制对手 C-Bet 频率，跟注太被动。',
          evLoss: '-0.8 ante',
        },
      },
    ],
    practice: {
      id: 'l3sd-check-raise-practice',
      questions: [
        {
          id: 'l3sd-check-raise-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['6h', '7h'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['8d', '5c', '2s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '67 在 8-5-2 面有双卡顺 + 后门同花，fold 太弱。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '67 有顺子听牌，x/r 半诈唬保护并施压。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'Donk Bet', isCorrect: false, explanation: 'OOP 应先 Check 让对手行动再 x/r，Donk 放弃 x/r 杠杆。', evImpact: '-0.5 ante', evLoss: 0.5 },
          ],
          relatedLessonId: 'l3sd-check-raise',
        },
        {
          id: 'l3sd-check-raise-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['As', 'Ks'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Kh', '8c', '3d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check-Raise', isCorrect: false, explanation: '顶对顶踢脚 x/r 赶走弱牌，干燥面应跟注控池保留诈唬。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Check-Call', isCorrect: true, explanation: '干燥面顶对跟注，保留对手诈唬并在 OOP 控池。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: '顶对顶踢脚是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l3sd-check-raise',
        },
        {
          id: 'l3sd-check-raise-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['9d', '9c'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9s', '7h', '6d'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，湿润连接面' },
          },
          options: [
            { action: 'Check-Call', isCorrect: false, explanation: '暗三在湿润面需保护，x/r 建立底池并让听牌付费。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Check-Raise', isCorrect: true, explanation: '暗三（非坚果但强）在湿润面 x/r，保护并建立底池。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: '暗三是强牌，fold 荒谬。', evImpact: '-3.0 ante', evLoss: 3 },
          ],
          relatedLessonId: 'l3sd-check-raise',
        },
      ],
    },
  },
];
