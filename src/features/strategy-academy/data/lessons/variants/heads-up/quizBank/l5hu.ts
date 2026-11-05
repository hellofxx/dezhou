import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L5 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel5.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）；
 * q6–q10 为本批扩容新增（每题四选项、唯一正确答案，解析含推导或边界）。
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
    {
      id: 'l5hu-focus-q6',
      question: '单挑每小时约 200 手，session 上限 90 分钟。按这个密度，90 分钟里你要做出大约多少手牌的决策？',
      options: ['约 100 手', '约 200 手', '约 300 手', '约 600 手'],
      correctIndex: 2,
      explanation: '200 手/小时 × 1.5 小时 = 300 手。200 手是把 90 分钟当成 1 小时；600 手相当于把上限按 3 小时算，比 60-90 分钟窗口多了一倍。',
    },
    {
      id: 'l5hu-focus-q7',
      question: '"每 100 手起身一次"在每小时约 200 手的节奏下，等于大约每多久休息一次？',
      options: ['每 15 分钟', '每 30 分钟', '每 60 分钟', '每 100 分钟'],
      correctIndex: 1,
      explanation: '100 手 ÷ 200 手/小时 = 0.5 小时 = 30 分钟。60 分钟是把密度错当成 100 手/小时；100 分钟直接把"手数"当"分钟"读。',
    },
    {
      id: 'l5hu-focus-q8',
      question:
        '疲劳让你维持旧频率下注，但对手弃牌率已从 45% 降到 30%。底池 4BB、你下注 1.33BB（1/3 池），按 EV = f × P − (1 − f) × b 计算，这一街 EV 的变化约为：',
      options: ['约 −0.80BB', '约 −0.27BB', '约 −1.07BB', '约 −1.33BB'],
      correctIndex: 0,
      explanation:
        '旧频率 EV = 0.45 × 4 − 0.55 × 1.33 ≈ +1.07BB；掉到 30% 后 EV = 0.30 × 4 − 0.70 × 1.33 ≈ +0.27BB；差额 ≈ −0.80BB。−0.27 只算了被跟注后的整体 EV，−1.07 是旧频率下的整体 EV 而不是差值。',
    },
    {
      id: 'l5hu-focus-q9',
      question: '下列哪一项属于"疲劳导致的决策劣化"，而不是策略选择？',
      options: [
        '在干燥高牌面用 1/3 池 C-Bet',
        '没察觉对手弃牌率已从 45% 降到 30%，仍按旧频率下注',
        '河牌放弃中等强度的薄价值下注',
        '3-bet 价值范围只包含强牌',
      ],
      correctIndex: 1,
      explanation:
        '其余三项都可以是合理的策略选择，共同点是"你知道信息并据此决定"。只有觉察钝化后沿用旧频率属于状态问题：信息已经变了而你没更新，这才是疲劳劣化。',
    },
    {
      id: 'l5hu-focus-q10',
      question: '你在 100BB 买入的单挑桌累计输 45BB，正落在 40-50BB 波动预算区间内。按纪律正确的处理是：',
      options: [
        '补码回到 100BB，加大注码把 45BB 赢回来',
        '暂停 session 复盘，按预设规则结束或择时重开',
        '把波动预算上调到 100BB 再继续',
        '换一张桌子继续打，避开同一个对手',
      ],
      correctIndex: 1,
      explanation:
        '波动预算是止损纪律：进入 40-50BB 区间即暂停复盘，切断翻本冲动。补码加倍、上调预算、换桌继续，都是把预算从"规则"降级成"建议"。',
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
    {
      id: 'l5hu-opponent-psychology-q6',
      question: '单挑每小时约 200 手。按"只用 50 手以上样本下结论"的纪律，凑够 50 手大约需要：',
      options: ['约 15 分钟', '约 30 分钟', '约 50 分钟', '约 2 小时'],
      correctIndex: 0,
      explanation: '50 手 ÷ 200 手/小时 = 0.25 小时 = 15 分钟。50 分钟是把"手数"当"分钟"读；2 小时能攒到约 400 手，早已越过门槛。',
    },
    {
      id: 'l5hu-opponent-psychology-q7',
      question:
        '底池 4BB、你下注 1.33BB（1/3 池），读取显示对手弃牌率约 50%。按 EV = f × P − (1 − f) × b，这一街的期望约为：',
      options: ['约 +1.34BB', '约 +2.00BB', '约 +0.67BB', '约 −0.67BB'],
      correctIndex: 0,
      explanation:
        'EV = 0.5 × 4 − 0.5 × 1.33 = 2 − 0.665 ≈ +1.34BB。+2.00 只算了弃牌收益；+0.67 把 1.33 的损失整笔减掉而漏乘了被跟注概率。',
    },
    {
      id: 'l5hu-opponent-psychology-q8',
      question: '反读取（所有下注用相同思考时间）的代价是：',
      options: [
        '放弃一部分节奏带来的即时信息优势，换取长期不可被读取',
        '让对手更容易判断你的牌力',
        '必须放弃所有诈唬',
        '必须比对手思考得更久',
      ],
      correctIndex: 0,
      explanation:
        '节奏一致牺牲的是"强牌快、弱牌慢"这类即时收益，换来的是对手无法用节奏反推范围。它既不要求放弃诈唬，也不改变思考时长的绝对值。',
    },
    {
      id: 'l5hu-opponent-psychology-q9',
      question: '底池 10BB、对手下注 5BB。按"跟注所需胜率"计算，你跟注需要的胜率是：',
      options: ['25%', '33.3%', '20%', '50%'],
      correctIndex: 0,
      explanation:
        '跟注 5BB 进入 20BB 总底池（10 + 5 + 5），所需胜率 = 5 ÷ 20 = 25%。33.3% 是 5 ÷ 15、漏算自己跟注的 5BB；20% 把总底池错算成 25BB。',
    },
    {
      id: 'l5hu-opponent-psychology-q10',
      question: '对手在 12 手里 3-bet 了 3 次（25%）。按读取纪律，正确的处理是：',
      options: [
        '立刻判定他是高频 3-bettor，全线收紧开池范围',
        '把它当作待验证假设，先按基线频率应对，攒到 50-100 手再调整',
        '完全忽略这 3 次 3-bet',
        '立刻开始用 4-bet 诈唬他',
      ],
      correctIndex: 1,
      explanation:
        '12 手样本的 25% 置信区间极宽，还不足以定为频率；正确做法是当假设、按基线打，同时把记录攒到 50-100 手。立刻收紧或立刻反诈唬，都是把一个假设当成结论。',
    },
  ],
};
