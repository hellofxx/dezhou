import type { Lesson, LessonSection } from '../../../../../types';

// ===== l4hu-gto-basics 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L4HU_GTO_U1_SECTIONS: LessonSection[] = [
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
];

const L4HU_GTO_U2_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '频率基准：价值:诈唬比与 MDF' },
  {
    type: 'formula',
    content:
      '河牌满池下注的均衡价值:诈唬比（底池 P、下注 P）：\n诈唬占比 f = b/(1+2b) = 1/(1+2) = 1/3\n即价值:诈唬 = 2:1。\n\n半池（b=0.5）：f = 0.5/2 = 25%，价值:诈唬 = 3:1。\n2 倍池（b=2）：f = 2/(1+4) = 40%，价值:诈唬 = 3:2。\n\nMDF（最小防御频率）= 1/(1+b)：\n1/3 池 → 75%；半池 → 67%；满池 → 50%；2 倍池 → 33%。\n\n单挑中 BB 防守 60%+ 远超 MDF 底线（约 33%-38%），因为翻前最后做决定与已投死钱赔率让跟注本身 +EV。',
  },
  {
    type: 'text',
    content:
      '单挑 GTO 与满员桌的频率差异：满员桌多数位置只能打紧、均衡下注频率低；单挑则范围宽、下注频率高、诈唬密度大。求解器在单挑中会输出大量激进的下注与极化范围。理解这些频率基准，是识别"对手何时偏离均衡"的前提。',
  },
  {
    type: 'example',
    content:
      '实例：单挑 SB 面对 BB，求解器会告诉你 SB 用约 80% 范围开池、BB 用约 60%+ 防守，翻后 OOP 的 BB 高频过牌、IP 的 SB 高频下注。这些频率看似"松"，但都是均衡的一部分——任何一方偏离（如 SB 只开池 50%），另一方都能通过加宽防守或提高偷盲频率来剥削。',
  },
  {
    type: 'example',
    content:
      '实例二（位置对称性）：单挑每手牌双方互换 SB/BB，位置不是固定的——SB 翻前先开池、翻后才轮到最后行动；BB 恰好相反。GTO 均衡会同时包含两个方向的位置策略，位置对称性意味着你既要会打 SB 也要会打 BB，不能用满员桌"固定位置"的思维。',
  },
];

const L4HU_GTO_U3_SECTIONS: LessonSection[] = [
  {
    type: 'highlight',
    content:
      '反直觉点："GTO 就是打得紧"是最大误读。单挑 GTO 充满高频下注、超池全下与薄价值——它只是让这一切保持在对手无法反制的比例上。学习求解器别背频率，问三个为什么：为什么这个牌面用这个尺度？为什么这手牌进下注范围？为什么转牌后频率变了？',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：不可剥削、博弈值，以及"GTO 不是最赚钱"的定位，见理论学院 T5『GTO 核心思想』——本课的频率基准就是那一章"均衡只保证下限"的落地版本。',
    data: { theoryLevelId: 't5hu', theoryChapterId: 't5hu-gto-he' },
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：混合策略、无差别原则与 MDF / Alpha 的临界频率计算，见理论学院 T5『频率平衡』——价值:诈唬 2:1 与 MDF 50% 其实是同一个等式的两面。',
    data: { theoryLevelId: 't5hu', theoryChapterId: 't5hu-frequency' },
  },
  {
    type: 'pro-tip',
    content:
      '单挑 GTO 学习路径：先用求解器理解均衡"形状"（为什么这样打），再用节点锁定研究"对手常见漏洞的收割方案"，最后实战验证。基线给你不败之地，偏离给你利润空间。',
  },
  {
    type: 'takeaway',
    content:
      '单挑 GTO 三句总结：\n均衡保证的是"不被剥削"的下限，不是"赚最多"的上限\n频率基准可复算：满池价值:诈唬 2:1、半池 3:1、2 倍池 3:2；MDF = 1/(1+b)（1/3 池 75%、半池 67%、满池 50%、2 倍池 33%）\nBB 翻前最后做决定、已投死钱让跟注便宜，所以能防守超过 MDF 底线',
  },
];

