import type { Lesson } from '../../../../types';

export const HEADS_UP_LEVEL_5_LESSONS: Lesson[] = [
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
];
