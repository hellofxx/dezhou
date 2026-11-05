import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L5 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel5.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）。
 */
export const LEVEL_5HU_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l5hu-focus': [
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
  'l5hu-opponent-psychology': [
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
};