export const HEADS_UP_LESSON: Lesson = {
  id: 'l4hu-gto-basics',
  level: 4,
  order: 3,
  title: '单挑 GTO 基础',
  subtitle: '单挑均衡策略的结构差异、频率基准与位置对称性',
  duration: '9 min',
  objectives: [
    '说明单挑（忽略抽水）是纯二人零和博弈，纳什均衡「不可剥削」的保证在此严格成立',
    '计算河牌满池下注的均衡诈唬占比（b/(1+2b) = 1/3，价值:诈唬 2:1），并列出半池 25% 与 MDF = 1/(1+b) 的对应数值',
    '说明单挑 GTO 与满员桌的频率差异（范围宽、下注频率高、诈唬密度大），并判断「GTO 就是打得紧」是误读',
    '判断单挑位置对称性（每手牌互换 SB/BB），说出你既要会打 SB 也要会打 BB 的原因',
  ],
  variant: 'heads-up',
  variantContext: { anteStructure: 'sb_ante', stackDepth: 100 },
  content: [...L4HU_GTO_U1_SECTIONS, ...L4HU_GTO_U2_SECTIONS, ...L4HU_GTO_U3_SECTIONS],
  quiz: [],
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
          'BB 翻前最后做决定、跟注便宜，同花连张可玩性好，是均衡防守范围成员',
        ],
      },
      commonMistake: {
        action: 'Fold（"65s 太弱"）',
        reasoning: '单挑 BB 面对 SB 宽范围应宽防守，65s 是标准跟注牌。满员桌标准会丢掉翻前信息与底池赔率优势。',
        evLoss: '-1.0 BB/100',
      },
    },
    {
      id: 'l4hu-gto-basics-ex2',
      title: '均衡下 OOP 在翻牌的高频过牌',
      heroHand: ['Qd', '9d'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
      ],
      board: ['Kh', '8c', '3s'],
      street: 'flop',
      effectiveStack: 98,
      potSize: 4,
      correctDecision: {
        action: 'Check',
        reasoning: [
          'BB 翻后先行动，Q9 在 K-8-3 面只有第二对子加后门同花，属于中等强度，均衡下以过牌为主',
          '翻前 SB 是 aggressor 且持有位置，K 高面的范围优势在它那边，硬碰硬只会把中等牌打成半诈唬',
          '过牌保留跟注一次 C-Bet 的选项，比主动下注把底池做大更符合均衡：这条路线上你既不放弃权益，也不暴露范围',
        ],
      },
      commonMistake: {
        action: 'Donk bet 2BB（"先下手为强"）',
        reasoning:
          '在 K 高面用第二对子抢先下注，等于把中等强度牌当半诈唬打：撞上对手范围里的 Kx 与更强的牌时，剩下只有被加注的损失。',
        evLoss: '-0.7 BB/100',
      },
    },
    {
      id: 'l4hu-gto-basics-ex3',
      title: '河牌半池：价值 3 : 诈唬 1 的比例',
      heroHand: ['Ac', 'Kc'],
      heroPosition: 'SB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 1.3BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 2.2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
      ],
      board: ['Kh', '9d', '4c', '2s', '7h'],
      street: 'river',
      effectiveStack: 94.5,
      potSize: 11,
      correctDecision: {
        action: 'Bet',
        amount: '5.5BB（1/2 pot）',
        reasoning: [
          'AK 在 K-9-4-2-7 面是顶对顶踢脚，河牌下注半池是标准价值线',
          '半池的价值:诈唬比是 3:1：每 3 手价值牌配 1 手诈唬，让对手在 25% 的跟注线上恰好无差别',
          '尺度与范围配套：半池把对手的跟注线压到 5.5 ÷ (11 + 5.5 + 5.5) = 25%，它范围里所有中等对子都在这条线上',
        ],
      },
      commonMistake: {
        action: 'Bet 11BB（满池）',
        reasoning:
          '满池要求对手守到 50%、跟注线升到 33.3%，价值:诈唬变成 2:1；这条街上真正能付钱给你的牌变少，等于把价值牌打成只能收到更强牌跟注的局面。',
        evLoss: '-0.4 BB/100',
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
          { action: 'Call', isCorrect: true, explanation: 'T9s 同花连张跟注便宜、可玩性好，均衡防守范围成员。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: '3-bet', isCorrect: false, explanation: 'T9s 偏投机，3-bet 太激进，跟注即可。', evImpact: '-0.3 BB/100', evLoss: 0.3 },
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
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，3-bet 底池' },
        },
        options: [
          { action: 'Bet 4BB（1/3 pot）', isCorrect: true, explanation: 'AK 顶对顶踢脚，3-bet 底池主动小注薄价值；SB 的弱牌只能廉价跟注。', evImpact: '+2.0 BB/100', evLoss: 0 },
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
          { action: 'Check-Call', isCorrect: true, explanation: 'QJ 顶对，BB 先过牌再跟注，保留 SB 诈唬，干燥面控制底池。', evImpact: '+1.2 BB/100', evLoss: 0 },
          { action: 'Check-Raise', isCorrect: false, explanation: '顶对 x/r 赶走 SB 诈唬，浪费薄价值，应跟注。', evImpact: '-0.8 BB/100', evLoss: 0.8 },
          { action: 'Fold', isCorrect: false, explanation: 'QJ 顶对是强牌，fold 太弱。', evImpact: '-2.0 BB/100', evLoss: 2 },
        ],
        relatedLessonId: 'l4hu-gto-basics',
      },
      {
        id: 'l4hu-gto-basics-p4',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['Ah', 'Qc'],
          heroPosition: 'BB',
          previousActions: [
            { player: 'SB', action: 'raise 2BB' }, { player: 'BB', action: 'call' },
            { player: 'BB', action: 'check' }, { player: 'SB', action: 'bet 2BB' },
            { player: 'BB', action: 'call' }, { player: 'BB', action: 'check' },
            { player: 'SB', action: 'bet 4BB' }, { player: 'BB', action: 'call' },
            { player: 'BB', action: 'check' }, { player: 'SB', action: 'bet 8BB（1/2 pot）' },
          ],
          board: ['Ad', '9s', '4h', '3c', '2d'],
          street: 'river',
          potSize: 24,
          effectiveStack: 92,
          gameContext: { gameType: 'cash', tableDescription: 'HU 现金桌，SB 连开三枪' },
        },
        options: [
          { action: 'Call', isCorrect: true, explanation: '半池只需 8 ÷ (16 + 8 + 8) = 25% 胜率即可保本，AQ 是顶对顶踢脚，正处在 MDF 67% 的防守范围顶端。', evImpact: '+2.0 BB/100', evLoss: 0 },
          { action: 'Fold（"顶对被三枪打穿"）', isCorrect: false, explanation: '把"尊重三枪"当纪律会系统性弃掉超过 MDF 的强牌：对手只要把半池的价值:诈唬比调到 3:1 以上，就能靠诈唬自动获利。', evImpact: '-2.2 BB/100', evLoss: 2.2 },
          { action: 'Raise to 24BB', isCorrect: false, explanation: '河牌加注只会留下更强的牌跟注，把薄价值翻成反向价值，同时让对手的诈唬轻松弃牌。', evImpact: '-1.0 BB/100', evLoss: 1 },
        ],
        relatedLessonId: 'l4hu-gto-basics',
      },
    ],
  },
  units: [
    { id: 'u1', title: '均衡与不可剥削', sections: L4HU_GTO_U1_SECTIONS, exampleId: 'l4hu-gto-basics-ex1' },
    { id: 'u2', title: '价值:诈唬比与 MDF', sections: L4HU_GTO_U2_SECTIONS, exampleId: 'l4hu-gto-basics-ex3' },
    { id: 'u3', title: '理论支撑与学习路径', sections: L4HU_GTO_U3_SECTIONS, exampleId: 'l4hu-gto-basics-ex2' },
  ],
};
