import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { headsUpRules } from '../variantRules';

const variant: PokerVariant = 'heads-up';

export const HEADS_UP_LEVEL_7: TheoryLevelInfo = {
  id: 't7hu',
  level: 7,
  tier: 'advanced',
  title: '单挑对手剥削',
  description: '识别并利用对手的 exploitable 倾向',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T6HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l4hu-counter-strategies', title: '反制策略' },
      { id: 'l8hu-exploitative', title: '剥削性打法' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't7hu-patterns',
      level: 7,
      order: 1,
      title: '对手模式识别',
      subtitle: '常见单挑玩家的行为特征',
      duration: '15 min',
      eloDimension: 'handReading',
      objectives: [
        '识别单挑最常见的对手类型：跟注站、nit（紧弱）、疯鱼（激进跟注）、紧凶',
        '掌握从频率与倾向推断对手范围的读牌方法',
        '学会区分"可剥削倾向"与"一次性动作"，避免过度反应',
      ],
      content: [
        { type: 'heading', content: '单挑是读人的战场' },
        {
          type: 'text',
          content:
            '单挑只面对一个对手，读人的价值被无限放大——你无需兼顾多桌的多个形象，只需吃透眼前这一位。单挑玩家的倾向通常可分为几类：跟注站（Calling Station）翻后几乎不弃牌、nit（紧弱）范围极窄弃牌过多、疯鱼（Maniac）激进且跟注松、紧凶（TAG）平衡但可预测。识别类型后，你的剥削策略就有了方向。',
        },
        {
          type: 'key-point',
          content:
            '读人不是猜手牌，是估范围。对手"跟注过多"意味着他的范围偏宽、偏弱；"弃牌过多"意味着他的范围极窄、可被偷。从频率反推范围，是模式识别的核心。',
        },
        { type: 'heading', content: '从频率到范围：四个关键维度' },
        {
          type: 'text',
          content:
            '观察单挑对手的四个频率：(1) 翻前开池率——判断他玩多宽；(2) 面对 C-Bet 的弃牌率——判断他是否过度弃牌；(3) 3Bet 率——判断他的攻击性；(4) 摊牌倾向——判断他是跟注站还是可控。这四个频率交叉，基本勾勒出对手的完整画像。样本至少 50-100 手，单手牌印象不作数。',
        },
        {
          type: 'example',
          content:
            '实例：某单挑对手翻前开池 85%（宽），但面对 C-Bet 弃牌 60%（过度弃牌）。画像：开池宽+弃牌多 = "宽范围 + 弱防守"的结合。剥削方向：翻后你作为 IP 应高频 C-Bet 偷池，因为他的弃牌率高；同时他的开池宽说明你 BB 的防守也能加宽。两个漏洞一次收割。',
        },
        {
          type: 'example',
          content:
            '实例二（跟注站）：对手翻后几乎不弃牌（弃牌率 <25%），但开池适中。画像：跟注站。剥削方向：不能用纯诈唬（他不弃），改用价值下注薄价值——顶对弱踢脚也能下注收钱，因为他会用更差的牌跟注。同时减少诈唬频率，把诈唬牌转化为半诈唬或过牌。',
        },
        {
          type: 'example',
          content:
            '实例三（nit）：对手开池仅 30%，面对加注弃牌过多。画像：nit。剥削方向：提高偷盲与加注频率（他的弃牌率是自动利润）；但注意不要被他偶尔的强牌反加——nit 一旦进入底池通常很强。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：不要因为对手"某次"翻出坚果就改变对他的分类。单挑是高频博弈，单个全下赢/输是噪声；只有跨 50-100 手的频率统计才构成可剥削的信号。用单手牌印象下结论，是剥削的最大敌人。',
        },
        {
          type: 'pro-tip',
          content:
            '建立对手笔记：每 20 手记录一次四个频率（开池率/弃牌率/3Bet 率/摊牌倾向）。单挑高手中"边打边记笔记"是把短期印象转化为长期优势的纪律。',
        },
      ],
      quiz: [
        {
          id: 't7hu-patterns-q1',
          question: '单挑中"读人"的正确方式是：',
          options: [
            '猜对手具体拿什么牌',
            '从频率（开池率/弃牌率等）反推对手范围',
            '凭感觉判断',
            '只看单手牌表现',
          ],
          correctIndex: 1,
          explanation: '读人是估范围而非猜手牌。从四个关键频率（开池/弃牌/3Bet/摊牌）交叉推断对手画像。',
        },
        {
          id: 't7hu-patterns-q2',
          question: '对手开池 85%、面对 C-Bet 弃牌 60%，正确判断是：',
          options: [
            '他是 nit，应减少下注',
            '他是"宽范围+弱防守"，应高频 C-Bet 偷池',
            '他是跟注站',
            '没有漏洞可剥削',
          ],
          correctIndex: 1,
          explanation: '开池宽 + 弃牌多 = 宽范围弱防守，IP 高频 C-Bet 偷池 + BB 加宽防守，两个漏洞同时收割。',
        },
        {
          id: 't7hu-patterns-q3',
          question: '面对翻后几乎不弃牌的跟注站，正确的剥削是：',
          options: [
            '增加纯诈唬',
            '用价值下注薄价值，减少诈唬',
            '完全停止下注',
            '只玩坚果',
          ],
          correctIndex: 1,
          explanation: '跟注站不弃牌，纯诈唬无效；改用价值下注薄价值，因为对手会用更差的牌跟注。',
        },
        {
          id: 't7hu-patterns-q4',
          question: '识别对手类型时，足够的样本量约为：',
          options: ['3-5 手', '10 手', '50-100 手', '任意手数'],
          correctIndex: 2,
          explanation: '单个全下的输赢是噪声，只有 50-100 手的频率统计才构成可靠信号。单手牌印象下结论是剥削大敌。',
        },
        {
          id: 't7hu-patterns-q5',
          question: '对手开池仅 30%、面对加注弃牌过多（nit），剥削方向是：',
          options: [
            '提高偷盲与加注频率',
            '减少进攻',
            '只玩强牌',
            '增加跟注',
          ],
          correctIndex: 0,
          explanation: 'nit 弃牌过多，偷盲与加注的弃牌率是自动利润。但注意他进池后通常很强，避免被反加。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't7hu-exploit',
      level: 7,
      order: 2,
      title: '针对性调整',
      subtitle: '从 GTO 到剥削的转换',
      duration: '12 min',
      eloDimension: 'postflop',
      objectives: [
        '理解从 GTO 基线转向剥削策略的正确框架：最小必要偏离',
        '掌握针对不同对手类型的具体调整（频率、尺度、范围）',
        '学会识别"何时回到 GTO"——剥削打开漏洞的边界',
      ],
      content: [
        { type: 'heading', content: '剥削不是抛弃 GTO，是校准 GTO' },
        {
          type: 'text',
          content:
            '剥削策略（Exploitative Strategy）利用对手偏离均衡的倾向赚取超额利润。但单挑高手不会"抛弃"GTO，而是"校准"它：以均衡频率为基线，针对对手的明确偏离做最小必要偏离。关键纪律是——每次偏离都打开自己的漏洞，因此幅度要可控，且对手调整后要及时回到基线。',
        },
        {
          type: 'key-point',
          content:
            '剥削的正确姿态：方向瞄准对手漏洞（Maximally Exploitative），幅度保持最小（Minimally Exploitative）。偏离的目标是"对手修正前赚够"，而非"把自己也变漏洞"。',
        },
        { type: 'heading', content: '节点锁定：把剥削变成计算' },
        {
          type: 'text',
          content:
            '节点锁定（Node Locking）是求解器的高级用法：把对手某节点的策略锁定为你观察到的真实倾向（如"此对手河牌从不诈唬"或"面对 C-Bet 弃牌 60%"），重解你的最优应对。输出的就是针对该漏洞的最大剥削策略。这让剥削从"感觉"变成"计算"。',
        },
        {
          type: 'formula',
          content:
            '针对弃牌过多的对手提高偷盲（SB min-raise 到 2BB，BB 面对弃牌率 f）：\n\nEV(steal) = f×1.5 − (1−f)×1.5\n\n均衡弃牌率约 40%（f=0.4）→ EV = 0.4×1.5 − 0.6×1.5 = −0.3BB（不盈利，需翻后补）\n\n若对手弃牌率 60%（f=0.6）→ EV = 0.6×1.5 − 0.4×1.5 = +0.3BB（纯偷盲已盈利）\n\n结论：对手每提高弃牌率 10%，你的偷盲频率都应上调——但幅度以"他若修正到 50% 你仍不亏"为限。（概念源自：《Applications of No-Limit Hold’em》Matthew Janda Ch.13 剥削性下注与频率）',
        },
        {
          type: 'example',
          content:
            '实例：锁定"BB 面对转牌二次开火弃牌 55%（均衡约 45%）"后重解，求解器会立刻把你的转牌诈唬频率推高、连原本过牌的弱牌也加入下注。它精确展示了"对手每偏离 1%，你应该偏离多少"来收割。',
        },
        {
          type: 'example',
          content:
            '实例二（针对跟注站的价值）：对手翻后跟注过松（跟注站），锁定该倾向后，你的价值下注尺度可以加大、薄价值牌（顶对弱踢脚）全进下注范围。因为跟注站用弱牌跟注，你的宽价值范围被超额支付。',
        },
        {
          type: 'example',
          content:
            '实例三（何时回基线）：你提高偷盲频率后，对手开始频繁 3Bet 反击——说明他发现了你的偏离。此时必须回到 GTO 基线（收窄偷盲范围、减少纯诈唬），否则你新打开的漏洞会被他反向收割。剥削是动态博弈：偏离-被察觉-回基线，循环往复。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：剥削的最大风险不是"剥削得不够"，而是"剥削过头"把自己变成漏洞。单挑高手在收割对手漏洞的同时，永远留着一只手握在 GTO 基线的方向盘上——对手一调整，立刻归位。',
        },
        {
          type: 'pro-tip',
          content:
            '剥削执行五步：(1) HUD 收集足够样本确认漏洞；(2) 求解器锁定该节点求最优应对；(3) 对比基线标出被推高的频率与尺度；(4) 实战执行；(5) 每 500 手复核样本是否仍成立。没有数据支撑的"锁定"只是纸上的剥削。',
        },
      ],
      quiz: [
        {
          id: 't7hu-exploit-q1',
          question: '"最小必要偏离"的纪律是：',
          options: [
            '完全抛弃 GTO',
            '方向瞄准对手漏洞、幅度保持最小，随时可回基线',
            '永远加大剥削',
            '完全照抄 GTO',
          ],
          correctIndex: 1,
          explanation: '偏离打开自己的漏洞，幅度要可控；方向瞄准漏洞、幅度最小、对手调整后及时回基线。',
        },
        {
          id: 't7hu-exploit-q2',
          question: '针对弃牌率 60%（均衡 40%）的对手，偷盲 EV 为：',
          options: ['−0.3BB', '+0.3BB', '0', '无法计算'],
          correctIndex: 1,
          explanation: 'EV = 0.6×1.5 − 0.4×1.5 = +0.3BB，纯偷盲已盈利。对手弃牌率越高，偷盲频率越应上调。',
        },
        {
          id: 't7hu-exploit-q3',
          question: '节点锁定（Node Locking）的用途是：',
          options: [
            '锁定自己策略防止手抖',
            '把对手策略固定为观察到的倾向，求最大剥削应对',
            '防止求解器崩溃',
            '锁定翻前范围',
          ],
          correctIndex: 1,
          explanation: '节点锁定把"对手实际怎么打"输入求解器，输出对该偏差的最优收割方案，让剥削从感觉变计算。',
        },
        {
          id: 't7hu-exploit-q4',
          question: '面对翻后跟注过松的跟注站，剥削调整是：',
          options: [
            '加大价值下注、薄价值牌全进下注范围',
            '增加纯诈唬',
            '减少下注',
            '只玩坚果',
          ],
          correctIndex: 0,
          explanation: '跟注站用弱牌跟注，你的宽价值范围被超额支付，价值下注尺度可加大、薄价值牌可进下注范围。',
        },
        {
          id: 't7hu-exploit-q5',
          question: '你提高偷盲频率后对手开始频繁 3Bet 反击，正确做法是：',
          options: [
            '继续加大偷盲',
            '回到 GTO 基线，收窄范围',
            '完全停止开池',
            '忽略对手反应',
          ],
          correctIndex: 1,
          explanation: '对手发现你的偏离，你新打开的漏洞会被反向收割。必须回到基线，剥削是"偏离-被察觉-回基线"的动态博弈。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};

// ========== T8: 扑克心理学（单挑版）==========
