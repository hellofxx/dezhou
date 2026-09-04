import type { Lesson } from '../../../../types';

export const HEADS_UP_LEVEL_4_LESSONS: Lesson[] = [
  {
    id: 'l4hu-bn-opening',
    level: 4,
    order: 1,
    title: '按钮位开局加注',
    subtitle: '单挑按钮位接近 100% 的开局频率与尺度调整',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: '接近 100% 的开池：单挑按钮位的进攻' },
      {
        type: 'text',
        content:
          '单挑按钮位（SB）是翻前最后行动的一方，面对唯一的对手，开池频率可以接近 100%——只有极少数完全垃圾的牌（如 72o、83o）弃牌。这是因为：SB 补 0.5 即可看 1.5BB 底池（所需胜率 25%），任何牌对 BB 宽防守范围都接近或超过这条线；且翻前最后行动让你永远有主动权。高频开池不是"玩得松"，而是"用频率榨取每一个边缘 EV"。',
      },
      {
        type: 'key-point',
        content: '按钮位开池的核心是"尺度服务翻后"，不是"尺度服务偷盲"。单挑中用 min-raise（2BB）为主：偷盲门槛低（需 60% 弃牌率）、尺度小让翻后更容易控池，范围够宽才能覆盖各种牌面。',
      },
      { type: 'heading', content: '开池尺度的数学：为什么 min-raise 是主武器' },
      {
        type: 'formula',
        content:
          'SB min-raise 到 2BB 的数学（SB 已投 0.5，额外风险 1.5BB；BB 已投 1，可弃或补 1）：\n\n纯偷盲模型：SB 额外风险 1.5BB，目标奖池 1BB\nEV(raise) = f×1 − (1−f)×1.5（f = BB 弃牌率）\n盈亏平衡：f = 1.5/2.5 = 60%\n\n即 BB 弃牌率超过 60% 时，SB 用任意两张牌 min-raise 自动盈利。\n尺度对比：min-raise 2BB → 60%；2.5BB → 66.7%；3BB → 71.4%。\n\n结论：尺度越小，自动盈利门槛越低。单挑中开池价值在翻后，尺度越小越容易控池。',
      },
      {
        type: 'text',
        content:
          '为什么单挑不用满员桌的"偷盲要加大尺度"？三点：(1) 单挑 BB 面对 min-raise 的真实弃牌率只有约 30%-40%，纯偷盲几乎不盈利，价值在翻后；(2) 大尺度在单挑是"自我惩罚"——BB 的跟注范围随尺度收窄，你花 3BB 只换来一个更强、更有位置的跟注范围；(3) 频率与平衡——min-raise 让你能用约 80% 的手牌开池，范围够宽才能覆盖翻后各种牌面。',
      },
      {
        type: 'example',
        content:
          '实例：单挑 100BB 深，你（SB）持 Q♦J♦。这是满员桌的紧位置边缘牌，但单挑中 QJs 面对 BB 宽防守范围胜率约 52%，min-raise 2BB 是标准开池。翻后你有同花/顺子听牌潜力 + SB 最后行动优势，QJs 在单挑按钮位是绝对的开池牌。',
      },
      {
        type: 'example',
        content:
          '实例二（随对手调整尺度）：你观察到 BB 面对 min-raise 弃牌率高达 55%。此时即使 min-raise 的纯偷盲 EV = 0.55×1 − 0.45×1.5 = −0.125BB（仍微亏，靠翻后补），但你可以提高开池频率至接近 100%，因为 BB 的弃牌率让偷盲利润上升。反过来，若 BB 3Bet 频繁，你应收窄范围、减少被 3Bet 后只能弃牌的边缘牌。',
      },
      {
        type: 'highlight',
        content: '反直觉点：单挑按钮位"接近 100% 开池"不是贪心，是数学。但要注意——开池宽不等于每条街都投入。翻后按牌面适配及时收手，才是"参与多、投入少"的成熟打法。',
      },
      {
        type: 'pro-tip',
        content: '按钮位开池速查：默认 min-raise 2BB，用约 80%-100% 范围开池；顶端 15% 强牌 + 中段同花连张/Ax + 底部垃圾混合。每 50 手检查：BB 的 3Bet 是否正在把你赶出开池范围？BB 的弃牌率是否支持你开到 100%？',
      },
    ],
    quiz: [
      {
        id: 'l4hu-bn-opening-q1',
        question: '单挑按钮位（SB）的开池频率范围约为：',
        options: ['约 30%', '约 50%', '约 80%-100%', '约 10%'],
        correctIndex: 2,
        explanation: '单挑 SB 开池约 80%-100%，只有极少数完全垃圾弃牌。因为补 0.5 即可看 1.5BB 底池、翻前最后行动。',
      },
      {
        id: 'l4hu-bn-opening-q2',
        question: '单挑按钮位开池为什么以 min-raise（2BB）为主？',
        options: [
          'min-raise 偷盲门槛低（60% 弃牌率）且翻后容易控池',
          'min-raise 让对手更容易弃牌',
          '大尺度更好偷盲',
          'min-raise 让牌更强',
        ],
        correctIndex: 0,
        explanation: 'min-raise 偷盲盈亏平衡 60% 弃牌率、尺度小翻后易控池，且能支持约 80% 的宽范围。大尺度在单挑是自我惩罚。',
      },
      {
        id: 'l4hu-bn-opening-q3',
        question: '单挑中 BB 面对 min-raise 的真实弃牌率约为：',
        options: ['约 60%', '约 30%-40%', '约 80%', '约 10%'],
        correctIndex: 1,
        explanation: '单挑 BB 面对 min-raise 真实弃牌率仅约 30%-40%（防守 60%-70%），说明纯偷盲几乎不盈利，开池价值在翻后。',
      },
      {
        id: 'l4hu-bn-opening-q4',
        question: '单挑按钮位"开池约 80%"的正确理解是：',
        options: [
          '用 80% 的牌打到摊牌',
          '参与约 80%，但很多牌翻后按牌面适配及时收手',
          '只用 80% 强牌',
          '开池后永远加注',
        ],
        correctIndex: 1,
        explanation: '开池宽是"参与多、投入少"——翻后按牌面适配及时收手，才是成熟打法。',
      },
      {
        id: 'l4hu-bn-opening-q5',
        question: '面对 BB 3Bet 频繁的对手，按钮位应如何调整开池？',
        options: [
          '保持 80% 不变',
          '收窄范围，减少被 3Bet 后只能弃牌的边缘牌',
          '开到 100%',
          '完全停止开池',
        ],
        correctIndex: 1,
        explanation: '高频 3Bet 侵蚀偷盲 EV，边缘牌被 3Bet 后只能弃牌。正确调整是收窄范围；完全停止是过度反应。',
      },
    ],
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
            'SB 翻前最后行动，尺度小让翻后易控池',
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
            { action: 'Min-raise', isCorrect: true, explanation: 'K7s 有高张 + 同花潜力，SB 翻前最后行动，应 min-raise 开池。', evImpact: '+1.0 BB/100', evLoss: 0 },
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
            { action: '3-Bet', isCorrect: false, explanation: '首开池用 min-raise 而非 3-Bet，3-Bet 无意义。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
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
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 3-Bet 频率 20%' },
          },
          options: [
            { action: 'Min-raise', isCorrect: false, explanation: 'BB 3-Bet 20% 很高，Q5s 被 3-Bet 后只能弃牌，开池 EV 被侵蚀。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
            { action: 'Fold', isCorrect: true, explanation: '面对高频 3-Bet，Q5s 这类边缘同花牌应弃牌，收窄开池范围。', evImpact: '+0 BB/100', evLoss: 0 },
            { action: 'Limp', isCorrect: false, explanation: 'Limp 会让 BB 轻松 isolate，且 Q5s 面对高频 3-Bet 翻后难发挥。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
          ],
          relatedLessonId: 'l4hu-bn-opening',
        },
      ],
    },
  },
  {
    id: 'l4hu-ev-adjustments',
    level: 4,
    order: 2,
    title: 'EV 调整',
    subtitle: '单挑两人底池的 EV 计算差异与决策简化',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [
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
      { type: 'heading', content: '翻前偷盲 EV 与翻后位置 EV' },
      {
        type: 'formula',
        content:
          '翻前偷盲 EV（SB min-raise 到 2BB，BB 弃牌率 f）：\nEV(steal) = f×1 − (1−f)×1.5\n\n翻后位置 EV 锚点：\n单挑位置价值约 0.5-1BB/手（BB 每手翻后 IP）\n\n实例：BB 面对 SB min-raise（SB 总投入 2BB，BB 已投 1BB）：\n通式：所需胜率 = 跟注额 ÷（当前底池 + 对手下注 + 跟注额）\n代入：1 ÷ (1.5 + 1.5 + 1) = 1 ÷ 4 = 25%\n（当前底池 1.5 = SB 0.5 + BB 自己已投的 1，这 1BB 是死钱但仍在分母里，不可漏算；对手下注 1.5 = SB 补到 2BB 的加注额；跟注额 1 = BB 需补的差额。等价于跟注后总底池 4BB，1÷4=25%）\nBB 面对 SB 约 80% 开池范围，边缘牌胜率常超 40% → 跟注 +EV',
      },
      {
        type: 'text',
        content:
          '单挑 EV 调整的实践含义：面对 SB 的宽范围，BB 的跟注门槛大幅降低。满员桌面对 UTG 范围 15% 时 40% 的跟注线，在单挑面对 SB 范围 80% 时降到 25%（再跟 1BB ÷ 跟注后总底池 4BB），且因为位置优势实际胜率更高。这就是为什么单挑 BB 能防守 60%+——不是"宽松"，而是"EV 计算的结果"。',
      },
      {
        type: 'example',
        content:
          '实例：单挑盲注 0.5/1，翻前 SB min-raise 2BB，你（BB）持 K♠7♠。跟注 1BB，跟注后总底池 = SB 2 + BB 已投 1 + 你的跟注 1 = 4BB，所需胜率 = 1 ÷ 4 = 25%。K7s 对 SB 约 80% 的开池范围胜率约 48%，富余约 23 个百分点。翻后你 IP：出 K 可薄价值、出同花/顺子可便宜追、完全 miss 可放弃。跟注的 EV 为正——满员桌 K7s 面对 UTG 是弃牌，但单挑面对 SB 宽范围是 +EV 跟注。',
      },
      {
        type: 'example',
        content:
          '实例二（翻后 EV 决策）：翻牌底池 4BB，你（BB IP）持 7♠6♠，SB（OOP）下注 2BB（半池）。你跟注所需胜率 = 2/(4+2+2) = 25%。你的 76 在 9♠8♦3♣ 面有双卡顺 + 后门同花，约 8 个 Outs 单街 17%——单看不足 25%，但加隐含赔率（中顺后能再赢 2.5BB）跟注转 +EV。单挑听牌跟注更常依赖隐含赔率，因为对手范围宽、支付意愿高。',
      },
      {
        type: 'highlight',
        content: '反直觉点：单挑中"小牌"不是废牌。9-high 在单挑翻后仍可赢牌——对手跟注范围极宽，9-high 的摊牌价值远超满员桌。同样的底池赔率 25%，单挑中 9-high 可能在 40%+ 时机领先，满员桌只有 15%-20%。',
      },
      {
        type: 'pro-tip',
        content: '单挑 EV 速算锚点：半池下注所需胜率 25%、1/3 池 20%、满池 33.3%；limp 看翻牌 25%、开池跟注 3BB 33.3%。背熟这些数字，牌桌上比数更快。',
      },
    ],
    quiz: [
      {
        id: 'l4hu-ev-adjustments-q1',
        question: '单挑中 EV 计算与满员桌的主要差异是：',
        options: [
          '公式完全不同',
          '没有多人稀释、死钱占比高、对手范围宽，EV 数值被放大',
          '单挑没有 EV',
          '单挑 EV 更小',
        ],
        correctIndex: 1,
        explanation: 'EV 公式不变，但单挑两人底池无稀释、SB 死钱占比高、对手范围宽，让更多边缘牌跟注变成 +EV，数值意义被放大。',
      },
      {
        id: 'l4hu-ev-adjustments-q2',
        question: 'SB min-raise 到 2BB（BB 已投 1BB），BB 还需跟注 1BB，所需胜率约为：',
        options: ['33.3%', '25%', '40%', '50%'],
        correctIndex: 1,
        explanation: '所需胜率 = 跟注额 ÷（当前底池 + 对手下注 + 跟注额）= 1 ÷ (1.5 + 1.5 + 1) = 1 ÷ 4 = 25%。分母必须含 BB 自己已入池的 1BB 死钱（1/(2+1)≈33.3% 正是漏算它得到的错值）。单挑死钱占比高，比满员桌 BTN 跟注 40% 更便宜。',
      },
      {
        id: 'l4hu-ev-adjustments-q3',
        question: '单挑 BB 防守 60%+ 的根本原因是：',
        options: [
          'BB 牌更好',
          '面对 SB 宽范围跟注门槛低且位置优势使实际胜率更高',
          'BB 必须防守',
          '规则要求',
        ],
        correctIndex: 1,
        explanation: '面对 SB 约 80% 宽范围，跟注门槛降至 25%（再跟 1BB ÷ 跟注后总底池 4BB），且 IP 权益实现率超 100%，故可宽防守——是 EV 计算的结果而非"宽松"。',
      },
      {
        id: 'l4hu-ev-adjustments-q4',
        question: '单挑中听牌跟注（如双卡顺）常依赖隐含赔率的原因是：',
        options: [
          '单挑底池更大',
          '对手范围宽、支付意愿高，中牌后能再赢更多',
          '听牌胜率更高',
          '没有隐含赔率',
        ],
        correctIndex: 1,
        explanation: '单挑对手范围宽、支付意愿高，中牌后能再赢更多（隐含赔率好），弥补单街胜率的不足。',
      },
      {
        id: 'l4hu-ev-adjustments-q5',
        question: '单挑位置价值约 0.5-1BB/手，最准确的理解是：',
        options: [
          'BB 每手翻牌都能多赚 1BB',
          '长期来看 BB 位比 SB 位每手多 0.5-1BB 期望收益',
          '翻前位置的价值',
          '只在锦标赛成立',
        ],
        correctIndex: 1,
        explanation: '位置价值是长期期望差异：BB 有翻后信息优势，平均每手多赢 0.5-1BB，是统计期望而非单手保证。',
      },
    ],
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
            'BB 翻后 IP，权益实现率超 100%，边缘牌也可盈利',
          ],
        },
        commonMistake: {
          action: 'Fold（"Q6s 太弱"）',
          reasoning: '单挑面对 SB 宽范围，Q6s 的 +EV 跟注被满员桌记忆掩盖。BB 位置优势让边缘牌可防守。',
          evLoss: '-1.0 BB/100',
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
            { action: 'Call', isCorrect: true, explanation: 'J8s 同花连张翻后 IP 可玩性好，跟注 EV 为正。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: '3-Bet', isCorrect: false, explanation: 'J8s 偏投机，3-Bet 太激进，跟注即可。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
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
      ],
    },
  },
  // ===== L4B 进阶思维 · GTO 与博弈论 =====
  {
    id: 'l4hu-gto-basics',
    level: 4,
    order: 1,
    title: '单挑 GTO 基础',
    subtitle: '单挑均衡策略的结构差异、频率基准与位置对称性',
    duration: '9 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: '单挑：均衡策略最纯净的适用场景' },
      {
        type: 'text',
        content:
          '单挑扑克（忽略抽水）是纯二人零和博弈，纳什均衡"不可剥削"的保证在此严格成立。这意味着单挑存在一套均衡策略（GTO）：无论对手怎么打，你的长期期望都不低于博弈值。与满员桌相比，单挑 GTO 范围极宽（SB 开池约 80%、BB 防守 60%+），均衡意味着极高的下注频率与诈唬密度——GTO 不是"打得紧"，而是"让一切保持在对手无法反制的比例上"。',
      },
      {
        type: 'key-point',
        content: '单挑 GTO 的定位是"防弹背心"不是"武器"：它保证你不被剥削，但不承诺赚得最多。面对漏洞百出的对手，针对性剥削赚更多——代价是打开自己的漏洞。单挑高手在"穿背心"与"换刀"之间切换。',
      },
      { type: 'heading', content: '频率基准：价值:诈唬比与 MDF' },
      {
        type: 'formula',
        content:
          '河牌满池下注的均衡价值:诈唬比（底池 P、下注 P）：\n诈唬占比 f = b/(1+2b) = 1/(1+2) = 1/3\n即价值:诈唬 = 2:1。\n\n半池（b=0.5）：f = 0.5/2 = 25%，价值:诈唬 = 3:1。\n\nMDF（最小防御频率）= 1/(1+b)：\n半池 → 67%；满池 → 50%；2 倍池 → 33%。\n\n单挑中 BB 防守 60%+ 远超 MDF 底线（约 33%-38%），因为翻后位置让跟注本身 +EV。',
      },
      {
        type: 'text',
        content:
          '单挑 GTO 与满员桌的频率差异：满员桌多数位置只能打紧、均衡下注频率低；单挑则范围宽、下注频率高、诈唬密度大。求解器在单挑中会输出大量激进的下注与极化范围。理解这些频率基准，是识别"对手何时偏离均衡"的前提。',
      },
      {
        type: 'example',
        content:
          '实例：单挑 SB 面对 BB，求解器会告诉你 SB 用约 80% 范围开池、BB 用约 60%+ 防守，翻后 OOP 的 SB 高频过牌、IP 的 BB 高频下注。这些频率看似"松"，但都是均衡的一部分——任何一方偏离（如 SB 只开池 50%），另一方都能通过加宽防守或提高偷盲频率来剥削。',
      },
      {
        type: 'example',
        content:
          '实例二（位置对称性）：单挑每手牌双方互换 SB/BB，位置不是固定的——SB 翻前最后行动（有翻前位置）、翻后先行动（OOP）；BB 恰好相反。GTO 均衡会同时包含两个方向的位置策略，位置对称性意味着你既要会打 SB 也要会打 BB，不能用满员桌"固定位置"的思维。',
      },
      {
        type: 'highlight',
        content: '反直觉点："GTO 就是打得紧"是最大误读。单挑 GTO 充满高频下注、超池全下与薄价值——它只是让这一切保持在对手无法反制的比例上。学习求解器别背频率，问三个为什么：为什么这个牌面用这个尺度？为什么这手牌进下注范围？为什么转牌后频率变了？',
      },
      {
        type: 'pro-tip',
        content: '单挑 GTO 学习路径：先用求解器理解均衡"形状"（为什么这样打），再用节点锁定研究"对手常见漏洞的收割方案"，最后实战验证。基线给你不败之地，偏离给你利润空间。',
      },
    ],
    quiz: [
      {
        id: 'l4hu-gto-basics-q1',
        question: '纳什均衡"不可剥削"的保证在单挑中的适用性：',
        options: [
          '不适用',
          '严格成立（单挑是纯二人零和博弈）',
          '只在翻前成立',
          '只在锦标赛成立',
        ],
        correctIndex: 1,
        explanation: '单挑（忽略抽水）是纯二人零和博弈，纳什均衡的不可剥削保证在此严格成立。多人底池会因联合效应弱化。',
      },
      {
        id: 'l4hu-gto-basics-q2',
        question: '河牌满池下注的均衡价值:诈唬比约为：',
        options: ['1:1', '2:1', '3:1', '4:1'],
        correctIndex: 1,
        explanation: '诈唬占比 f = 1/(1+2) = 1/3，价值 2/3、诈唬 1/3，价值:诈唬 = 2:1。恰等于对手跟注所需胜率 33%。',
      },
      {
        id: 'l4hu-gto-basics-q3',
        question: '单挑 GTO 与满员桌 GTO 的主要差异是：',
        options: [
          '单挑 GTO 更紧',
          '单挑范围极宽、下注频率高、诈唬密度大',
          '两者完全相同',
          '单挑不存在 GTO',
        ],
        correctIndex: 1,
        explanation: '单挑范围宽（SB 80%、BB 60%+），均衡伴随高下注频率与极化范围，而非"打得紧"。',
      },
      {
        id: 'l4hu-gto-basics-q4',
        question: '单挑中 BB 防守 60%+ 远超 MDF 底线（约 33%-38%）的原因是：',
        options: [
          'BB 每手牌更好',
          'BB 翻后位置优势让跟注本身 +EV',
          'BB 必须防守',
          'MDF 公式在翻前不适用',
        ],
        correctIndex: 1,
        explanation: 'MDF 只保证"阻止纯诈唬自动盈利"，而 BB 跟注的正 EV 来自翻后位置（权益实现率 >100%），故可防守超过底线且仍盈利。',
      },
      {
        id: 'l4hu-gto-basics-q5',
        question: '单挑"位置对称性"指的是：',
        options: [
          '双方位置固定不变',
          '每手牌双方互换 SB/BB，你既要会打 SB 也要会打 BB',
          '位置没有影响',
          '只有 SB 有位置',
        ],
        correctIndex: 1,
        explanation: '单挑每手牌双方互换 SB/BB，位置反转（SB 翻前最后、翻后先；BB 相反），GTO 均衡同时包含两个方向的位置策略。',
      },
    ],
    examples: [
      {
        id: 'l4hu-gto-basics-ex1',
        title: '单挑 BB 面对 SB 开池的均衡防守',
        heroHand: ['6s', '5s'],
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
            '65s 面对 SB 约 80% 开池范围胜率约 42%',
            '跟注 1BB 进入 4BB 总底池（SB 2 + BB 1 + 跟注 1），所需胜率 = 1÷4 = 25%，富余约 17 个百分点',
            'BB 翻后 IP，同花连张可玩性好，是均衡防守范围成员',
          ],
        },
        commonMistake: {
          action: 'Fold（"65s 太弱"）',
          reasoning: '单挑 BB 面对 SB 宽范围应宽防守，65s 是标准跟注牌。满员桌标准会丢掉位置优势。',
          evLoss: '-1.0 BB/100',
        },
      },
    ],
    practice: {
      id: 'l4hu-gto-basics-practice',
      questions: [
        {
          id: 'l4hu-gto-basics-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Td', '9d'],
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
            { action: 'Fold', isCorrect: false, explanation: 'T9s 面对 SB 宽范围可玩性好，fold 太紧。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Call', isCorrect: true, explanation: 'T9s 同花连张翻后 IP 可玩性好，均衡防守范围成员。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: '3-Bet', isCorrect: false, explanation: 'T9s 偏投机，3-Bet 太激进，跟注即可。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
          ],
          relatedLessonId: 'l4hu-gto-basics',
        },
        {
          id: 'l4hu-gto-basics-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ah', 'Kh'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: '3-bet to 6BB' },
              { player: 'SB', action: 'call' },
            ],
            board: ['Kd', '8c', '3h'],
            street: 'flop',
            potSize: 12,
            effectiveStack: 90,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，3-Bet 底池' },
          },
          options: [
            { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'AK 顶对顶踢脚，IP 小注薄价值让 SB 弱牌跟注。', evImpact: '+2.0 BB/100', evLoss: 0 },
            { action: 'Check', isCorrect: false, explanation: '顶对顶踢脚应下注薄价值，check 太被动。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'All-in', isCorrect: false, explanation: '干燥面顶对 All-in 过度，小注即可。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l4hu-gto-basics',
        },
        {
          id: 'l4hu-gto-basics-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Qs', 'Js'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Jd', '7c', '2h'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Check-Call', isCorrect: true, explanation: 'QJ 顶对，IP 跟注保留 SB 诈唬，干燥面控制底池。', evImpact: '+1.2 BB/100', evLoss: 0 },
            { action: 'Check-Raise', isCorrect: false, explanation: '顶对 x/r 赶走 SB 诈唬，浪费薄价值，应跟注。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
            { action: 'Fold', isCorrect: false, explanation: 'QJ 顶对是强牌，fold 太弱。', evImpact: '-2.0 BB/100', evLoss: 2 },
          ],
          relatedLessonId: 'l4hu-gto-basics',
        },
      ],
    },
  },
  {
    id: 'l4hu-counter-strategies',
    level: 4,
    order: 2,
    title: '反制策略',
    subtitle: '针对单挑对手常见偏离的 GTO 反制与再调整框架',
    duration: '9 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: '识别偏离：单挑反制的前提' },
      {
        type: 'text',
        content:
          '单挑反制策略（Counter-Strategy）的核心是：先识别对手偏离均衡的倾向，再用 GTO 基线校准出针对该漏洞的最优应对。常见的单挑偏离有四类：弃牌过多（面对 C-Bet 弃牌率超高）、跟注过松（跟注站）、3Bet 过频、C-Bet 过频。识别依赖跨 50-100 手的频率统计，而非单手牌印象。',
      },
      {
        type: 'key-point',
        content: '反制的正确姿态：方向瞄准对手漏洞（Maximally Exploitative），幅度保持最小（Minimally Exploitative）。每次偏离都打开自己的漏洞，因此幅度要可控、对手调整后及时回基线。',
      },
      { type: 'heading', content: '四类偏离的针对性反制' },
      {
        type: 'formula',
        content:
          '针对弃牌过多的对手提高偷盲（SB min-raise 到 2BB，BB 弃牌率 f）：\nEV(steal) = f×1 − (1−f)×1.5\n\n均衡弃牌率约 40%（f=0.4）→ EV = 0.4×1 − 0.6×1.5 = −0.5BB（不盈利，需翻后补）\n若对手弃牌率 60%（f=0.6）→ EV = 0.6×1 − 0.4×1.5 = +0BB（纯偷盲接近持平）\n若对手弃牌率 70%（f=0.7）→ EV = 0.7×1 − 0.3×1.5 = +0.25BB（自动盈利）\n\n结论：对手弃牌率越高，偷盲频率越应上调，但幅度以"他若修正到 50% 你仍不亏"为限。',
      },
      {
        type: 'text',
        content:
          '四类偏离的反制方向：(1) 弃牌过多 → 提高开池/C-Bet 频率，用更多半诈唬；(2) 跟注过松（跟注站）→ 减少纯诈唬，改用价值下注薄价值（顶对弱踢脚也能下注收钱）；(3) 3Bet 过频 → 收窄开池范围、增加 4Bet 价值；(4) C-Bet 过频 → 提高 x/r 频率与 float。每一类都从"识别 → 反制 → 复核"闭环推进。',
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
    quiz: [
      {
        id: 'l4hu-counter-strategies-q1',
        question: '识别单挑对手偏离的正确依据是：',
        options: [
          '单手牌印象',
          '跨 50-100 手的频率统计',
          '对手外貌',
          '随机猜测',
        ],
        correctIndex: 1,
        explanation: '单挑反制依赖跨 50-100 手的频率统计（弃牌率/3Bet 率等），单手牌印象是噪声，不足为据。',
      },
      {
        id: 'l4hu-counter-strategies-q2',
        question: '针对弃牌过多的对手，正确的反制是：',
        options: [
          '减少进攻',
          '提高开池/C-Bet 频率，增加半诈唬',
          '只玩坚果',
          '完全停注',
        ],
        correctIndex: 1,
        explanation: '弃牌过多的对手让偷盲与 C-Bet 的弃牌率成为自动利润，应提高开池/C-Bet 频率与半诈唬密度。',
      },
      {
        id: 'l4hu-counter-strategies-q3',
        question: '针对跟注过松的跟注站，正确的反制是：',
        options: [
          '增加纯诈唬',
          '减少诈唬，改用价值下注薄价值',
          '完全停止下注',
          '只玩坚果',
        ],
        correctIndex: 1,
        explanation: '跟注站不弃牌，纯诈唬无效；改用价值下注薄价值，因为对手会用更差的牌跟注。',
      },
      {
        id: 'l4hu-counter-strategies-q4',
        question: '"最小必要偏离"的纪律是：',
        options: [
          '完全抛弃 GTO',
          '方向瞄准对手漏洞、幅度保持最小，随时可回基线',
          '永远加大反制',
          '完全照抄 GTO',
        ],
        correctIndex: 1,
        explanation: '偏离打开自己的漏洞，幅度要可控；方向瞄准漏洞、幅度最小、对手调整后及时回基线。',
      },
      {
        id: 'l4hu-counter-strategies-q5',
        question: '节点锁定（Node Locking）在反制中的作用是：',
        options: [
          '锁定自己策略',
          '把对手偏离锁定为固定频率，重解你的最优应对',
          '防止求解器崩溃',
          '锁定翻前范围',
        ],
        correctIndex: 1,
        explanation: '节点锁定把"对手实际怎么打（偏离）"输入求解器，输出针对该偏差的最优反制，让反制从感觉变计算。',
      },
    ],
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
            { action: 'Donk Bet', isCorrect: false, explanation: 'IP 应 Check 让对手先行动再 x/r，Donk 不是标准打法。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l4hu-counter-strategies',
        },
      ],
    },
  },
];
