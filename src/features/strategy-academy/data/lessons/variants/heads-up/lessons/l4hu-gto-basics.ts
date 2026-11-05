import type { Lesson } from '../../../../../types';

export const HEADS_UP_LESSON: Lesson = {
  id: 'l4hu-gto-basics',
  level: 4,
  order: 1,
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
        '河牌满池下注的均衡价值:诈唬比（底池 P、下注 P）：\n诈唬占比 f = b/(1+2b) = 1/(1+2) = 1/3\n即价值:诈唬 = 2:1。\n\n半池（b=0.5）：f = 0.5/2 = 25%，价值:诈唬 = 3:1。\n\nMDF（最小防御频率）= 1/(1+b)：\n半池 → 67%；满池 → 50%；2 倍池 → 33%。\n\n单挑中 BB 防守 60%+ 远超 MDF 底线（约 33%-38%），因为翻前最后做决定与已投死钱赔率让跟注本身 +EV。',
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
    {
      type: 'highlight',
      content: '反直觉点："GTO 就是打得紧"是最大误读。单挑 GTO 充满高频下注、超池全下与薄价值——它只是让这一切保持在对手无法反制的比例上。学习求解器别背频率，问三个为什么：为什么这个牌面用这个尺度？为什么这手牌进下注范围？为什么转牌后频率变了？',
    },
    {
      type: 'pro-tip',
      content: '单挑 GTO 学习路径：先用求解器理解均衡"形状"（为什么这样打），再用节点锁定研究"对手常见漏洞的收割方案"，最后实战验证。基线给你不败之地，偏离给你利润空间。',
    },
  ],
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
    ],
  },
};
