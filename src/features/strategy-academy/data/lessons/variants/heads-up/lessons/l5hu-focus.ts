import type { Lesson } from '../../../../../types';

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
};
