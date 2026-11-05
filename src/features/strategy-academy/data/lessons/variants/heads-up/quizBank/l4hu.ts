import type { QuizQuestion } from '../../../../../types';

/**
 * 单挑 L4 题库（lessonId → questions）。
 * q1–q5 由 headsUpLevel4.ts 逐字迁入（id / 选项顺序 / correctIndex / 解析未改动）。
 */
export const LEVEL_4HU_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l4hu-bn-opening': [
    {
      id: 'l4hu-bn-opening-q1',
      question: '单挑按钮位（SB）的开池频率范围约为：',
      options: ['约 30%', '约 50%', '约 80%-100%', '约 10%'],
      correctIndex: 2,
      explanation: '单挑 SB 开池约 80%-100%，只有极少数完全垃圾弃牌。因为补 0.5 即可看 1.5BB 底池、翻后由你最后行动。',
    },
    {
      id: 'l4hu-bn-opening-q2',
      question: '单挑按钮位开池为什么以 min-raise（2BB）为主？',
      options: [
        'min-raise 偷盲门槛低（50% 弃牌率）且翻后容易控池',
        'min-raise 让对手更容易弃牌',
        '大尺度更好偷盲',
        'min-raise 让牌更强',
      ],
      correctIndex: 0,
      explanation: 'min-raise 偷盲盈亏平衡 50% 弃牌率、尺度小翻后易控池，且能支持约 80% 的宽范围。大尺度在单挑是自我惩罚。',
    },
    {
      id: 'l4hu-bn-opening-q3',
      question: '单挑中 BB 面对 min-raise 的真实弃牌率约为：',
      options: ['约 60%', '约 30%-40%', '约 80%', '约 10%'],
      correctIndex: 1,
      explanation: '单挑 BB 面对 min-raise 真实弃牌率仅约 30%-40%（防守 60%-70%），说明纯偷盲几乎不盈利，开池价值在翻后。',
    },
    {
      id: 'l4hu-bn-opening-q4',
      question: '单挑按钮位"开池约 80%"的正确理解是：',
      options: [
        '用 80% 的牌打到摊牌',
        '参与约 80%，但很多牌翻后按牌面适配及时收手',
        '只用 80% 强牌',
        '开池后永远加注',
      ],
      correctIndex: 1,
      explanation: '开池宽是"参与多、投入少"——翻后按牌面适配及时收手，才是成熟打法。',
    },
    {
      id: 'l4hu-bn-opening-q5',
      question: '面对 BB 3-bet 频繁的对手，按钮位应如何调整开池？',
      options: [
        '保持 80% 不变',
        '收窄范围，减少被 3-bet 后只能弃牌的边缘牌',
        '开到 100%',
        '完全停止开池',
      ],
      correctIndex: 1,
      explanation: '高频 3-bet 侵蚀偷盲 EV，边缘牌被 3-bet 后只能弃牌。正确调整是收窄范围；完全停止是过度反应。',
    },
  ],
  'l4hu-ev-adjustments': [
    {
      id: 'l4hu-ev-adjustments-q1',
      question: '单挑中 EV 计算与满员桌的主要差异是：',
      options: [
        '公式完全不同',
        '没有多人稀释、死钱占比高、对手范围宽，EV 数值被放大',
        '单挑没有 EV',
        '单挑 EV 更小',
      ],
      correctIndex: 1,
      explanation: 'EV 公式不变，但单挑两人底池无稀释、SB 死钱占比高、对手范围宽，让更多边缘牌跟注变成 +EV，数值意义被放大。',
    },
    {
      id: 'l4hu-ev-adjustments-q2',
      question: 'SB min-raise 到 2BB（BB 已投 1BB），BB 还需跟注 1BB，所需胜率约为：',
      options: ['33.3%', '25%', '40%', '50%'],
      correctIndex: 1,
      explanation: '所需胜率 = 跟注额 ÷（当前底池 + 对手下注 + 跟注额）= 1 ÷ (1.5 + 1.5 + 1) = 1 ÷ 4 = 25%。分母必须含 BB 自己已入池的 1BB 死钱（1/(2+1)≈33.3% 正是漏算它得到的错值）。单挑死钱占比高，比满员桌 BTN 跟注 40% 更便宜。',
    },
    {
      id: 'l4hu-ev-adjustments-q3',
      question: '单挑 BB 防守 60%+ 的根本原因是：',
      options: [
        'BB 牌更好',
        '面对 SB 宽范围跟注门槛低，且翻前最后做决定信息更全',
        'BB 必须防守',
        '规则要求',
      ],
      correctIndex: 1,
      explanation: '面对 SB 约 80% 宽范围，跟注门槛降至 25%（再跟 1BB ÷ 跟注后总底池 4BB），且 BB 翻前最后做决定、已投死钱赔率便宜，故可宽防守——是 EV 计算的结果而非"宽松"；权益实现率超 100% 的红利属于持有位置的 SB，不在 BB 名下。',
    },
    {
      id: 'l4hu-ev-adjustments-q4',
      question: '单挑中听牌跟注（如双卡顺）常依赖隐含赔率的原因是：',
      options: [
        '单挑底池更大',
        '对手范围宽、支付意愿高，中牌后能再赢更多',
        '听牌胜率更高',
        '没有隐含赔率',
      ],
      correctIndex: 1,
      explanation: '单挑对手范围宽、支付意愿高，中牌后能再赢更多（隐含赔率好），弥补单街胜率的不足。',
    },
    {
      id: 'l4hu-ev-adjustments-q5',
      question: '单挑位置价值约 0.5-1BB/手，最准确的理解是：',
      options: [
        'BB 每手翻牌都能多赚 1BB',
        '长期来看 SB 位比 BB 位每手多 0.5-1BB 期望收益',
        '翻前位置的价值',
        '只在锦标赛成立',
      ],
      correctIndex: 1,
      explanation: '位置价值是长期期望差异：SB 翻后最后行动、持有 IP，平均每手多赢 0.5-1BB，是统计期望而非单手保证。',
    },
  ],
  'l4hu-gto-basics': [
    {
      id: 'l4hu-gto-basics-q1',
      question: '纳什均衡"不可剥削"的保证在单挑中的适用性：',
      options: [
        '不适用',
        '严格成立（单挑是纯二人零和博弈）',
        '只在翻前成立',
        '只在锦标赛成立',
      ],
      correctIndex: 1,
      explanation: '单挑（忽略抽水）是纯二人零和博弈，纳什均衡的不可剥削保证在此严格成立。多人底池会因联合效应弱化。',
    },
    {
      id: 'l4hu-gto-basics-q2',
      question: '河牌满池下注的均衡价值:诈唬比约为：',
      options: ['1:1', '2:1', '3:1', '4:1'],
      correctIndex: 1,
      explanation: '诈唬占比 f = 1/(1+2) = 1/3，价值 2/3、诈唬 1/3，价值:诈唬 = 2:1。恰等于对手跟注所需胜率 33%。',
    },
    {
      id: 'l4hu-gto-basics-q3',
      question: '单挑 GTO 与满员桌 GTO 的主要差异是：',
      options: [
        '单挑 GTO 更紧',
        '单挑范围极宽、下注频率高、诈唬密度大',
        '两者完全相同',
        '单挑不存在 GTO',
      ],
      correctIndex: 1,
      explanation: '单挑范围宽（SB 80%、BB 60%+），均衡伴随高下注频率与极化范围，而非"打得紧"。',
    },
    {
      id: 'l4hu-gto-basics-q4',
      question: '单挑中 BB 防守 60%+ 远超 MDF 底线（约 33%-38%）的原因是：',
      options: [
        'BB 每手牌更好',
        'BB 翻前最后做决定，已投 1BB 死钱让跟注便宜',
        'BB 必须防守',
        'MDF 公式在翻前不适用',
      ],
      correctIndex: 1,
      explanation: 'MDF 只保证"阻止纯诈唬自动盈利"，而 BB 跟注的正 EV 来自翻前最后做决定与已投死钱赔率，故可防守超过底线且仍盈利。权益实现率超 100% 的红利属于持有位置的 SB。',
    },
    {
      id: 'l4hu-gto-basics-q5',
      question: '单挑"位置对称性"指的是：',
      options: [
        '双方位置固定不变',
        '每手牌双方互换 SB/BB，你既要会打 SB 也要会打 BB',
        '位置没有影响',
        '只有 SB 有位置',
      ],
      correctIndex: 1,
      explanation: '单挑每手牌双方互换 SB/BB，位置反转（SB 翻前先开池、翻后最后行动；BB 相反），GTO 均衡同时包含两个方向的位置策略。',
    },
  ],
  'l4hu-counter-strategies': [
    {
      id: 'l4hu-counter-strategies-q1',
      question: '识别单挑对手偏离的正确依据是：',
      options: [
        '单手牌印象',
        '跨 50-100 手的频率统计',
        '对手外貌',
        '随机猜测',
      ],
      correctIndex: 1,
      explanation: '单挑反制依赖跨 50-100 手的频率统计（弃牌率/3-bet 率等），单手牌印象是噪声，不足为据。',
    },
    {
      id: 'l4hu-counter-strategies-q2',
      question: '针对弃牌过多的对手，正确的反制是：',
      options: [
        '减少进攻',
        '提高开池/C-Bet 频率，增加半诈唬',
        '只玩坚果',
        '完全停注',
      ],
      correctIndex: 1,
      explanation: '弃牌过多的对手让偷盲与 C-Bet 的弃牌率成为自动利润，应提高开池/C-Bet 频率与半诈唬密度。',
    },
    {
      id: 'l4hu-counter-strategies-q3',
      question: '针对跟注过松的跟注站，正确的反制是：',
      options: [
        '增加纯诈唬',
        '减少诈唬，改用价值下注薄价值',
        '完全停止下注',
        '只玩坚果',
      ],
      correctIndex: 1,
      explanation: '跟注站不弃牌，纯诈唬无效；改用价值下注薄价值，因为对手会用更差的牌跟注。',
    },
    {
      id: 'l4hu-counter-strategies-q4',
      question: '"最小必要偏离"的纪律是：',
      options: [
        '完全抛弃 GTO',
        '方向瞄准对手漏洞、幅度保持最小，随时可回基线',
        '永远加大反制',
        '完全照抄 GTO',
      ],
      correctIndex: 1,
      explanation: '偏离打开自己的漏洞，幅度要可控；方向瞄准漏洞、幅度最小、对手调整后及时回基线。',
    },
    {
      id: 'l4hu-counter-strategies-q5',
      question: '节点锁定（Node Locking）在反制中的作用是：',
      options: [
        '锁定自己策略',
        '把对手偏离锁定为固定频率，重解你的最优应对',
        '防止求解器崩溃',
        '锁定翻前范围',
      ],
      correctIndex: 1,
      explanation: '节点锁定把"对手实际怎么打（偏离）"输入求解器，输出针对该偏差的最优反制，让反制从感觉变计算。',
    },
  ],
};
