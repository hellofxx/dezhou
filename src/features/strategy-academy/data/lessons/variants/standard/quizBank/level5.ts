import type { QuizQuestion } from '../../../../../types';

/**
 * L5 题库（由 content 轨迁入/扩充；level 文件 quiz 置空后本文件为唯一题源）。
 * q1-q5 为原 standardLevel5.ts 内联题逐字迁移（id / options / correctIndex / explanation 不变）；
 * q6-q10 为按课程目标补充的新题。
 */
export const LEVEL_5_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l5-bankroll': [
    {
      id: 'l5-br-q1',
      question: '打$1/$2现金局（买入$200），最低需要多少资金？',
      options: ['$400', '$2,000', '$4,000-$6,000', '$100'],
      correctIndex: 2,
      explanation: '最低需要20个买入 = 20 × $200 = $4,000。推荐30个 = $6,000。',
    },
    {
      id: 'l5-br-q2',
      question: '什么时候应该降级？',
      options: ['连输3手牌', '资金降至20个买入以下', '不想打了', '对手太强'],
      correctIndex: 1,
      explanation: '当你的资金降至当前级别20个买入以下时，应该果断降级以保护资金安全。',
    },
    {
      id: 'l5-br-q3',
      question: '推荐的现金局资金管理是多少个买入？',
      options: ['10个', '20个', '30-50个', '100个'],
      correctIndex: 2,
      explanation: '推荐30-50个买入的资金管理，这能让你承受正常的波动。',
    },
    {
      id: 'l5-br-q4',
      question: '升级的条件是？',
      options: ['想升级就升级', '在当前级别积累到下一级30个买入', '赢了10手牌', '对手太弱'],
      correctIndex: 1,
      explanation: '升级条件是在当前级别积累到下一级30个买入，确保有足够的安全边际。',
    },
    {
      id: 'l5-br-q5',
      question: '为什么不能把生活费和扑克资金混在一起？',
      options: ['方便计算', '专款专用是资金管理第一原则', '没有原因', '法律规定'],
      correctIndex: 1,
      explanation: '专款专用是资金管理的第一原则，混合使用会导致在有压力时做出非理性决策。',
    },
    {
      id: 'l5-br-q6',
      question: 'Kelly 准则下，胜率 55%、净赔率 1:1 时的最优资金比例 f* 是多少？',
      options: ['5%', '10%', '20%', '45%'],
      correctIndex: 1,
      explanation: 'f* = (bp − q) / b = (1×0.55 − 0.45) / 1 = 0.10，即 10%。',
    },
    {
      id: 'l5-br-q7',
      question: 'Kelly 准则下，胜率 40%、净赔率 2:1 时的最优资金比例 f* 是多少？',
      options: ['10%', '20%', '30%', '40%'],
      correctIndex: 0,
      explanation:
        'f* = (bp − q) / b = (2×0.4 − 0.6) / 2 = 0.2 / 2 = 0.10，即 10%。胜率不到 50% 仍可下注，因为 2:1 的赔率补偿了胜率。',
    },
    {
      id: 'l5-br-q8',
      question: '打 $20 买入的锦标赛，按本课的最低要求（50 个买入）需要多少资金？',
      options: ['$200', '$500', '$1,000', '$2,000'],
      correctIndex: 2,
      explanation: '锦标赛最低 50 个买入 = 50 × $20 = $1,000；本课建议锦标赛用 50-100 个买入。',
    },
    {
      id: 'l5-br-q9',
      question: '本课推荐的 Half Kelly（f = f*/2）主要目的是？',
      options: ['提高单次下注收益', '进一步降低破产风险', '让资金增长最快', '方便心算'],
      correctIndex: 1,
      explanation:
        'Half Kelly 只投入 Kelly 推荐比例的一半（60% 胜率 1:1 时由 20% 降为 10%），用一部分增长率换取更低的方差与破产风险。',
    },
    {
      id: 'l5-br-q10',
      question: '打 $2/$5 现金局（100BB 买入 = $500），按推荐下限 30 个买入需要多少资金？',
      options: ['$5,000', '$10,000', '$15,000', '$30,000'],
      correctIndex: 2,
      explanation: '30 个买入 × $500 = $15,000。本课推荐现金局 30-50 个买入，职业标准 50+ 个买入。',
    },
  ],
  'l5-tilt': [
    {
      id: 'l5-tilt-q1',
      question: '被bad beat后最好的做法是？',
      options: ['立即加注报复', '继续打更多手牌赢回来', '停下来检查自己的情绪', '骂对手'],
      correctIndex: 2,
      explanation:
        '最好的做法是暂停，检查自己的情绪状态。如果感到愤怒或沮丧，应该停止当前的session。',
    },
    {
      id: 'l5-tilt-q2',
      question: '什么是“止损线”？',
      options: ['停止打牌的时间', '设定的最大亏损额度', '下注的上限', '休息时间'],
      correctIndex: 1,
      explanation:
        '止损线是你提前设定的每次session的最大亏损额度（如2个买入），达到后立即停止，防止tilt造成更大损失。',
    },
    {
      id: 'l5-tilt-q3',
      question: 'Tilt的类型不包括？',
      options: ['愤怒型', '恐惧型', '开心型', '报复型'],
      correctIndex: 2,
      explanation: 'Tilt类型包括愤怒型、恐惧型、报复型和绝望型，不包括"开心型"。',
    },
    {
      id: 'l5-tilt-q4',
      question: '发现自己在做"不像自己"的行动时应该？',
      options: ['继续打', '立即停止', '加注更多', '换桌子'],
      correctIndex: 1,
      explanation: '发现自己在做不像自己的行动时，这是tilt的停止信号，应该立即停止。',
    },
    {
      id: 'l5-tilt-q5',
      question: '每打多久应该休息5-10分钟？',
      options: ['30分钟', '1小时', '2小时', '3小时'],
      correctIndex: 1,
      explanation: '建议每打1小时休息5-10分钟，保持清醒的头脑和稳定的情绪。',
    },
    {
      id: 'l5-tilt-q6',
      question: '按本课给出的识别信号，正确率下降超过多少时应暂停训练？',
      options: ['5%', '10%', '15%', '30%'],
      correctIndex: 2,
      explanation:
        '本课给出两个暂停信号：连续答错 3 题、正确率下降超过 15%。此时决策质量已在下降，继续只会放大损失。',
    },
    {
      id: 'l5-tilt-q7',
      question: 'Tendler 7 型 Tilt 中，「连续赢钱后过度自信」属于哪一型？',
      options: ['傲慢型 Tilt', '恐惧型 Tilt', '厌倦型 Tilt', '自毁型 Tilt'],
      correctIndex: 0,
      explanation:
        '傲慢型 Tilt 由连续赢钱后的过度自信引发；恐惧型来自害怕输钱，厌倦型来自长时间 session 注意力下降，自毁型则是潜意识惩罚自己。',
    },
    {
      id: 'l5-tilt-q8',
      question: '「长期下风期积累的负面情绪」对应 Tendler 的哪一型 Tilt？',
      options: ['愤怒型 Tilt', '沮丧型 Tilt', '急迫型 Tilt', '报复型 Tilt'],
      correctIndex: 1,
      explanation:
        '沮丧型 Tilt 是长期下风期积累的负面情绪；愤怒型由单次 bad beat 触发，急迫型源于时间或资金压力，报复型针对特定对手。',
    },
    {
      id: 'l5-tilt-q9',
      question: '「长时间 session 导致注意力下降」对应 Tendler 的哪一型 Tilt？',
      options: ['傲慢型 Tilt', '恐惧型 Tilt', '厌倦型 Tilt', '沮丧型 Tilt'],
      correctIndex: 2,
      explanation:
        '厌倦型 Tilt 来自长时间 session 的注意力衰减，与本课「疲劳时继续打」属同一类风险，靠定时休息与止损线控制。',
    },
    {
      id: 'l5-tilt-q10',
      question: '为了赶在月底前把亏损赢回来，你连续加开 4 桌并压缩每个决策的思考时间。这最接近哪一型 Tilt？',
      options: ['急迫型 Tilt', '傲慢型 Tilt', '厌倦型 Tilt', '恐惧型 Tilt'],
      correctIndex: 0,
      explanation:
        '急迫型 Tilt 因时间或资金压力仓促决策；加开桌数压缩思考时间正是它的典型表现，应对方式是回到单桌并按止损线结束 session。',
    },
  ],
  'l5-game-selection': [
    {
      id: 'l5-game-q1',
      question: '好桌子的特征之一是？',
      options: ['全是职业牌手', '底池很小', '有很多休闲玩家', '没人加注'],
      correctIndex: 2,
      explanation: '理想的桌子有很多休闲玩家（高VPIP），这让你的技术优势最大化。',
    },
    {
      id: 'l5-game-q2',
      question: '至少需要多少手牌的样本量才能准确评估你的水平？',
      options: ['100手', '1,000手', '10,000手以上', '10手'],
      correctIndex: 2,
      explanation: '至少需要10,000+手牌，短期的结果受方差影响太大，无法准确评估技术水平。',
    },
    {
      id: 'l5-game-q3',
      question: '你是桌上第几好的玩家最理想？',
      options: ['第1好', '第3好', '第6好', '无所谓'],
      correctIndex: 0,
      explanation: '理想情况是你是桌上最好的玩家，技术优势最大化。',
    },
    {
      id: 'l5-game-q4',
      question: '短期（1周）的输赢能说明什么？',
      options: ['你的真实水平', '策略有问题', '受方差影响太大', '应该换策略'],
      correctIndex: 2,
      explanation: '短期结果受方差影响太大，需要10,000+手牌才能评估。',
    },
    {
      id: 'l5-game-q5',
      question: '关注什么比关注结果更重要？',
      options: ['单手输赢', '决策质量', '对手的表情', '运气'],
      correctIndex: 1,
      explanation: '关注决策质量而非结果。错误决策可能偶尔赢钱，但长期必亏。',
    },
    {
      id: 'l5-game-q6',
      question: '本课判断「休闲玩家比例高」所用的 VPIP 门槛是多少？',
      options: ['VPIP > 15%', 'VPIP > 30%', 'VPIP > 50%', 'VPIP > 70%'],
      correctIndex: 1,
      explanation:
        '本课口径：桌上有高比例的休闲玩家，即 VPIP > 30%。这类玩家入池过多，正好是你的技术优势所在。',
    },
    {
      id: 'l5-game-q7',
      question: '为什么「翻牌率高（多玩家看 flop）」是好桌子的特征？',
      options: ['说明对手很紧', '说明多人愿意用弱牌入池，技术优势更容易实现', '说明抽水更低', '说明盲注更大'],
      correctIndex: 1,
      explanation:
        '多玩家看 flop 说明对手愿意用偏宽的范围入池，正是弱玩家多的信号；这类底池里的错误决策更多，你的技术优势更容易变现。',
    },
    {
      id: 'l5-game-q8',
      question: '你落座后发现全桌都是长期盈利的职业牌手，最合理的做法是？',
      options: ['坐下硬打，用技术证明自己', '换一张有休闲玩家的桌子', '加大级别找回优势', '把把全押制造波动'],
      correctIndex: 1,
      explanation:
        '游戏选择优先于技术发挥：全桌职业牌手意味着技术优势被抹平，换桌寻找弱玩家是+EV 的选择，硬打只会消耗时间与信心。',
    },
    {
      id: 'l5-game-q9',
      question: '这周你输了 5 个买入，但复盘显示每个决策都正确。按本课口径应该？',
      options: ['立刻收紧起手牌范围', '升级级别把损失赢回来', '继续执行同一套 +EV 策略', '换一种打法直到赢回来'],
      correctIndex: 2,
      explanation:
        '5 个买入（500BB）在正常方差范围内，10,000+ 手牌后才能评估水平。决策正确就继续执行；因短期结果改策略会变成长期 -EV。',
    },
    {
      id: 'l5-game-q10',
      question: '以下哪项不是好桌子的特征？',
      options: ['休闲玩家 VPIP > 30%', '平均底池较大', '玩家之间加注频繁、互动多', '全桌都是紧凶的职业牌手'],
      correctIndex: 3,
      explanation:
        '好桌子的四个特征是休闲玩家多（VPIP > 30%）、平均底池大、翻牌率高、互动多；全桌紧凶职业牌手恰好是应该避开的那一类。',
    },
  ],
  'l5-session-review': [
    {
      id: 'l5-sr-q1',
      question: 'Session Review 的第一步是？',
      options: ['计算赢输', '标记关键手牌', '打开GTO求解器', '发朋友圈'],
      correctIndex: 1,
      explanation: '复盘首先要标记出需要分析的关键牌局，然后再深入分析。',
    },
    {
      id: 'l5-sr-q2',
      question: '复盘时应该关注什么？',
      options: ['单手牌的输赢结果', '决策质量而非结果', '只看大底池', '对手的表情'],
      correctIndex: 1,
      explanation: '质量复盘关注的是决策过程是否正确，而非单次结果。',
    },
    {
      id: 'l5-sr-q3',
      question: '按 Session A/B/C 档框架，出现 C 档（疲劳状态）信号时应如何处理？',
      options: ['继续打完预定的局数', '立即结束本次 Session', '加大注码把输的赢回来', '开更多桌分散注意力'],
      correctIndex: 1,
      explanation:
        '本课的 Session A/B/C 档框架规定：C 档表现为注意力下降、直觉代替分析，出现信号即强制结束。继续打或加大注码都会在劣化的决策上放大亏损；开更多桌只会进一步稀释注意力，而预定局数属于事前计划，不能凌驾于当下的状态信号之上。',
    },
    {
      id: 'l5-sr-q4',
      question: '每次Session应标记几手关键牌？',
      options: ['所有手牌', '3-5手', '1手', '不标记'],
      correctIndex: 1,
      explanation: '每次Session结束后标记3-5手"不确定"的牌。',
    },
    {
      id: 'l5-sr-q5',
      question: '复盘的第5步是？',
      options: ['计算赢输', '标记手牌', '制定改进计划', '对比GTO'],
      correctIndex: 2,
      explanation: '复盘第5步是制定改进计划。',
    },
    {
      id: 'l5-sr-q6',
      question: '本课的 Session 管理原则规定，单次训练不应超过多少分钟？',
      options: ['30 分钟', '45 分钟', '60 分钟', '120 分钟'],
      correctIndex: 2,
      explanation: '本课原则：单次训练不超过 60 分钟、每 30 分钟休息 5 分钟，出现 C 档信号立即结束。',
    },
    {
      id: 'l5-sr-q7',
      question: '按 Session 管理原则，每打 30 分钟应该休息多久？',
      options: ['不休息', '5 分钟', '15 分钟', '30 分钟'],
      correctIndex: 1,
      explanation:
        '本课原则是每 30 分钟休息 5 分钟，用短休息把状态维持在前两档，避免滑向 C 档（注意力下降、靠直觉决策）。',
    },
    {
      id: 'l5-sr-q8',
      question: 'Session A/B/C 档框架中，A 档的特征是？',
      options: ['注意力下降、靠直觉决策', '有一定疲劳但能维持基本决策质量', '专注、冷静、每个决策都经过分析', '情绪波动、想立刻翻本'],
      correctIndex: 2,
      explanation:
        'A 档是最佳状态：专注、冷静、每个决策经过分析，适合处理复杂决策；B 档是能维持基本质量的常规状态；C 档应立即停止。',
    },
    {
      id: 'l5-sr-q9',
      question: '复盘五步法中，第 3 步是？',
      options: ['标记关键手牌', '分析决策点', '对比 GTO', '记录得失'],
      correctIndex: 2,
      explanation:
        '五步法顺序：标记关键手牌 → 分析决策点 → 对比 GTO → 记录得失 → 制定改进计划。第 3 步是用求解器核对最优策略。',
    },
    {
      id: 'l5-sr-q10',
      question: '为什么本课说「赢钱的 session 可能是最差的学习机会」？',
      options: ['赢钱时手牌质量更高，没有分析价值', '赢钱容易掩盖错误决策，让人误以为自己打得很好', '赢钱后情绪太激动无法复盘', '赢钱的牌局数据无法导入工具'],
      correctIndex: 1,
      explanation:
        '赢钱会制造「我打得很好」的错觉，即使实际是靠运气赢；真正的学习发生在输钱的 session —— 那是你发现并修正错误的机会。',
    },
  ],
  'l5-data-driven': [
    {
      id: 'l5-dd-q1',
      question: 'VPIP/PFR 差距过大说明什么？',
      options: ['打得太紧', '跟注太多、加注太少', '打得很好', 'bluff太多'],
      correctIndex: 1,
      explanation: 'VPIP远大于PFR说明你被动跟注太多，应该要么加注要么弃牌。',
    },
    {
      id: 'l5-dd-q2',
      question: '修复漏洞应优先关注哪类？',
      options: ['河牌场景', '翻前场景（频率最高）', '锦标赛场景', '全部同时修'],
      correctIndex: 1,
      explanation: '翻前决策每手牌都会发生，修复翻前漏洞的收益最大。',
    },
    {
      id: 'l5-dd-q3',
      question: 'C-Bet % < 50% 说明什么？',
      options: ['打得太松', '翻后不够激进', '打得很好', 'bluff太多'],
      correctIndex: 1,
      explanation: 'C-Bet低于50%说明翻后不够激进。',
    },
    {
      id: 'l5-dd-q4',
      question: 'Showdown % > 35% 说明什么？',
      options: ['打得太紧', '跟注太多到河牌', 'bluff太多', '打得很好'],
      correctIndex: 1,
      explanation: 'Showdown%过高说明跟注太多到河牌。',
    },
    {
      id: 'l5-dd-q5',
      question: '每月应该做什么来追踪进步？',
      options: ['换级别', '做数据体检', '换平台', '不需要追踪'],
      correctIndex: 1,
      explanation: '每月做数据体检，导出各项统计对比目标值。',
    },
    {
      id: 'l5-dd-q6',
      question: '本课认为 VPIP 与 PFR 的差距超过多少个百分点就算「被动跟注过多」？',
      options: ['3 个百分点', '5 个百分点', '8 个百分点', '15 个百分点'],
      correctIndex: 2,
      explanation:
        '本课口径：VPIP/PFR 差距 > 8 个百分点即说明跟注太多、加注太少 —— 入池的牌里应当有更多被加注或被直接弃掉。',
    },
    {
      id: 'l5-dd-q7',
      question: '各位置的赢率差异明显偏大，最合理的解读是？',
      options: ['纯粹是运气问题，不用管', '某些位置的策略存在问题', '对手在针对你作弊', '样本量已经足够，可以升级'],
      correctIndex: 1,
      explanation:
        '总体赢率会掩盖位置差异；分位置看差异偏大，通常指向某些位置（常见是盲注位）的开池与防守策略有漏洞。',
    },
    {
      id: 'l5-dd-q8',
      question: '本课建议多久做一次「数据体检」？',
      options: ['每天', '每周', '每月', '每年'],
      correctIndex: 2,
      explanation:
        '每月导出各项统计、对比上月与目标值。进步就是漏洞不断缩小的过程，只有固定的体检节奏才能看见趋势。',
    },
    {
      id: 'l5-dd-q9',
      question: '你的 VPIP 是 45%、PFR 是 25%，按本课口径说明了什么？',
      options: ['差距 20 个百分点（>8），被动跟注过多', '差距 20 个百分点，属于健康区间', 'VPIP 偏低，说明打得太紧', '数据完全正常，无需调整'],
      correctIndex: 0,
      explanation:
        '45 − 25 = 20 个百分点，远超本课 8 个百分点的阈值：入池的牌里有大量是被动跟注，应把其中一部分改成加注或直接弃牌。',
    },
    {
      id: 'l5-dd-q10',
      question: '从数据角度看，「进步」最准确的定义是？',
      options: ['赢钱金额越来越高', '漏洞不断被发现并缩小', 'VPIP 越来越高', '打的级别越来越高'],
      correctIndex: 1,
      explanation:
        '短期赢钱受方差影响；数据视角的进步是漏洞持续被发现并被修复的过程，这正是本课「每月数据体检」的用途。',
    },
  ],
  'l5-tools': [
    {
      id: 'l5-tools-q1',
      question: 'PioSOLVER / GTO+ 的主要用途是？',
      options: ['追踪历史数据', '求解特定场景的GTO策略', '计算胜率', '管理资金'],
      correctIndex: 1,
      explanation: 'PioSOLVER/GTO+ 是求解器，用于分析特定场景的GTO策略。',
    },
    {
      id: 'l5-tools-q2',
      question: 'Equilab 的主要功能是？',
      options: ['分析翻后策略', '追踪历史数据', '计算手牌对阵范围的胜率', '管理资金'],
      correctIndex: 2,
      explanation: 'Equilab 是免费的胜率计算器，用于分析手牌对阵范围的胜率。',
    },
    {
      id: 'l5-tools-q3',
      question: '使用分析工具的正确姿势是？',
      options: ['完全依赖工具做决策', '先理解原理，再用工具验证', '只看结果不理解逻辑', '同时开多个工具快速浏览'],
      correctIndex: 1,
      explanation: '工具是辅助学习的，应该先理解原理，再用工具验证。',
    },
    {
      id: 'l5-tools-q4',
      question: 'Hand2Note / Holdem Resource Manager 的主要用途是？',
      options: ['求解GTO策略', '计算胜率', '追踪和分析历史数据', '训练翻后技术'],
      correctIndex: 2,
      explanation: 'Hand2Note/Holdem Resource Manager 是数据追踪工具，用于分析历史数据。',
    },
    {
      id: 'l5-tools-q5',
      question: '关于工具使用的建议，以下哪项是错误的？',
      options: ['从简单场景开始学习', '专注理解一个场景比快速浏览100个更有效', '同时开多个工具提高效率', '先理解原理再验证'],
      correctIndex: 2,
      explanation: '同时开多个工具会降低学习效率。应该专注理解一个场景，深入分析。',
    },
    {
      id: 'l5-tools-q6',
      question: '本课对 PioSOLVER / GTO+ 的学习建议是？',
      options: ['直接从多人底池的复杂场景入手', '从单挑翻牌圈等简单场景开始，逐步增加复杂度', '只分析河牌圈的单一决策', '先背下所有范围的频率'],
      correctIndex: 1,
      explanation:
        '求解器的学习路径是从简单场景（如单挑翻牌圈）开始，理解原理后再逐步增加复杂度；直接上复杂场景只会得到看不懂的输出。',
    },
    {
      id: 'l5-tools-q7',
      question: '使用 Hand2Note 这类数据追踪工具时，本课的建议是？',
      options: ['把每一个统计指标都分析一遍', '只关注关键指标（VPIP/PFR/3-bet%），不要过度分析', '只看赢输金额', '只在输钱之后才打开工具'],
      correctIndex: 1,
      explanation:
        '本课建议关注关键指标（VPIP/PFR/3-bet%）并避免过度分析：指标太多会摊薄注意力，真正重要的漏洞反而看不出来。',
    },
    {
      id: 'l5-tools-q8',
      question: '用 Equilab 反复计算常用范围胜率的目的是？',
      options: ['替代实战决策', '熟悉常用范围的胜率，培养直觉', '生成 GTO 策略表', '统计对手的历史数据'],
      correctIndex: 1,
      explanation:
        'Equilab 用于翻前范围与胜率计算；反复算常用范围是为了把胜率变成直觉，实战中不查表也能大致判断强弱。',
    },
    {
      id: 'l5-tools-q9',
      question: '用工具分析完一手牌，只看「正确动作」却不理解背后的逻辑，后果是？',
      options: ['学习效率降低，换个场景就失效', '不影响，只要结论一致就行', '会提高决策速度', '能更快提升级别'],
      correctIndex: 0,
      explanation:
        '本课例题的错误做法正是「只看结果不分析过程」：记住结论却不知道原因，参数一变就无法迁移，学习效率因此降低。',
    },
    {
      id: 'l5-tools-q10',
      question: '本课对分析工具的整体定位是？',
      options: ['工具能替代理解原理', '工具是辅助学习的利器，过度依赖会阻碍直觉培养', '工具只适合职业牌手', '工具开得越多学得越快'],
      correctIndex: 1,
      explanation:
        '工具的价值在于验证直觉、发现漏洞、学习 GTO 与追踪进步；过度依赖会阻碍直觉培养，正确姿势是先理解原理再用工具验证。',
    },
  ],
  'l5-online-vs-live': [
    {
      id: 'l5-online-vs-live-q1',
      question: '线上扑克每小时约多少手牌？',
      options: ['25-35手', '60-80手', '100-120手', '150+手'],
      correctIndex: 1,
      explanation: '线上扑克节奏快，每小时约 60-80 手牌。',
    },
    {
      id: 'l5-online-vs-live-q2',
      question: 'HUD 的主要用途是？',
      options: ['计算胜率', '快速识别对手类型和数据', '分析翻后策略', '管理资金'],
      correctIndex: 1,
      explanation: 'HUD 可以快速显示对手的 VPIP/PFR/3-bet% 等数据，帮助识别对手类型。',
    },
    {
      id: 'l5-online-vs-live-q3',
      question: '速度扑克（Zoom/Blitz）适合打什么策略？',
      options: ['剥削策略', 'GTO 策略', 'Tell 阅读', '形象管理'],
      correctIndex: 1,
      explanation: '速度扑克每手牌换桌，无法针对特定对手调整，适合打 GTO 策略。',
    },
    {
      id: 'l5-online-vs-live-q4',
      question: '线下扑克的优势是？',
      options: ['节奏快', '可以观察 Tell 和形象', '可以多桌', '每小时手牌多'],
      correctIndex: 1,
      explanation: '线下扑克节奏慢，有更多时间观察对手的 Tell 和建立形象。',
    },
    {
      id: 'l5-online-vs-live-q5',
      question: '反 HUD 策略的核心是？',
      options: ['不使用 HUD', '平衡数据，让对手无法利用', '只打紧凶', '只打松凶'],
      correctIndex: 1,
      explanation: '反 HUD 策略的核心是平衡你的数据，不要让数据过于极端，让对手无法利用。',
    },
    {
      id: 'l5-online-vs-live-q6',
      question: '线下扑克每小时大约能打多少手牌？',
      options: ['25-35 手', '60-80 手', '100-120 手', '150 手以上'],
      correctIndex: 0,
      explanation:
        '线下每手牌约 1-2 分钟，每小时约 25-35 手；线上每手约 10-15 秒，每小时约 60-80 手。',
    },
    {
      id: 'l5-online-vs-live-q7',
      question: '本课如何概括线上与线下的盈利来源差异？',
      options: ['线上靠质量与耐心，线下靠速度与数量', '线上靠速度与数量，线下靠质量与耐心', '两者都只靠发牌运气', '两者都只靠 Tell 阅读'],
      correctIndex: 1,
      explanation:
        '线上节奏快、可多桌，靠数量与速度盈利；线下节奏慢，靠决策质量、Tell 阅读与耐心盈利，因此需要的技能与心态不同。',
    },
    {
      id: 'l5-online-vs-live-q8',
      question: '本课建议线上多桌从几张桌开始？',
      options: ['1 桌', '2-4 桌', '8-12 桌', '16 桌以上'],
      correctIndex: 1,
      explanation:
        '本课建议从 2-4 桌开始、逐步增加；多桌会降低每桌的专注度，适合打标准牌，不适合复杂决策。',
    },
    {
      id: 'l5-online-vs-live-q9',
      question: '按本课的线下 Tell 举例，对手下注时手抖通常代表？',
      options: ['强牌', '弱牌', '纯粹的紧张，没有信息', '诱导你跟注的伪装'],
      correctIndex: 0,
      explanation:
        '本课列举的常见 Tell：手抖通常偏强牌、犹豫通常偏弱牌；但不要过度解读，要结合数据与对手形象判断。',
    },
    {
      id: 'l5-online-vs-live-q10',
      question: '线下形象管理最重要的一条是？',
      options: ['频繁换风格让对手永远猜不到', '保持一致性，不要让对手读出你的模式', '永远只打强牌', '永远不展示自己的牌'],
      correctIndex: 1,
      explanation:
        '形象管理的目标是建立稳定形象并利用它剥削对手（如紧形象时多 bluff），前提是保持一致性——行为模式自相矛盾本身就会泄露信息。',
    },
  ],
};
