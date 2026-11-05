import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L8 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel8.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）。
 */
export const LEVEL_8HU_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l8hu-exploitative': [
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
      question: '你提高偷盲后对手开始频繁 3-bet 反击，正确做法是：',
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
      explanation: '频率读取依赖跨 50-100 手的统计（开池率/弃牌率/3-bet 率/摊牌倾向），单手牌印象是噪声。',
    },
  ],
};
