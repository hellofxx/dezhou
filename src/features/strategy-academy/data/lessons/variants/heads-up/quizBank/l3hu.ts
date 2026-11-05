import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L3 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel3.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）。
 */
export const LEVEL_3HU_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l3hu-bn-aggression': [
    {
      id: 'l3hu-bn-aggression-q1',
      question: '单挑中按钮位（SB）的核心频率优势是：',
      options: [
        '翻后最后行动（IP），每条街多一手信息',
        '翻前最后行动，每手牌都多一手信息',
        '每手牌都能免费看翻牌',
        '起手牌必然更好',
      ],
      correctIndex: 0,
      explanation: 'SB 即按钮位：它翻前先开池，翻后才轮到它最后行动（IP），这才是最核心的优势。"翻前最后行动"是满员桌按钮位思维，搬进单挑就是本题的陷阱。C 是 SB 补足盲注看翻牌，不属于位置优势。',
    },
    {
      id: 'l3hu-bn-aggression-q2',
      question: '单挑按钮位（SB）的典型开池频率约为：',
      options: ['约 30%', '约 50%', '约 80%', '100%'],
      correctIndex: 2,
      explanation: '单挑 SB 开池约 80%，因为只面对一个对手、任何对子与 Ax 都是强牌、翻后有位置。100% 虽接近但非 GTO（仍有垃圾需弃）。',
    },
    {
      id: 'l3hu-bn-aggression-q3',
      question: '干燥高牌面（K♠7♦2♣）上，单挑按钮位 C-Bet 的倾向是：',
      options: [
        '1/3 池小注高频（约 70%-80%）',
        '超池全下',
        '完全过牌',
        '只用坚果下注',
      ],
      correctIndex: 0,
      explanation: '干燥高牌面对手中牌率低，1/3 池小注即可偷池与薄价值，高频持续施压是标准打法。超池/只用坚果都浪费频率优势。',
    },
    {
      id: 'l3hu-bn-aggression-q4',
      question: '单挑按钮位"持续施压"的正确含义是：',
      options: [
        '每街都无脑下注',
        '以高频开池与 C-Bet 抢主动权，但湿润面懂得混合 check 控制底池',
        '永远下注到河牌',
        '只诈唬不价值',
      ],
      correctIndex: 1,
      explanation: '持续施压是频率优势，不是无脑开火。湿润牌面或转牌易手时混合 check 控制底池、提防 BB 的先行动反打才是正确姿势。',
    },
    {
      id: 'l3hu-bn-aggression-q5',
      question: '单挑中按钮位开池约 80% 的数学依据是：',
      options: [
        '任何对子和 Ax 都是强牌，只面对一个对手',
        '牌发得比别人好',
        '规则允许开池更多',
        '底池更大',
      ],
      correctIndex: 0,
      explanation: '单挑只面对一个对手，任何对子、Ax、同花连牌对宽范围都有足够权益，加上翻后有位置，故可高频开池。',
    },
  ],
  'l3hu-sb-continuation': [
    {
      id: 'l3hu-sb-continuation-q1',
      question: '单挑中 SB 翻后最后行动（IP），其 C-Bet 的核心特征是：',
      options: [
        '无脑代表强牌',
        '按牌面范围优势定频率，混合 check 控制底池',
        '永远过牌',
        '每街都大注',
      ],
      correctIndex: 1,
      explanation: 'SB 翻后最后行动且持有 IP，C-Bet 成本低、底池由你掌控。正确姿势是按牌面范围优势决定频率，混合 check 控池并防范 BB 的 x/r 反打。',
    },
    {
      id: 'l3hu-sb-continuation-q2',
      question: '干燥高牌面（K♠7♦2♣）上，SB（IP）的 C-Bet 频率倾向是：',
      options: [
        '高频（约 70%-80%）1/3 池小注',
        '完全过牌',
        '低频只用坚果',
        '超池全下',
      ],
      correctIndex: 0,
      explanation: '干燥面 SB 开池范围含大量 Kx，范围优势明显，1/3 池小注高频 C-Bet 让 BB 弱牌弃牌或薄价值。',
    },
    {
      id: 'l3hu-sb-continuation-q3',
      question: '湿润连接面（9♠8♥6♣）上，SB（IP）的 C-Bet 频率应：',
      options: [
        '保持高频',
        '大幅下降（约 30%-40%），因为 BB 有坚果优势',
        '完全停注',
        '只用超池',
      ],
      correctIndex: 1,
      explanation: '湿润面 BB 防守范围含大量顺子/听牌，坚果优势倒向 BB，SB 应降频并混合 check 控池。',
    },
    {
      id: 'l3hu-sb-continuation-q4',
      question: '单挑中 BB（翻后要先行动的一方）的过牌，正确理解是：',
      options: [
        '示弱，表示没有牌',
        '保留 x/r 杠杆，把决策权交给 IP 的 SB，是成熟打法',
        '永远错误',
        '只在河牌使用',
      ],
      correctIndex: 1,
      explanation: 'BB 翻后要先行动，它的过牌不是示弱，而是保留过牌加注的威胁、把球踢给最后行动的你——SB 必须为这种 x/r 风险定价。这是单挑 BB 的成熟姿势。',
    },
    {
      id: 'l3hu-sb-continuation-q5',
      question: 'SB 持超对在湿润面（9♠8♥6♣）的正确处理是：',
      options: [
        '只用 1/3 池小注',
        '2/3 池以上大注保护权益，但弱牌 check 控池',
        '直接弃牌',
        '无脑过牌',
      ],
      correctIndex: 1,
      explanation: '湿润面超对领先但易被反超，用 2/3 池大注保护权益；同时范围里弱牌 check，构建平衡的下注/过牌结构。',
    },
  ],
  'l3hu-bb-defense': [
    {
      id: 'l3hu-bb-defense-q1',
      question: '单挑 BB 面对 SB 开池的典型防守频率约为：',
      options: ['15%-25%', '30%-40%', '60%-70%', '85%-95%'],
      correctIndex: 2,
      explanation: '单挑 BB 防守约 60%-70%（跟注约 35%-50% + 3-bet 约 15%-25%）。15%-25% 是满员桌紧位置的量级，85%-95% 是被动跟注站。',
    },
    {
      id: 'l3hu-bb-defense-q2',
      question: '单挑 BB 防守 60%+ 的数学依据是：',
      options: [
        'BB 每手牌都更好',
        'BB 翻前最后做决定，已投 1BB 死钱带来底池赔率',
        'BB 必须阻止 SB 用任何牌偷盲',
        '规则要求',
      ],
      correctIndex: 1,
      explanation: 'BB 翻前最后做决定，且 SB 的 0.5 死钱让你跟注便宜，故可防守超过 MDF 底线且仍盈利。权益实现率超 100% 的红利属于持有位置的 SB，BB 要靠结构与赔率补偿翻后的先行动。',
    },
    {
      id: 'l3hu-bb-defense-q3',
      question: '湿润面（8♣5♦2♠）上，BB 持强听牌面对 SB 的 C-Bet，正确做法是：',
      options: [
        '跟注被动看牌',
        '过牌加注（x/r）半诈唬',
        '直接弃牌',
        '超池全下',
      ],
      correctIndex: 1,
      explanation: '强听牌（双卡顺+后门花）是标准 x/r 半诈唬牌：SB 弃牌直接赢，被跟注有改进空间，同时压制 SB 的 C-Bet 频率。',
    },
    {
      id: 'l3hu-bb-defense-q4',
      question: 'BB 持顶对顶踢脚在干燥面面对 SB C-Bet，正确做法是：',
      options: [
        '过牌加注赶走弱牌',
        '跟注，保留 SB 的诈唬；自己在 OOP 控池',
        '直接弃牌',
        '全下',
      ],
      correctIndex: 1,
      explanation: 'BB 翻后要先行动，顶对顶踢脚倾向跟注而非 x/r：跟注保留 SB 的诈唬，也在无位置时控制底池；x/r 反而赶走弱牌浪费薄价值。',
    },
    {
      id: 'l3hu-bb-defense-q5',
      question: '单挑 BB 的"60%+ 防守"与"跟注站"的区别是：',
      options: [
        '没有区别',
        'BB 的防守由跟注、3-bet 价值、3-bet 诈唬、x/r 构成且有结构，跟注站没有这些杠杆',
        '跟注站防守更宽',
        'BB 防守更被动',
      ],
      correctIndex: 1,
      explanation: 'BB 的 60% 是"有结构的选择"（含 3-bet 与 x/r 杠杆），跟注站是"舍不得弃牌"的被动。防守宽度 ≠ 防守被动。',
    },
  ],
};
