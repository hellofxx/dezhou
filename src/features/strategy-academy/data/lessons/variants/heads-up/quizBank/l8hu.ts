import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L8 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel8.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）；
 * q6–q10 为本批扩容新增（每题四选项、唯一正确答案，解析含推导或边界）。
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
    {
      id: 'l8hu-exploitative-q6',
      question:
        '底池 4BB，你在翻牌下注 1.33BB（1/3 池）。对手面对 C-Bet 弃牌 62%（均衡约 45%），这一街的剥削 EV 约为：',
      options: ['+1.97BB', '+2.48BB', '+1.07BB', '−0.51BB'],
      correctIndex: 0,
      explanation:
        'EV = f×P − (1−f)×b = 0.62×4 − 0.38×1.33 = 2.48 − 0.51 ≈ +1.97BB。+2.48 只算弃牌收益、漏掉被跟注的 0.51；+1.07 是均衡 45% 弃牌率下的 EV（0.45×4 − 0.55×1.33）；−0.51 把两个分支的符号写反。',
    },
    {
      id: 'l8hu-exploitative-q7',
      question: '100 手样本里对手面对 C-Bet 弃牌 62 次。这个频率的标准误约为：',
      options: ['约 4.9 个百分点', '约 2.4 个百分点', '约 17 个百分点', '约 0.6 个百分点'],
      correctIndex: 0,
      explanation:
        '频率标准误 = √(p(1−p)/n) = √(0.62×0.38/100) = √0.002356 ≈ 0.0485，即约 4.9 个百分点。样本翻四倍标准误才减半；17 个百分点是 62% 与 45% 的差，不是噪声尺度；0.6 个百分点把分母当成了 10000。',
    },
    {
      id: 'l8hu-exploitative-q8',
      question: '只有 20 手样本时你看到对手弃牌 62%（基线 45%）。按显著性检验，正确动作是：',
      options: [
        '立刻把 C-Bet 频率翻倍',
        '继续取样，暂不偏离',
        '反向降低 C-Bet 频率',
        '直接改用最大程度偏离',
      ],
      correctIndex: 1,
      explanation:
        '20 手的标准误 = √(0.62×0.38/20) ≈ 10.9 个百分点，17 个百分点的差只有约 1.6 个标准误，不到 2 个标准误的门槛，这条观察还可能是噪声。正确动作是先补样本；样本不足就大幅偏离，等于把自己变成对手的剥削目标。',
    },
    {
      id: 'l8hu-exploitative-q9',
      question: '一次合格的单挑剥削调整必须同时具备：',
      options: ['方向、幅度上限与样本证据', '只有方向', '只有样本量', '只有幅度'],
      correctIndex: 0,
      explanation:
        '三个门槛缺一不可：方向（往哪偏）、幅度（偏多少，用频率差而不是感觉）、证据（样本量是否支撑这个方向）。缺方向是乱打；缺幅度上限会在对手调整后变成新漏洞；缺证据则只是"我觉得他弃牌多"。',
    },
    {
      id: 'l8hu-exploitative-q10',
      question: '同一节点上，对手 A 面对 C-Bet 弃牌 62%、对手 B 只弃 30%。你的下注范围调整应当是：',
      options: [
        '对 A 提高诈唬密度，对 B 降低诈唬并把价值段加宽',
        '两人都提高诈唬密度',
        '两人都降低诈唬密度',
        '对 A 降低诈唬、对 B 提高诈唬',
      ],
      correctIndex: 0,
      explanation:
        '剥削方向由偏离方向决定：A 弃牌过多 → 弃牌率替你赚钱，提高诈唬密度与下注频率；B 跟注过多 → 纯诈唬不成立，降低诈唬、把价值段加宽并做薄价值下注。两人方向相反，用同一套频率打两边就是主动放弃剥削收益。',
    },
  ],
};
