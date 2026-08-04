import type { Lesson } from '../../types';

/**
 * P2-1.7 模块 6：情绪管理（3 课）
 *
 * 国内低级别玩家最大的漏洞往往不是技术，而是情绪。
 * 本模块讲解 Tilt 识别、止损纪律与 Session 管理。
 */
export const MENTAL_LESSONS: Lesson[] = [
  // ===== local-mental-tilt-recognition =====
  {
    id: 'local-mental-tilt-recognition',
    level: 7,
    order: 19,
    title: 'Tilt 识别与应对',
    subtitle: '识别情绪失控的信号与紧急处理',
    duration: '9 min',
    content: [
      { type: 'highlight', content: '💡 此内容与 Level 5 的「情绪管理」(l5-tilt) 相关联，建议先完成基础课程。本模块针对国内低级别场景，侧重“实战中的情绪触发与应对”以及“止损纪律”。' },
      { type: 'heading', content: '什么是 Tilt？' },
      { type: 'text', content: 'Tilt（情绪失控）是扑克玩家最大的敌人。它指因负面事件（bad beat、连续输牌、被对手挑衅等）导致情绪波动，进而做出非理性决策的状态。\n\n国内低级别玩家尤其容易 tilt：抽水高、variance 大、对手运气好（跟注站用垃圾牌击中奇迹），这些都会引发情绪失控。\n\n关键认知：tilt 不会让你"感觉"自己失控，它会让你"觉得"自己在做正确决策，但实际上已经偏离了最优策略。' },
      { type: 'key-point', content: 'Tilt 的本质：情绪系统劫持了理性决策系统。你不是"故意"打差，而是大脑在情绪压力下自动选择了次优策略。' },
      { type: 'heading', content: 'Tilt 的早期信号' },
      { type: 'text', content: '识别 tilt 的身体与行为信号：\n\n身体信号：\n• 心跳加速、呼吸变浅\n• 脸红、出汗、肌肉紧绷（特别是下颌/肩膀）\n• 坐姿变化：前倾、握拳、抖腿\n• 视野变窄（隧道视觉）\n\n行为信号：\n• 开牌范围明显放宽（用 K5o、96o 等垃圾牌开牌）\n• 加注尺度变大（突然 overbet 或 All-in）\n• 频繁 bluff（报复性攻击对手）\n• 跟注到底（"我要看他到底有什么"）\n• 无法弃牌（执意用顶对打光）\n\n心理信号：\n• "我要把输的赢回来"\n• "这桌运气太差，我要换桌"\n• "这对手太烦，我要教训他"\n• "再来一把就收手"' },
      { type: 'example', content: '示例场景：连续 bad beat 后的 tilt\n\n第 1 手：你 AA All-in 输给对手 KK（river 击中 K）\n第 2 手：你 KK All-in 输给对手 QQ（river 击中 Q）\n第 3 手：你 AK 击中顶对输给对手 72（river 两对）\n\nTilt 信号：\n• 心跳加速，呼吸变浅\n• 第 4 手你用 K9o 开牌（平时不会）\n• 第 5 手你用 87o 跟注 3-Bet（平时不会）\n• 第 6 手你河牌 All-in bluff（报复性）\n\n正确应对：\n• 立即坐下离开桌子 5-10 分钟\n• 深呼吸 10 次（4 秒吸气、7 秒屏住、8 秒呼气）\n• 喝水、走动、洗手间\n• 评估：是否还能保持理性决策？如否，今天停止\n\n错误应对：继续打，"把输的赢回来"——这通常导致更大亏损' },
      { type: 'heading', content: 'Tilt 的类型与应对' },
      { type: 'text', content: '不同类型的 tilt 需要不同应对：\n\n1. 失利 tilt（最常见）：连续输牌后想要"追回"\n• 应对：离开桌子，回顾决策（而非结果）\n\n2. 不公 tilt：被 bad beat 后觉得"不公平"\n• 应对：记住 variance 是扑克本质，长期技术会胜出\n\n3. 失控 tilt：感觉无法影响结果\n• 应对：降到更低级别打几手，找回掌控感\n\n4. 报复 tilt：针对某个对手"教训他"\n• 应对：换桌，避免与该对手纠缠\n\n5. 疲劳 tilt：长时间打牌后决策力下降\n• 应对：定时休息，单次 session 不超过 2 小时' },
      { type: 'highlight', content: 'Tilt 最致命的认知错误：以为"我能控制自己"。Tilt 是潜意识接管决策，你感觉理性但实际已经失控。最好的应对是"预防"——设置硬性止损，到点必须离开。' },
      { type: 'pro-tip', content: '使用 Session 日志记录情绪状态：每次 session 后标记"今天情绪如何（1-5 分）"，并与盈亏关联。长期数据会让你发现"情绪差时亏损严重"，从而建立情绪管理意识。' },
    ],
    quiz: [
      {
        id: 'mental-tilt-q1',
        question: 'Tilt 的本质是？',
        options: ['故意打差', '情绪系统劫持理性决策系统', '技术不足', '运气差'],
        correctIndex: 1,
        explanation: 'Tilt 是情绪压力下大脑自动选择次优策略，你感觉理性但实际已失控。这不是"故意"打差。',
      },
      {
        id: 'mental-tilt-q2',
        question: '以下哪项是 tilt 的行为信号？',
        options: ['开牌范围明显放宽', '心跳加速', '呼吸变浅', '脸红'],
        correctIndex: 0,
        explanation: '行为信号包括开牌范围放宽、加注尺度变大、频繁 bluff 等。心跳加速、呼吸变浅、脸红是身体信号。',
      },
      {
        id: 'mental-tilt-q3',
        question: '连续 bad beat 后的正确应对是？',
        options: ['继续打"把输的赢回来"', '离开桌子 5-10 分钟', '升级别打', '换桌继续'],
        correctIndex: 1,
        explanation: '连续 bad beat 后应立即离开桌子 5-10 分钟，深呼吸、走动、评估是否能保持理性。如否，停止 session。',
      },
      {
        id: 'mental-tilt-q4',
        question: 'Tilt 最致命的认知错误是？',
        options: ['承认自己 tilt', '以为"我能控制自己"', '离开桌子', '记录情绪'],
        correctIndex: 1,
        explanation: 'Tilt 是潜意识接管，你感觉理性但实际已失控。以为"我能控制自己"是最致命错误，应设置硬性止损。',
      },
    ],
  },

  // ===== local-mental-stop-loss =====
  {
    id: 'local-mental-stop-loss',
    level: 7,
    order: 20,
    title: '止损纪律',
    subtitle: '用硬性规则保护资金与心态',
    duration: '8 min',
    content: [
      { type: 'heading', content: '为什么需要止损？' },
      { type: 'text', content: '扑克是高 variance 游戏，即使技术占优，短期内也可能大幅亏损。止损是保护资金和心态的硬性规则：达到亏损阈值时必须停止，不论"感觉"如何。\n\n国内低级别玩家最常见的问题：没有止损，亏损后继续打"追回"，结果小亏变大亏、大亏变破产。\n\n关键认知：止损不是"承认失败"，而是"保护未来的自己"。今天的亏损已经发生，止损是防止明天更大的亏损。' },
      { type: 'key-point', content: '止损的本质：用预设规则替代情绪决策。情绪状态下永远觉得"再来一把就回本"，硬性止损能强制切断这个循环。' },
      { type: 'heading', content: '止损规则设置' },
      { type: 'text', content: '推荐的止损规则：\n\n按 buy-in 计：\n• 单 session 止损：3 个 buy-in（如 NL100 止损 300BB）\n• 单日止损：5 个 buy-in（500BB）\n• 单周止损：10 个 buy-in（1000BB）\n\n按情绪状态计：\n• 连续输 2 个 buy-in：暂停 15 分钟，评估情绪\n• 连续输 3 个 buy-in：强制停止当日 session\n• 感觉 tilt：立即停止，不论输赢\n\n按时间计：\n• 单 session 不超过 2 小时（疲劳止损）\n• 单日不超过 6 小时（累计疲劳止损）\n• 连续 3 天亏损：休息 1 天（深度止损）' },
      { type: 'example', content: '示例：NL50 玩家的止损规则\n\n单 session 止损：3 × 50BB = 150BB\n单日止损：5 × 50BB = 250BB\n单周止损：10 × 50BB = 500BB\n\n场景：周一 session 输 150BB（触发单 session 止损）\n• 正确应对：立即停止周一 session\n• 错误应对：换桌继续打"换换运气"\n\n场景：周一到周三累计输 400BB\n• 评估：接近单周止损（500BB），情绪如何？\n• 若情绪稳定：周四可继续，但收紧止损到单 session 100BB\n• 若情绪不稳：周四、周五休息，下周重新开始\n\n场景：单 session 输 100BB 但感觉 tilt\n• 正确应对：立即停止（情绪止损优先于金额止损）\n• 错误应对："还没到 150BB，继续打"' },
      { type: 'heading', content: '止损执行的心理障碍' },
      { type: 'text', content: '执行止损时的常见心理障碍：\n\n1. "再来一把就回本"\n• 真相：每把独立，亏损已发生，"再来一把"期望值为负（你已 tilt）\n• 应对：提前设置自动停止（如定时器、金额报警）\n\n2. "今天运气差，明天会好"\n• 真相：运气不"欠"你，明天可能继续差\n• 应对：基于长期 EV 决策，而非短期运气预期\n\n3. "我技术比对手强，应该赢"\n• 真相：技术优势需要长期才能体现，短期 variance 主导\n• 应对：接受短期亏损是技术盈利的代价\n\n4. "止损就是认输"\n• 真相：止损是保护资金和心态，是职业素养\n• 应对：将止损视为"成本控制"，而非"认输"' },
      { type: 'highlight', content: '止损最致命的错误：在触发止损后"破例"继续打。一旦破例，止损规则就失去了意义，下次更难执行。坚持"零破例"原则。' },
      { type: 'pro-tip', content: '使用 APP 或定时器辅助止损：设置单 session 2 小时定时器，到点强制停止。使用资金管理表格记录每日盈亏，达到单周止损阈值时强制休息。' },
    ],
    quiz: [
      {
        id: 'mental-stop-loss-q1',
        question: '单 session 推荐止损额为？',
        options: ['1 个 buy-in', '3 个 buy-in', '10 个 buy-in', '不限'],
        correctIndex: 1,
        explanation: '推荐单 session 止损 3 个 buy-in，单日 5 个 buy-in，单周 10 个 buy-in。这是平衡保护与盈利空间的规则。',
      },
      {
        id: 'mental-stop-loss-q2',
        question: '止损的本质是？',
        options: ['承认失败', '用预设规则替代情绪决策', '保证盈利', '报复对手'],
        correctIndex: 1,
        explanation: '止损用预设规则替代情绪决策，情绪状态下永远觉得"再来一把就回本"，硬性止损能强制切断这个循环。',
      },
      {
        id: 'mental-stop-loss-q3',
        question: '触发止损后"再来一把就回本"的心理是？',
        options: ['正确的坚持', '典型的 tilt 心理', '理性计算', 'GTO 策略'],
        correctIndex: 1,
        explanation: '"再来一把就回本"是典型的 tilt 心理——每把独立，亏损已发生，且你已 tilt 期望值为负。',
      },
      {
        id: 'mental-stop-loss-q4',
        question: '止损执行的最致命错误是？',
        options: ['严格执行', '提前设置', '触发后"破例"继续打', '记录盈亏'],
        correctIndex: 2,
        explanation: '触发止损后"破例"继续打是最致命错误——一旦破例，止损规则失去意义，下次更难执行。坚持"零破例"原则。',
      },
    ],
  },

  // ===== local-mental-session-management =====
  {
    id: 'local-mental-session-management',
    level: 7,
    order: 21,
    title: 'Session 管理与长期盈利',
    subtitle: '从单次盈利到长期稳定收益',
    duration: '9 min',
    content: [
      { type: 'heading', content: 'Session 管理的核心原则' },
      { type: 'text', content: '单次 session 的盈亏不重要，长期累积的 EV 才是盈利的根本。Session 管理的目标：保持决策质量、控制疲劳、积累长期优势。\n\n国内低级别玩家最常见的问题：单 session 过长（4-6 小时甚至通宵）、疲劳决策、情绪化加注。这些都侵蚀长期 EV。\n\n关键认知：扑克不是"打得多就赢得多"，而是"决策质量 × 手数 = 长期盈利"。疲劳和情绪会显著降低决策质量。' },
      { type: 'key-point', content: 'Session 管理 = 决策质量保护。最优 session 长度因人而异，通常 90-120 分钟后决策质量明显下降，应定时休息。' },
      { type: 'heading', content: 'Session 计划与执行' },
      { type: 'text', content: '推荐的 session 流程：\n\nSession 前（10 分钟）：\n• 评估当前情绪与体力状态（1-5 分，<3 分不打的）\n• 设定本次 session 目标（手数 / 时长 / 止损）\n• 确认资金充足（不低于 30 个 buy-in）\n• 选择好桌子（HUD 数据、桌选）\n\nSession 中：\n• 每 60 分钟休息 5 分钟（站起、走动、喝水）\n• 每 90 分钟深休息 10 分钟（呼吸、洗手间、小吃）\n• 单 session 不超过 2 小时\n• 触发止损立即停止\n\nSession 后（5 分钟）：\n• 记录本次 session 盈亏、手数、时长\n• 标记情绪状态（1-5 分）\n• 记录关键牌局（特别是错误决策）\n• 评估是否还能继续（连续 session 间隔至少 1 小时）' },
      { type: 'example', content: '示例：职业玩家的日常 session 安排\n\n上午 10:00-12:00（2 小时）\n• 主 session，精力最充沛\n• 目标：500 手，专注决策\n• 12:00-13:00 午休\n\n下午 14:00-16:00（2 小时）\n• 第二 session\n• 目标：500 手\n• 16:00-19:00 长休（运动、晚餐）\n\n晚上 20:00-22:00（2 小时）\n• 第三 session（可选）\n• 评估前两 session 状态，若疲劳则不打\n\n单日总计：6 小时 / 1500 手\n• 每周休息 1-2 天（防疲劳累积）\n• 每月复盘 1 次（识别模式、调整策略）\n\n对比业余玩家常见错误：\n• 通宵打 8-10 小时（决策质量骤降）\n• 没有固定时间（情绪化启动）\n• 不复盘（重复犯错）' },
      { type: 'heading', content: '桌选与对手筛选' },
      { type: 'text', content: 'Session 盈利的 80% 来自桌选：\n\n好桌子的标志：\n• 高 Players/Flop%（>40% 说明松）\n• 平均底池大（>80BB）\n• 有 1-2 个明显弱玩家（跟注站/Maniac）\n• 自己有位置优势（坐在弱玩家左边）\n\n坏桌子的标志：\n• 全是 REG（VPIP < 25%）\n• 平均底池小（<40BB）\n• 没有弱玩家\n• 自己无位置优势\n\n原则：宁可不打，也不打坏桌子。等待好桌子的时间比在坏桌子上挣扎更划算。' },
      { type: 'heading', content: '长期盈利的心态' },
      { type: 'text', content: '扑克长期盈利的核心心态：\n\n1. 关注决策而非结果\n• 好决策可能输（variance），坏决策可能赢（运气）\n• 长期看决策质量决定盈亏\n• 复盘时问"我的决策对吗"，而非"我赢了吗"\n\n2. 接受 variance\n• 即使 80% 胜率，也有 20% 概率输\n• 连续 10 手输给运气是正常的\n• 不要让 variance 影响决策\n\n3. 持续学习\n• 每周复盘 5-10 个关键牌局\n• 学习新策略（GTO/剥削/数学）\n• 与强玩家讨论\n\n4. 资金管理\n• 保持 30-50 个 buy-in\n• 输到 20 个 buy-in 以下立即降级\n• 不要用生活费打牌' },
      { type: 'highlight', content: '长期盈利最致命的错误：追求"短期暴利"而非"长期稳定"。今天的 5 个 buy-in 亏损不重要，重要的是你今天做了多少正确决策。长期看，正确决策会带来稳定盈利。' },
      { type: 'pro-tip', content: '使用复盘工具（如 Hand History 记录、Tracker 软件）每周复盘 5-10 个关键牌局。重点关注"错误决策"而非"输掉的牌"——前者是改进机会，后者只是 variance。' },
    ],
    quiz: [
      {
        id: 'mental-session-q1',
        question: 'Session 管理的核心原则是？',
        options: ['打得越多越好', '保护决策质量', '追求单次大赢', '通宵打牌'],
        correctIndex: 1,
        explanation: 'Session 管理的核心是保护决策质量。决策质量 × 手数 = 长期盈利，疲劳和情绪会显著降低决策质量。',
      },
      {
        id: 'mental-session-q2',
        question: '单 session 推荐最长不超过？',
        options: ['1 小时', '2 小时', '4 小时', '8 小时'],
        correctIndex: 1,
        explanation: '单 session 推荐不超过 2 小时。通常 90-120 分钟后决策质量明显下降，应定时休息。',
      },
      {
        id: 'mental-session-q3',
        question: 'Session 盈利的 80% 来自？',
        options: ['技术', '运气', '桌选', '资金'],
        correctIndex: 2,
        explanation: 'Session 盈利的 80% 来自桌选——选择有弱玩家的好桌子，比技术精进更重要。宁可不打，也不打坏桌子。',
      },
      {
        id: 'mental-session-q4',
        question: '长期盈利最致命的错误是？',
        options: ['严格执行止损', '追求短期暴利而非长期稳定', '每周复盘', '保持 30+ buy-in'],
        correctIndex: 1,
        explanation: '追求"短期暴利"是最致命错误。今天的 5 个 buy-in 亏损不重要，重要的是做了多少正确决策。长期看正确决策会带来稳定盈利。',
      },
    ],
  },
];
