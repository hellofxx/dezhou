import type { Lesson } from '../../../../../types';

export const HEADS_UP_LESSON: Lesson = {
  id: 'l4hu-bn-opening',
  level: 4,
  order: 1,
  title: '按钮位开局加注',
  subtitle: '单挑按钮位接近 100% 的开局频率与尺度调整',
  duration: '8 min',
  objectives: [
    '推导 SB min-raise 2BB 的纯偷盲盈亏平衡弃牌率（以弃牌为基准：f×1.5 = (1−f)×1.5 → f = 50%），并说出尺度越大自动盈利门槛越高',
    '判断单挑开池以 min-raise 为主的原因（偷盲门槛低、尺度小翻后易控池、支撑约 80%-100% 宽范围）',
    '说明 BB 面对 min-raise 的真实弃牌率约 30%-40%，并判断纯偷盲不盈利时开池价值主要来自翻后',
    '判断 SB（按钮位）面对 BB 高频 3-bet 时应收窄开池范围（剔除被 3-bet 后只能弃牌的边缘牌）',
  ],
  variant: 'heads-up',
  variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
  content: [
    { type: 'heading', content: '接近 100% 的开池：单挑按钮位的进攻' },
    {
      type: 'text',
      content:
        '单挑按钮位（SB）翻前先开池、翻后才轮到最后行动，面对唯一的对手，开池频率可以接近 100%——只有极少数完全垃圾的牌（如 72o、83o）弃牌。这是因为：SB 补 0.5 即可看 1.5BB 底池（所需胜率 25%），任何牌对 BB 宽防守范围都接近或超过这条线；且翻后由你最后行动、持有位置，主动权能一路延伸到后两条街。高频开池不是"玩得松"，而是"用频率榨取每一个边缘 EV"。',
    },
    {
      type: 'key-point',
      content: '按钮位开池的核心是"尺度服务翻后"，不是"尺度服务偷盲"。单挑中用 min-raise（2BB）为主：偷盲门槛低（需 50% 弃牌率）、尺度小让翻后更容易控池，范围够宽才能覆盖各种牌面。',
    },
    { type: 'heading', content: '开池尺度的数学：为什么 min-raise 是主武器' },
    {
      type: 'formula',
      content:
        'SB min-raise 到 2BB 的数学（SB 已投 0.5，再投 1.5BB；BB 已投 1，可弃或补 1）：\n\n纯偷盲模型（以 SB 直接弃牌为基准，0.5 死钱已沉没）：\nBB 弃牌 → SB 收下现有底池 1.5BB；BB 跟注 → SB 再输增量 1.5BB\nEV(raise) = f×1.5 − (1−f)×1.5（f = BB 弃牌率）\n盈亏平衡：f = 1.5/(1.5+1.5) = 50%\n\n即 BB 弃牌率超过 50% 时，SB 用任意两张牌 min-raise 自动盈利。\n尺度对比：min-raise 2BB → 50%；2.5BB（再投 2）→ 2/3.5 ≈ 57.1%；3BB（再投 2.5）→ 2.5/4 = 62.5%。\n\n结论：尺度越大，自动盈利门槛越高。单挑中开池价值在翻后，尺度越小越容易控池。',
    },
    {
      type: 'text',
      content:
        '为什么单挑不用满员桌的"偷盲要加大尺度"？三点：(1) 单挑 BB 面对 min-raise 的真实弃牌率只有约 30%-40%，纯偷盲几乎不盈利，价值在翻后；(2) 大尺度在单挑是"自我惩罚"——BB 的跟注范围随尺度收窄，你花 3BB 只换来一个更强的跟注范围；(3) 频率与平衡——min-raise 让你能用约 80% 的手牌开池，范围够宽才能覆盖翻后各种牌面。',
    },
    {
      type: 'example',
      content:
        '实例：单挑 100BB 深，你（SB）持 Q♦J♦。这是满员桌的紧位置边缘牌，但单挑中 QJs 面对 BB 宽防守范围胜率约 52%，min-raise 2BB 是标准开池。翻后你有同花/顺子听牌潜力 + 最后行动的位置红利，QJs 在单挑按钮位是绝对的开池牌。',
    },
    {
      type: 'example',
      content:
        '实例二（随对手调整尺度）：你观察到 BB 面对 min-raise 弃牌率高达 55%。此时 min-raise 的纯偷盲 EV = 0.55×1.5 − 0.45×1.5 = +0.15BB（微利，主要利润仍来自翻后），你可以提高开池频率至接近 100%，因为 BB 的弃牌率让偷盲利润上升。反过来，若 BB 3-bet 频繁，你应收窄范围、减少被 3-bet 后只能弃牌的边缘牌。',
    },
    {
      type: 'highlight',
      content: '反直觉点：单挑按钮位"接近 100% 开池"不是贪心，是数学。但要注意——开池宽不等于每条街都投入。翻后按牌面适配及时收手，才是"参与多、投入少"的成熟打法。',
    },
    {
      type: 'pro-tip',
      content: '按钮位开池速查：默认 min-raise 2BB，用约 80%-100% 范围开池；顶端 15% 强牌 + 中段同花连张/Ax + 底部垃圾混合。每 50 手检查：BB 的 3-bet 是否正在把你赶出开池范围？BB 的弃牌率是否支持你开到 100%？',
    },
  ],
  quiz: [],
  examples: [
    {
      id: 'l4hu-bn-opening-ex1',
      title: '单挑按钮位的标准 min-raise',
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
          '98s 在单挑按钮位是标准开池牌，面对 BB 宽防守范围胜率约 48%',
          'min-raise 偷盲 + 翻后同花/顺子潜力',
          'SB 翻后最后行动、有位置，尺度小让翻后易控池',
        ],
      },
      commonMistake: {
        action: 'Fold（"98s 太弱"）',
        reasoning: '用满员桌标准打单挑浪费按钮位开池优势。98s 在单挑中价值足够，应积极 min-raise。',
        evLoss: '-1.0 BB/100',
      },
    },
  ],
  practice: {
    id: 'l4hu-bn-opening-practice',
    questions: [
      {
        id: 'l4hu-bn-opening-p1',
        difficulty: 'beginner',
        scenario: {
          heroHand: ['Kd', '7d'],
          heroPosition: 'SB',
          previousActions: [],
          street: 'preflop',
          potSize: 1.5,
          effectiveStack: 100,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Fold', isCorrect: false, explanation: 'K7s 在单挑按钮位是标准开池牌，fold 太紧。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Min-raise', isCorrect: true, explanation: 'K7s 有高张 + 同花潜力，SB 翻后最后行动有位置，应 min-raise 开池。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'Call', isCorrect: false, explanation: 'Limp 太被动，单挑 SB 应积极 min-raise 抢主动权。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
        ],
        relatedLessonId: 'l4hu-bn-opening',
      },
      {
        id: 'l4hu-bn-opening-p2',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['As', '8h'],
          heroPosition: 'SB',
          previousActions: [],
          street: 'preflop',
          potSize: 1.5,
          effectiveStack: 100,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 面对 min-raise 弃牌 55%' },
        },
        options: [
          { action: 'Fold', isCorrect: false, explanation: 'A8o 面对弃牌多的 BB 是可开池牌，fold 太紧。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
          { action: 'Min-raise', isCorrect: true, explanation: 'A8o 面对弃牌率 55% 的 BB，min-raise 偷盲 + A 高翻后价值，标准开池。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: '3-bet', isCorrect: false, explanation: '首开池用 min-raise 而非 3-bet，3-bet 无意义。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
        ],
        relatedLessonId: 'l4hu-bn-opening',
      },
      {
        id: 'l4hu-bn-opening-p3',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['Qh', '5h'],
          heroPosition: 'SB',
          previousActions: [],
          street: 'preflop',
          potSize: 1.5,
          effectiveStack: 100,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 3-bet 频率 20%' },
        },
        options: [
          { action: 'Min-raise', isCorrect: false, explanation: 'BB 3-bet 20% 很高，Q5s 被 3-bet 后只能弃牌，开池 EV 被侵蚀。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
          { action: 'Fold', isCorrect: true, explanation: '面对高频 3-bet，Q5s 这类边缘同花牌应弃牌，收窄开池范围。', evImpact: '+0 BB/100', evLoss: 0 },
          { action: 'Limp', isCorrect: false, explanation: 'Limp 会让 BB 轻松 isolate，且 Q5s 面对高频 3-bet 翻后难发挥。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
        ],
        relatedLessonId: 'l4hu-bn-opening',
      },
    ],
  },
};
