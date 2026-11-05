import type { Lesson, LessonSection } from '../../../../../types';

// ===== l5hu-focus 分段常量（引用相等契约：content 与手写 units.sections 共享同一批对象） =====
const L5HU_FOCUS_U1_SECTIONS: LessonSection[] = [
  { type: 'heading', content: '单挑：决策密度的极限测试' },
  {
    type: 'text',
    content:
      '单挑是扑克中决策密度最高的形式：每手牌都在盲注位、每小时 200+ 手、几乎每手都进翻牌。这意味着你的专注力在单挑中既是武器也是短板——一个分神就可能错过对手的倾向、算错赔率、或在高频下风期情绪失控。单挑高手把专注力当作可训练的资源，而非天生的天赋。',
  },
  {
    type: 'key-point',
    content:
      '单挑的专注力不是"盯住屏幕"，而是"对高频决策保持同样的质量"。用 session 时长限制 + 状态觉察 + 疲劳控制，让最后一手的决策质量和第一手一样好。',
  },
];

const L5HU_FOCUS_U2_SECTIONS: LessonSection[] = [
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
];

const L5HU_FOCUS_U3_SECTIONS: LessonSection[] = [
  {
    type: 'highlight',
    content:
      '反直觉点：单挑中最危险的不是"输钱时的冲动"，而是"赢钱后的松懈"。赢了几手后玩家常放松警惕、开始玩边缘牌，把优势送回去。单挑的纪律必须全程一致，无论牌势顺逆。',
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：单挑高频对抗下的波动密度与情绪触发见理论学院 T8『压力管理』——那一章把持续紧张感拆成波动密度、时间压力与自我对话三层，每层都给出可执行的降温动作，本课的三件套就是从这套动作里挑出最适合现金单挑的三条。',
    data: { theoryLevelId: 't8hu', theoryChapterId: 't8hu-pressure' },
  },
  {
    type: 'theory-reference',
    content:
      '理论支撑：情绪失控的分型与决策漂移见理论学院 T8『Tilt 类型学』——先认出自己属于哪一种失控（报复型、自负型、还是最容易被忽视的疲劳型），再谈对策；把"我今天 tilt 了"换成"我今天是哪一种"，纪律才有落点。',
    data: { theoryLevelId: 't8hu', theoryChapterId: 't8hu-tilt-types' },
  },
  {
    type: 'pro-tip',
    content:
      '单挑 session 管理三件套：(1) 预设波动预算——输 40-50BB 即暂停复盘；(2) 每 100 手起身一次，切断连败心理惯性；(3) 复盘只问 EV 不问结果。',
  },
  {
    type: 'takeaway',
    content:
      '专注力三句总结：\n每小时约 200 手，90 分钟上限等于约 300 手决策——最后那几十手的质量决定 session 的真实 EV\n疲劳的第一信号是"觉察变钝"（例如 BB 面对 C-Bet 的弃牌率从 45% 掉到 30% 你却没发现），不是"打错一手"\n40-50BB 波动预算与每 100 手（约 30 分钟）起身，是把止损写进流程而不是靠临场意志',
  },
];

