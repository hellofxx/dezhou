import type { Lesson } from '../../../../../types';

export const HEADS_UP_LESSON: Lesson = {
  id: 'l3hu-bn-aggression',
  level: 3,
  order: 1,
  title: '按钮位激进度',
  subtitle: '单挑按钮位的频率优势与翻后持续施压',
  duration: '8 min',
  objectives: [
    '说明单挑 SB 的频率优势来源（只面对一个对手、翻后最后行动持有位置），并说出开池约 80% 与满员桌的差异',
    '判断干燥高牌面（1/3 池小注、约 70%-80% 频率）与湿润连接面（降频 + 2/3 池大注）的 C-Bet 处理差异',
    '区分「持续施压」与「无脑开火」：判断湿润面或转牌牌面易手时应混合 check 控制底池、防范 BB 的 x/r 反打',
  ],
  variant: 'heads-up',
  variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
  content: [
    { type: 'heading', content: '单挑按钮位：翻后最后行动的位置优势' },
    {
      type: 'text',
      content:
        '单挑中按钮位（SB）翻前先开池、翻后才轮到最后行动，这是你每手牌都能享受到的位置优势。因为只有一个对手，你可以用约 80% 的手牌开池——任何对子、任何 Ax、同花连牌都可以玩。这个优势的关键不是"牌更强"，而是"频率更高 + 翻后有位置"：你抢走主动权、让对手持续被动回应，对手的防守成本会随你的激进度快速上升。',
    },
    {
      type: 'key-point',
      content: '按钮位的激进不是"打得更松"，而是"更积极地抢主动权"。每手牌你翻后最后行动，意味着 BB 每条街都必须先做决定——用这个优势持续施压，而不是浪费在等待好牌。',
    },
    { type: 'heading', content: '翻后持续施压：C-Bet 的频率与尺度' },
    {
      type: 'text',
      content:
        '翻后你（SB）最后行动、持有位置，翻前的主动权叠加翻后的位置红利，让 C-Bet 价值更高。单挑中 C-Bet 频率远高于满员桌：因为对手防守范围宽、中牌率低，你的连续下注能高频偷走底池。干燥高牌面用 1/3 池小注高频（约 70%-80% 频率），湿润连接面用 2/3 池以上大注保护权益。关键在于——单挑 C-Bet 的价值是"让宽范围的弱牌弃牌 + 薄价值"，而非"代表强牌"。',
    },
    {
      type: 'example',
      content:
        '实例：单挑 100BB 深，你（SB）持 A♠5♠ min-raise 到 2BB，BB 跟注，底池 4BB。翻牌 K♠7♦2♣。你是翻前 aggressor，且翻后最后行动（IP）。干燥高牌面，BB 范围极少中 K，你下注 1/3 池约 1.3BB：A5 的高牌 + 后门同花有足够权益支持持续施压，同时让 BB 的垃圾牌付费。BB 若弃牌你直接赢 4BB，若跟注你有 A 高作为后续改进空间。',
    },
    {
      type: 'highlight',
      content: '反直觉点：单挑按钮位"持续施压"不等于"每街都下注"。翻后你虽是最后行动的一方，面对湿润牌面或转牌牌面易手时，仍要懂得混合 check 控制底池，提防先行动的 BB 用 x/r 反打——激进是频率优势，不是无脑开火。',
    },
    {
      type: 'pro-tip',
      content: '按钮位激进度速记：翻前开池约 80%，翻后干燥面 C-Bet 约 70%-80%（1/3 池），湿润面降频用大注。每 50 手检查一次：你的 C-Bet 频率是否太低让 BB 的弱牌廉价看到转牌？你的开池是否太紧浪费了翻后有位置的优势？',
    },
  ],
  quiz: [],
  examples: [
    {
      id: 'l3hu-bn-aggression-ex1',
      title: '单挑按钮位的高频开池',
      heroHand: ['Qc', '7c'],
      heroPosition: 'SB',
      previousActions: [],
      street: 'preflop',
      effectiveStack: 100,
      potSize: 1.5,
      correctDecision: {
        action: 'Min-raise',
        amount: '2BB',
        reasoning: [
          'Q7s 在单挑中是标准开池牌，面对 BB 约 60% 防守范围有足够权益',
          'SB 翻前先开池，min-raise 以 1.5BB 风险争夺 1BB 盲注',
          '同花牌翻后潜力好，深筹码下可以持续施压',
        ],
      },
      commonMistake: {
        action: 'Fold（"Q7s 不够好"）',
        reasoning: '用满员桌标准打单挑会浪费按钮位的频率与位置优势。Q7s 在单挑中是标准 open。',
        evLoss: '-1.5 BB/100',
      },
    },
  ],
  practice: {
    id: 'l3hu-bn-aggression-practice',
    questions: [
      {
        id: 'l3hu-bn-aggression-p1',
        difficulty: 'beginner',
        scenario: {
          heroHand: ['Jc', '8c'],
          heroPosition: 'SB',
          previousActions: [],
          street: 'preflop',
          potSize: 1.5,
          effectiveStack: 100,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Fold', isCorrect: false, explanation: 'J8s 在单挑中是标准开池牌，fold 太紧浪费按钮位优势。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
          { action: 'Call', isCorrect: false, explanation: 'Limp 太被动，单挑 SB 应积极 min-raise 抢主动权。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          { action: 'Min-raise', isCorrect: true, explanation: 'J8s 在单挑中可玩性好，SB 翻前先行动、翻后再由你最后决策，应 min-raise 开池。', evImpact: '+1.0 BB/100', evLoss: 0 },
        ],
        relatedLessonId: 'l3hu-bn-aggression',
      },
      {
        id: 'l3hu-bn-aggression-p2',
        difficulty: 'intermediate',
        scenario: {
          heroHand: ['As', '9h'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['Kd', '7c', '3h'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Check', isCorrect: false, explanation: 'A9 高牌在干燥面对 BB 宽范围有下注价值，check 太被动。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
          { action: 'Bet 1.3BB（1/3 pot）', isCorrect: true, explanation: '干燥 K 高面，A 高有后门改进空间，1/3 池小注持续施压偷池。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'All-in', isCorrect: false, explanation: 'A 高 All-in 过度，深筹码应用小注施压即可。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
        ],
        relatedLessonId: 'l3hu-bn-aggression',
      },
      {
        id: 'l3hu-bn-aggression-p3',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['9h', '8h'],
          heroPosition: 'SB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' },
            { player: 'BB', action: 'call' },
          ],
          board: ['Jd', '7c', '2s'],
          street: 'flop',
          potSize: 4,
          effectiveStack: 95,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
        },
        options: [
          { action: 'Bet 1.3BB（1/3 pot）', isCorrect: true, explanation: '98 在 J-6-2 面有卡顺 + 后门同花，1/3 池半诈唬持续施压。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'Check-Fold', isCorrect: false, explanation: '98 有听牌潜力，fold 太弱。单挑按钮位应积极半诈唬。', evImpact: '-1.0 BB/100', evLoss: 1 },
          { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，1/3 池半诈唬即可建立优势。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
        ],
        relatedLessonId: 'l3hu-bn-aggression',
      },
    ],
  },
};
