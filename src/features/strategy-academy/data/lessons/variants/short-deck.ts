import type { Lesson } from '../../../types';

/**
 * Short Deck（短牌）L3-L8 课程骨架（P2 变体支持，Day 3-4）。
 *
 * 36 张牌（移除 2-5）、三条 > 顺子、同花 > 葫芦、AA > KQ、6 人桌。
 * l3sd-intro 为标准课程纯化（2026-08-06）自 LEVEL_5_LESSONS 迁入的短牌入门课，
 * 内容已按主流 6+ 规则（PokerStars/Triton 口径）修正；其余课程为骨架，
 * 实际内容由后续任务（Day 5+）按设计文档第 5.2 节填充。
 * variant 显式声明为 'short-deck'；variantContext 标注典型浅筹码深度。
 */
export const SHORT_DECK_STRATEGY_COURSES: Lesson[] = [
  // ===== L3 短牌入门（自标准课程 L5 迁入，内容已按主流 6+ 规则修正）=====
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
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3sd-cbet-practice', questions: [] }, // 待填充
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
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3sd-donk-practice', questions: [] }, // 待填充
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
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3sd-check-raise-practice', questions: [] }, // 待填充
  },
  // ===== L4A 进阶思维 · 范围与 EV =====
  {
    id: 'l4sd-preflop-ranges',
    level: 4,
    order: 1,
    title: '短牌翻前范围',
    subtitle: '36 张牌环境下的起手牌价值重排与开局范围构建',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-preflop-ranges-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4sd-nuts-equity',
    level: 4,
    order: 2,
    title: '坚果与权益计算',
    subtitle: '短牌高权益环境下的坚果追逐、胜率修正与成牌概率',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-nuts-equity-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4sd-blocker-bluff',
    level: 4,
    order: 3,
    title: '阻断牌诈唬',
    subtitle: '短牌强牌密集环境下的阻断牌价值与诈唬选择',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-blocker-bluff-practice', questions: [] }, // 待填充
  },
  // ===== L4B 进阶思维 · GTO 与博弈论 =====
  {
    id: 'l4sd-gto-fundamentals',
    level: 4,
    order: 1,
    title: '短牌 GTO 基础',
    subtitle: '短牌博弈树差异、频率基准与 GTO 策略的适用边界',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-gto-fundamentals-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4sd-solver-readout',
    level: 4,
    order: 2,
    title: 'Solver 结果解读',
    subtitle: '阅读短牌 Solver 输出并提炼为可执行的实战策略',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4sd-solver-readout-practice', questions: [] }, // 待填充
  },
  // ===== L5 职业素养 =====
  {
    id: 'l5sd-bankroll',
    level: 5,
    order: 1,
    title: '短牌资金管理',
    subtitle: '高波动短牌局的风险控制、资金规则与升/降级纪律',
    duration: '7 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l5sd-bankroll-practice', questions: [] }, // 待填充
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
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l5sd-tilt-control-practice', questions: [] }, // 待填充
  },
  // ===== L6 锦标赛策略 =====
  {
    id: 'l6sd-tourney-i',
    level: 6,
    order: 1,
    title: '短牌锦标赛（一）',
    subtitle: '短牌 MTT 的筹码节奏、翻前攻防与生存策略',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 50 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l6sd-tourney-i-practice', questions: [] }, // 待填充
  },
  {
    id: 'l6sd-tourney-ii',
    level: 6,
    order: 2,
    title: '短牌锦标赛（二）',
    subtitle: '短牌 MTT 的 ICM、泡沫期与决赛桌调整',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 40 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l6sd-tourney-ii-practice', questions: [] }, // 待填充
  },
  // ===== L7 现金桌专项 =====
  {
    id: 'l7sd-deep-stack',
    level: 7,
    order: 1,
    title: '短牌深筹码',
    subtitle: '100BB+ 短牌深筹码策略、强牌价值提取与坚果对抗',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 150 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l7sd-deep-stack-practice', questions: [] }, // 待填充
  },
  {
    id: 'l7sd-shallow-stack',
    level: 7,
    order: 2,
    title: '短牌浅筹码',
    subtitle: '30BB 以下短筹码的 Push/Fold 与翻前全下策略',
    duration: '8 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 30 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l7sd-shallow-stack-practice', questions: [] }, // 待填充
  },
  // ===== L8 高级剥削策略 =====
  {
    id: 'l8sd-exploit-i',
    level: 8,
    order: 1,
    title: '短牌剥削（一）',
    subtitle: '针对短牌休闲玩家的范围剥削、下注尺度与频率调整',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l8sd-exploit-i-practice', questions: [] }, // 待填充
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
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l8sd-exploit-ii-practice', questions: [] }, // 待填充
  },
];
