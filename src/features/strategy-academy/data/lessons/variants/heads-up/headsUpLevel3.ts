import type { Lesson } from '../../../../types';

export const HEADS_UP_LEVEL_3_LESSONS: Lesson[] = [
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
];
