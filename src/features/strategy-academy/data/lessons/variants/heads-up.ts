import type { Lesson } from '../../../types';

/**
 * Heads-Up（单挑）L3-L8 课程骨架（P2 变体支持，Day 3-4）。
 *
 * 2 人对战、SB 强制 Ante、翻后 SB（BTN）有位置、无位置解锁。
 * l7hu-stakes 为标准课程纯化（2026-08-06）自 LEVEL_7_LESSONS 迁入的单挑策略基础课；
 * 其余课程为骨架，实际内容由后续任务（Day 5+）按设计文档填充。
 * variant 显式声明为 'heads-up'；variantContext 标注按钮位归属与 Ante 结构。
 */
export const HEADS_UP_STRATEGY_COURSES: Lesson[] = [
  // ===== L3 翻后策略 =====
  {
    id: 'l3hu-bn-aggression',
    level: 3,
    order: 1,
    title: '按钮位激进度',
    subtitle: '单挑按钮位的频率优势与翻后持续施压',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: '单挑按钮位：翻前最后行动的频率优势' },
      {
        type: 'text',
        content:
          '单挑中按钮位（SB）是翻前最后行动的一方，这是你每手牌都能享受到的频率优势。因为只有一个对手，你可以用约 80% 的手牌开池——任何对子、任何 Ax、同花连牌都可以玩。这个优势的关键不是"牌更强"，而是"频率更高"：你抢走主动权、让对手持续被动回应，对手的防守成本会随你的激进度快速上升。',
      },
      {
        type: 'key-point',
        content: '按钮位的激进不是"打得更松"，而是"更积极地抢主动权"。每手牌你翻前最后行动，意味着你比 BB 多一手信息——用这个优势持续施压，而不是浪费在等待好牌。',
      },
      { type: 'heading', content: '翻后持续施压：C-Bet 的频率与尺度' },
      {
        type: 'text',
        content:
          '翻后你（SB）虽然先行动（位置反转，OOP），但翻前的主动权让 C-Bet 仍具价值。单挑中 C-Bet 频率远高于满员桌：因为对手防守范围宽、中牌率低，你的连续下注能高频偷走底池。干燥高牌面用 1/3 池小注高频（约 70%-80% 频率），湿润连接面用 2/3 池以上大注保护权益。关键在于——单挑 C-Bet 的价值是"让宽范围的弱牌弃牌 + 薄价值"，而非"代表强牌"。',
      },
      {
        type: 'example',
        content:
          '实例：单挑 100BB 深，你（SB）持 A♠5♠ min-raise 到 2BB，BB 跟注，底池 4BB。翻牌 K♠7♦2♣。你是翻前 aggressor 但翻后 OOP。干燥高牌面，BB 范围极少中 K，你下注 1/3 池约 1.3BB：A5 的高牌 + 后门同花有足够权益支持持续施压，同时让 BB 的垃圾牌付费。BB 若弃牌你直接赢 4BB，若跟注你有 A 高作为后续改进空间。',
      },
      {
        type: 'highlight',
        content: '反直觉点：单挑按钮位"持续施压"不等于"每街都下注"。翻后你 OOP（先行动），面对湿润牌面或转牌牌面易手时，要懂得混合 check 保留过牌加注（x/r）杠杆——激进是频率优势，不是无脑开火。',
      },
      {
        type: 'pro-tip',
        content: '按钮位激进度速记：翻前开池约 80%，翻后干燥面 C-Bet 约 70%-80%（1/3 池），湿润面降频用大注。每 50 手检查一次：你的 C-Bet 频率是否太低让 BB 无限 check-float？你的开池是否太紧浪费了最后行动优势？',
      },
    ],
    quiz: [
      {
        id: 'l3hu-bn-aggression-q1',
        question: '单挑中按钮位（SB）的核心频率优势是：',
        options: [
          '翻前最后行动，每手牌都多一手信息',
          '翻后最后行动',
          '每手牌都能免费看翻牌',
          '起手牌必然更好',
        ],
        correctIndex: 0,
        explanation: '单挑 SB 翻前最后行动（有翻前位置），这是它最核心的优势；翻后反而先行动（OOP）。C 是 SB 补足盲注看翻牌，不属于"最后行动优势"。',
      },
      {
        id: 'l3hu-bn-aggression-q2',
        question: '单挑按钮位（SB）的典型开池频率约为：',
        options: ['约 30%', '约 50%', '约 80%', '100%'],
        correctIndex: 2,
        explanation: '单挑 SB 开池约 80%，因为只面对一个对手、任何对子与 Ax 都是强牌、翻前最后行动。100% 虽接近但非 GTO（仍有垃圾需弃）。',
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
          '以高频开池与 C-Bet 抢主动权，但湿润面懂得混合 check 保留 x/r 杠杆',
          '永远下注到河牌',
          '只诈唬不价值',
        ],
        correctIndex: 1,
        explanation: '持续施压是频率优势，不是无脑开火。湿润牌面或转牌易手时混合 check 保留 x/r 杠杆才是正确姿势。',
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
        explanation: '单挑只面对一个对手，任何对子、Ax、同花连牌对宽范围都有足够权益，加上翻前最后行动，故可高频开池。',
      },
    ],
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
            'SB 翻前最后行动，min-raise 以 1.5BB 风险争夺 1BB 盲注',
            '同花牌翻后潜力好，深筹码下可以持续施压',
          ],
        },
        commonMistake: {
          action: 'Fold（"Q7s 不够好"）',
          reasoning: '用满员桌标准打单挑会浪费按钮位最后行动的频率优势。Q7s 在单挑中是标准 open。',
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
            { action: 'Min-raise', isCorrect: true, explanation: 'J8s 在单挑中可玩性好，SB 翻前最后行动，应 min-raise 开池。', evImpact: '+1.0 BB/100', evLoss: 0 },
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
            board: ['Jd', '6c', '2s'],
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
  },
  {
    id: 'l3hu-sb-continuation',
    level: 3,
    order: 2,
    title: 'SB 持续下注',
    subtitle: '单挑 SB 翻后延续下注的尺度、频率与范围',
    duration: '7 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: 'SB 的 C-Bet：OOP 的持续下注纪律' },
      {
        type: 'text',
        content:
          '单挑中 SB 翻后先行动（OOP），这意味着你的 C-Bet 不是"代表强牌"，而是"用正确的范围与尺度让宽范围的 BB 弃牌或付费"。与满员桌 BTN 不同，SB 的 C-Bet 面对 IP 的 BB 时成本更高：被加注时进退两难。因此 SB 的 C-Bet 范围更依赖牌面与范围优势——干燥高牌面高频、湿润连接面降频，并混合 check 保留 x/r 杠杆。',
      },
      {
        type: 'key-point',
        content: 'OOP 的 C-Bet 核心纪律：先判断"这个牌面击中谁的范围"。干燥面 SB 范围优势大 → 高频小注；湿润面 BB 坚果优势 → 降频控池。不要因为"我是 aggressor"就无脑开火。',
      },
      { type: 'heading', content: '尺度与范围：何时继续、何时 check' },
      {
        type: 'text',
        content:
          'SB 翻后持续下注的选择分三层：(1) 干燥高牌面（如 K♠7♦2♣）——SB 开池范围含大量 Kx，范围优势明显，用 1/3 池小注高频 C-Bet（约 70%-80%），让 BB 的宽范围弱牌弃牌或薄价值；(2) 湿润连接面（如 9♠8♥6♣）——BB 防守范围含大量顺子/听牌，坚果优势倒向 BB，SB 应降频（约 30%-40%）并混合 check；(3) 无范围优势的中性面——SB 用中小对子 check-call、强听牌 check-raise，构建平衡范围。',
      },
      {
        type: 'example',
        content:
          '实例：单挑 100BB 深，你（SB）min-raise 到 2BB，BB 跟注，底池 4BB。翻牌 Q♦8♣3♠（干燥）。你是 OOP。你的开池范围含大量 Qx，BB 防守范围难中 Q，范围优势在你。下注 1/3 池约 1.3BB：QJ/QT 薄价值、A 高半诈唬、小对子也下注——整个范围高频 C-Bet，BB 的弱牌只能弃牌。',
      },
      {
        type: 'example',
        content:
          '实例二（湿润面降频）：同一底池，翻牌 9♠8♥6♣。BB 防守范围含 87/65/97 等大量顺子与听牌，坚果优势倒向 BB。你持 K♠K♦（超对）：仍领先但易被反超，下注 2/3 池保护权益，但 A 高、小对子等弱牌应 check 控池——SB 此面 C-Bet 频率大幅下降。',
      },
      {
        type: 'highlight',
        content: '反直觉点：OOP 的 C-Bet 不等于"主动权的宣告"。翻前 aggressor 翻后 OOP 时，check 不是示弱，而是把决策权交给 IP 再决定接不接。混合 check 保留 x/r 杠杆，才是单挑 SB 的成熟打法。',
      },
      {
        type: 'pro-tip',
        content: 'SB C-Bet 决策三问：(1) 牌面击中谁的范围？(2) 我的牌是价值、半诈唬还是纯空气？(3) 被加注我能否应对？三问走完，OOP 的持续下注就从惯性变成结构。',
      },
    ],
    quiz: [
      {
        id: 'l3hu-sb-continuation-q1',
        question: '单挑中 SB 翻后先行动（OOP），其 C-Bet 的核心特征是：',
        options: [
          '无脑代表强牌',
          '依赖牌面范围优势，混合 check 保留 x/r 杠杆',
          '永远过牌',
          '每街都大注',
        ],
        correctIndex: 1,
        explanation: 'SB 翻后 OOP，C-Bet 成本高。正确姿势是按牌面范围优势决定频率，并混合 check 保留 x/r 杠杆。',
      },
      {
        id: 'l3hu-sb-continuation-q2',
        question: '干燥高牌面（K♠7♦2♣）上，SB（OOP）的 C-Bet 频率倾向是：',
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
        question: '湿润连接面（9♠8♥6♣）上，SB（OOP）的 C-Bet 频率应：',
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
        question: 'OOP 的 check 在单挑中的正确理解是：',
        options: [
          '示弱，表示没有牌',
          '把决策权交给 IP，保留 x/r 杠杆，是成熟打法',
          '永远错误',
          '只在河牌使用',
        ],
        correctIndex: 1,
        explanation: 'OOP 的 check 不是示弱，而是把球踢给 IP 再决定接不接，同时保留 x/r 杠杆——这是单挑 SB 的成熟姿势。',
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
    examples: [
      {
        id: 'l3hu-sb-continuation-ex1',
        title: 'SB 干燥面的高频 C-Bet',
        heroHand: ['Qd', 'Jd'],
        heroPosition: 'SB',
        previousActions: [
          { player: 'SB', action: 'raise 2BB' },
          { player: 'BB', action: 'call' },
        ],
        board: ['Qc', '8h', '3s'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 4,
        correctDecision: {
          action: 'Bet',
          amount: '1.3BB（1/3 pot）',
          reasoning: [
            'QJ 在 Q-8-3 干燥面是顶对，范围优势在 SB',
            '1/3 池小注薄价值 + 让 BB 宽范围弱牌弃牌',
            'OOP 但翻前主动权支持持续施压',
          ],
        },
        commonMistake: {
          action: 'Check',
          reasoning: '干燥面顶对是 SB 范围的标准 C-Bet 牌，check 让 BB 免费实现弱范围，浪费范围优势。',
          evLoss: '-1.0 BB/100',
        },
      },
    ],
    practice: {
      id: 'l3hu-sb-continuation-practice',
      questions: [
        {
          id: 'l3hu-sb-continuation-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ad', 'Jd'],
            heroPosition: 'SB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Qc', '7h', '2s'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Check', isCorrect: false, explanation: 'AJ 高牌在干燥面有下注价值，check 太被动。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
            { action: 'Bet 1.3BB（1/3 pot）', isCorrect: true, explanation: '干燥 Q 高面，AJ 有高牌 + 后门改进空间，1/3 池持续施压。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'AJ 高牌 All-in 过度，深筹码应用小注施压。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
          ],
          relatedLessonId: 'l3hu-sb-continuation',
        },
        {
          id: 'l3hu-sb-continuation-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Kh', 'Kc'],
            heroPosition: 'SB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '8s', '6c'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，湿润连接面' },
          },
          options: [
            { action: 'Bet 1.3BB（1/3 pot）', isCorrect: false, explanation: '湿润面 BB 坚果优势，超对需大注保护而非小注。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
            { action: 'Bet 2.7BB（2/3 pot）', isCorrect: true, explanation: '湿润连接面超对领先但易被反超，2/3 池大注保护权益并让听牌付费。', evImpact: '+1.2 BB/100', evLoss: 0 },
            { action: 'Check-Fold', isCorrect: false, explanation: '超对在湿润面仍是强牌，fold 太弱。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
          ],
          relatedLessonId: 'l3hu-sb-continuation',
        },
        {
          id: 'l3hu-sb-continuation-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['7d', '6d'],
            heroPosition: 'SB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9h', '5s', '4c'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '76 在 9-5-4 面有双卡顺 + 后门同花，fold 太弱。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Bet 1.3BB（1/3 pot）', isCorrect: true, explanation: '76 有顺子听牌，1/3 池半诈唬持续施压，湿润面适合保护权益。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，1/3 池半诈唬即可建立优势。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
          ],
          relatedLessonId: 'l3hu-sb-continuation',
        },
      ],
    },
  },
  {
    id: 'l3hu-bb-defense',
    level: 3,
    order: 3,
    title: 'BB 防守',
    subtitle: '单挑大盲的宽范围防守、过牌加注与不利位置控制',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_BB', anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: 'BB：单挑中位置最好但防守最重的座位' },
      {
        type: 'text',
        content:
          '单挑 BB 翻后是位置优势方（IP），但翻前每手牌都要面对 SB 的进攻，防守频率高达 60%+。这个"60%+ 防守"不是被动跟注，而是有结构的防守：跟注叠（中小对子、同花连张、弱 Ax）+ 3Bet 价值叠（强牌打价值）+ 3Bet 诈唬叠（阻断牌）。因为 BB 翻后 IP 且 SB 的 0.5 死钱让跟注便宜，边缘牌也能盈利地防守。',
      },
      {
        type: 'key-point',
        content: 'BB 的"60%+ 防守"是有位置的防守：翻前最后行动 + 翻后最后行动，让边缘牌跟注的代价远低于满员桌。把满员桌"BB 只能打紧"搬进单挑，等于白白扔掉位置优势。',
      },
      { type: 'heading', content: '过牌加注（x/r）：BB 的关键杠杆' },
      {
        type: 'text',
        content:
          'BB 翻后 IP，面对 SB 的 C-Bet 有三个选择：跟注、加注、弃牌。过牌加注（x/r）是 BB 构建范围的关键工具——用强牌 + 强听牌构成两极化 x/r 范围，压制 SB 的 C-Bet 频率，保护跟注范围不被剥削。x/r 的数学依据：当 SB 的 C-Bet 频率过高、弃牌率不足时，BB 的 x/r 半诈唬自动盈利。',
      },
      {
        type: 'example',
        content:
          '实例：单挑 100BB 深，SB min-raise 到 2BB，你（BB）持 7♠6♠ 跟注，底池 4BB。翻牌 8♣5♦2♠。SB C-Bet 1.3BB（半池）。你有双卡顺（4 张 6 + 4 张 9）+ 后门同花，是标准 x/r 半诈唬牌。加注到 4BB 左右：SB 若弃牌你直接赢 5.3BB；被跟注你有 8+ 张 Outs 的改进空间。x/r 既保护你的听牌，又让 SB 的宽范围 C-Bet 付出代价。',
      },
      {
        type: 'example',
        content:
          '实例二（不利位置控制）：同一底池，你（BB）持 A♠K♠，翻牌 K♦8♣3♥（干燥顶对）。你 IP，SB C-Bet 1.3BB。顶对顶踢脚在干燥面倾向跟注而非加注——用跟注保留 SB 的诈唬，同时你在 IP 可以控制后续街。x/r 反而会把 SB 的弱牌赶走，浪费顶对的薄价值。IP 的优势就是"跟注看对手继续开火，或薄价值自己下注"。',
      },
      {
        type: 'highlight',
        content: '反直觉点：BB 防守宽不等于跟注站。真正的跟注站没有 x/r、没有 3Bet 叠；而单挑 BB 的 60% 由跟注、3Bet 价值、3Bet 诈唬、x/r 四部分构成，每一部分都随 SB 倾向移动。防守的宽度与防守的被动是两回事。',
      },
      {
        type: 'pro-tip',
        content: 'BB 防守速查三步：(1) 报底池赔率——SB 开池 2BB 时跟注线约 33%；(2) 分叠——强成牌价值 3Bet、阻断牌诈唬 3Bet、中等牌跟注；(3) 看 SB——弃牌多的 SB 提高 3Bet，limp 多的提高 isolate，C-Bet 过频的提高 x/r。',
      },
    ],
    quiz: [
      {
        id: 'l3hu-bb-defense-q1',
        question: '单挑 BB 面对 SB 开池的典型防守频率约为：',
        options: ['15%-25%', '30%-40%', '60%-70%', '85%-95%'],
        correctIndex: 2,
        explanation: '单挑 BB 防守约 60%-70%（跟注约 35%-50% + 3Bet 约 15%-25%）。15%-25% 是满员桌紧位置的量级，85%-95% 是被动跟注站。',
      },
      {
        id: 'l3hu-bb-defense-q2',
        question: '单挑 BB 防守 60%+ 的数学依据是：',
        options: [
          'BB 每手牌都更好',
          'BB 翻后 IP、跟注价格便宜（SB 死钱）',
          'BB 必须阻止 SB 用任何牌偷盲',
          '规则要求',
        ],
        correctIndex: 1,
        explanation: 'BB 翻后 IP 权益实现率超 100%，且 SB 的 0.5 死钱让跟注价格便宜，故可防守超过 MDF 底线且仍盈利。',
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
          '跟注，保留 SB 诈唬并在 IP 控池',
          '直接弃牌',
          '全下',
        ],
        correctIndex: 1,
        explanation: 'IP 顶对倾向跟注而非 x/r：跟注保留 SB 的诈唬，同时 IP 可控制后续街，x/r 反而赶走弱牌浪费薄价值。',
      },
      {
        id: 'l3hu-bb-defense-q5',
        question: '单挑 BB 的"60%+ 防守"与"跟注站"的区别是：',
        options: [
          '没有区别',
          'BB 的防守由跟注、3Bet 价值、3Bet 诈唬、x/r 构成且有结构，跟注站没有这些杠杆',
          '跟注站防守更宽',
          'BB 防守更被动',
        ],
        correctIndex: 1,
        explanation: 'BB 的 60% 是"有结构的选择"（含 3Bet 与 x/r 杠杆），跟注站是"舍不得弃牌"的被动。防守宽度 ≠ 防守被动。',
      },
    ],
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
            '跟注 1BB 争夺 SB 投入的 2BB，所需胜率约 33%，富余约 15 个百分点',
            'BB 翻后 IP，权益实现率超 100%，边缘牌也可盈利防守',
          ],
        },
        commonMistake: {
          action: 'Fold（"K7s 是烂牌"）',
          reasoning: '用满员桌标准打单挑会丢掉 BB 的位置优势。K7s 面对 SB 宽范围是 +EV 的跟注。',
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
            { action: 'Fold', isCorrect: false, explanation: 'J9s 面对 SB 宽范围可玩性好，fold 太紧浪费 BB 位置。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Call', isCorrect: true, explanation: 'J9s 同花连张翻后 IP 可玩性好，跟注 1BB 争夺 2BB，标准防守。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: '3-Bet', isCorrect: false, explanation: 'J9s 偏投机，3-Bet 太激进，跟注即可。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
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
            board: ['Jc', '6h', '3s'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '87 有卡顺 + 后门同花，fold 太弱。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '87 有卡顺听牌，x/r 半诈唬压制 SB C-Bet 并保护听牌。', evImpact: '+1.2 BB/100', evLoss: 0 },
            { action: 'Donk Bet', isCorrect: false, explanation: 'Donk 不是标准打法，IP 应 Check 让对手先行动。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
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
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，3-Bet 底池' },
          },
          options: [
            { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'AK 在 K-8-3 干燥面是顶对顶踢脚，IP 小注薄价值让 SB 弱牌跟注。', evImpact: '+2.0 BB/100', evLoss: 0 },
            { action: 'Check', isCorrect: false, explanation: '顶对顶踢脚应下注薄价值，check 太被动。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'All-in', isCorrect: false, explanation: '干燥面顶对 All-in 过度，小注薄价值即可。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l3hu-bb-defense',
        },
      ],
    },
  },
  // ===== L4A 进阶思维 · 范围与 EV =====
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
          '翻前偷盲 EV（SB min-raise 到 2BB，BB 弃牌率 f）：\nEV(steal) = f×1 − (1−f)×1.5\n\n翻后位置 EV 锚点：\n单挑位置价值约 0.5-1BB/手（BB 每手翻后 IP）\n\n实例：BB 面对 SB min-raise，跟注 1BB 争夺 2BB：\n所需胜率 = 1/(2+1) ≈ 33.3%\nBB 面对 SB 约 80% 开池范围，边缘牌胜率常超 40% → 跟注 +EV',
      },
      {
        type: 'text',
        content:
          '单挑 EV 调整的实践含义：面对 SB 的宽范围，BB 的跟注门槛大幅降低。满员桌面对 UTG 范围 15% 时 40% 的跟注线，在单挑面对 SB 范围 80% 时降到约 33%，且因为位置优势实际胜率更高。这就是为什么单挑 BB 能防守 60%+——不是"宽松"，而是"EV 计算的结果"。',
      },
      {
        type: 'example',
        content:
          '实例：单挑盲注 0.5/1，翻前 SB min-raise 2BB，你（BB）持 K♠7♠。跟注 1BB 争夺 SB 投入的 2BB，所需胜率 33.3%。K7s 对 SB 约 80% 的开池范围胜率约 48%，富余约 15 个百分点。翻后你 IP：出 K 可薄价值、出同花/顺子可便宜追、完全 miss 可放弃。跟注的 EV 为正——满员桌 K7s 面对 UTG 是弃牌，但单挑面对 SB 宽范围是 +EV 跟注。',
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
        question: 'SB min-raise 到 2BB，BB 跟注 1BB 争夺 SB 投入的 2BB，所需胜率约为：',
        options: ['25%', '33.3%', '40%', '50%'],
        correctIndex: 1,
        explanation: '所需胜率 = 1/(2+1) ≈ 33.3%。单挑死钱占比高，比满员桌 BTN 跟注 40% 更便宜。',
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
        explanation: '面对 SB 约 80% 宽范围，跟注门槛降至约 33%，且 IP 权益实现率超 100%，故可宽防守——是 EV 计算的结果而非"宽松"。',
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
            '跟注 1BB 争夺 2BB，所需胜率约 33.3%，富余约 12 个百分点',
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
            '跟注 1BB 争夺 2BB，所需胜率约 33.3%，富余约 9 个百分点',
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
  // ===== L5 职业素养 =====
  {
    id: 'l5hu-focus',
    level: 5,
    order: 1,
    title: '单挑专注力',
    subtitle: '单挑高速决策节奏下的专注、状态管理与疲劳控制',
    duration: '7 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: '单挑：决策密度的极限测试' },
      {
        type: 'text',
        content:
          '单挑是扑克中决策密度最高的形式：每手牌都在盲注位、每小时 200+ 手、几乎每手都进翻牌。这意味着你的专注力在单挑中既是武器也是短板——一个分神就可能错过对手的倾向、算错赔率、或在高频下风期情绪失控。单挑高手把专注力当作可训练的资源，而非天生的天赋。',
      },
      {
        type: 'key-point',
        content: '单挑的专注力不是"盯住屏幕"，而是"对高频决策保持同样的质量"。用 session 时长限制 + 状态觉察 + 疲劳控制，让最后一手的决策质量和第一手一样好。',
      },
      { type: 'heading', content: '状态管理与疲劳控制' },
      {
        type: 'text',
        content:
          '单挑状态管理三原则：(1) session 时长限制——单挑专注力难以维持超过 60-90 分钟，预设时长到点即停，避免疲劳导致的决策劣化；(2) 波动预算——输 40-50BB 即暂停复盘，是止损重开而非翻本；(3) 每 100 手起身一次——切断连败的心理惯性，让眼睛和大脑休息。疲劳的征兆包括：开始玩边缘牌、下注尺度失控、重复犯低级错误、对手的明显倾向被你忽略。',
      },
      {
        type: 'example',
        content:
          '实例：你已连续打单挑 2 小时，近 30 手开始"自动打牌"——没注意 BB 面对你的 C-Bet 弃牌率已从 45% 降到 30%。这是典型的疲劳征兆：你对对手偏离的觉察钝化，仍在按旧频率下注，被对手反向调整收割。正确做法：立即暂停，识别疲劳，休息后重新用"对手现在怎么打"而非"我平时怎么打"来决策。',
      },
      {
        type: 'example',
        content:
          '实例二（状态管理流程）：单挑 session 开始前定好三条规则：(1) 最多 90 分钟；(2) 输 50BB 即停；(3) 每 100 手起身 2 分钟。到点严格执行，即使牌势正旺也停——因为"赢家也会在疲劳时把优势送回去"。Tendler 强调：纪律不是限制乐趣，而是保护长期 EV。',
      },
      {
        type: 'highlight',
        content: '反直觉点：单挑中最危险的不是"输钱时的冲动"，而是"赢钱后的松懈"。赢了几手后玩家常放松警惕、开始玩边缘牌，把优势送回去。单挑的纪律必须全程一致，无论牌势顺逆。',
      },
      {
        type: 'pro-tip',
        content: '单挑 session 管理三件套：(1) 预设波动预算——输 40-50BB 即暂停复盘；(2) 每 100 手起身一次，切断连败心理惯性；(3) 复盘只问 EV 不问结果。',
      },
    ],
    quiz: [
      {
        id: 'l5hu-focus-q1',
        question: '单挑专注力的核心是：',
        options: [
          '盯住屏幕不分神',
          '对高频决策保持同样的质量，靠 session 限制与疲劳控制',
          '打得更快',
          '只关注大底池',
        ],
        correctIndex: 1,
        explanation: '单挑专注力是"对高频决策保持质量"，靠 session 时长限制、波动预算、定期起身等状态管理实现。',
      },
      {
        id: 'l5hu-focus-q2',
        question: '单挑 session 的合理时长上限约为：',
        options: ['30 分钟', '60-90 分钟', '3 小时', '无限'],
        correctIndex: 1,
        explanation: '单挑专注力难以维持超过 60-90 分钟，超时导致决策劣化。3 小时以上疲劳风险极高。',
      },
      {
        id: 'l5hu-focus-q3',
        question: '疲劳的典型征兆不包括：',
        options: [
          '开始玩边缘牌',
          '下注尺度失控',
          '对对手倾向的觉察更敏锐',
          '重复犯低级错误',
        ],
        correctIndex: 2,
        explanation: '疲劳会钝化对对手倾向的觉察，而非更敏锐。边缘牌、尺度失控、低级错误都是疲劳征兆。',
      },
      {
        id: 'l5hu-focus-q4',
        question: '"输 50BB 即暂停"的波动预算作用是：',
        options: [
          '限制最多能输多少',
          '到止损点暂停复盘，避免翻本式追加',
          '确保每次都赢',
          '计算期望值',
        ],
        correctIndex: 1,
        explanation: '波动预算是止损纪律：输到预设点数暂停复盘，切断"翻本"冲动，避免陷入疲劳与 tilt。',
      },
      {
        id: 'l5hu-focus-q5',
        question: '关于单挑中的纪律，正确的说法是：',
        options: [
          '赢牌后可以放松',
          '牌势正旺时可以延长时间',
          '纪律必须全程一致，无论牌势顺逆',
          '只输钱时需要纪律',
        ],
        correctIndex: 2,
        explanation: '赢牌后的松懈与疲劳同样危险。单挑纪律必须全程一致，顺逆都不可松懈，才能保住长期 EV。',
      },
    ],
    examples: [
      {
        id: 'l5hu-focus-ex1',
        title: '疲劳导致的决策劣化',
        heroHand: ['Jd', 'Td'],
        heroPosition: 'SB',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 1.5,
        correctDecision: {
          action: 'Min-raise',
          amount: '2BB',
          reasoning: [
            'JTs 在单挑按钮位是标准开池牌',
            '正常状态下应积极开池',
            '若已疲劳且未觉察 BB 倾向变化，应暂停而非继续',
          ],
        },
        commonMistake: {
          action: '疲劳时自动 Fold 或玩边缘牌',
          reasoning: '疲劳导致决策劣化——没觉察 BB 弃牌率变化、尺度失控。正确做法是暂停休息而非继续。',
          evLoss: '-1.5 BB/100',
        },
      },
    ],
    practice: {
      id: 'l5hu-focus-practice',
      questions: [
        {
          id: 'l5hu-focus-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Qc', '9c'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: 'Q9s 在单挑按钮位是标准开池牌，fold 太紧。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Min-raise', isCorrect: true, explanation: 'Q9s 面对 BB 宽范围可玩性好，标准开池。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: 'Q9s All-in 过度，min-raise 即可。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
          ],
          relatedLessonId: 'l5hu-focus',
        },
        {
          id: 'l5hu-focus-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ah', '5h'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Kh', '9h', '3c'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: 'A5 同花听牌 9 个 Outs，fold 太弱。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Check-Raise', isCorrect: true, explanation: '坚果同花听牌 + A 高，x/r 半诈唬保护听牌并施压。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '听牌 All-in 过度，x/r 建立优势即可。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
          ],
          relatedLessonId: 'l5hu-focus',
        },
        {
          id: 'l5hu-focus-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Jh', 'Jc'],
            heroPosition: 'SB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['9c', '6d', '2s'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，已打 2 小时疲劳状态' },
          },
          options: [
            { action: 'Bet 2BB（半池）', isCorrect: true, explanation: 'JJ 超对在干燥面应下注价值，即便疲劳也要保持决策质量。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '超对 All-in 过度，半池价值即可。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Check-Fold', isCorrect: false, explanation: 'JJ 超对是强牌，且疲劳时应先暂停而非劣化决策。', evImpact: '-2.0 BB/100', evLoss: 2 },
          ],
          relatedLessonId: 'l5hu-focus',
        },
      ],
    },
  },
  {
    id: 'l5hu-opponent-psychology',
    level: 5,
    order: 2,
    title: '对手心理',
    subtitle: '单挑心理博弈：下注节奏、反应时间与行为模式解读',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [
      { type: 'heading', content: '单挑：读人的战场' },
      {
        type: 'text',
        content:
          '单挑只面对一个对手，读人的价值被无限放大——你无需兼顾多桌的多重形象，只需吃透眼前这一位。对手心理（Reading）分为两类：行为模式（下注尺度、跟注倾向、tilt 倾向）与实时信号（下注节奏、反应时间）。单挑中这两者结合，帮助你推断对手的范围与情绪状态。',
      },
      {
        type: 'key-point',
        content: '读人不是猜手牌，是估范围 + 估情绪。对手"跟注过快"可能表示边缘牌或强牌，"思考太久"可能表示艰难决策或演戏。把观察转化为概率，而非确定性。',
      },
      { type: 'heading', content: '下注节奏与反应时间的解读' },
      {
        type: 'text',
        content:
          '单挑中下注节奏与反应时间是重要信号（尤其线上）。常见解读：下注过快 = 可能强牌（急于价值）或弱牌（不想多想）；思考太久 = 艰难决策（边缘牌/听牌）或演戏；跟注犹豫 = 边缘牌。但样本不足时这些信号不可靠——必须与跨 50-100 手的频率统计交叉验证，单独一次节奏不作数。',
      },
      {
        type: 'example',
        content:
          '实例：单挑对手转牌面对你的下注思考了 20 秒才跟注。频率读取：思考时间长 = 艰难决策，可能边缘牌（跟注站特征）或听牌。但样本不足时可能是演戏。正确做法是交叉验证：他面对大注的跟注倾向、他河牌的摊牌选择，综合判断而非单独依赖一次节奏。',
      },
      {
        type: 'example',
        content:
          '实例二（反读取）：你持 AA，翻牌下注时注意自己的节奏。若你因为"有强牌"下注飞快、又因"在诈唬"下注犹豫，对手会很快破解。反读取练习：规定所有下注用相同思考时间，或关键时刻刻意打乱节奏（强牌也犹豫、诈唬也果断）。你在读对手，对手也在读你。',
      },
      {
        type: 'highlight',
        content: '反直觉点：读取的敌人不是"读错"，而是"过度自信"。单挑高手会承认"这个读取只有 60% 把握"并据此下注，而不是"我确定他有什么"。把读取转化为概率而非确定性，才是可持续的策略。',
      },
      {
        type: 'pro-tip',
        content: '读取纪律：(1) 只用统计显著的频率（50+ 手样本）下结论；(2) 结合下注节奏与频率交叉验证；(3) 承认读取的不确定性，把它折入胜率与赔率计算。三件事做完，读取就从玄学变成数学。',
      },
    ],
    quiz: [
      {
        id: 'l5hu-opponent-psychology-q1',
        question: '单挑读人的正确方式是：',
        options: [
          '猜对手具体拿什么牌',
          '估范围 + 估情绪，把观察转化为概率',
          '凭感觉判断',
          '只看单手牌',
        ],
        correctIndex: 1,
        explanation: '读人是估范围 + 估情绪，把观察转化为概率而非确定性。单手牌印象不可靠。',
      },
      {
        id: 'l5hu-opponent-psychology-q2',
        question: '单挑中"下注过快"的常见解读是：',
        options: [
          '一定是强牌',
          '可能强牌（急于价值）或弱牌（不想多想），需交叉验证',
          '一定是弱牌',
          '没有信息',
        ],
        correctIndex: 1,
        explanation: '下注过快可能是强牌（急于价值）或弱牌（不想多想），单次信号不可靠，需与频率统计交叉验证。',
      },
      {
        id: 'l5hu-opponent-psychology-q3',
        question: '线上单挑对手转牌思考 20 秒才跟注，最可靠的处理是：',
        options: [
          '判定他是边缘牌立即加注',
          '结合他面对大注的跟注倾向与摊牌选择交叉验证',
          '判定他在演戏',
          '忽略这个信号',
        ],
        correctIndex: 1,
        explanation: '思考时间长可能边缘牌/听牌/演戏，单独一次不可靠。需结合面对大注的跟注倾向、河牌摊牌选择等频率交叉验证。',
      },
      {
        id: 'l5hu-opponent-psychology-q4',
        question: '"反读取（Balanced Play）"的核心是：',
        options: [
          '隐藏自己的强牌',
          '让动作不泄露范围信息，保持节奏一致或打乱',
          '永远最快下注',
          '让对手猜不透牌力',
        ],
        correctIndex: 1,
        explanation: '反读取要求动作不泄露范围：不要"强牌快、弱牌慢"，保持节奏一致或刻意打乱节奏。',
      },
      {
        id: 'l5hu-opponent-psychology-q5',
        question: '单挑读取的正确态度是：',
        options: [
          '把读取当作确定性事实',
          '承认不确定性，把它折入胜率与赔率计算',
          '读取永远正确',
          '忽略所有读取',
        ],
        correctIndex: 1,
        explanation: '读取有不确定性，高手把它转化为概率（如"60% 把握"）并折入决策，才是可持续策略。',
      },
    ],
    examples: [
      {
        id: 'l5hu-opponent-psychology-ex1',
        title: '结合节奏与频率的读取',
        heroHand: ['Kc', 'Qc'],
        heroPosition: 'SB',
        previousActions: [
          { player: 'SB', action: 'raise 2BB' },
          { player: 'BB', action: 'call' },
        ],
        board: ['Kd', '8h', '3c'],
        street: 'flop',
        effectiveStack: 95,
        potSize: 4,
        correctDecision: {
          action: 'Bet',
          amount: '1.3BB（1/3 pot）',
          reasoning: [
            'KQ 在 K-8-3 干燥面是顶对',
            'BB 面对 C-Bet 弃牌率 50%（跨 60 手统计）',
            '结合 BB 的跟注倾向交叉验证后，1/3 池薄价值',
          ],
        },
        commonMistake: {
          action: '只凭 BB 某次思考慢就判定他弱',
          reasoning: '单次节奏信号不可靠，应结合跨 60 手统计的弃牌率交叉验证，而非单独依赖一次反应时间。',
          evLoss: '-1.0 BB/100',
        },
      },
    ],
    practice: {
      id: 'l5hu-opponent-psychology-practice',
      questions: [
        {
          id: 'l5hu-opponent-psychology-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Ad', 'Qd'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: '3-bet to 6BB' },
              { player: 'SB', action: 'call' },
            ],
            board: ['Qh', '8c', '3s'],
            street: 'flop',
            potSize: 12,
            effectiveStack: 90,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'AQ 顶对顶踢脚，IP 小注薄价值。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'Check', isCorrect: false, explanation: '顶对顶踢脚应下注，check 太被动。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'All-in', isCorrect: false, explanation: '干燥面顶对 All-in 过度，小注即可。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l5hu-opponent-psychology',
        },
        {
          id: 'l5hu-opponent-psychology-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Js', 'Ts'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Th', '7c', '2d'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 面对 x/r 弃牌率高' },
          },
          options: [
            { action: 'Check-Call', isCorrect: true, explanation: 'JT 顶对，结合 SB 弃牌率高可考虑 x/r，但顶对跟注控池也合理。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: 'Check-Raise', isCorrect: false, explanation: '顶对 x/r 赶走弱牌，干燥面应跟注控池。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
            { action: 'Fold', isCorrect: false, explanation: 'JT 顶对是强牌，fold 太弱。', evImpact: '-2.0 BB/100', evLoss: 2 },
          ],
          relatedLessonId: 'l5hu-opponent-psychology',
        },
        {
          id: 'l5hu-opponent-psychology-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['9c', '8c'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Jd', '8h', '5c'],
            street: 'flop',
            potSize: 4,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 下注节奏反常' },
          },
          options: [
            { action: 'Check-Call', isCorrect: true, explanation: '98 中对 + 卡顺，跟注控池，结合 SB 节奏反常保持谨慎。', evImpact: '+1.0 BB/100', evLoss: 0 },
            { action: 'Check-Raise', isCorrect: false, explanation: '中对牌力不足以 x/r，跟注更合理。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
            { action: 'Fold', isCorrect: false, explanation: '中对 + 卡顺有改进空间，fold 太弱。', evImpact: '-1.2 BB/100', evLoss: 1.2 },
          ],
          relatedLessonId: 'l5hu-opponent-psychology',
        },
      ],
    },
  },
  // ===== L6 锦标赛策略 =====
  {
    id: 'l6hu-tourney',
    level: 6,
    order: 1,
    title: '单挑锦标赛',
    subtitle: '单挑 SNG / MTT 决赛桌的筹码节奏、ICM 与盲注攻防',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante', stackDepth: 40 },
    content: [
      { type: 'heading', content: '单挑锦标赛：筹码与盲注的博弈' },
      {
        type: 'text',
        content:
          '单挑锦标赛（SNG 决赛桌 / MTT 最终两人）与前注制、固定筹码深度的现金桌截然不同：盲注随时间上涨、筹码是有限资源、ICM 压力主导决策。单挑锦标赛中，筹码节奏（Stack Rhythm）成为核心——深筹码阶段（40BB+）可维持现金桌式的翻后打法，浅筹码阶段（20BB 以下）则转向翻前全下博弈。',
      },
      {
        type: 'key-point',
        content: '单挑锦标赛的黄金原则：筹码越浅、盲注占比越高，翻前全下越频繁。ICM 与盲注压力让"生存"和"进攻"成为同等重要的目标。',
      },
      { type: 'heading', content: 'ICM 与盲注攻防' },
      {
        type: 'text',
        content:
          '单挑 SNG 决赛桌的 ICM 很简单：赢家拿全部奖金，所以 ICM 压力相对满员桌低，但仍影响决策——你在深筹码时避免不必要的波动（保护领先），在落后时用高激进度翻盘。盲注攻防：浅筹码时（如 15-20BB），min-raise 偷盲 + 全下成为主武器，因为盲注上涨让你的偷盲自动盈利；而现金桌的复杂翻后打法在浅筹码下失效。',
      },
      {
        type: 'example',
        content:
          '实例：单挑 SNG 决赛桌，你持 18BB，对手 22BB，盲注 0.5/1。你（SB）持 A♠4♠。此筹码深度下，A4s 是标准的推/全下范围：对 BB 约 60% 跟注范围有约 50% 胜率，全下 18BB 的 EV 为正，且盲注上涨让等待的价值降低。若深筹码（60BB+），A4s 仍是开池牌但翻后空间更大。筹码深度的变化直接改变同一手牌的打法。',
      },
      {
        type: 'example',
        content:
          '实例二（盲注上涨的紧迫感）：单挑 MTT 决赛，盲注每 5 分钟上涨，你从 30BB 降到 12BB。此时"等好牌"是错误——盲注上涨让你的等待成本飙升。正确策略是提高全下频率，用任何有权益的牌（对子、Ax、强同花连张）抢盲与翻盘。筹码节奏的关键是：在盲注吞噬你之前行动。',
      },
      {
        type: 'highlight',
        content: '反直觉点：单挑锦标赛中"领先时保守"与"落后时激进"的 ICM 逻辑，与现金桌"永远最大 EV"不同。深筹码领先时避免大波动，落后时用激进翻盘——因为锦标赛只有第一名才有意义。',
      },
      {
        type: 'pro-tip',
        content: '单挑锦标赛筹码节奏速记：(1) 40BB+ 深筹码可维持现金桌打法；(2) 20-40BB 中筹码，min-raise + 翻后；(3) 15BB 以下浅筹码，全下为主。每级别盲注上涨后重新评估你的策略，不要让旧节奏害你。',
      },
    ],
    quiz: [
      {
        id: 'l6hu-tourney-q1',
        question: '单挑锦标赛与现金桌的核心差异是：',
        options: [
          '没有差异',
          '盲注上涨、筹码有限、ICM 压力主导',
          '单挑锦标赛牌更大',
          '现金桌盲注更高',
        ],
        correctIndex: 1,
        explanation: '单挑锦标赛盲注上涨、筹码是有限资源、ICM 压力主导，策略随筹码深度动态调整。',
      },
      {
        id: 'l6hu-tourney-q2',
        question: '单挑锦标赛浅筹码（15BB 以下）的正确策略是：',
        options: [
          '复杂翻后打法',
          '翻前全下为主，任何有权益的牌抢盲',
          '等好牌',
          '完全过牌',
        ],
        correctIndex: 1,
        explanation: '浅筹码时翻前全下成为主武器，因为盲注上涨让偷盲自动盈利，且等待成本飙升。',
      },
      {
        id: 'l6hu-tourney-q3',
        question: '单挑 SNG 决赛桌的 ICM 特点是：',
        options: [
          'ICM 压力极高，接近满员桌',
          '赢家拿全部奖金，ICM 压力相对低，但仍影响决策',
          '没有 ICM',
          'ICM 只在泡沫期存在',
        ],
        correctIndex: 1,
        explanation: '单挑决赛桌赢家拿全部奖金，ICM 压力相对满员桌低，但仍影响决策——深筹码避免波动、落后时激进。',
      },
      {
        id: 'l6hu-tourney-q4',
        question: '盲注上涨对单挑锦标赛策略的影响是：',
        options: [
          '没有影响',
          '等待成本飙升，应提高行动频率而非等好牌',
          '应该更保守',
          '只影响现金桌',
        ],
        correctIndex: 1,
        explanation: '盲注上涨让你的等待成本飙升，正确策略是提高全下/偷盲频率，在盲注吞噬之前行动。',
      },
      {
        id: 'l6hu-tourney-q5',
        question: '单挑锦标赛 20-40BB 中筹码阶段的策略是：',
        options: [
          '完全全下',
          'min-raise + 翻后，兼顾偷盲与翻后',
          '纯等牌',
          '只打坚果',
        ],
        correctIndex: 1,
        explanation: '中筹码阶段（20-40BB）兼顾偷盲与翻后，min-raise 加翻后是合理策略，区别于浅筹码的全下为主。',
      },
    ],
    examples: [
      {
        id: 'l6hu-tourney-ex1',
        title: '浅筹码单挑锦标赛的全下',
        heroHand: ['Ac', '7s'],
        heroPosition: 'SB',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 15,
        potSize: 1.5,
        correctDecision: {
          action: 'All-in',
          amount: '15BB',
          reasoning: [
            '浅筹码（15BB）下，A7o 对 BB 宽范围胜率约 55%',
            '盲注上涨让等待成本高，全下抢盲 + 翻盘',
            'ICM 下落后激进翻盘',
          ],
        },
        commonMistake: {
          action: '等好牌再行动',
          reasoning: '浅筹码 + 盲注上涨时，等待成本飙升，A7o 是标准全下牌，等牌是错误。',
          evLoss: '-2.0 BB/100',
        },
      },
    ],
    practice: {
      id: 'l6hu-tourney-practice',
      questions: [
        {
          id: 'l6hu-tourney-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Kh', 'Qh'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 15,
            gameContext: { gameType: 'sng', tableDescription: '单挑 SNG 决赛桌，浅筹码 15BB' },
          },
          options: [
            { action: 'All-in', isCorrect: true, explanation: 'KQs 浅筹码全下范围，对宽范围胜率约 58%，抢盲翻盘。', evImpact: '+2.0 BB/100', evLoss: 0 },
            { action: 'Fold', isCorrect: false, explanation: 'KQs 浅筹码是强全下牌，fold 太紧。', evImpact: '-2.0 BB/100', evLoss: 2 },
            { action: 'Limp', isCorrect: false, explanation: '浅筹码 limp 让对手 isolate，全下更优。', evImpact: '-1.0 BB/100', evLoss: 1 },
          ],
          relatedLessonId: 'l6hu-tourney',
        },
        {
          id: 'l6hu-tourney-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Ts', '8s'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 12,
            gameContext: { gameType: 'sng', tableDescription: '单挑 SNG 决赛桌，浅筹码 12BB，盲注即将上涨' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: '盲注即将上涨，等待成本高，T8s 有全下权益，fold 太紧。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
            { action: 'All-in', isCorrect: true, explanation: '盲注上涨紧迫，T8s 同花连张有权益，全下抢盲翻盘。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'Min-raise', isCorrect: false, explanation: '浅筹码（12BB）min-raise 后无法覆盖后续全下，直接推更优。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l6hu-tourney',
        },
        {
          id: 'l6hu-tourney-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Ad', 'Kd'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 45,
            gameContext: { gameType: 'mtt', tableDescription: '单挑 MTT 决赛，深筹码 45BB，对手 nit' },
          },
          options: [
            { action: 'Min-raise', isCorrect: true, explanation: '深筹码 AK 应 min-raise，面对 nit 对手，min-raise + 翻后最大化价值。', evImpact: '+2.0 BB/100', evLoss: 0 },
            { action: 'All-in', isCorrect: false, explanation: '45BB 深筹码 AK 全下浪费价值，min-raise 更优。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
            { action: 'Fold', isCorrect: false, explanation: 'AK 顶级强牌，fold 荒谬。', evImpact: '-3.0 BB/100', evLoss: 3 },
          ],
          relatedLessonId: 'l6hu-tourney',
        },
      ],
    },
  },
  // ===== L7 现金桌专项（l7hu-stakes 自标准课程 L7 迁入的单挑策略基础课）=====
  {
    id: 'l7hu-stakes',
    level: 7,
    order: 1,
    title: '单挑策略基础',
    subtitle: '位置价值更大、范围更宽、决策更频繁',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante', stackDepth: 100 },
    content: [
      { type: 'heading', content: 'HU 的独特性' },
      {
        type: 'text',
        content:
          '单挑（Heads-Up）是德州扑克中最纯粹的形式。与 6-max 或全桌相比，HU 有以下特点：\n\n1. 位置价值更大：BTN 每手牌都有位置优势\n2. 范围大幅拓宽：任何对子都是强牌，Ax 都是强牌\n3. 翻后决策更频繁：更多时候只有两人争夺底池\n4. 剥削调整更重要：可以快速识别并剥削对手弱点',
      },
      {
        type: 'key-point',
        content: '核心概念：HU 中位置价值极大。BTN 每手牌都有位置优势。任何对子在 HU 中都是强牌，Ax 都是强牌。',
      },
      { type: 'heading', content: '翻前范围调整' },
      {
        type: 'text',
        content:
          'HU 翻前范围比 6-max 大幅拓宽：\n\nBTN open 范围：约 50-70%（vs 6-max 的 30-40%）\n- 任何对子都是强牌\n- 任何 Ax 都是强牌\n- 同花连牌、小对子都可以 open\n\n3-Bet 范围：\n- 更宽（约 10-15%）\n- 包括强牌 + 部分 bluff\n- 平衡性更重要',
      },
      { type: 'heading', content: '翻后策略调整' },
      {
        type: 'text',
        content:
          'HU 翻后策略的关键调整：\n\n1. 更多 C-Bet：BTN 有范围优势，应该高频 C-Bet\n2. 更宽的价值下注：顶对弱踢脚也是强牌\n3. 更多 bluff：对手范围更宽，更容易被 bluff 走\n4. 位置利用：有位置时可以更频繁地价值下注和 bluff',
      },
      { type: 'heading', content: '适应不同 HU 对手类型' },
      {
        type: 'text',
        content:
          'HU 中快速识别对手类型并调整：\n\n1. 紧弱型：频繁 C-Bet，多 bluff\n2. 松被动型：多价值下注，少 bluff\n3. 松凶型：平衡打法，适当陷阱\n4. 紧凶型：尊重对手，避免过度冲突',
      },
      {
        type: 'pro-tip',
        content: 'HU 中最重要的技能是快速识别对手类型并调整。前 20 手牌就要建立对手的基本画像，然后开始剥削。',
      },
      {
        type: 'highlight',
        content: '警告：不要用 6-max 的标准打 HU。很多在 6-max 中是 fold 的牌，在 HU 中都是 call 或 raise。',
      },
    ],
    quiz: [
      {
        id: 'l7hu-stakes-q1',
        question: 'HU 中 BTN 的 open 范围约是多少？',
        options: ['20-30%', '30-40%', '50-70%', '80%+'],
        correctIndex: 2,
        explanation: 'HU 中 BTN open 范围约 50-70%，比 6-max 的 30-40% 大幅拓宽。',
      },
      {
        id: 'l7hu-stakes-q2',
        question: 'HU 中以下哪类牌的价值提升最多？',
        options: ['72o', '任何对子和 Ax', '同花连牌', '小对子'],
        correctIndex: 1,
        explanation: 'HU 中任何对子都是强牌，Ax 都是强牌。这些牌的价值大幅提升。',
      },
      {
        id: 'l7hu-stakes-q3',
        question: 'HU 中面对紧弱型对手应该？',
        options: ['减少 bluff', '频繁 C-Bet，多 bluff', '只打价值下注', '尊重对手'],
        correctIndex: 1,
        explanation: '面对紧弱型对手应该频繁 C-Bet 和 bluff，因为他们弃牌率高。',
      },
      {
        id: 'l7hu-stakes-q4',
        question: 'HU 中位置价值如何？',
        options: ['不重要', '比 6-max 略大', '极大，BTN 每手牌都有位置优势', '和 6-max 一样'],
        correctIndex: 2,
        explanation: 'HU 中位置价值极大，BTN 每手牌都有位置优势。',
      },
      {
        id: 'l7hu-stakes-q5',
        question: 'HU 中顶对弱踢脚的正确打法是？',
        options: ['Check-Fold', '控制底池', '更宽的价值下注', 'All-in'],
        correctIndex: 2,
        explanation: 'HU 中范围更宽，顶对弱踢脚也是强牌，应该更宽地价值下注。',
      },
    ],
    examples: [
      {
        id: 'l7hu-stakes-ex1',
        title: 'HU 中 BTN 的宽 open',
        heroHand: ['7h', '6h'],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop',
        effectiveStack: 100,
        potSize: 1.5,
        correctDecision: {
          action: 'Open raise',
          reasoning: [
            'HU 中 76s 可玩性好，应该 open',
            'BTN 有位置优势，翻后可以利用',
            '同花连牌有很好的翻后潜力',
            '在 HU 中这比 6-max 中的相对价值高得多',
          ],
        },
        commonMistake: {
          action: 'Fold（"只是 76s"）',
          reasoning: '用 6-max 的标准打 HU 会错过很多盈利机会。76s 在 HU 中是标准 open。',
          evLoss: '-1.5 BB/100',
        },
      },
    ],
    practice: {
      id: 'l7hu-stakes-practice',
      questions: [
        {
          id: 'l7hu-stakes-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['8s', '7s'],
            heroPosition: 'BTN',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Open raise', isCorrect: true, explanation: 'HU 中 87s 可玩性好，BTN 有位置优势，应该 open。', evImpact: '+1.0 BB/100' },
            { action: 'Limp', isCorrect: false, explanation: 'HU 中应该积极 open，limp 太被动。', evImpact: '-0.5 BB/100' },
            { action: 'Fold', isCorrect: false, explanation: '87s 在 HU 中可玩性好，fold 太紧。', evImpact: '-1.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p2',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['As', '2h'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Ac', '8d', '3c'],
            street: 'flop',
            potSize: 5.5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'C-Bet 2BB（33% pot）', isCorrect: true, explanation: 'A2 在 A-8-3 面是顶对，HU 中应该小注 C-Bet 获取价值。', evImpact: '+1.0 BB/100' },
            { action: 'Check', isCorrect: false, explanation: 'HU 中顶对应该下注获取价值，check 太被动。', evImpact: '-0.8 BB/100' },
            { action: 'All-in', isCorrect: false, explanation: 'A2 顶对弱踢脚，All-in 过度。小注获取价值即可。', evImpact: '-1.0 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p3',
          difficulty: 'intermediate',
          scenario: {
            heroHand: ['Qd', 'Jd'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: 'call' },
              { player: 'BB', action: 'check' },
            ],
            board: ['Kd', '7c', '2h'],
            street: 'flop',
            potSize: 5.5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，对手是紧弱型' },
          },
          options: [
            { action: 'C-Bet 4BB（75% pot）', isCorrect: true, explanation: '面对紧弱型对手应该高频 C-Bet，QJ 有高牌胜率，应该下注。', evImpact: '+1.5 BB/100' },
            { action: 'Check', isCorrect: false, explanation: '面对紧弱型对手应该多 bluff，check 错失机会。', evImpact: '-0.8 BB/100' },
            { action: 'All-in', isCorrect: false, explanation: 'QJ 高牌 All-in 过度。中等下注即可。', evImpact: '-1.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p4',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['9h', '8h'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: 'call' },
            ],
            board: ['Th', '7c', '2d'],
            street: 'flop',
            potSize: 5.5,
            effectiveStack: 95,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌' },
          },
          options: [
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: '98 在 T-7-2 面有卡顺 + 后门同花，Check-Raise 半诈唬是标准打法。', evImpact: '+1.5 BB/100' },
            { action: 'Check-Fold', isCorrect: false, explanation: '98 有卡顺听牌，fold 太弱。应该 Check-Raise 半诈唬。', evImpact: '-1.0 BB/100' },
            { action: 'Donk Bet', isCorrect: false, explanation: 'Donk Bet 不是标准打法。应该 Check 让对手先行动，然后 Check-Raise。', evImpact: '-0.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
        {
          id: 'l7hu-stakes-p5',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['Ks', 'Qs'],
            heroPosition: 'BTN',
            previousActions: [
              { player: 'BTN', action: 'raise 2.5BB' },
              { player: 'BB', action: '3-bet to 9BB' },
              { player: 'BTN', action: 'call' },
              { player: 'BB', action: 'check' },
            ],
            board: ['Kh', '8c', '3h'],
            street: 'flop',
            potSize: 18.5,
            effectiveStack: 80,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，3-Bet 底池' },
          },
          options: [
            { action: 'Bet 8BB（约45% pot）', isCorrect: true, explanation: 'KQ 在 K-8-3 面是顶对好踢脚，3-Bet 底池 SPR 低，应该下注获取价值。', evImpact: '+2.0 BB/100' },
            { action: 'Check', isCorrect: false, explanation: 'KQ 在干燥面是强牌，check 太被动。应该下注获取价值。', evImpact: '-1.0 BB/100' },
            { action: 'All-in', isCorrect: false, explanation: 'SPR 4.3，All-in 过度。中等下注即可，让对手用更宽范围跟注。', evImpact: '-0.5 BB/100' },
          ],
          relatedLessonId: 'l7hu-stakes',
        },
      ],
    },
  },
  // ===== L8 高级剥削策略 =====
  {
    id: 'l8hu-exploitative',
    level: 8,
    order: 1,
    title: '单挑剥削打法',
    subtitle: '单挑针对性剥削：频率读取、范围极化与动态调整',
    duration: '9 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante', stackDepth: 100 },
    content: [
      { type: 'heading', content: '单挑剥削：不是抛弃 GTO，是校准 GTO' },
      {
        type: 'text',
        content:
          '单挑剥削打法（Exploitative Play）利用对手偏离均衡的倾向赚取超额利润。但单挑高手不会"抛弃"GTO，而是"校准"它：以均衡频率为基线，针对对手的明确偏离做最小必要偏离。单挑是读人价值最高的形式——只面对一个对手，你能快速识别他的漏洞并用针对性策略收割。',
      },
      {
        type: 'key-point',
        content: '剥削的正确姿态：方向瞄准对手漏洞（Maximally Exploitative），幅度保持最小（Minimally Exploitative）。每次偏离都打开自己的漏洞，因此幅度要可控，对手调整后及时回基线。',
      },
      { type: 'heading', content: '频率读取：从统计到剥削' },
      {
        type: 'text',
        content:
          '频率读取是单挑剥削的地基：识别对手的四维倾向（开池率、面对 C-Bet 弃牌率、3Bet 率、摊牌倾向），再用针对性策略收割。弃牌过多 → 提高 C-Bet/偷盲频率；跟注过松（跟注站）→ 价值下注薄价值、减少纯诈唬；3Bet 过频 → 收窄开池、增加 4Bet；C-Bet 过频 → 提高 x/r。识别依赖跨 50-100 手的统计，单手牌印象不作数。',
      },
      {
        type: 'example',
        content:
          '实例：你观察到某单挑对手面对 C-Bet 弃牌率高达 62%（均衡约 45%）。这是明确的弃牌过多漏洞。剥削：你的翻牌 C-Bet 频率与诈唬密度整体上调，连原本 check 的弱牌也加入下注。但幅度以"他若收紧到 50% 你仍不亏"为限——保留修正空间。这就是"有方向、有纪律"的偏离。',
      },
      {
        type: 'example',
        content:
          '实例二（范围极化）：面对跟注过松的跟注站，你的下注范围应两极化——用坚果打价值、用强听牌半诈唬，中间牌过牌。因为跟注站用弱牌跟注，你的宽价值范围被超额支付。同时减少纯诈唬（他不弃），把诈唬牌转化为半诈唬或过牌。',
      },
      {
        type: 'example',
        content:
          '实例三（动态调整）：你提高偷盲频率后，对手开始频繁 3Bet 反击——说明他发现了你的偏离。此时必须回到 GTO 基线（收窄偷盲范围、减少纯诈唬），否则你新打开的漏洞会被他反向收割。剥削是动态博弈：偏离-被察觉-回基线，循环往复。',
      },
      {
        type: 'highlight',
        content: '反直觉点：剥削的最大风险不是"剥削得不够"，而是"剥削过头"把自己变成漏洞。单挑高手在收割对手漏洞的同时，永远留着一只手握在 GTO 基线的方向盘上——对手一调整，立刻归位。',
      },
      {
        type: 'pro-tip',
        content: '剥削执行五步：(1) HUD 收集足够样本确认漏洞；(2) 求解器锁定该节点求最优应对；(3) 对比基线标出被推高的频率与尺度；(4) 实战执行；(5) 每 500 手复核样本是否仍成立。没有数据支撑的"锁定"只是纸上的剥削。',
      },
    ],
    quiz: [
      {
        id: 'l8hu-exploitative-q1',
        question: '单挑剥削的正确基础是：',
        options: [
          '完全抛弃 GTO',
          '以 GTO 为基线，针对对手明确偏离做最小必要偏离',
          '只用感觉',
          '永远最大程度偏离',
        ],
        correctIndex: 1,
        explanation: '剥削是"校准 GTO"而非抛弃：以均衡频率为基线，针对对手偏离做有方向、有幅度上限的偏离。',
      },
      {
        id: 'l8hu-exploitative-q2',
        question: '面对弃牌过多的对手，单挑剥削是：',
        options: [
          '减少进攻',
          '提高 C-Bet/偷盲频率与诈唬密度',
          '只玩坚果',
          '完全停注',
        ],
        correctIndex: 1,
        explanation: '弃牌过多的对手让偷盲与 C-Bet 的弃牌率成为自动利润，应提高 C-Bet/偷盲频率与诈唬密度。',
      },
      {
        id: 'l8hu-exploitative-q3',
        question: '面对跟注过松的跟注站，正确剥削是：',
        options: [
          '增加纯诈唬',
          '下注范围两极化，价值下注薄价值、减少纯诈唬',
          '完全停止下注',
          '只玩坚果',
        ],
        correctIndex: 1,
        explanation: '跟注站用弱牌跟注，价值下注薄价值被超额支付；纯诈唬无效（他不弃），应转化为半诈唬或过牌。',
      },
      {
        id: 'l8hu-exploitative-q4',
        question: '你提高偷盲后对手开始频繁 3Bet 反击，正确做法是：',
        options: [
          '继续加大偷盲',
          '回到 GTO 基线，收窄范围',
          '完全停止开池',
          '忽略对手反应',
        ],
        correctIndex: 1,
        explanation: '对手发现你的偏离，你新打开的漏洞会被反向收割。必须回到基线，剥削是"偏离-被察觉-回基线"的动态博弈。',
      },
      {
        id: 'l8hu-exploitative-q5',
        question: '单挑剥削的频率读取依赖：',
        options: [
          '单手牌印象',
          '跨 50-100 手的统计',
          '对手外貌',
          '随机猜测',
        ],
        correctIndex: 1,
        explanation: '频率读取依赖跨 50-100 手的统计（开池率/弃牌率/3Bet 率/摊牌倾向），单手牌印象是噪声。',
      },
    ],
    examples: [
      {
        id: 'l8hu-exploitative-ex1',
        title: '剥削弃牌过多的对手',
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
            'BB 面对 min-raise 弃牌 60%（偏离均衡 40%）',
            '98s 面对弃牌多的对手是可开池牌',
            '反制弃牌过多：提高开池频率',
          ],
        },
        commonMistake: {
          action: 'Fold（"98s 不够好"）',
          reasoning: '面对弃牌过多的对手，边缘牌也能通过偷盲盈利，fold 浪费剥削机会。',
          evLoss: '-1.0 BB/100',
        },
      },
    ],
    practice: {
      id: 'l8hu-exploitative-practice',
      questions: [
        {
          id: 'l8hu-exploitative-p1',
          difficulty: 'beginner',
          scenario: {
            heroHand: ['Qc', '6c'],
            heroPosition: 'SB',
            previousActions: [],
            street: 'preflop',
            potSize: 1.5,
            effectiveStack: 100,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，BB 面对 min-raise 弃牌 65%' },
          },
          options: [
            { action: 'Fold', isCorrect: false, explanation: '面对弃牌 65% 的 BB，Q6s 是可开池牌，fold 太紧。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Min-raise', isCorrect: true, explanation: 'BB 弃牌过多，Q6s min-raise 偷盲 EV 上升，标准剥削。', evImpact: '+1.2 BB/100', evLoss: 0 },
            { action: 'Call', isCorrect: false, explanation: 'Limp 太被动，面对弃牌多的对手应积极 min-raise。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l8hu-exploitative',
        },
        {
          id: 'l8hu-exploitative-p2',
          difficulty: 'intermediate',
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
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 面对 x/r 弃牌 60%' },
          },
          options: [
            { action: 'Check-Fold', isCorrect: false, explanation: '76 有双卡顺，且 SB 弃牌率高，应 x/r 剥削。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'Check-Raise 半诈唬', isCorrect: true, explanation: 'SB 面对 x/r 弃牌 60%，双卡顺半诈唬 x/r 剥削，弃牌率支撑盈利。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'Donk Bet', isCorrect: false, explanation: 'IP 应 Check 让对手先行动再 x/r，Donk 不是标准打法。', evImpact: '-0.5 BB/100', evLoss: 0.5 },
          ],
          relatedLessonId: 'l8hu-exploitative',
        },
        {
          id: 'l8hu-exploitative-p3',
          difficulty: 'advanced',
          scenario: {
            heroHand: ['As', '9s'],
            heroPosition: 'BB',
            previousActions: [
              { player: 'SB', action: 'raise 2BB' },
              { player: 'BB', action: '3-bet to 6BB' },
              { player: 'SB', action: 'call' },
            ],
            board: ['Kh', '8c', '3s'],
            street: 'flop',
            potSize: 12,
            effectiveStack: 90,
            gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 面对 3-Bet 弃牌 40%（偏离）' },
          },
          options: [
            { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'A9 有 A 高 + 后门同花，SB 弃牌率高，1/3 池持续施压剥削。', evImpact: '+1.5 BB/100', evLoss: 0 },
            { action: 'Check', isCorrect: false, explanation: 'SB 弃牌率高应下注施压，check 太被动。', evImpact: '-1.0 BB/100', evLoss: 1 },
            { action: 'All-in', isCorrect: false, explanation: 'A 高 All-in 过度，小注施压即可。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
          ],
          relatedLessonId: 'l8hu-exploitative',
        },
      ],
    },
  },
];
