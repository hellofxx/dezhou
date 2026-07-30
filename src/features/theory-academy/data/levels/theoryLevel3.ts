import type { TheoryChapter } from '../../types';

// T3 位置理论与起手牌理论 —— 位置价值、Gap Concept、Sklansky 基本定理
export const THEORY_LEVEL_3_CHAPTERS: TheoryChapter[] = [
  {
    id: 't3-position-value',
    level: 3,
    order: 1,
    title: '位置价值的来源',
    subtitle: '为什么"最后说话"本身就是一种筹码',
    duration: '11 min',
    eloDimension: 'preflop',
    content: [
      { type: 'heading', content: '位置是什么' },
      {
        type: 'text',
        content:
          '位置（Position）指你在下注顺序中的相对次序。翻后每一轮都最后行动的位置称为"有位置"（In Position, IP），反之为"无位置"（Out of Position, OOP）。按钮（BTN）是全桌唯一翻后永远有位置的座位，也是长期盈利率最高的座位；盲注位（SB/BB）翻后永远无位置，是仅有的两个长期亏损座位——这是所有追踪数据库都验证过的结构性事实。',
      },
      { type: 'heading', content: '位置优势的三个来源' },
      {
        type: 'text',
        content:
          '(1) 信息优势：后行动者看到对手的动作后再决策，每一轮都多一份信息；(2) 底池控制权：有位置者可以选择跟注收住底池（Pot Control）或加注膨胀底池，无位置者做不到——他过牌可能被下注，下注可能被加注；(3) 免费牌与实现权益：有位置的听牌可以过牌拿免费牌，无位置的听牌经常被迫在不利价格下做决定。',
      },
      {
        type: 'key-point',
        content: '位置优势的本质是"权益实现率"（Equity Realization）：同样 50% 的原始胜率，有位置时你能实现 100% 以上，无位置时往往只能实现 80-90%。位置直接给你的胜率打折或加成。',
      },
      {
        type: 'formula',
        content: '实际权益 = 原始胜率 × 权益实现率（R）\n有位置（IP）：R 常见 100% 以上；无位置（OOP）：R 常见 80-90%\n例：同样 50% 原始胜率，IP ≈ 50%×105% = 52.5%，OOP ≈ 50%×85% = 42.5%',
      },
      {
        type: 'example',
        content:
          '实例：同样持 8♠7♠ 面对开局加注。在 BTN 跟注：翻后你每轮最后行动，中听牌可以控池追牌，中对子可以薄价值，错过可以看对手示弱后偷池。在 SB 跟注：翻后你先行动，过牌被 C-Bet 打走一半弱牌，下注又暴露范围。同一手牌，位置不同 EV 差距巨大——这就是为什么各位置的起手范围必须不同。',
      },
      { type: 'heading', content: '位置决定范围宽度' },
      {
        type: 'text',
        content:
          '标准的开局加注（RFI）范围宽度大致为：UTG 最紧（约 15% 上下），随位置后移逐渐放宽，到 BTN 可达 40-50%。逻辑链条：位置越靠后 → 身后需要穿越的对手越少 + 翻后越可能有位置 → 边缘牌的 EV 越高 → 范围越宽。范围训练模块的位置范围正是这个原理的落地。',
      },
      {
        type: 'highlight',
        content: '新手最大的结构性漏洞就是"用同一套牌在所有位置打"。UTG 打 K9o 是烧钱，BTN 弃掉 K9o 是烧机会。',
      },
      {
        type: 'pro-tip',
        content: '一个自检习惯：每次进池前先报出自己的位置和翻后是否有位置。如果翻后无位置，把你准备进池的范围砍紧一档。',
      },
    ],
    quiz: [
      {
        id: 't3-position-value-q1',
        question: '全桌长期盈利率最高的座位是：',
        options: ['UTG', 'CO', 'BTN', 'BB'],
        correctIndex: 2,
        explanation: 'BTN 是唯一翻后永远最后行动的座位，信息与控池优势最大，所有数据库统计中盈利率最高。',
      },
      {
        id: 't3-position-value-q2',
        question: '"权益实现率"描述的是：',
        options: [
          '起手牌的原始胜率',
          '原始胜率中实际能转化为赢率的比例',
          '底池赔率的倒数',
          '对手弃牌的频率',
        ],
        correctIndex: 1,
        explanation: '同样的原始胜率，有位置能实现更高比例（甚至超额实现），无位置会被迫在不利条件下放弃部分权益。',
      },
      {
        id: 't3-position-value-q3',
        question: '为什么 BTN 的开局范围可以远宽于 UTG？',
        options: [
          'BTN 的牌本身更好',
          '身后对手更少且翻后有位置，边缘牌 EV 更高',
          'BTN 的盲注成本更低',
          '传统习惯而已，没有数学依据',
        ],
        correctIndex: 1,
        explanation: '范围宽度由 EV 决定：BTN 只需穿越两个盲注位且翻后必有位置，大量边缘牌从负 EV 变为正 EV。',
      },
      {
        id: 't3-position-value-q4',
        question: '以下哪项不是位置优势的来源？',
        options: ['后行动的信息优势', '底池大小的控制权', '拿免费牌的能力', '更高的起手牌质量'],
        correctIndex: 3,
        explanation: '发牌是随机的，位置不改变你拿到的牌，只改变同样的牌能实现多少价值。',
      },
    ],
  },
  {
    id: 't3-starting-hands',
    level: 3,
    order: 2,
    title: '起手牌理论与 Gap Concept',
    subtitle: '进池标准不是一张表，而是一套随情境移动的逻辑',
    duration: '11 min',
    eloDimension: 'preflop',
    content: [
      { type: 'heading', content: '起手牌的价值维度' },
      {
        type: 'text',
        content:
          '起手牌的价值来自四个维度：(1) 高牌力——AK 类，靠一对取胜；(2) 成对潜力——口袋对，靠暗三条赢大池；(3) 连接性——连张成顺子；(4) 同花性——同花牌成同花。真正决定进池与否的不是"这手牌好不好看"，而是它在当前位置、筹码深度、对手结构下的 EV。',
      },
      {
        type: 'key-point',
        content: '牌力可粗分三类：成牌型（大对子/大高张，喜欢小额底池单挑）、投机型（小对/同花连张，喜欢深筹码多人便宜进池）、垃圾型（既无高牌力也无潜力）。同一手牌在不同筹码深度下会跨类移动。',
      },
      { type: 'heading', content: 'Gap Concept（跳档概念）' },
      {
        type: 'text',
        content:
          'David Sklansky 提出的 Gap Concept：跟注别人的开局加注所需的牌力，高于自己主动开局加注所需的牌力。原因有二：(1) 加注者已经展示了牌力，你面对的是一个更强的范围；(2) 主动加注自带 Fold Equity（对手可能直接弃牌让你赢下盲注），而跟注没有——你少了一条赢牌路径。',
      },
      {
        type: 'example',
        content:
          '实例：CO 位置 A9o 可以开局加注（有 Fold Equity + 位置），但 UTG 开局加注后你在 CO 拿着同一手 A9o 应该弃牌——A9o 撞上 UTG 范围（AQ/AK/大对子居多）时严重被支配：命中 A 反而可能输大钱，这正是反向隐含赔率（T2）在翻前的体现。',
      },
      { type: 'heading', content: '主动进池 vs 被动进池' },
      {
        type: 'text',
        content:
          '现代翻前理论的共识：首入底池（无人加注时）应选择加注而非平跟（Limp）。加注保留 Fold Equity、建立主动权、避免多人底池稀释胜率。平跟的问题在于它只有一条赢牌路径（成牌），且向所有人宣告"我的牌不够加注"。3Bet（再加注）逻辑同理：对抗开局加注，用"3Bet 或弃牌"结构通常优于宽平跟（BB 防守除外，因为已投入盲注且关闭行动）。',
      },
      {
        type: 'highlight',
        content: 'Gap Concept 的现代修正：随着位置与筹码深度变化，"跳档"的幅度会伸缩——BTN 对 CO 开局的 3Bet/跟注范围可以很宽，UTG+1 对 UTG 开局则要极紧。原则不变：面对已展示的牌力，你的标准必须上移。',
      },
      {
        type: 'pro-tip',
        content: '判断一手牌能不能跟注开局加注，别问"它多好看"，问三个问题：被支配了吗？有位置吗？筹码够深让潜力兑现吗？三问有两个"否"就弃牌。',
      },
    ],
    quiz: [
      {
        id: 't3-starting-hands-q1',
        question: 'Gap Concept 的核心内容是：',
        options: [
          '相邻位置的范围差距固定为 5%',
          '跟注开局加注所需牌力高于自己主动开局所需牌力',
          '连张之间的间隔越小越好',
          '翻前和翻后的策略要有差距',
        ],
        correctIndex: 1,
        explanation: '加注者已展示牌力且你失去了 Fold Equity 这条赢牌路径，因此跟注标准必须高于开局标准。',
      },
      {
        id: 't3-starting-hands-q2',
        question: '为什么首入底池推荐加注而非平跟（Limp）？',
        options: [
          '加注显得更有气势',
          '加注保留 Fold Equity 与主动权，平跟只剩成牌一条赢牌路径',
          '平跟是违规行为',
          '加注可以看到更多张公共牌',
        ],
        correctIndex: 1,
        explanation: '加注可以直接赢下盲注、建立主动权并避免多人底池稀释胜率；平跟放弃了这些结构性优势。',
      },
      {
        id: 't3-starting-hands-q3',
        question: 'UTG 开局加注后，你在 CO 持 A9o。理论上最佳的行动通常是：',
        options: ['弃牌', '跟注', '小尺度 3Bet 试探', '全下'],
        correctIndex: 0,
        explanation: 'A9o 撞上 UTG 强范围时被 AQ/AK/Ax 大踢脚严重支配，命中 A 反而输大钱（反向隐含赔率），标准打法是弃牌。',
      },
      {
        id: 't3-starting-hands-q4',
        question: '小口袋对子（如 44）最喜欢的进池环境是：',
        options: [
          '浅筹码、单挑、高额翻前投入',
          '深筹码、便宜进池、命中暗三条后收割',
          '任何环境都一样',
          '只在 BB 免费看翻牌',
        ],
        correctIndex: 1,
        explanation: '小对子属投机型：胜负几乎全押在约 12% 的中 Set 概率上，需要深筹码提供隐含赔率、便宜进池控制成本。',
      },
    ],
  },
  {
    id: 't3-fundamental-theorem',
    level: 3,
    order: 3,
    title: 'Sklansky 基本定理与主动权',
    subtitle: '扑克盈利的第一性原理：让对手犯错',
    duration: '10 min',
    eloDimension: 'preflop',
    content: [
      { type: 'heading', content: '扑克基本定理' },
      {
        type: 'text',
        content:
          'David Sklansky 在《The Theory of Poker》中提出的扑克基本定理（The Fundamental Theorem of Poker）：每当对手的打法与"他能看到你底牌时的正确打法"不同，你就获利；每当你的打法与"你能看到对手底牌时的正确打法"不同，对手就获利。',
      },
      {
        type: 'key-point',
        content: '扑克的利润不来自好牌，而来自对手的错误——你的全部策略（下注、尺度、诈唬、慢打）本质上都是在制造让对手更容易犯错的局面。',
      },
      {
        type: 'example',
        content:
          '实例：你持 AA 翻前只平跟，对手拿 T9o 免费看翻牌并中了两对。对手用 T9o 看翻牌本来是错误（若他知道你有 AA 会弃牌），但你的平跟把这个错误变成了免费甚至正确的行为——是你替对手修正了错误。这就是"慢打过度"违反基本定理的数学解释。',
      },
      { type: 'heading', content: '错误的两种形态' },
      {
        type: 'text',
        content:
          '对手的错误分两类：跟注过多（对抗你的价值下注付钱太多）和弃牌过多（对抗你的诈唬放弃太多）。任何对手都不可能两个方向同时不犯错——跟得多就该多价值下注、少诈唬；弃得多就该多诈唬、薄价值收窄。识别对手在哪个方向犯错，是剥削策略（T7、T9）的全部出发点。',
      },
      { type: 'heading', content: '主动权（Initiative）' },
      {
        type: 'text',
        content:
          '主动权指最后一个翻前加注者获得的叙事权：翻后他可以代表最强范围率先下注（持续下注 C-Bet），迫使对手在没有信息的情况下先做决定。主动权是一种"结构性诈唬许可"——同样一张翻牌，有主动权的下注可信度远高于无主动权的下注。这也是 Gap Concept 推崇加注而非跟注的深层原因：加注买到的不只是当前底池，还有之后每一街的主动权。',
      },
      {
        type: 'highlight',
        content: '注意：基本定理在多人底池会出现例外（某人"正确"的跟注可能同时伤害你和他自己之外的第三方），它最严格的适用场景是单挑底池。这也是理论学习的重要一课——每个定理都有适用边界。',
      },
      {
        type: 'pro-tip',
        content: '每次行动前默问："如果对手能看到我的牌，他会希望我这么做吗？"如果答案是"会"，你多半正在犯错。',
      },
    ],
    quiz: [
      {
        id: 't3-fundamental-theorem-q1',
        question: 'Sklansky 基本定理指出，你的利润来自：',
        options: [
          '拿到比对手更好的牌',
          '对手的打法偏离"他能看到你底牌时的正确打法"',
          '尽可能多地诈唬',
          '只玩最强的起手牌',
        ],
        correctIndex: 1,
        explanation: '扑克利润的本质是对手的决策错误。牌力长期人人均等，决策质量差才是盈利来源。',
      },
      {
        id: 't3-fundamental-theorem-q2',
        question: '持 AA 翻前平跟让对手免费看翻牌，从基本定理看问题在于：',
        options: [
          '暴露了你的牌力',
          '替对手修正了本应犯下的错误（付费进池）',
          '让底池变得太大',
          '没有问题，慢打是高级技巧',
        ],
        correctIndex: 1,
        explanation: '对手的弱牌本该为进池付出代价（犯错），你的平跟让他免费实现权益，等于把利润还给了对手。',
      },
      {
        id: 't3-fundamental-theorem-q3',
        question: '对手的错误只可能是两种方向：',
        options: [
          '下注太大或太小',
          '跟注过多或弃牌过多',
          '打太快或打太慢',
          '玩太紧或坐错位置',
        ],
        correctIndex: 1,
        explanation: '面对下注只有跟/弃两个基本方向，不可能同时"跟太多"又"弃太多"。识别方向即找到剥削入口。',
      },
      {
        id: 't3-fundamental-theorem-q4',
        question: '翻前最后加注者获得的"主动权"意味着：',
        options: [
          '翻后必须每街都下注',
          '翻后可以代表最强范围率先施压，对手被迫先做决定',
          '可以看到对手的底牌',
          '下一手牌可以先行动',
        ],
        correctIndex: 1,
        explanation: '主动权是叙事权：加注者的范围里"应该"有最强的牌，因此翻后的持续下注自带可信度。它不等于必须下注。',
      },
    ],
  },
];
