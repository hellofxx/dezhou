import type { Lesson } from '../../types';

/**
 * P2-1.2 模块 1：Limp 局应对（3 课）
 *
 * 国内低级别现金桌最常见的结构——多人 Limp 入池。
 * 本模块讲解如何在 Limp 局中通过隔离加注、范围调整与多人底池策略获取盈利。
 */
export const LIMP_LESSONS: Lesson[] = [
  // ===== local-limp-intro =====
  {
    id: 'local-limp-intro',
    level: 7,
    order: 6,
    title: 'Limp 局的特点与挑战',
    subtitle: '国内低级别最常见的桌型，理解它才能盈利',
    duration: '8 min',
    content: [
      { type: 'heading', content: '什么是 Limp 局？' },
      { type: 'text', content: '国内线下俱乐部和线上低级别（NL2-NL25）最常见的结构就是 Limp 局：翻前多人只跟注大盲而不加注，导致底池多人、筹码浅、决策复杂。这与 GTO 教学中假设的"开牌-3Bet-弃牌"单挑场景截然不同。\n\n典型场景：UTG limp、MP limp、CO limp、BTN limp，到你在大盲只需补一个盲注就能看到 5 人底池的翻牌。' },
      { type: 'key-point', content: 'Limp 局的核心特征：①多人底池频率高；②底池中等、SPR 通常 3-5（中等偏低），适合隐含赔率游戏；③玩家被动、少加注；④抽水占比相对高。这些特征要求你大幅调整标准 GTO 策略。' },
      { type: 'heading', content: 'Limp 局的盈利来源' },
      { type: 'text', content: '在 Limp 局中，盈利主要来自三个方面：\n\n1. 用强牌隔离加注（Isolate）：把多人底池压缩成单挑，让 Limp 玩家付出代价\n2. 用投机牌便宜看翻牌：同花连牌、小对子在多人底池有更高隐含赔率\n3. 翻后精准剥削：Limp 玩家通常翻后被动，可以更频繁 C-Bet 或价值下注' },
      { type: 'heading', content: '常见误区' },
      { type: 'text', content: '国内低级别玩家在 Limp 局最常犯的错误：\n\n• 用太宽的范围跟注 Limp（如 K5o、96o 这种垃圾牌也补一脚）\n• 强牌不隔离加注，AA/KK 也跟着 Limp，结果被多人底池反超\n• 翻后用顶对弱踢脚在多人底池大注打光，忽视多人底池顶对贬值\n• 忽视抽水，长期打小底池被抽水吃光' },
      { type: 'highlight', content: 'Limp 局最致命的错误：把多人底池当单挑打。多人底池中顶对顶踢脚（TPTK）的价值大幅下降，必须收紧价值范围。' },
      { type: 'pro-tip', content: '在 Limp 局中，位置的价值更高。BTN 或 CO 可以用更宽的范围 Limp behind（跟着 Limp），因为翻后可以最后行动，剥削被动玩家更高效。' },
    ],
    quiz: [
      {
        id: 'local-limp-intro-q1',
        question: '国内低级别 Limp 局最常见的桌型特征是？',
        options: ['翻前单挑多', '多人底池频率高', '玩家加注频繁', '筹码都很深'],
        correctIndex: 1,
        explanation: 'Limp 局翻前多人 Limp 入池，导致多人底池频率极高。这是国内低级别最常见的结构。',
      },
      {
        id: 'local-limp-intro-q2',
        question: 'Limp 局中顶对顶踢脚（TPTK）的价值如何？',
        options: ['和单挑一样强', '大幅贬值', '完全没有价值', '比葫芦还强'],
        correctIndex: 1,
        explanation: '多人底池中顶对贬值严重——3-5 人底池中，有人持有两对+的概率显著上升。TPTK 不再是"绝对强牌"。',
      },
      {
        id: 'local-limp-intro-q3',
        question: 'Limp 局最主要的盈利来源是？',
        options: ['频繁诈唬', '隔离加注 + 投机牌隐含赔率 + 翻后剥削', '只打 AA/KK', '靠运气赢大底池'],
        correctIndex: 1,
        explanation: 'Limp 局盈利来自三方面：用强牌隔离、用投机牌便宜看翻牌、翻后剥削被动玩家。频繁诈唬在跟注站众多的 Limp 局是亏损策略。',
      },
    ],
  },

  // ===== local-limp-isolate =====
  {
    id: 'local-limp-isolate',
    level: 7,
    order: 7,
    title: '隔离加注（Isolate）策略',
    subtitle: '用强牌把 Limp 玩家单独拎出来打',
    duration: '9 min',
    content: [
      { type: 'heading', content: '为什么要隔离加注？' },
      { type: 'text', content: '当有人 Limp 时，他们通常持有宽而弱的范围（任意两张同花、连牌、小对子、甚至 K5o 这种垃圾）。如果你手持强牌（如 AQ+、TT+）只跟着 Limp，结果是 5 人底池，你的强牌优势被稀释。\n\n隔离加注的目的：把多人底池压缩成单挑或 Heads-Up，让你在翻后用位置和牌力优势压制对手。' },
      { type: 'key-point', content: '隔离加注的三大目标：①建立底池（强牌价值）；②减少对手人数（提升胜率）；③获取主动权（翻后 C-Bet 优势）。' },
      { type: 'heading', content: '隔离加注的尺度' },
      { type: 'text', content: '国内 Limp 局的隔离加注尺度需要比标准 GTO 更大：\n\n• 单人 Limp：加注到 4-5BB（标准是 3-4BB）\n• 两人 Limp：加注到 6-7BB\n• 三人 Limp：加注到 8-10BB\n\n原因：Limp 玩家的跟注范围太宽，小加注无法把他们赶走。加大尺度既能减少跟注人数，又能用强牌建立更大底池获取价值。' },
      { type: 'example', content: '示例牌局：NL25 现金桌，100BB 有效\nUTG limp（VPIP 45 的跟注站），MP limp，CO fold\n你在 BTN 持有 A♠K♥\n\n正确做法：加注到 6BB（隔离两个 Limp 玩家）\n• UTG 跟注（范围宽，常见）\n• MP 弃牌（理想结果）\n• 翻后 heads-up，你用 AK 在 BTN 后位 C-Bet\n\n错误做法：跟着 Limp，5 人底池看翻牌，AK 价值被稀释' },
      { type: 'heading', content: '隔离加注的范围' },
      { type: 'text', content: '适合隔离加注的牌：\n• 价值范围：TT+、AQ+、KQs（强牌想建立底池）\n• 形态范围：A2s-A5s、56s-9Ts（投机牌但有同花潜力）\n\n不适合隔离加注的牌：\n• 中等牌力：AT、KJ、QT（隔离后被 4-Bet 或跟注后处于劣势）\n• 垃圾牌：K5o、96o、72o（没有任何理由加注）' },
      { type: 'highlight', content: '隔离加注失败的情况：如果连续 3 次隔离都被多人跟注，说明桌风太松，应该收紧隔离范围、加大尺度，或转用 Limp behind 策略用投机牌便宜看翻牌。' },
      { type: 'pro-tip', content: '隔离加注后翻牌若miss（如 AK 翻牌 7♠8♦2♣），仍应高频 C-Bet。Limp 玩家翻后弃牌率高，单次 C-Bet 的 EV 远好于被动 check 暴露你的牌力范围。' },
    ],
    quiz: [
      {
        id: 'local-limp-isolate-q1',
        question: '面对两人 Limp，标准隔离加注尺度应为？',
        options: ['2-3BB', '6-7BB', '15BB', '直接 All-in'],
        correctIndex: 1,
        explanation: '国内 Limp 局面对两人 Limp 应加注到 6-7BB。Limp 玩家跟注范围宽，小尺度无法隔离，大尺度又会吓跑强牌价值。',
      },
      {
        id: 'local-limp-isolate-q2',
        question: '以下哪类牌最适合隔离加注？',
        options: ['K5o', 'TT 和 AQ+', '96o', '23o'],
        correctIndex: 1,
        explanation: 'TT+ 和 AQ+ 是强牌，适合隔离加注建立底池并压缩对手。K5o、96o、23o 都是垃圾牌，不应加注。',
      },
      {
        id: 'local-limp-isolate-q3',
        question: '隔离加注的核心目标不包括？',
        options: ['减少对手人数', '建立底池获取价值', '获取翻后主动权', '诈唬所有人弃牌'],
        correctIndex: 3,
        explanation: '隔离加注不是诈唬，是用强牌建立底池并减少对手。Limp 玩家弃牌率低，指望全部弃牌是不现实的。',
      },
    ],
  },

  // ===== local-limp-multiway =====
  {
    id: 'local-limp-multiway',
    level: 7,
    order: 8,
    title: '多人 Limp 底池的翻后应对',
    subtitle: '4-5 人底池中如何调整 C-Bet 与价值范围',
    duration: '10 min',
    content: [
      { type: 'heading', content: '多人底池的本质变化' },
      { type: 'text', content: '当 4-5 人看到翻牌时，发生根本性变化：\n\n• 顶对价值大幅贬值：3 人底池顶对胜率约 60%，5 人底池降到 35%\n• 听牌价值上升：同花/顺子听牌在多人底池赔率极佳\n• C-Bet 成功率骤降：单挑 C-Bet 成功率约 50%，5 人底池降到 25%\n• 强牌组合更可能：多人中"两对+"概率显著上升' },
      { type: 'key-point', content: '多人底池策略原则：①收紧价值范围（顶对不再值三条街）；②减少 C-Bet 诈唬（成功率低）；③用听牌便宜看翻牌（隐含赔率好）。' },
      { type: 'heading', content: 'C-Bet 策略调整' },
      { type: 'text', content: '多人底池的 C-Bet 频率应大幅降低（约 30-40%，单挑是 60-70%）：\n\n应该 C-Bet 的场景：\n• 你持有真正的强牌（两对+）→ 价值 C-Bet\n• 牌面干燥（如 K82r）且你击中顶对 → 价值 C-Bet\n• 你是翻前加注者且 heads-up 后位 → 可以选择性 C-Bet\n\n不该 C-Bet 的场景：\n• 牌面湿润（如 T♥9♥8♠）多人底池 → 太容易被加注\n• 你完全 miss 且有多个跟注站 → 诈唬成功率低\n• 中等牌力（顶对弱踢脚）多人底池 → 控制底池更优' },
      { type: 'example', content: '示例牌局：NL10，4 人底池，BB 翻前 Limp behind\n你持有 8♠9♠ 在 BB，UTG/MP/BTN 都 Limp，你 check\n翻牌：7♠T♠2♦\n\n分析：\n• 你持有 OESD + 同花听牌（共 15 outs）\n• 4 人底池，C-Bet 价值低（你不是翻前加注者）\n• 但你可以 check-raise 偷取底池\n\n正确做法：check，若有人下注 1/2 pot 则加注（半诈唬，大量 outs 支撑）\n错误做法：主动 donk bet，暴露牌力且面临多人加注风险' },
      { type: 'heading', content: '价值下注范围调整' },
      { type: 'text', content: '多人底池中价值下注需要的牌力门槛：\n• 4 人底池：两对起才能多条街价值下注\n• 5+ 人底池：三条起才值得多条街价值\n• 顶对顶踢脚：只能在翻牌下一条街价值，转牌后控制底池\n• 听牌成牌：成花/成顺后可以多条街价值下注\n\n记住：多人底池中"奇怪的两对"（如 87s 在 8-7-2 翻牌）非常常见，TPTK 不再安全。' },
      { type: 'highlight', content: '多人 Limp 底池的黄金法则：当有人主动加注时，几乎可以确定他持有两对或更好的牌。国内 Limp 玩家极少诈唬，加注即代表强牌。' },
      { type: 'pro-tip', content: '在多人底池中，听牌的隐含赔率极佳。如果你在 BB 持有 5♠6♠，4 人 Limp 后你只需补 1BB 看 5BB 底池，击中同花后可赢 30-50BB，这种投入产出比远胜单挑场景。' },
    ],
    quiz: [
      {
        id: 'local-limp-multiway-q1',
        question: '5 人底池中顶对顶踢脚（TPTK）的价值？',
        options: ['坚果牌，可打光', '贬值严重，只值一条街', '完全没用', '比两对还强'],
        correctIndex: 1,
        explanation: '5 人底池中 TPTK 胜率仅约 35%，贬值严重。应控制底池，最多在翻牌下一条街价值，转牌后转为控制。',
      },
      {
        id: 'local-limp-multiway-q2',
        question: '多人 Limp 底池中 C-Bet 频率应如何调整？',
        options: ['提高到 80%', '降低到 30-40%', '保持 60% 不变', '总是 100% C-Bet'],
        correctIndex: 1,
        explanation: '多人底池 C-Bet 成功率骤降（5 人底池约 25%），应降低频率到 30-40%。只在持有强牌或干燥牌面时 C-Bet。',
      },
      {
        id: 'local-limp-multiway-q3',
        question: '多人底池中听牌的价值如何？',
        options: ['贬值（容易被反加注）', '升值（隐含赔率好）', '不变', '完全没用'],
        correctIndex: 1,
        explanation: '多人底池听牌隐含赔率极佳——便宜看翻牌，击中后可赢多人筹码。同花连牌在多人底池是高 +EV 的投机牌。',
      },
      {
        id: 'local-limp-multiway-q4',
        question: '国内 Limp 玩家在多人底池主动加注通常代表？',
        options: ['诈唬', '两对或更强', '顶对', '听牌'],
        correctIndex: 1,
        explanation: '国内 Limp 玩家极少诈唬，多人底池主动加注几乎总是两对+。遇到加注应立即弃掉顶对等中等牌力。',
      },
    ],
  },
];
