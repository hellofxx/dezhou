import type { Lesson } from '../../../../../types';

export const HEADS_UP_LESSON: Lesson = {
  id: 'l3hu-bb-defense',
  level: 3,
  order: 3,
  title: 'BB 防守',
  subtitle: '单挑大盲的宽范围防守、过牌加注与不利位置控制',
  duration: '8 min',
  objectives: [
    '说明单挑 BB 防守 60%+ 的数学依据（翻前最后行动、已投 1BB 死钱带来的底池赔率），并区分它与跟注站的差异',
    '用底池赔率公式计算 BB 面对 SB min-raise 的跟注线（1÷(3+1) = 25%）',
    '判断强听牌面对 C-Bet 应 x/r 半诈唬、顶对顶踢脚在干燥面应跟注控池保留 SB 诈唬',
  ],
  variant: 'heads-up',
  variantContext: { dealerButtonPosition: 'HU_BB', anteStructure: 'sb_ante' },
  content: [
    { type: 'heading', content: 'BB：翻前信息最全、翻后要先行动的防守位' },
    {
      type: 'text',
      content:
        '单挑中 SB 先开池、BB 翻前最后再做决定，每手牌都要面对进攻，防守频率高达 60%+。这个"60%+ 防守"不是被动跟注，而是有结构的防守：跟注叠（中小对子、同花连张、弱 Ax）+ 3-bet 价值叠（强牌打价值）+ 3-bet 诈唬叠（阻断牌）。宽防守的数学依据是翻前信息优势加已投 1BB 死钱带来的底池赔率：SB min-raise 到 2BB 时你只需再跟 1BB。要清醒的是，翻后 BB 要先行动，权益实现率超 100% 的红利属于持有位置的 SB——BB 得用 check-call 与控池来补偿位置劣势。',
    },
    {
      type: 'key-point',
      content: 'BB 的"60%+ 防守"是有结构的防守：翻前最后做决定 + 已投 1BB 死钱，让边缘牌跟注的代价远低于满员桌。把满员桌"BB 只能打紧"搬进单挑，等于白白扔掉信息与赔率优势；但翻后 BB 要先行动，宽必须配上 check-call 与控池的纪律。',
    },
    { type: 'heading', content: '过牌加注（x/r）：BB 的关键杠杆' },
    {
      type: 'text',
      content:
        'BB 翻后要先行动，过牌后常面对 SB 的 C-Bet：跟注、过牌加注、弃牌。过牌加注（x/r）是 BB 构建范围的关键工具——用强牌 + 强听牌构成两极化 x/r 范围，压制 SB 的 C-Bet 频率，保护跟注范围不被剥削。x/r 的数学依据：当 SB 的 C-Bet 频率过高、弃牌率不足时，BB 的 x/r 半诈唬自动盈利。',
    },
    {
      type: 'example',
      content:
        '实例：单挑 100BB 深，SB min-raise 到 2BB，你（BB）持 7♠6♠ 跟注，底池 4BB。翻牌 8♣5♦2♠。你过牌，SB C-Bet 1.3BB（半池）。你有双卡顺（4 张 4 + 4 张 9）+ 后门同花，是标准 x/r 半诈唬牌。加注到 4BB 左右：SB 若弃牌你直接赢 5.3BB；被跟注你有 8+ 张 Outs 的改进空间。x/r 既保护你的听牌，又让 SB 的宽范围 C-Bet 付出代价。',
    },
    {
      type: 'example',
      content:
        '实例二（不利位置的控制）：同一底池，你（BB）持 A♠K♠，翻牌 K♦8♣3♥（干燥顶对）。你翻后先过牌，SB C-Bet 1.3BB。顶对顶踢脚在干燥面倾向跟注而非加注——用跟注保留 SB 的诈唬、同时避免在无位置时把底池造大。x/r 反而会把 SB 的弱牌赶走，浪费顶对的薄价值。OOP 的纪律是"用 check-call 实现强牌，不轻易造大底池"。',
    },
    {
      type: 'highlight',
      content: '反直觉点：BB 防守宽不等于跟注站。真正的跟注站没有 x/r、没有 3-bet 叠；而单挑 BB 的 60% 由跟注、3-bet 价值、3-bet 诈唬、x/r 四部分构成，每一部分都随 SB 倾向移动。防守的宽度与防守的被动是两回事。',
    },
    {
      type: 'pro-tip',
      content: 'BB 防守速查三步：(1) 报底池赔率——SB 开池 2BB 时跟注线 25%（SB 2 + 你已投 1 = 底池 3，再跟 1BB，1÷(3+1)=25%）；(2) 分叠——强成牌价值 3-bet、阻断牌诈唬 3-bet、中等牌跟注；(3) 看 SB——弃牌多的 SB 提高 3-bet，limp 多的提高 isolate，C-Bet 过频的提高 x/r。',
    },
  ],
  quiz: [],
  examples: [
    {
      id: 'l3hu-bb-defense-ex1',
      title: 'BB 面对 SB 宽开池的边缘跟注',
      heroHand: ['Ks', '7s'],
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
          'K7s 面对 SB 约 80% 开池范围胜率约 48%',
          '跟注 1BB 进入 4BB 总底池（SB 2 + BB 已投 1 + 跟注 1），所需胜率 = 1÷4 = 25%，富余约 23 个百分点',
          'BB 翻前最后做决定、赔率便宜，边缘牌即可盈利防守；翻后先用 check-call 补偿位置',
        ],
      },
      commonMistake: {
        action: 'Fold（"K7s 是烂牌"）',
        reasoning: '用满员桌标准打单挑会丢掉 BB 的翻前信息优势与底池赔率。K7s 面对 SB 宽范围是 +EV 的跟注。',
        evLoss: '-1.0 BB/100',
      },
    },
  ],
  practice: {
    id: 'l3hu-bb-defense-practice',
    questions: [
      {
        id: 'l3hu-bb-defense-p1',
        difficulty: 'beginner',
        scenario: {
          heroHand: ['Jd', '9d'],
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
          { action: 'Fold', isCorrect: false, explanation: 'J9s 面对 SB 宽范围可玩性好，fold 太紧浪费底池赔率。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Call', isCorrect: true, explanation: 'J9s 同花连张，跟注 1BB 进入 4BB 总底池（所需胜率 25%），赔率富余足以补偿翻后先行动的弱势，标准防守。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: '3-bet', isCorrect: false, explanation: 'J9s 偏投机，3-bet 太激进，跟注即可。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
        ],
        relatedLessonId: 'l3hu-bb-defense',
      },
      {
        id: 'l3hu-bb-defense-p2',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['8d', '7d'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['Jc', '9h', '3s'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Check-Fold', isCorrect: false, explanation: '87 有卡顺 + 后门同花，fold 太弱。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '87 有卡顺听牌，x/r 半诈唬压制 SB C-Bet 并保护听牌。', evImpact: '+1.2 BB/100', evLoss: 0 },
          { action: 'Donk Bet', isCorrect: false, explanation: 'Donk 不是标准打法，BB 应先 Check，面对 SB 的 C-Bet 再 x/r。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
        ],
        relatedLessonId: 'l3hu-bb-defense',
      },
      {
        id: 'l3hu-bb-defense-p3',
        difficulty: 'advanced',
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
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，3-bet 底池' },
        },
        options: [
          { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'AK 在 K-8-3 干燥面是顶对顶踢脚，3-bet 底池主动小注薄价值；SB 的弱牌只能廉价跟注或弃牌。', evImpact: '+2.0 BB/100', evLoss: 0 },
          { action: 'Check', isCorrect: false, explanation: '顶对顶踢脚应下注薄价值，check 太被动。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'All-in', isCorrect: false, explanation: '干燥面顶对 All-in 过度，小注薄价值即可。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
        ],
        relatedLessonId: 'l3hu-bb-defense',
      },
    ],
  },
};
