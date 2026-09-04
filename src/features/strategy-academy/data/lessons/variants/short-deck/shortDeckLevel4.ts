import type { Lesson } from '../../../../types';

export const SHORT_DECK_LEVEL_4_LESSONS: Lesson[] = [
  {
    id: 'l4sd-preflop-ranges',
    level: 4,
    order: 1,
    title: '短牌翻前范围',
    subtitle: '36 张牌环境下的起手牌价值重排与开局范围构建',
    duration: '9 min',
    variant: 'short-deck',
    variantContext: { stackDepth: 100 },
    content: [
      { type: 'heading', content: '短牌翻前范围：起手牌价值重排' },
      {
        type: 'text',
        content:
          '短牌 36 张牌环境下，起手牌价值被重排：口袋对价值上升（三条牌级高、中牌概率 17.6%）、AK 是最强非对子但不击败对子、同花连牌可玩性好但次级。短牌翻前范围因此"对子与同花优先、非同花大高张相对降值"。',
      },
      {
        type: 'key-point',
        content: '短牌翻前范围铁律：对子（含小对子）与同花牌优先，AK 次级，非同花 AX 相对降值。构建范围时把更多组合配给对子/同花连牌。',
      },
      { type: 'heading', content: '短牌开局范围的分层' },
      {
        type: 'text',
        content:
          '短牌翻前开局范围分层：(1) 顶级——AA/KK/QQ（对子价值高，压制 AK）；(2) 次级价值——JJ-TT/AK（最强非对子）；(3) 投机层——99-22（set mining，三条价值高）/同花连牌 JTs+/同花 Ax。相比标准德州，短牌中小对子与同花连牌的比重上升，非同花 AX 的相对价值下降。',
      },
      {
        type: 'example',
        content:
          '实例：短牌 BTN 开池，你（BB）持 T♠9♠。T9s 在短牌范围中属投机层——能成同花（beats 葫芦）与顺子，可玩性好。面对 BTN 约 60% 开池范围，T9s 胜率不错且翻后潜力大，是标准跟注牌。若持 A♠K♦（非同花），则属次级价值——能中顶对，但翻牌对子密度高，顶对价值不如标准德州。',
      },
      {
        type: 'example',
        content:
          '实例二（3Bet 范围）：短牌你面对 BTN 开池，考虑 3Bet。3Bet 范围分两层：价值层（JJ+/AK）+ 诈唬层（A5s 等带阻断牌的牌——阻断 AA/AK，被 4Bet 可弃牌）。短牌中对子密度高，3Bet 价值层应含更多对子（因为对子 > AK）。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌中 AK 不是"翻硬币偏上"的强全下牌。它压制所有非对子、翻后能中顶对，但翻前全下对任何口袋对约 43%-45% 落后。把 AK 当成顶级强牌是标准德州惯性的最大误判。',
      },
      {
        type: 'pro-tip',
        content: '短牌翻前范围速记：顶级对子（AA/KK/QQ）+ 次级 AK + 投机对子/同花连牌。开池约 50%-60%（BTN），对子与同花优先。面对 3Bet 时，小对子与同花连牌应收紧（投机价值需隐含赔率）。',
      },
    ],
    quiz: [
      {
        id: 'l4sd-preflop-ranges-q1',
        question: '短牌翻前范围中，起手牌价值重排的核心是：',
        options: [
          'AK 最强',
          '对子与同花优先，非同花大高张相对降值',
          '同花连牌最强',
          '没有变化',
        ],
        correctIndex: 1,
        explanation: '短牌对子价值上升（三条牌级高）、同花价值提升，非同花大高张相对降值。',
      },
      {
        id: 'l4sd-preflop-ranges-q2',
        question: '短牌翻前范围中，投机层主要包括：',
        options: [
          'AA/KK',
          '99-22 对子 + 同花连牌 JTs+ + 同花 Ax',
          '非同花 AK/AQ',
          '垃圾牌',
        ],
        correctIndex: 1,
        explanation: '短牌投机层是小对子（set mining）+ 同花连牌 + 同花 Ax，利用三条与同花价值。',
      },
      {
        id: 'l4sd-preflop-ranges-q3',
        question: '短牌 BTN 面对短牌开池，T9s 的正确处理是：',
        options: [
          '弃牌',
          '标准跟注/开池牌，能成同花与顺子',
          '只 3Bet',
          '完全没用',
        ],
        correctIndex: 1,
        explanation: 'T9s 短牌可玩性好（成同花/顺子），是标准跟注/开池牌。',
      },
      {
        id: 'l4sd-preflop-ranges-q4',
        question: '短牌 3Bet 范围的价值层应包含：',
        options: [
          '只用 AK',
          '更多对子（对子 > AK）+ AK',
          '只用同花连牌',
          '只用小对子',
        ],
        correctIndex: 1,
        explanation: '短牌对子 > AK，3Bet 价值层应含更多对子（JJ+/AK），因为对子翻前全下更强。',
      },
      {
        id: 'l4sd-preflop-ranges-q5',
        question: '短牌中 AK 翻前全下对口袋对的胜率约为：',
        options: ['约 55%', '约 43%-45%', '约 70%', '约 35%'],
        correctIndex: 1,
        explanation: '短牌 AK 对口袋对约 43%-45% 落后，AK 是最强非对子但不击败对子。',
      },
    ],
    examples: [
      {
        id: 'l4sd-preflop-ranges-ex1',
        title: '短牌小对子的价值',
        heroHand: ['7s', '7c'],
        heroPosition: 'BB',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
        ],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 5,
        correctDecision: {
          action: 'Call',
          amount: '2 ante',
          reasoning: [
            '77 短牌 set mining 价值上升（三条牌级高）',
            '中三条概率约 17.6%（满员桌 12%）',
            '面对 BTN 宽开池，隐含赔率足够，跟注',
          ],
        },
        commonMistake: {
          action: 'Fold（"77 太小"）',
          reasoning: '短牌小对子 set mining 价值高于满员桌（三条牌级上升），fold 太紧。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l4sd-preflop-ranges-practice',
      questions: [
        {
          id: 'l4sd-preflop-ranges-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['9c', '9d'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
            ],
            street: 'preflop',
            potSize: 5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: '99 短牌 set mining 价值高，fold 太紧。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Call', isCorrect: true, explanation: '99 小对子短牌价值上升，面对 BTN 宽开池跟注 set mining。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: '3-Bet', isCorrect: false, explanation: '99 偏投机，跟注 set mining 更优，3-Bet 可偶尔混合。', evImpact: '+0.3 ante', evLoss: 0.3 },
          ],
          relatedLessonId: 'l4sd-preflop-ranges',
        },
        {
          id: 'l4sd-preflop-ranges-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['As', 'Ks'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: '3-bet to 6 ante' },
            ],
            street: 'preflop',
            potSize: 9,
            effectiveStack: 90,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'AK 是最强非对子，3Bet 后不应弃牌。', evImpact: '-2.0 ante', evLoss: 2 },
            { action: 'Call 4 ante', isCorrect: true, explanation: 'AK 面对 BTN 4Bet 范围，跟注看翻后（中顶对价值），或 5Bet 全下看对手。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'AK 对口袋对落后，若 BTN 4Bet 范围含多对子，全下需谨慎。', evImpact: '-0.5 ante', evLoss: 0.5 },
          ],
          relatedLessonId: 'l4sd-preflop-ranges',
        },
        {
          id: 'l4sd-preflop-ranges-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Ad', '5d'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: '3-bet to 6 ante' },
            ],
            street: 'preflop',
            potSize: 9,
            effectiveStack: 90,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BTN 面对 3-Bet 弃牌率高' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'A5s 是标准 3Bet 诈唬牌（阻断 AA/AK），有弃牌率支撑。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Call', isCorrect: false, explanation: 'A5s 3Bet 后被 4Bet 可干净弃牌，跟注不是主要用途。', evImpact: '+0.3 ante', evLoss: 0.3 },
            { action: '3-Bet', isCorrect: true, explanation: 'A5s 阻断 AA/AK，BTN 弃牌率高，3Bet 诈唬标准。', evImpact: '+1.5 ante', evLoss: 0 },
          ],
          relatedLessonId: 'l4sd-preflop-ranges',
        },
      ],
    },
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
    content: [
      { type: 'heading', content: '短牌权益：高价值听牌的追逐' },
      {
        type: 'text',
        content:
          '短牌中权益（Equity）计算的核心调整是 outs 按 36 张牌重算（每花色 9 张）。同花听牌 outs = 9 − 已见该花色数，单街命中率用"outs ÷ 33"估算。短牌虽 outs 绝对数字低，但成牌价值高（同花/顺子常是坚果），追逐坚果的隐含赔率极佳。',
      },
      {
        type: 'key-point',
        content: '短牌权益铁律：outs 按 36 张重算（同花 = 9 − 已见该花色），但成牌价值高（同花 beats 葫芦）→ 追逐坚果听牌的隐含赔率极佳。',
      },
      { type: 'heading', content: '短牌胜率修正与成牌概率' },
      {
        type: 'formula',
        content:
          '短牌 outs 与胜率修正：\n\n同花听牌 outs = 9 − 已见该花色数（手持 2 + 牌面 2 → 5）\n单街命中率 = outs ÷ 33（翻牌后）\n\n实例：同花听牌 5 outs → 单街 5/33 ≈ 15%，双街约 28%\n顺子听牌 8 outs → 单街 8/33 ≈ 24%，双街约 44%\n\n2/4 法则按 36 张修正：短牌用"outs × 2"看单街更准，双街 outs×4 会高估。\n\n成牌价值：同花（beats 葫芦）/顺子常是坚果 → 追逐的隐含赔率极佳。（概念源自：《Short Deck Poker》outs 与权益）',
      },
      {
        type: 'text',
        content:
          '短牌权益计算的实践：虽然短牌听牌胜率绝对数字低于满员桌（outs 少），但成牌价值高——同花/顺子常是坚果级。所以追坚果听牌（同花/顺子）的隐含赔率极佳，跟注与半诈唬都有利。关键是用短牌修正后的 outs，而非满员桌 outs 表。',
      },
      {
        type: 'example',
        content:
          '实例：短牌你持 A♥K♥，翻牌 9♥7♥2♣。你听同花：已见红心 A♥K♥ + 牌面 9♥7♥ = 4 张，同花 outs = 9 − 4 = 5。对手下注半池，你跟注需 25% 胜率。你的同花 5 outs 单街 15%，但双街约 28%，且成同花是坚果（beats 葫芦）。加隐含赔率（成同花后榨取大锅），跟注 +EV，甚至可考虑加注半诈唬。',
      },
      {
        type: 'example',
        content:
          '实例二（坚果追逐）：短牌你持 8♠9♠，翻牌 6♦7♣2♥。你听 5 或 T 组成顺子（8 个 Outs，但 6、7 已见，5/T 各 4 张 = 8）。此顺子（5-6-7-8-9 或 6-7-8-9-T）是短牌强顺，只输给葫芦/同花/三条。双街约 44%，且成顺后接近坚果。跟注与半诈唬都极佳。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌同花 outs 只有 5 个（满员桌 9 个），胜率绝对数字低——但成牌是坚果级（beats 葫芦），一旦成牌基本锁定底池。"outs 少"不等于"听牌弱"，关键是成牌后的相对强度。',
      },
      {
        type: 'pro-tip',
        content: '短牌权益速算：同花 5 outs ≈ 15% 单街、28% 双街；顺子 8 outs ≈ 24% 单街、44% 双街。背熟后结合"成牌是坚果"判断追不追。',
      },
    ],
    quiz: [
      {
        id: 'l4sd-nuts-equity-q1',
        question: '短牌同花听牌 outs 的正确计算是：',
        options: [
          '恒为 9',
          '9 − 已见该花色张数',
          '13 − 已见该花色张数',
          '恒为 5',
        ],
        correctIndex: 1,
        explanation: '短牌每花色仅 9 张，同花 outs = 9 − 已见该花色张数。',
      },
      {
        id: 'l4sd-nuts-equity-q2',
        question: '短牌手持 2 张红心 + 牌面 2 张红心，同花 outs 为：',
        options: ['9', '5', '7', '4'],
        correctIndex: 1,
        explanation: '9 − 4（已见 4 张红心）= 5。',
      },
      {
        id: 'l4sd-nuts-equity-q3',
        question: '短牌顺子听牌（8 outs）双街命中率约为：',
        options: ['约 24%', '约 44%', '约 30%', '约 55%'],
        correctIndex: 1,
        explanation: '短牌顺子 8 outs 双街约 44%，远高于单街的 24%。',
      },
      {
        id: 'l4sd-nuts-equity-q4',
        question: '短牌同花听牌（5 outs）胜率低但价值高的原因是：',
        options: [
          '底池更大',
          '成同花是坚果级（beats 葫芦），隐含赔率极佳',
          'outs 更多',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '短牌同花 beats 葫芦，成牌后是接近坚果的强牌，隐含赔率极佳。',
      },
      {
        id: 'l4sd-nuts-equity-q5',
        question: '短牌翻牌后单街命中率的口算基准是：',
        options: ['outs ÷ 47', 'outs ÷ 33', 'outs ÷ 36', 'outs ÷ 52'],
        correctIndex: 1,
        explanation: '短牌翻牌后剩余约 33 张，单街命中率用 outs ÷ 33 粗估。47 是满员桌的。',
      },
    ],
    examples: [
      {
        id: 'l4sd-nuts-equity-ex1',
        title: '短牌同花听牌的追逐',
        heroHand: ['Ah', 'Kh'],
        heroPosition: 'BTN',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['9h', '7h', '2c'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 5,
        correctDecision: {
          action: 'Call',
          amount: '2.5 ante',
          reasoning: [
            'AK 同花听牌：已见 4 张红心，outs = 9 − 4 = 5',
            '双街约 28% + A/K 高张 Outs，隐含赔率极佳',
            '成同花是坚果（beats 葫芦），值得追逐',
          ],
        },
        commonMistake: {
          action: 'Fold（"outs 太少"）',
          reasoning: '短牌同花 outs 少但成牌是坚果，隐含赔率极佳，fold 浪费高价值听牌。',
          evLoss: '-1.5 ante',
        },
      },
    ],
    practice: {
      id: 'l4sd-nuts-equity-practice',
      questions: [
        {
          id: 'l4sd-nuts-equity-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ad', 'Kd'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9d', '8d', '2h'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'AK 同花听牌（outs 5）+ A/K 高张，价值高，fold 太弱。', evImpact: '-1.5 ante', evLoss: 1.5 },
            { action: 'Call 2.5 ante', isCorrect: true, explanation: '同花听牌 5 outs + 高张，隐含赔率极佳，跟注追坚果。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '深筹码听牌 All-in 过度，跟注或半诈唬加注即可。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l4sd-nuts-equity',
        },
        {
          id: 'l4sd-nuts-equity-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['8s', '9s'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['6d', '7c', '2h'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '89 在 6-7-2 面有顺子听牌（5/T 共 8 outs），fold 太弱。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '顺子听牌 8 outs 双街约 44%，x/r 半诈唬保护并施压。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，x/r 建立优势即可。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l4sd-nuts-equity',
        },
        {
          id: 'l4sd-nuts-equity-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['7h', '8h'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '6d', '3s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check', isCorrect: false, explanation: '78 有顺子听牌（5/T 共 8 outs）+ 后门同花，应主动下注半诈唬。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Bet 2.5 ante（半池）', isCorrect: true, explanation: '顺子听牌 8 outs + 后门同花，半池半诈唬，短牌成牌价值高。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，半池建立优势即可。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l4sd-nuts-equity',
        },
      ],
    },
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
    content: [
      { type: 'heading', content: '短牌阻断牌：强牌密集环境的价值' },
      {
        type: 'text',
        content:
          '阻断牌（Blocker）指你持有的牌减少对手特定组合数。短牌中阻断牌价值被放大：因为同花价值极高（beats 葫芦）且对子密度高，阻断对手的同花/对子组合对诈唬与跟注决策影响更大。持 A♠ 时对手的 A♠X♠ 坚果同花被完全阻断——这在短牌中价值极高。',
      },
      {
        type: 'key-point',
        content: '短牌阻断牌铁律：持 A 高阻断坚果同花（对手 A♥X♥ 组合为 0）；持对子阻断对手对子。短牌同花/对子价值高，阻断它们对诈唬成功率影响巨大。',
      },
      { type: 'heading', content: '阻断牌诈唬的运用' },
      {
        type: 'text',
        content:
          '短牌阻断牌诈唬的运用：(1) 诈唬阻断——持 A♠ 时对手坚果同花 A♠X♠ 为 0，诈唬成功率上升；(2) 翻前 3Bet 选择——持 A 高阻断 AA/AK，被 4Bet 概率下降。短牌因同花/对子价值高，这些阻断效果被放大，诈唬选择要优先带阻断牌的牌。',
      },
      {
        type: 'example',
        content:
          '实例：短牌翻牌三张黑桃 K♠9♠4♠，你持 A♦A♣（无黑桃 A）。你不阻断任何同花，对手可能有 A♠X♠ 坚果同花或更小同花。你的 AA 抓诈唬价值下降，倾向弃牌。相反，若你持 A♠（无黑桃成牌），你阻断了坚果同花 A♠X♠ 全部组合，对手"最强牌"被证伪——你的诈唬或跟注成功率上升。',
      },
      {
        type: 'example',
        content:
          '实例二（翻前阻断）：短牌你（BB）面对 BTN 开池，考虑 3Bet 诈唬。持 A♦5♦ 与 7♦6♦ 的区别：A5s 的 A 阻断对手的 AA 与 AK（顶级强牌变少，被 4Bet 概率下降），且被 4Bet 后 A5s 可干净弃牌；76s 不阻断任何强牌，被 4Bet 时更常撞上 QQ+。短牌中对子密度高，A 高阻断价值更明显。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌阻断牌是边际工具，不是万能钥匙。持 A♠ 诈唬成功率上升，但不保证成功；用它推翻基础范围分析是滥用。短牌中价值大（同花/对子价值高），但仍是"基础范围对了之后"的锦上添花。',
      },
      {
        type: 'pro-tip',
        content: '短牌阻断牌速记：三张同花面持 A♠ → 阻断坚果同花，诈唬/跟注加分；持对子 → 阻断对手对子。离桌练习：随机摆三张同花面，数"对手坚果同花"在你持 A♠ 与不持时的差异。',
      },
    ],
    quiz: [
      {
        id: 'l4sd-blocker-bluff-q1',
        question: '短牌中阻断牌的特殊价值源于：',
        options: [
          '底池更大',
          '同花价值极高（beats 葫芦）且对子密度高',
          '牌发得慢',
          '没有原因',
        ],
        correctIndex: 1,
        explanation: '短牌同花价值极高（beats 葫芦）、对子密度高，阻断同花/对子的挡牌效果被放大。',
      },
      {
        id: 'l4sd-blocker-bluff-q2',
        question: '三张黑桃面持 A♠，对对手坚果同花组合的影响是：',
        options: [
          '无影响',
          '完全阻断（对手 A♠X♠ 为 0），诈唬成功率上升',
          '增加对手组合',
          '让对手更强',
        ],
        correctIndex: 1,
        explanation: '持 A♠ 使对手 A♠X♠ 坚果同花组合数为 0，最强的跟注/反加牌被削减，诈唬成功率上升。',
      },
      {
        id: 'l4sd-blocker-bluff-q3',
        question: '短牌翻前 3Bet 诈唬，为什么 A5s 优于 76s？',
        options: [
          'A5s 阻断 AA/AK，被 4Bet 概率下降',
          '76s 阻断更多强牌',
          'A5s 牌力更强',
          '没有区别',
        ],
        correctIndex: 0,
        explanation: 'A5s 的 A 阻断对手 AA/AK，降低被 4Bet 频率；76s 不阻断强牌，撞上 QQ+ 概率更高。',
      },
      {
        id: 'l4sd-blocker-bluff-q4',
        question: '短牌中阻断牌的适用边界是：',
        options: [
          '可以推翻任何基础分析',
          '是边缘局面的边际工具，需建立在正确基础范围之上',
          '只在翻前有效',
          '只用于跟注',
        ],
        correctIndex: 1,
        explanation: '阻断牌调整组合比例而非改写范围，基础范围正确时锦上添花，基础错误时无法救你。',
      },
      {
        id: 'l4sd-blocker-bluff-q5',
        question: '三张黑桃面持 A♦A♣（无黑桃 A），面对对手下注的正确倾向是：',
        options: [
          '无脑跟注',
          '谨慎——不阻断同花，对手跟注范围偏强',
          '加注诈唬',
          '直接全下',
        ],
        correctIndex: 1,
        explanation: '不持 A♠ 时你不阻断同花，对手可能拿 A♠X♠ 坚果或更小同花，抓诈唬价值下降。',
      },
    ],
    examples: [
      {
        id: 'l4sd-blocker-bluff-ex1',
        title: '短牌 A 高阻断同花的诈唬',
        heroHand: ['As', '5d'],
        heroPosition: 'BTN',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
          { player: 'BB', action: 'call' },
        ],
        board: ['Ks', '9s', '4h'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 5,
        correctDecision: {
          action: 'Bet',
          amount: '3.3 ante（2/3 pot）',
          reasoning: [
            '持 A♠ 阻断坚果同花 A♠X♠ 全部组合',
            '对手"最强牌"被证伪，诈唬成功率上升',
            '短牌同花价值高，阻断效果放大',
          ],
        },
        commonMistake: {
          action: 'Check',
          reasoning: '持 A♠ 阻断坚果同花，诈唬价值高，check 浪费阻断优势。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l4sd-blocker-bluff-practice',
      questions: [
        {
          id: 'l4sd-blocker-bluff-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ad', '6c'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Qd', '8d', '3s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，两张方块' },
          },
          options: [
            { action: 'Check', isCorrect: false, explanation: 'A6 有后门同花 + 高张，可半诈唬，check 太被动。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: true, explanation: 'A6 高牌 + 后门同花，1/3 池半诈唬，短牌成牌价值高。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'A 高 All-in 过度，小注半诈唬即可。', evImpact: '-1.5 ante', evLoss: 1.5 },
          ],
          relatedLessonId: 'l4sd-blocker-bluff',
        },
        {
          id: 'l4sd-blocker-bluff-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['As', '5s'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
            ],
            street: 'preflop',
            potSize: 3,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，BTN 面对 3-Bet 弃牌率高' },
          },
          options: [
            { action: 'Call', isCorrect: false, explanation: 'A5s 是标准 3Bet 诈唬牌，跟注浪费阻断优势。', evImpact: '+0.3 ante', evLoss: 0.3 },
            { action: '3-Bet', isCorrect: true, explanation: 'A5s 阻断 AA/AK，BTN 弃牌率高，3Bet 诈唬标准。', evImpact: '+1.5 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'A5s 有阻断价值 + 弃牌率支撑，fold 太紧。', evImpact: '-0.8 ante', evLoss: 0.8 },
          ],
          relatedLessonId: 'l4sd-blocker-bluff',
        },
        {
          id: 'l4sd-blocker-bluff-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Kh', 'Qh'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '7h', '2c'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，三张红桃' },
          },
          options: [
            { action: 'Check-Call', isCorrect: false, explanation: 'KQ 同花听牌 + 高张，x/r 半诈唬更优。', evImpact: '+0.5 ante', evLoss: 0.5 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: 'K♥ 阻断对手 K♥X♥ 同花，同花听牌 6 outs（9−3已见），半诈唬保护。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'KQ 同花听牌价值高，fold 太弱。', evImpact: '-1.5 ante', evLoss: 1.5 },
          ],
          relatedLessonId: 'l4sd-blocker-bluff',
        },
      ],
    },
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
    content: [
      { type: 'heading', content: '短牌 GTO：博弈树与频率的适配' },
      {
        type: 'text',
        content:
          '短牌 GTO（博弈论最优）与标准德州的核心差异在于博弈树结构与成牌分布：对子密度高、同花价值大、听牌常见，导致均衡的下注频率更高、极化更明显、下注尺度可更大。理解这些差异，是应用短牌 GTO 的前提。',
      },
      {
        type: 'key-point',
        content: '短牌 GTO 定位是"防弹背心"：保证你不被剥削，但不承诺赚最多。面对漏洞对手，针对性剥削赚更多——代价是打开漏洞。短牌高手在"穿背心"与"换刀"间切换。',
      },
      { type: 'heading', content: '短牌频率基准的调整' },
      {
        type: 'formula',
        content:
          '短牌价值:诈唬比与 MDF（公式不变，输入调整）：\n\n价值:诈唬比 = b/(1+2b)\n满池：1/3 诈唬（2:1）\n半池：1/4 诈唬（3:1）\n\nMDF = 1/(1+b)：半池防 67%、满池防 50%\n\n短牌调整点：\n1. 成牌价值高（同花/顺子）→ 价值下注可更大尺度\n2. 听牌常见 → 诈唬密度可略高（用强听牌半诈唬）\n3. 对子密度高 → 防守范围含更多对子，MDF 可支撑更高\n\n概念源自：《Short Deck Poker》GTO 频率与 6+ 结构',
      },
      {
        type: 'text',
        content:
          '短牌 GTO 的实践：因为同花/顺子成牌价值高、听牌常见，短牌的下注范围更极化（强成牌 + 半诈唬听牌），且下注尺度可以更大（大注榨取成牌价值）。但频率平衡仍是核心——诈唬与价值的比例、防守的 MDF 都要合理，否则被对手反制。',
      },
      {
        type: 'example',
        content:
          '实例：短牌河牌满池下注，均衡价值:诈唬比 2:1。你持同花（价值）与顺子听牌未中（诈唬）混合下注。若你只用同花下注（诈唬 0%），对手对你的满池全弃即可剥削你；若诈唬过半，对手全跟剥削你。均衡比例让对手左右为难。',
      },
      {
        type: 'example',
        content:
          '实例二（最小必要偏离）：你观察到短牌对手河牌面对大注只跟注 25%（均衡约 50%）。据此你可整体上调河牌超池诈唬频率——但幅度以"他若修正到 40% 你仍不亏"为限。这就是"以 GTO 为基线、按可观测偏差做有纪律的偏离"。',
      },
      {
        type: 'highlight',
        content: '反直觉点：短牌 GTO 不是"打得紧"，而是"让一切保持在对手无法反制的比例上"。短牌 GTO 充满高频下注、超池全下与半诈唬——只是因为成牌价值高、听牌常见，均衡频率看起来更"激进"。',
      },
      {
        type: 'pro-tip',
        content: '短牌 GTO 学习路径：先用求解器理解均衡"形状"，再用节点锁定研究"对手常见漏洞的收割方案"，最后实战验证。基线给你不败之地，偏离给你利润空间。',
      },
    ],
    quiz: [
      {
        id: 'l4sd-gto-fundamentals-q1',
        question: '短牌 GTO 与标准德州的核心差异是：',
        options: [
          '短牌更紧',
          '成牌价值高、听牌常见，下注范围更极化、尺度可更大',
          '完全相同',
          '短牌无 GTO',
        ],
        correctIndex: 1,
        explanation: '短牌同花/顺子价值高、听牌常见，下注范围更极化、尺度可更大，频率基准调整。',
      },
      {
        id: 'l4sd-gto-fundamentals-q2',
        question: '短牌河牌满池下注的均衡价值:诈唬比约为：',
        options: ['1:1', '2:1', '3:1', '4:1'],
        correctIndex: 1,
        explanation: '诈唬占比 b/(1+2b) = 1/3，价值:诈唬 = 2:1。',
      },
      {
        id: 'l4sd-gto-fundamentals-q3',
        question: '面对半池下注，MDF（最小防御频率）约为：',
        options: ['50%', '67%', '75%', '33%'],
        correctIndex: 1,
        explanation: 'MDF = 1/(1+0.5) = 2/3 ≈ 67%。',
      },
      {
        id: 'l4sd-gto-fundamentals-q4',
        question: '你观察到短牌对手河牌面对大注只跟注 25%（均衡 50%），正确反制是：',
        options: [
          '无脑加诈唬',
          '上调诈唬频率，但以"对手修正到 40% 你仍不亏"为限',
          '减少下注',
          '完全停手',
        ],
        correctIndex: 1,
        explanation: '对手弃牌过多，上调诈唬频率，但幅度有纪律上限，保留回基线空间。',
      },
      {
        id: 'l4sd-gto-fundamentals-q5',
        question: '"短牌 GTO 不是打得紧"的含义是：',
        options: [
          'GTO 就是紧',
          '均衡包含高频下注与半诈唬，只是让一切保持对手无法反制的比例',
          'GTO 就是松',
          'GTO 无意义',
        ],
        correctIndex: 1,
        explanation: '短牌 GTO 充满高频下注、超池与半诈唬，关键是比例平衡，不是"打得紧"。',
      },
    ],
    examples: [
      {
        id: 'l4sd-gto-fundamentals-ex1',
        title: '短牌均衡防守',
        heroHand: ['Td', '9d'],
        heroPosition: 'BB',
        previousActions: [
          { player: 'BTN', action: 'raise 2 ante' },
        ],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 3,
        correctDecision: {
          action: 'Call',
          amount: '2 ante',
          reasoning: [
            'T9s 短牌可玩性好（成同花/顺子），是均衡防守范围成员',
            '面对 BTN 宽开池，跟注 EV 为正',
            'BB 有翻后位置，可便宜实现权益',
          ],
        },
        commonMistake: {
          action: 'Fold（"T9s 太弱"）',
          reasoning: '短牌同花连牌价值高，T9s 是标准跟注牌，fold 太紧。',
          evLoss: '-1.0 ante',
        },
      },
    ],
    practice: {
      id: 'l4sd-gto-fundamentals-practice',
      questions: [
        {
          id: 'l4sd-gto-fundamentals-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['9c', '9d'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
            ],
            street: 'preflop',
            potSize: 3,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: '99 短牌价值高，fold 太紧。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Call', isCorrect: true, explanation: '99 小对子短牌 set mining 价值上升，均衡防守。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: '3-Bet', isCorrect: false, explanation: '99 偏投机，跟注 set mining 更优，3-Bet 可偶尔混合。', evImpact: '+0.3 ante', evLoss: 0.3 },
          ],
          relatedLessonId: 'l4sd-gto-fundamentals',
        },
        {
          id: 'l4sd-gto-fundamentals-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ah', 'Kh'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: '3-bet to 6 ante' },
              { player: 'BTN', action: 'call' },
            ],
            board: ['Kd', '8c', '3h'],
            street: 'flop',
            potSize: 13,
            effectiveStack: 90,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，3-Bet 底池' },
          },
          options: [
            { action: 'Bet 4.3 ante（1/3 pot）', isCorrect: true, explanation: 'AK 顶对顶踢脚，短牌成牌价值高，IP 小注薄价值。', evImpact: '+2.0 ante', evLoss: 0 },
            { action: 'Check', isCorrect: false, explanation: '顶对顶踢脚应下注，check 太被动。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'All-in', isCorrect: false, explanation: '干燥面顶对 All-in 过度，小注即可。', evImpact: '-0.5 ante', evLoss: 0.5 },
          ],
          relatedLessonId: 'l4sd-gto-fundamentals',
        },
        {
          id: 'l4sd-gto-fundamentals-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Qs', 'Js'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Jd', '7c', '2h'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check-Call', isCorrect: true, explanation: 'QJ 顶对，IP 跟注保留对手诈唬，干燥面控制底池。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'Check-Raise', isCorrect: false, explanation: '顶对 x/r 赶走弱牌，干燥面应跟注控池。', evImpact: '-0.8 ante', evLoss: 0.8 },
            { action: 'Fold', isCorrect: false, explanation: 'QJ 顶对是强牌，fold 太弱。', evImpact: '-2.0 ante', evLoss: 2 },
          ],
          relatedLessonId: 'l4sd-gto-fundamentals',
        },
      ],
    },
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
    content: [
      { type: 'heading', content: '短牌 Solver：解读输出的方法论' },
      {
        type: 'text',
        content:
          'Solver（求解器）通过迭代逼近短牌均衡策略，输出每个节点上每手牌的动作频率与尺度。短牌 Solver 结果与标准德州有差异（范围更极化、下注尺度更大、半诈唬更多），解读的关键不是背频率，而是理解"为什么"。',
      },
      {
        type: 'key-point',
        content: '解读短牌 Solver 三问：为什么这个牌面用这个尺度？为什么这手牌进下注范围？为什么转牌后频率变了？理解结构，频率自然会记住。',
      },
      { type: 'heading', content: '短牌 Solver 输出特征' },
      {
        type: 'text',
        content:
          '短牌 Solver 输出的常见特征：(1) 下注范围更极化——强成牌 + 强听牌半诈唬，中间牌过牌；(2) 尺度偏大——湿润面 2/3 池以上保护成牌；(3) 半诈唬频率高——同花/顺子听牌价值大，被跟注有改进空间。识别这些特征，你就能把 Solver 输出转化为实战策略。',
      },
      {
        type: 'example',
        content:
          '实例：短牌 Solver 在翻牌 9♦8♣3♥（湿润面）输出：超对（KK/QQ）用 2/3 池以上下注保护，A 高与中小对子过牌，顺子/同花听牌混合半诈唬下注。理解后提炼为：湿润面强成牌大注保护、听牌半诈唬、中等牌过牌。这就是把 Solver 转化为可执行策略。',
      },
      {
        type: 'example',
        content:
          '实例二（转牌频率变化）：短牌 Solver 在转牌完成对手听牌时（如出同花/顺子面）下调开火频率。理解后提炼为：转牌河牌牌面易手时，即使你领先也要下调下注频率——因为对手范围里能击败你的组合变多了。',
      },
      {
        type: 'highlight',
        content: '反直觉点：Solver 不是"答案"，而是"坐标系"。背 Solver 频率会忘记，理解结构才能迁移到不同牌面。短牌高手的标志是"用 Solver 理解为什么"，而非"抄 Solver 怎么做"。',
      },
      {
        type: 'pro-tip',
        content: '解读 Solver 五步：(1) 看下注范围结构（价值/半诈唬/过牌比例）；(2) 看尺度分布（为何用这个尺度）；(3) 看街间变化（转牌河牌频率如何变）；(4) 提炼一条可复用原则；(5) 实战验证。每解读一个牌面，你的短牌框架就完整一分。',
      },
    ],
    quiz: [
      {
        id: 'l4sd-solver-readout-q1',
        question: '短牌 Solver 输出的常见特征是：',
        options: [
          '范围线性不极化',
          '下注范围极化、尺度偏大、半诈唬频率高',
          '尺度总是小注',
          '从无半诈唬',
        ],
        correctIndex: 1,
        explanation: '短牌 Solver 输出范围极化、尺度偏大、半诈唬频率高，因成牌价值高、听牌常见。',
      },
      {
        id: 'l4sd-solver-readout-q2',
        question: '解读短牌 Solver 的核心是：',
        options: [
          '背每个频率',
          '理解"为什么"（尺度/范围/街间逻辑）',
          '只抄尺度',
          '忽略频率',
        ],
        correctIndex: 1,
        explanation: '背频率会忘记，理解结构（为什么用这个尺度/这手进下注范围）才能迁移到不同牌面。',
      },
      {
        id: 'l4sd-solver-readout-q3',
        question: '短牌湿润面（9♦8♣3♥）Solver 对超对的输出是：',
        options: [
          '1/3 池小注',
          '2/3 池以上大注保护',
          '过牌',
          '弃牌',
        ],
        correctIndex: 1,
        explanation: '短牌湿润面超对用 2/3 池以上大注保护，让听牌付费。',
      },
      {
        id: 'l4sd-solver-readout-q4',
        question: '短牌 Solver 在转牌完成对手听牌时，开火频率会：',
        options: [
          '上调',
          '下调（牌面易手）',
          '不变',
          '消失',
        ],
        correctIndex: 1,
        explanation: '转牌完成对手听牌时（牌面易手），对手范围里能击败你的组合变多，Solver 下调开火频率。',
      },
      {
        id: 'l4sd-solver-readout-q5',
        question: '把 Solver 输出转化为实战的正确方式是：',
        options: [
          '照抄每个频率',
          '提炼可复用原则（如湿润面大注保护）并实战验证',
          '忽略 Solver',
          '只看赢多少',
        ],
        correctIndex: 1,
        explanation: '从 Solver 提炼"湿润面大注保护、听牌半诈唬、中等牌过牌"等原则并实战验证，是正确转化。',
      },
    ],
    examples: [
      {
        id: 'l4sd-solver-readout-ex1',
        title: '短牌湿润面 Solver 策略提炼',
        heroHand: ['Kc', 'Kd'],
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
            '短牌 Solver 在湿润面对超对输出大注保护',
            'KK 在 9-8-3 面易被顺子/两对反超，2/3 池让听牌付费',
            '短牌成牌价值高，湿润面大尺度是 Solver 共识',
          ],
        },
        commonMistake: {
          action: 'Bet 1/3 pot',
          reasoning: '短牌湿润面小注给听牌太便宜，Solver 会大注保护，小注是标准德州惯性。',
          evLoss: '-0.8 ante',
        },
      },
    ],
    practice: {
      id: 'l4sd-solver-readout-practice',
      questions: [
        {
          id: 'l4sd-solver-readout-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ac', 'Kc'],
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
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: true, explanation: '干燥 Q 高面，AK 高牌 + 后门改进，Solver 倾向小注半诈唬。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'AK 高牌 All-in 过度。', evImpact: '-1.5 ante', evLoss: 1.5 },
          ],
          relatedLessonId: 'l4sd-solver-readout',
        },
        {
          id: 'l4sd-solver-readout-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['7d', '8d'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['6h', '9c', '2s'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '78 在 6-9-2 面有顺子听牌，Solver 会半诈唬，fold 太弱。', evImpact: '-1.0 ante', evLoss: 1 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '78 有顺子听牌，Solver 倾向 x/r 半诈唬（成牌价值高）。', evImpact: '+1.2 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，x/r 建立优势即可。', evImpact: '-1.2 ante', evLoss: 1.2 },
          ],
          relatedLessonId: 'l4sd-solver-readout',
        },
        {
          id: 'l4sd-solver-readout-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Jd', 'Jc'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2 ante' },
              { player: 'BB', action: 'call' },
            ],
            board: ['7h', '8s', '9c'],
            street: 'flop',
            potSize: 5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: '短牌现金桌，极湿连接面' },
          },
          options: [
            { action: 'Bet 1.7 ante（1/3 pot）', isCorrect: false, explanation: '极湿面小注给听牌太便宜，Solver 会大注或 check。', evImpact: '-0.5 ante', evLoss: 0.5 },
            { action: 'Check', isCorrect: true, explanation: '极湿连接面（7-8-9）BB 坚果优势大，JJ 超对 Solver 常混合 check 控池。', evImpact: '+1.0 ante', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '超对 All-in 过度。', evImpact: '-1.5 ante', evLoss: 1.5 },
          ],
          relatedLessonId: 'l4sd-solver-readout',
        },
      ],
    },
  },
];
