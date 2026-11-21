/* PokerLab · 牌室学院原型 — 模拟数据（课程 / 题库 / 种子状态） */
window.PL = (function () {
  const MENTORS = {
    'strict-math': { name: '沈算', style: '严谨数学', icon: 'sigma', quote: '扑克不是运气游戏，是长期期望值的生意。每一手牌，都是一道可以计算的题。' },
    'old-school': { name: '陈九', style: '老牌黑手', icon: 'spade', quote: '我打了三十年牌，输掉的筹码都交在同一个地方——不耐烦。位置、赔率、纪律，顺序不能乱。' },
    encouraging: { name: '林暖', style: '鼓励伙伴', icon: 'heart', quote: '错一手牌没关系，怕的是不知道为什么错。我们一题一题来，今天的你已经比昨天更懂这张桌子。' },
  };

  const STAGES = [
    { id: 's1', name: '入门 · 识局', sub: '规则、牌型与位置', glyph: 'book', lessons: ['l1', 'l2'], gate: '完成 2 课 + 课后检验' },
    { id: 's2', name: '基础 · 算赔', sub: '赔率、补牌与范围', glyph: 'calculator', lessons: ['l3', 'l4'], gate: '完成入门段全部课程' },
    { id: 's3', name: '进阶 · 谋势', sub: 'C-Bet、EV 与 GTO', glyph: 'target', lessons: ['l5', 'l6'], gate: '完成基础段全部课程' },
    { id: 's4', name: '精通 · 无惑', sub: '认证与实战校准', glyph: 'trophy', lessons: ['l7'], gate: '完成进阶段全部课程' },
  ];

  const LESSONS = {
    l1: {
      stage: 's1', title: '认识牌桌：规则与牌型', minutes: 5,
      intro: '德州扑克用 52 张牌，每人 2 张底牌，桌面陆续发出 5 张公共牌。从「自己的 2 张 + 公共 5 张」共 7 张里挑出最好的 5 张组合，就是你的手牌。',
      blocks: [
        { type: 'key-point', label: '关键要点', text: '牌型从大到小：皇家同花顺 > 同花顺 > 四条 > 葫芦 > 同花 > 顺子 > 三条 > 两对 > 一对 > 高牌。比牌先比「类型」，类型相同再比「点数」。' },
        { type: 'hand-example', label: '手牌示例', cards: [['A', '♠'], ['K', '♠'], ['Q', '♠'], ['J', '♠'], ['T', '♠']], note: 'A♠ K♠ Q♠ J♠ T♠ —— 皇家同花顺，德州扑克里最大的牌，约 65 万手才出现一次。' },
        { type: 'pro-tip', label: '职业牌手说', text: '新手最常犯的错是「高估一对」。一对 A 在多人底池里常常不够赢——牌型大小只是起点，真正的功夫在「相对强度」。' },
      ],
      takeaway: ['7 选 5：2 张底牌 + 5 张公共牌里挑最好的 5 张', '先比牌型类型，再比点数；踢脚牌（kicker）决定同类型的胜负', '一对并不强，相对强度比绝对牌型更重要'],
      quiz: [
        { q: '公共牌 A♥ K♥ 9♣ 4♦ 2♠，你手持 A♠ K♠，你的牌型是？', opts: ['一对 A', '两对（A 和 K）', '同花'], a: 1, explain: 'A♠K♠ 与公共牌组成 A-A-K-K-9，两对。同花需要同花色 5 张，这里只有 2 张红桃。' },
        { q: '葫芦（Full House）指的是？', opts: ['三条 + 一对', '四条 + 一张', '顺子 + 同花'], a: 0, explain: '葫芦 = 三条 + 一对，例如 K-K-K-7-7。它大于同花、小于四条。' },
        { q: '两人都是「一对 Q」，如何定胜负？', opts: ['平分底池', '比踢脚牌（剩余最大单牌）', '比花色'], a: 1, explain: '牌型相同比踢脚：Q-Q-A-9-4 胜过 Q-Q-K-9-4。德州扑克不比花色。' },
      ],
    },
    l2: {
      stage: 's1', title: '位置就是权力', minutes: 6,
      intro: '德州扑克里最被低估的武器不是好牌，而是「位置」。翻牌后谁最后行动，谁就掌握信息优势——你看过所有人的动作，才轮到你决定。',
      blocks: [
        { type: 'key-point', label: '关键要点', text: '6 人桌行动顺序（翻前）：UTG → HJ → CO → BTN → SB → BB。翻牌后顺序反过来，SB 先行动、BTN 最后行动。BTN（庄位）是全桌最好的位置。' },
        { type: 'hand-example', label: '同一手牌，两种命运', cards: [['A', '♠'], ['K', '♥']], note: 'A♠K♥ 在 BTN 是标准开牌加注；在 UTG 面对 3-bet 却要考虑弃牌。牌没变，位置变了，价值就变了。' },
        { type: 'counter-intuitive', label: '反直觉点', text: '在 BTN 你可以用更宽的范围开牌（约 40-50% 的手牌），在 UTG 却只能玩最紧的 15%。不是牌变好了，是「最后行动」让边缘牌也能赚钱。' },
        { type: 'pro-tip', label: '职业牌手说', text: '「位置是免费的筹码。」同样一手牌，有位置时你能控池、能诈唬、能免费看牌；没位置时你只能被动 guessing。选桌时，坐在松弱玩家的左边。' },
      ],
      takeaway: ['BTN 最后行动 = 信息优势 = 可以玩更宽的范围', 'UTG 最先行动 = 信息劣势 = 只玩强牌（约前 15%）', '同一手牌的价值随位置变化，范围表必须按位置记忆'],
      quiz: [
        { q: '6 人桌翻牌后，谁最后行动？', opts: ['BB（大盲）', 'BTN（庄位）', 'UTG（枪口）'], a: 1, explain: '翻牌后小盲先行动，庄位 BTN 最后行动——这就是 BTN 被称为最佳位置的原因。' },
        { q: '同样是 J♠T♠，在哪个位置最适合开牌加注？', opts: ['UTG', 'BTN', '都一样'], a: 1, explain: 'JTs 是边缘投机牌，需要位置带来的控池与诈唬空间。UTG 开牌范围应紧得多。' },
        { q: '「位置优势」本质上是什么？', opts: ['更容易拿到好牌', '后行动带来的信息优势', '底池赔率更高'], a: 1, explain: '位置不改变发牌概率，它改变的是信息：你看过对手的行动后再决策，长期 EV 显著更高。' },
      ],
    },
    l3: {
      stage: 's2', title: '底池赔率：跟注的数学', minutes: 7,
      intro: '每一次跟注都是一笔投资：你投入筹码，换取「赢下底池的机会」。底池赔率告诉你这笔投资的「盈亏平衡胜率」——低于它就该弃牌，高于它才是 +EV。',
      blocks: [
        { type: 'formula', label: '公式推导', text: '底池赔率 = 跟注额 ÷ (底池 + 跟注额)\n例：底池 100，对手下注 50 → 50 ÷ (100 + 50 + 50) = 25%' },
        { type: 'key-point', label: '关键要点', text: '算出「需要的胜率」后，与你「实际的胜率」比较：实际胜率 > 底池赔率 → 跟注 +EV；实际胜率 < 底池赔率 → 弃牌。这就是扑克决策的第一性原理。' },
        { type: 'hand-example', label: '算一笔账', cards: [['9', '♥'], ['8', '♥']], note: '底池 100，对手下注 50，你持同花听牌。跟注 50 争夺 200 的底池，需要 25% 胜率；若只看转牌一张，9 个补牌约 18%——不够，弃牌（除非有隐含赔率）。' },
        { type: 'pro-tip', label: '职业牌手说', text: '先算赔率，再谈感觉。90% 的「我觉得能中」都是 -EV 的借口。把 25%、33%、20% 这几个常见数字背到条件反射。' },
      ],
      takeaway: ['底池赔率 = 跟注额 ÷ (底池 + 跟注额)，即盈亏平衡胜率', '实际胜率 > 赔率要求 → 跟注；反之弃牌', '常见下注尺寸对应的赔率：1/2 池 → 25%，满池 → 33%'],
      quiz: [
        { q: '底池 80，对手下注 40，你跟注需要多少胜率？', opts: ['20%', '25%', '33%'], a: 1, explain: '40 ÷ (80 + 40 + 40) = 40 ÷ 160 = 25%。半池下注永远对应 25% 的盈亏平衡点。' },
        { q: '底池赔率要求 25%，你的听牌实际胜率约 18%（只看下一张），应该？', opts: ['跟注，搏一搏', '弃牌（不考虑隐含赔率）', '加注诈唬'], a: 1, explain: '18% < 25%，直接跟注是 -EV。只有后续街能赢到额外筹码（隐含赔率）时才值得考虑。' },
        { q: '对手全下满池（下注额 = 底池），你的跟注盈亏平衡胜率是？', opts: ['25%', '33%', '50%'], a: 1, explain: '设底池 P，跟注 P 争夺 3P：P ÷ 3P = 33%。满池下注对应 33%。' },
      ],
    },
    l4: {
      stage: 's2', title: '补牌与二四法则', minutes: 6,
      intro: '「补牌」（outs）是还没发出、但能让你反超的牌。数清补牌，再用二四法则快速估算胜率——这是把「听牌」从感觉变成数学的关键一步。',
      blocks: [
        { type: 'formula', label: '公式推导', text: '转牌命中率 ≈ 补牌数 × 2%\n翻牌全下（看两张）≈ 补牌数 × 4%\n例：同花听牌 9 outs → 转牌 ≈ 18%，翻牌到河牌 ≈ 36%' },
        { type: 'key-point', label: '关键要点', text: '同花听牌 9 outs、两头顺听牌 8 outs、卡顺 4 outs、两张高牌 6 outs。注意「重复补牌」要扣除——既是同花补牌又是顺子补牌的那张，只能数一次。' },
        { type: 'counter-intuitive', label: '反直觉点', text: '二四法则只在「翻牌看两张」时用 ×4；如果对手转牌还会下注，你付两次钱，就不能用 36% 去跟翻牌的全下尺寸——那是把两条街的钱当成一条街算。' },
        { type: 'hand-example', label: '数一数', cards: [['A', '♦'], ['7', '♦']], note: '公共牌 K♦ 9♦ 2♣：你持 A♦7♦，已有 4 张方块，剩余 9 张方块都是补牌 → 转牌约 18%，两条街约 35%（9×4=36 的近似）。' },
      ],
      takeaway: ['补牌 = 能让你反超的未发牌；同花 9、两头顺 8、卡顺 4', '二四法则：单街 ×2%，翻牌到河牌 ×4%', '重叠补牌只数一次；×4 只适用于「一次付费看两张」'],
      quiz: [
        { q: '两头顺子听牌（如 9T 在 J-8-2 面）有几个补牌？', opts: ['4 个', '8 个', '9 个'], a: 1, explain: '任意 Q 或 7 都成顺，各 4 张共 8 个 outs。卡顺才只有 4 个。' },
        { q: '翻牌圈同花听牌（9 outs），用二四法则估算到河牌的胜率约为？', opts: ['18%', '27%', '36%'], a: 2, explain: '翻牌看两张用 ×4：9 × 4 = 36%（精确值约 35%）。单看转牌才是 18%。' },
        { q: '你同时有同花听牌和卡顺听牌，其中 1 张牌重叠，总补牌数？', opts: ['13 个', '12 个', '9 个'], a: 1, explain: '9 + 4 = 13，减去重叠的 1 张 = 12。重叠牌不能重复计数。' },
      ],
    },
    l5: {
      stage: 's3', title: 'C-Bet：持续下注的时机', minutes: 7,
      intro: '翻前加注者，在翻牌圈继续下注，叫 C-Bet（持续下注）。它是现代扑克最频繁的武器——但「该不该 C-Bet」取决于牌面结构与你范围的优势，而不是惯性。',
      blocks: [
        { type: 'key-point', label: '关键要点', text: '干燥面（如 K♠7♦2♣）利于翻前加注者的范围，可以高频小尺寸 C-Bet（1/3 池）；湿润面（如 J♥T♥9♣）利于跟注者的范围，应降低频率、加大尺寸或过牌。' },
        { type: 'hand-example', label: '干燥面的价值下注', cards: [['K', '♥'], ['Q', '♥']], note: 'BTN 开牌被 BB 跟注，翻牌 K♠7♦2♣。你持 KQ 顶对好踢脚，BB 过牌 → 下注 2/3 池：既向弱 K、77 以下对子收价值，也保护手牌。' },
        { type: 'pro-tip', label: '职业牌手说', text: '「小尺寸高频，大尺寸低频。」1/3 池的 C-Bet 让对手用很宽的范围跟注，你在后续街继续施压；满池 C-Bet 则把范围极化，只留强牌与诈唬。' },
      ],
      takeaway: ['C-Bet 频率看牌面：干燥面高频小注，湿润面低频大注', '范围优势 = 你的强牌组合比对手多，而非「这手牌很强」', '1/3 池高频施压，满池极化，尺寸是范围的表达'],
      quiz: [
        { q: '翻牌 K♠7♦2♣（干燥面），BTN 开牌者持 A5s 落空，合理的 C-Bet 策略？', opts: ['放弃下注', '小尺寸（1/3 池）高频 C-Bet', '满池下注'], a: 1, explain: '干燥面利于开牌者范围，小尺寸让 BB 的弱对子、听牌难以便宜摊牌，落空牌也能盈利。' },
        { q: '翻牌 J♥T♥9♣（极湿润面），C-Bet 应该？', opts: ['提高频率、减小尺寸', '降低频率、加大尺寸或过牌', '永远满池'], a: 1, explain: '湿润面大量击中跟注者的范围（顺子、两对、强听牌），高频小注会被加注惩罚。' },
        { q: 'C-Bet 尺寸本质上在表达什么？', opts: ['手牌的绝对强度', '你的范围构成与牌面结构', '对手的人数'], a: 1, explain: '尺寸是范围的语言：小注 = 宽而薄，大注 = 极化。只按「我牌大就下大注」会被读穿。' },
      ],
    },
    l6: {
      stage: 's3', title: 'EV 决策树：把每个动作算清楚', minutes: 8,
      intro: '期望值（EV）是扑克唯一的记分牌。把每个动作写成「概率 × 收益」的算式，决策就从争论变成计算——这也是 GTO 与剥削策略共同的底座。',
      blocks: [
        { type: 'formula', label: '公式推导', text: 'EV = P(赢) × 赢得额 − P(输) × 输掉额\n例：胜率 40%，跟注 50 争夺 200 → EV = 0.4×150 − 0.6×50 = +30' },
        { type: 'key-point', label: '关键要点', text: '比较动作时只算「增量 EV」：弃牌 EV 恒为 0；跟注与加注各自展开概率树。GTO 是「不可被剥削的均衡」，剥削是「针对对手漏洞偏离均衡」——两者都以 EV 为裁判。' },
        { type: 'counter-intuitive', label: '反直觉点', text: '正确的决策可能输钱，错误的决策可能赢钱。一手牌的输赢是噪音，EV 才是信号。复盘时问「这个动作 +EV 吗」，而不是「这手赢了吗」。' },
        { type: 'pro-tip', label: '职业牌手说', text: '建立你的决策树模板：对手范围 → 我的胜率 → 各动作 EV → 选最大。练到 10 秒内能估出主干，你就超过了 90% 凭感觉打牌的人。' },
      ],
      takeaway: ['EV = 概率 × 收益的加权；弃牌 EV = 0 是基准线', '结果有噪音，EV 是信号：复盘评动作不评输赢', 'GTO 求均衡、剥削抓漏洞，裁判都是 EV'],
      quiz: [
        { q: '胜率 30%，跟注 40 争夺总底池 160（含你的 40），跟注 EV 约为？', opts: ['+8', '−8', '+40'], a: 0, explain: 'EV = 0.3×120 − 0.7×40 = 36 − 28 = +8。赢了净赚 120，输了损失 40。' },
        { q: '一个 +EV 的跟注这手输了，说明？', opts: ['决策错了', '决策仍正确，输赢是短期噪音', '应该改打紧'], a: 1, explain: 'EV 描述长期平均。单次结果受方差支配，不能用结果反推动作对错。' },
        { q: 'GTO 策略的核心目标是？', opts: ['赢下每一手牌', '让对手无法通过调整剥削你', '永远诈唬'], a: 1, explain: 'GTO 是均衡策略：对手无论怎么调整都无法提高对你的 EV。它不保证每手赢，保证不被剥削。' },
      ],
    },
    l7: {
      stage: 's4', title: '牌室认证：从入门到精通', minutes: 10, exam: true,
      intro: '认证考试覆盖四段核心能力：牌型与位置、赔率与补牌、C-Bet 与 EV。5 题答对 4 题即通过——认证不是终点，而是「可以独立复盘」的起点。',
      blocks: [
        { type: 'key-point', label: '认证标准', text: '5 题 ≥ 4 对通过。未通过可无限次重考，错题自动进入间隔复习队列。认证后解锁「精通」段全部训练与复盘工具。' },
      ],
      takeaway: ['认证考的是决策框架，不是死记硬背', '错题入 SRS 队列，在遗忘临界点重见', '通过后可独立导入牌局复盘，用 GTO 标准校准'],
      quiz: [
        { q: 'BTN 持 A♠K♥，前面全部弃牌，标准动作？', opts: ['弃牌', ' limp 跟注', '加注开牌'], a: 2, explain: 'AKo 是前 5% 强牌，BTN 开牌加注约 2.5bb，limp 放弃主动权。' },
        { q: '底池 100，对手下注 100，你跟注的盈亏平衡胜率？', opts: ['25%', '33%', '50%'], a: 1, explain: '100 ÷ 300 = 33%。满池下注的跟注门槛。' },
        { q: '翻牌同花听牌 9 outs，转牌命中率约？', opts: ['18%', '36%', '9%'], a: 0, explain: '单街 ×2：9×2 = 18%。×4 只用于翻牌一次付费看两张。' },
        { q: '干燥面 K♠7♦2♣，BTN 开牌者的 C-Bet 倾向？', opts: ['高频小尺寸', '低频满池', '从不 C-Bet'], a: 0, explain: '干燥面利于开牌者范围，1/3 池高频施压是标准打法。' },
        { q: '复盘时判断一手牌打得好不好，应该看？', opts: ['这手是否赢钱', '动作是否 +EV', '对手是否亮出强牌'], a: 1, explain: '结果是噪音，EV 是信号。+EV 的输牌仍是好决策。' },
      ],
    },
  };

  /* 训练题库：grade 由 evLoss 推导（best 0 / good ≤0.5 / ok ≤1.5 / wrong ≤3 / blunder >3） */
  const QUESTIONS = [
    {
      id: 'q1', kind: 'preflop', pos: 'BTN', street: '翻前 · 6 人桌', cards: [['A', '♠'], ['K', '♥']],
      pot: '1.5bb', stack: '100bb', note: '前面全部弃牌，轮到你行动。',
      q: 'A♠K♥ 在 BTN，前面全弃。你的标准动作？',
      opts: [
        { label: '弃牌', sub: 'Fold', ev: 3.2 },
        { label: '跟注', sub: 'Limp 1bb', ev: 0.8 },
        { label: '加注', sub: 'Raise 2.5bb', ev: 0 },
      ],
      explain: 'AKo 是前 5% 的强牌，BTN 标准开牌 2.5bb。limp 放弃主动权且暴露范围，弃牌则是直接扔掉 +EV。',
      lesson: 'l2',
    },
    {
      id: 'q2', kind: 'preflop', pos: 'UTG', street: '翻前 · 6 人桌', cards: [['7', '♣'], ['2', '♦']],
      pot: '1.5bb', stack: '100bb', note: '你是第一个行动的人，后面还有 5 家。',
      q: '7♣2♦ 在 UTG（枪口位），你的动作？',
      opts: [
        { label: '弃牌', sub: 'Fold', ev: 0 },
        { label: '跟注', sub: 'Limp 1bb', ev: 2.1 },
        { label: '加注', sub: 'Raise 2.5bb', ev: 4.6 },
      ],
      explain: '72o 是德州最弱起手牌，UTG 范围应最紧（约前 15%）。任何入池都是长期亏损，弃牌就是赚钱。',
      lesson: 'l2',
    },
    {
      id: 'q3', kind: 'odds', pos: 'BB', street: '转牌圈', cards: [['9', '♥'], ['8', '♥']], board: [['K', '♥'], ['4', '♦'], ['2', '♣'], ['7', '♠']],
      pot: '100', stack: '420', note: '对手下注 50。你只有同花听牌，且只看这一张转牌后的河牌前决策（无隐含赔率）。',
      q: '底池 100，对手下注 50，你持同花听牌（9 outs ≈ 18%）。跟注需要 25% 胜率，你该？',
      opts: [
        { label: '弃牌', sub: 'Fold', ev: 0 },
        { label: '跟注', sub: 'Call 50', ev: 1.4 },
        { label: '加注', sub: 'Raise 150', ev: 3.8 },
      ],
      explain: '18% < 25%，直接跟注 -EV（每 100 次约亏 14）。没有隐含赔率补偿时，纪律性弃牌是唯一 +EV 动作。',
      lesson: 'l3',
    },
    {
      id: 'q4', kind: 'odds', pos: 'CO', street: '翻牌圈 · 全下决策', cards: [['J', '♠'], ['T', '♠']], board: [['9', '♦'], ['8', '♣'], ['2', '♥']],
      pot: '80', stack: '300', note: '对手全下 40（一次付费看转牌+河牌两张）。你是两头顺听牌，8 outs ≈ 32%。',
      q: '底池 80，对手全下 40，你跟注需 25% 胜率；两头顺到河牌约 32%。你该？',
      opts: [
        { label: '弃牌', sub: 'Fold', ev: 1.9 },
        { label: '跟注', sub: 'Call 40', ev: 0 },
        { label: '——', sub: '已全下无法加注', ev: 99 },
      ],
      explain: '32% > 25%，跟注 +EV：0.32×120 − 0.68×40 ≈ +11。全下场景一次付费看两张，正是 ×4 法则的适用情形。',
      lesson: 'l4',
    },
    {
      id: 'q5', kind: 'preflop', pos: 'CO', street: '翻前 · 面对开牌', cards: [['A', '♠'], ['A', '♥']],
      pot: '4bb', stack: '100bb', note: 'UTG 开牌加注 2.5bb，其余弃牌，轮到你。',
      q: 'A♠A♥ 面对 UTG 开牌，你的动作？',
      opts: [
        { label: '弃牌', sub: 'Fold', ev: 9.5 },
        { label: '跟注', sub: 'Call 2.5bb', ev: 0.9 },
        { label: '3-Bet', sub: 'Raise 9bb', ev: 0 },
      ],
      explain: 'AA 是最大起手牌，3-bet 建池并隔离。慢打跟注虽不致命，但让 UTG 便宜看翻牌、多人入池会显著稀释 AA 的胜率。',
      lesson: 'l6',
    },
    {
      id: 'q6', kind: 'gto', pos: 'BTN', street: '河牌圈', cards: [['K', '♦'], ['9', '♣']], board: [['K', '♠'], ['7', '♦'], ['2', '♣'], ['4', '♥'], ['8', '♠']],
      pot: '100', stack: '260', note: '对手全下 100。读牌显示其范围约 2/3 是两对以上的价值牌，你顶对弱踢脚胜率约 25%。',
      q: '河牌底池 100，对手全下 100（需 33% 胜率），你顶对弱踢脚约 25%。你该？',
      opts: [
        { label: '弃牌', sub: 'Fold', ev: 0 },
        { label: '跟注', sub: 'Call 100', ev: 2.4 },
        { label: '——', sub: '无法加注', ev: 99 },
      ],
      explain: '25% < 33%，抓鸡失败的成本高于收益。顶对在河牌面对满池全下常常只是「 bluff catcher 」，范围不利时弃牌是纪律。',
      lesson: 'l6',
    },
    {
      id: 'q7', kind: 'puzzle', pos: 'BTN', street: '翻牌圈 · C-Bet', cards: [['K', '♥'], ['Q', '♥']], board: [['K', '♠'], ['7', '♦'], ['2', '♣']],
      pot: '12', stack: '94', note: '你 BTN 开牌，BB 跟注。干燥面，BB 过牌给你。',
      q: 'K♠7♦2♣ 干燥面，你持 KQ 顶对好踢脚，BB 过牌。你的动作？',
      opts: [
        { label: '过牌', sub: 'Check', ev: 1.1 },
        { label: '下注', sub: 'Bet 8 (2/3 池)', ev: 0 },
        { label: '全下', sub: 'All-in 94', ev: 3.4 },
      ],
      explain: '顶对好踢脚在干燥面应下注收价值：弱 K、77 以下对子会跟注。过牌放弃价值，全下则把弱牌全部吓跑、只被更强牌跟注。',
      lesson: 'l5',
    },
    {
      id: 'q8', kind: 'preflop', pos: 'BB', street: '翻前 · 防守', cards: [['A', '♣'], ['5', '♣']],
      pot: '5.5bb', stack: '97bb', note: 'BTN 开牌 2.5bb，SB 弃牌。你在 BB，已投入 1bb。',
      q: 'A♣5♣ 在 BB 面对 BTN 开牌，你的动作？',
      opts: [
        { label: '弃牌', sub: 'Fold', ev: 1.2 },
        { label: '跟注', sub: 'Call 1.5bb', ev: 0 },
        { label: '3-Bet', sub: 'Raise 9bb', ev: 0.7 },
      ],
      explain: 'BB 对 BTN 有赔率优势（只需补 1.5bb 争夺 5.5bb），A5s 有同花与轮子潜力，标准跟注防守。3-bet 偏激进，弃牌则放弃了便宜的看牌权。',
      lesson: 'l2',
    },
  ];

  const DRILL_SET = ['q1', 'q2', 'q5', 'q8', 'q3'];
  const QUICK_SET = ['q3', 'q7', 'q4'];

  const MODULES = [
    { id: 'range', title: '范围训练', desc: '13×13 网格 · 按位置记忆开牌范围', icon: 'grid', color: 'var(--brass-bright)', to: '#/drill', texture: 'grid' },
    { id: 'odds', title: '底池赔率', desc: '赔率计算 · 二四法则速算', icon: 'calculator', color: 'var(--sage-text)', to: '#/lesson/l3', texture: 'dots' },
    { id: 'gto', title: 'GTO 模拟', desc: '决策树 · 不可剥削的均衡', icon: 'brain', color: 'var(--freeze)', to: '#/drill', texture: 'diag' },
    { id: 'academy', title: '策略学院', desc: '四段路径 · 课后检验与认证', icon: 'book', color: 'var(--success)', to: '#/home', texture: 'lines' },
    { id: 'puzzle', title: '谜题训练', desc: '每日谜题 · 主题 Drill', icon: 'puzzle', color: 'var(--brass-bright)', to: '#/quick', texture: 'diag' },
    { id: 'review', title: '牌局复盘', desc: '街 timeline · GTO 偏差检测', icon: 'history', color: 'var(--leather)', to: '#/progress', texture: 'dots' },
  ];

  const ACHIEVEMENTS = [
    { id: 'first-seat', name: '初来乍到', desc: '完成首次落座引导', medal: 'gold', icon: 'spade' },
    { id: 'streak-3', name: '三日不辍', desc: '连续训练 3 天', medal: 'bronze', icon: 'flame' },
    { id: 'odds-master', name: '赔率学徒', desc: '赔率维度达到 60', medal: 'silver', icon: 'calculator' },
    { id: 'certified', name: '牌室认证', desc: '通过精通段认证考试', medal: 'gold', icon: 'trophy' },
    { id: 'centurion', name: '百炼成钢', desc: '累计完成 100 次训练', medal: 'silver', icon: 'target' },
  ];

  const SEED = {
    v: 1,
    onboarded: false,
    mentor: 'encouraging',
    theme: 'dark',
    motion: true,
    goal: 3,
    demoUnlock: false,
    streakDays: 4,
    week: [1, 1, 1, 1, 0, 0, 0],
    freeze: 1,
    elo: 1180,
    eloHistory: [1080, 1095, 1088, 1102, 1118, 1109, 1126, 1140, 1133, 1152, 1161, 1155, 1172, 1180],
    dims: { preflop: 62, odds: 48, gto: 35, mental: 55, review: 40 },
    lessons: { l1: 'done' },
    lessonScores: { l1: 3 },
    srs: [
      { front: 'BTN 开牌范围宽度', meta: '间隔 1 天 · 第 2 次复习' },
      { front: '底池赔率公式', meta: '间隔 3 天 · 第 3 次复习' },
      { front: '二四法则的适用街', meta: '间隔 1 天 · 第 1 次复习' },
    ],
    achievements: ['first-seat', 'streak-3'],
    accuracy7: [62, 58, 66, 71, 64, 73, 0],
    sessions: 6,
    tasks: { lesson: false, drill: false, srs: false },
    mood: null,
    lastDrill: null,
  };

  return { MENTORS, STAGES, LESSONS, QUESTIONS, DRILL_SET, QUICK_SET, MODULES, ACHIEVEMENTS, SEED };
})();