export const HEADS_UP_LESSON: Lesson = {
  id: 'l5hu-focus',
  level: 5,
  order: 1,
  title: '单挑专注力',
  subtitle: '单挑高速决策节奏下的专注、状态管理与疲劳控制',
  duration: '7 min',
  objectives: [
    '说明单挑专注力的定义（对高频决策保持同样的质量），并列举疲劳的四类征兆（玩边缘牌、尺度失控、低级错误、对对手倾向的觉察钝化）',
    '运用单挑状态管理三原则预设纪律（session 60-90 分钟上限、输 40-50BB 波动预算、每 100 手起身一次）',
    '区分「疲劳决策劣化」与「策略错误」，判断察觉 BB 倾向变化觉察钝化时应暂停而非按旧频率继续',
    '判断单挑纪律必须全程一致（赢钱后的松懈与输钱时的冲动同样危险）',
  ],
  variant: 'heads-up',
  variantContext: { anteStructure: 'sb_ante' },
  content: [...L5HU_FOCUS_U1_SECTIONS, ...L5HU_FOCUS_U2_SECTIONS, ...L5HU_FOCUS_U3_SECTIONS],
  quiz: [],
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
    {
      id: 'l5hu-focus-ex2',
      title: '疲劳时的尺度失控',
      heroHand: ['Ac', 'Ad'],
      heroPosition: 'SB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
      ],
      board: ['Kd', '9s', '4c'],
      street: 'flop',
      effectiveStack: 55,
      potSize: 4,
      correctDecision: {
        action: 'Bet',
        amount: '1.3BB（1/3 pot）',
        reasoning: [
          'AA 在 K-9-4 彩虹面是超对，1/3 池小注既取薄价值又维持高频下注，尺度不需要因为牌大而变大',
          '1/3 池的保本弃牌率 = 1.33 ÷ (4 + 1.33) ≈ 25%，对手只要弃掉最弱的四分之一，这笔下注就已盈利',
          '疲劳时最常见的失误是把尺度放大到 2 倍超池：8BB 需要 8 ÷ (4 + 8) ≈ 66.7% 的弃牌率才保本，而疲劳状态下你根本没在看弃牌率',
        ],
      },
      commonMistake: {
        action: 'Bet 8BB（2 倍超池）',
        reasoning:
          '超池 8BB 要把对手的弃牌率推到约 66.7% 才保本。放大的动机通常是"想快点结束这一手"而不是牌面需要——这正是尺度失控这一类疲劳征兆的现场版。',
        evLoss: '-1.4 BB/100',
      },
    },
    {
      id: 'l5hu-focus-ex3',
      title: '疲劳时的英雄跟注',
      heroHand: ['Ah', 'Jc'],
      heroPosition: 'BB',
      previousActions: [
        { player: 'SB', action: 'raise 2BB' },
        { player: 'BB', action: 'call' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'check' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'check' },
        { player: 'BB', action: 'check' },
        { player: 'SB', action: 'bet 8BB（2 倍底池）' },
      ],
      board: ['Ks', '9d', '4c', '2h', '8s'],
      street: 'river',
      effectiveStack: 98,
      potSize: 12,
      correctDecision: {
        action: 'Fold',
        reasoning: [
          '河牌从 4BB 底池里下注 8BB，跟注所需胜率 = 8 ÷ (4 + 8 + 8) = 40%',
          'AJ 只赢纯诈唬：所有 Kx、两对与顺子都赢它，2 倍底池的价值组合占比远高于 60%',
          '打到第 120 分钟且已出现疲劳征兆时，"想赢回来"会伪装成"我读到他诈唬"——这类跟注的动机是情绪不是赔率',
        ],
      },
      commonMistake: {
        action: 'Call（疲劳时的英雄跟注）',
        reasoning:
          '40% 的跟注线要求对手 2 倍底池的河牌下注里至少 40% 是诈唬，这个尺度在单挑河牌通常撑不起来。疲劳不改变这个数字，只让你把"不成立"看成"成立"。',
        evLoss: '-2.2 BB/100',
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
      {
        id: 'l5hu-focus-p4',
        difficulty: 'advanced',
        scenario: {
          heroHand: ['Ts', '9s'],
          heroPosition: 'SB',
          previousActions: [],
          street: 'preflop',
          potSize: 1.5,
          effectiveStack: 100,
          gameContext: {
            gameType: 'cash',
            tableDescription: 'HU 现金桌，已连续打 110 分钟，近 20 手每手都用同一套尺度',
          },
        },
        options: [
          { action: 'Min-raise 2BB，并按预设时长结束 session', isCorrect: true, explanation: 'T9s 本身是标准开池牌；本题的判分点在状态：110 分钟已超过 60-90 分钟上限，"尺度机械化"属于疲劳征兆。动作照常、session 按预设结束，才是把纪律写进流程。', evImpact: '+1.0 BB/100', evLoss: 0 },
          { action: 'All-in 100BB，趁手感还在快速结束', isCorrect: false, explanation: '100BB 全下只剩强牌跟注，把 T9s 打成纯诈唬；"快速结束"是疲劳的产物，不是牌面证据。', evImpact: '-3.0 BB/100', evLoss: 3 },
          { action: 'Fold，把筹码留到状态恢复以后', isCorrect: false, explanation: 'fold 丢掉标准开池的 +EV，而"等状态恢复"正是疲劳最爱的拖延理由——正确做法是结束 session，而不是在桌边等自己变清醒。', evImpact: '-1.5 BB/100', evLoss: 1.5 },
        ],
        relatedLessonId: 'l5hu-focus',
      },
    ],
  },
  units: [
    { id: 'u1', title: '决策密度与专注力基线', sections: L5HU_FOCUS_U1_SECTIONS, exampleId: 'l5hu-focus-ex1' },
    { id: 'u2', title: '状态管理与疲劳控制', sections: L5HU_FOCUS_U2_SECTIONS, exampleId: 'l5hu-focus-ex2' },
    { id: 'u3', title: '理论支撑与纪律落地', sections: L5HU_FOCUS_U3_SECTIONS, exampleId: 'l5hu-focus-ex3' },
  ],
};
