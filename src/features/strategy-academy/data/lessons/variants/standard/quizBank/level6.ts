import type { QuizQuestion } from '../../../../../types';

/**
 * L6 题库（由 content 轨迁入/扩充；level 文件 quiz 置空后本文件为唯一题源）。
 * q1-q5 为原 standardLevel6.ts 内联题逐字迁移（id / options / correctIndex / explanation 不变）；
 * q6-q10 为按课程目标补充的新题。
 */
export const LEVEL_6_QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'l6-icm': [
    {
      id: 'l6-icm-q1',
      question: 'ICM 的核心概念是什么？',
      options: ['筹码价值是线性的', '锦标赛中 Chip EV = $EV', '锦标赛中筹码价值不等于钱', 'ICM 只适用于现金局'],
      correctIndex: 2,
      explanation:
        'ICM 的核心是锦标赛中筹码的真实价值（$EV）与筹码数量（Chip EV）不相等，因为奖金结构的存在。',
    },
    {
      id: 'l6-icm-q2',
      question: '在泡沫期，中筹码玩家应该？',
      options: ['与大筹码对抗', '避免与大筹码冲突', '用任何牌 call all-in', '立即全押'],
      correctIndex: 1,
      explanation:
        '中筹码在泡沫期应该避免与大筹码对抗，因为被淘汰的损失（失去奖金）远大于翻倍筹码的收益。',
    },
    {
      id: 'l6-icm-q3',
      question: 'Bubble Factor 越高，你的 call 范围应该？',
      options: ['越宽', '越紧', '不变', '只 call 超强牌'],
      correctIndex: 1,
      explanation:
        'Bubble Factor 越高，ICM 压力越大，你需要更强的牌才能 call all-in，因为被淘汰的代价更高。',
    },
    {
      id: 'l6-icm-q4',
      question: '大筹码在泡沫期可以？',
      options: ['用更紧的范围 push', '用更宽的范围 push 短筹码', '只打超强牌', '避免任何冲突'],
      correctIndex: 1,
      explanation:
        '大筹码可以利用 ICM 压力，用更宽的范围 push 短筹码，因为短筹码需要用更强的牌才能 call。',
    },
    {
      id: 'l6-icm-q5',
      question: 'ICM压力最大的阶段是？',
      options: ['比赛开始', '泡沫期', '决赛桌后', '盲注期'],
      correctIndex: 1,
      explanation: '泡沫期是ICM压力最大的阶段，因为再淘汰1-3人进入奖金圈。',
    },
    {
      id: 'l6-icm-q6',
      question: '4 人 SNG 筹码分布为 40/30/20/10（共 100），按本课的简化算法，持 40 筹码的玩家夺冠概率约为？',
      options: ['10%', '25%', '40%', '60%'],
      correctIndex: 2,
      explanation: '简化算法下夺冠概率约等于筹码占比：40 ÷ 100 = 40%，这是本课算例的第一步。',
    },
    {
      id: 'l6-icm-q7',
      question: '现金局面对 50% 池下注，跟注需要 25% 胜率；若泡沫期 Bubble Factor 为 1.5，实际所需胜率约为？',
      options: ['25%', '33%', '37.5%', '50%'],
      correctIndex: 2,
      explanation:
        '所需胜率 = 25% × 1.5 = 37.5%。Bubble Factor 的作用就是把现金局口径的跟注门槛按 ICM 压力成倍放大。',
    },
    {
      id: 'l6-icm-q8',
      question: 'Bubble Factor = 1 意味着？',
      options: ['ICM 压力最大', '无 ICM 压力，与现金局口径一致', '你是筹码最少的玩家', '这一手必须弃牌'],
      correctIndex: 1,
      explanation:
        'BF = 跟注所需 equity ÷ 现金局所需 equity；BF = 1 表示没有 ICM 放大，等价于现金局；锦标赛泡沫期 BF 可达 1.5-2.0。',
    },
    {
      id: 'l6-icm-q9',
      question: '按 ICM 的核心结论，持有 10% 筹码的短筹码玩家，其 $EV 通常？',
      options: ['低于筹码占比', '高于筹码占比', '正好等于筹码占比', '必然为零'],
      correctIndex: 1,
      explanation:
        '筹码边际价值递减带来两个方向：大筹码的 $EV 低于筹码占比，短筹码的 $EV 高于筹码占比（生存价值），本课示例为 10% 筹码约 15% 的 $EV。',
    },
    {
      id: 'l6-icm-q10',
      question: '某玩家在 4 人 SNG 中夺冠概率 40%、亚军 32%、第三 20%（奖金 50/30/20 美元），他的 $EV 约为？',
      options: ['$20.0', '$28.0', '$33.6', '$40.0'],
      correctIndex: 2,
      explanation:
        '$EV = 0.4×50 + 0.32×30 + 0.2×20 = 20 + 9.6 + 4 = $33.6，即本课「ICM 计算示例」第三步的结果。',
    },
  ],
  'l6-pushfold': [
    {
      id: 'l6-pushfold-q1',
      question: '通常何时应该进入 Push/Fold 模式？',
      options: ['< 30BB', '< 20BB', '< 15BB', '< 5BB'],
      correctIndex: 2,
      explanation: '当筹码降到 15BB 以下时，应该考虑进入 Push/Fold 模式。< 10BB 时必须使用。',
    },
    {
      id: 'l6-pushfold-q2',
      question: '10BB 时 BTN 的 Nash push 范围大约是？',
      options: ['10-15%', '20-25%', '40-45%', '70-80%'],
      correctIndex: 2,
      explanation:
        '10BB 时 BTN 的 Nash push 范围约 40-45%，包括任何 Ax、任何对子、大部分 suited 连牌。',
    },
    {
      id: 'l6-pushfold-q3',
      question: '泡沫期你的 push 范围应该？',
      options: ['比 Nash 更紧', '与 Nash 相同', '比 Nash 更宽', '只 push 超强牌'],
      correctIndex: 2,
      explanation: '泡沫期 ICM 压力让对手 call 更紧，所以你可以用比 Nash 更宽的范围 push。',
    },
    {
      id: 'l6-pushfold-q4',
      question: '面对 UTG 的 10BB push，BB 的 call 范围应该？',
      options: ['非常宽（50%+）', '中等（30-35%）', '很紧（15-20%）', '只 call AA/KK'],
      correctIndex: 2,
      explanation: 'UTG 的 push 范围很紧（通常是强牌），所以 BB 应该用很紧的范围 call（15-20%）。',
    },
    {
      id: 'l6-pushfold-q5',
      question: 'SB 10BB时的push范围约？',
      options: ['20-25%', '30-35%', '50-55%', '80%+'],
      correctIndex: 2,
      explanation: 'SB 10BB时可以push约50-55%的范围，因为只剩BB。',
    },
    {
      id: 'l6-pushfold-q6',
      question: '15BB 时 BTN 的 push 范围大约是？',
      options: ['25-30%', '40-45%', '50-55%', '70% 以上'],
      correctIndex: 0,
      explanation:
        '本课口径：15BB 时 BTN push 收窄到约 25-30%（10BB 时才是 40-45%），因为 15BB 的筹码仍保有翻后价值。',
    },
    {
      id: 'l6-pushfold-q7',
      question: '面对 BTN 的 10BB push，BB 的 call 范围大约是？',
      options: ['15-20%', '30-35%', '50-55%', '70% 以上'],
      correctIndex: 1,
      explanation:
        'BTN 的 push 范围很宽，因此 BB 可以用约 30-35% 的范围跟注；面对 UTG 的 10BB push 才需要收紧到 15-20%。',
    },
    {
      id: 'l6-pushfold-q8',
      question: 'SB 全下 10BB（盲注 SB 0.5 / BB 1，无前注），BB 已投入 1BB、还需跟 9BB，跟注保本所需胜率是？',
      options: ['33%', '40%', '45%', '50%'],
      correctIndex: 2,
      explanation:
        'SB 全下后底池 = 10 + 1 = 11BB，BB 还需跟 9BB，跟注后总底池 20BB ⇒ 所需胜率 = 9 ÷ 20 = 45%。',
    },
    {
      id: 'l6-pushfold-q9',
      question: '筹码低于 8BB 时，本课的建议是？',
      options: ['只在前位 push', '几乎任何位置都应该寻找 push 机会', '等到 5BB 再 push', '只打 AA/KK'],
      correctIndex: 1,
      explanation:
        '本课阈值：< 15BB 开始考虑、< 10BB 必须使用 push/fold、< 8BB 几乎任何位置都应寻找 push 机会。等待只会让盲注继续蚕食筹码。',
    },
    {
      id: 'l6-pushfold-q10',
      question: 'Push/Fold 在现金桌与锦标赛中的差异是？',
      options: ['锦标赛的 ICM 压力让 push 范围可以更宽', '现金桌的 push 范围总是更宽', '两者完全相同', '锦标赛只能 min-raise'],
      correctIndex: 0,
      explanation:
        '锦标赛的 ICM 压力让对手 call 更紧，因此 push 范围可以比 Nash 更宽；现金桌没有 ICM，多数情况可以用 min-raise 保留翻后可玩性。',
    },
  ],
  'l6-bubble': [
    {
      id: 'l6-bubble-q1',
      question: '泡沫期是指？',
      options: ['比赛刚开始', '距离奖金圈 1-3 人淘汰', '决赛桌', '比赛中间阶段'],
      correctIndex: 1,
      explanation: '泡沫期是指距离奖金圈只剩 1-3 人淘汰的阶段，是 ICM 压力最大的时候。',
    },
    {
      id: 'l6-bubble-q2',
      question: '大筹码在泡沫期应该？',
      options: ['打得很紧', '激进施压，用宽范围 open/3-bet', '只打超强牌', '避免任何冲突'],
      correctIndex: 1,
      explanation: '大筹码应该利用 ICM 压力激进施压，用宽范围 open/3-bet，尤其是针对中筹码。',
    },
    {
      id: 'l6-bubble-q3',
      question: '中筹码在泡沫期应该？',
      options: ['与大筹码对抗', '避免与大筹码冲突，压制短筹码', '用任何牌 call', '立即全押'],
      correctIndex: 1,
      explanation: '中筹码应该避免与大筹码冲突（被淘汰的损失太大），但可以压制短筹码。',
    },
    {
      id: 'l6-bubble-q4',
      question: '短筹码在泡沫期应该？',
      options: ['被动等待', '主动寻找push机会（10-15BB时）', '只打AA', '弃牌所有手牌'],
      correctIndex: 1,
      explanation: '短筹码应在10-15BB时主动push，等到5BB就没有弃牌率了。',
    },
    {
      id: 'l6-bubble-q5',
      question: '泡沫爆裂后ICM压力？',
      options: ['增大', '骤降', '不变', '消失'],
      correctIndex: 1,
      explanation: '泡沫爆裂后所有人都已min-cash，ICM压力骤降。',
    },
    {
      id: 'l6-bubble-q6',
      question: '100 人参赛、前 15 名有奖金，按本课算例泡沫期是剩下多少人时？',
      options: ['15-16 人', '16-18 人', '20-25 人', '30-40 人'],
      correctIndex: 1,
      explanation:
        '本课算例：100 人参赛、前 15 名有奖金，只剩 16-18 人（距奖金圈 1-3 人淘汰）时就是泡沫期。',
    },
    {
      id: 'l6-bubble-q7',
      question: '泡沫期大筹码施压时，优先攻击的目标是？',
      options: ['短筹码', '中筹码', '同样是大筹码的对手', '刚刚翻倍的对手'],
      correctIndex: 1,
      explanation:
        '中筹码最怕被淘汰（失去即将到手的奖金），对大筹码进攻的弃牌率最高；短筹码已经没多少可失去，反而可能拼命。',
    },
    {
      id: 'l6-bubble-q8',
      question: '泡沫期中筹码除了避开大筹码，还应该？',
      options: ['对短筹码用宽范围 open/3-bet', '对所有对手一律弃牌', '频繁对短筹码 bluff 到底', '只在大盲位行动'],
      correctIndex: 0,
      explanation:
        '中筹码的生存策略是两极：对大筹码收紧、对短筹码放宽——短筹码必须用很紧的范围跟注，中筹码可以借他们的 ICM 恐惧施压。',
    },
    {
      id: 'l6-bubble-q9',
      question: '短筹码为什么不应该等到 5BB 以下再 push？',
      options: ['5BB 时手牌质量必然更差', '筹码太浅已没有弃牌率，跟注的赔率让对手无法弃牌', '5BB 时不能再全下', '盲注会在 5BB 时上涨'],
      correctIndex: 1,
      explanation:
        'Push 的价值来自弃牌率；筹码越浅，对手跟注的底池赔率越好，弃牌率随之消失。本课建议在 10-15BB 还有弃牌率时主动 push。',
    },
    {
      id: 'l6-bubble-q10',
      question: '泡沫爆裂（有人进入奖金圈）后，打法应该如何调整？',
      options: ['继续维持泡沫期的极紧范围', '回归更接近现金局的打法，但仍注意 payout 跳跃', '立刻用任何两张牌全下', '放弃所有剥削调整'],
      correctIndex: 1,
      explanation:
        '进圈后所有人都已 min-cash，ICM 压力骤降、范围整体放宽，打法回归更接近现金局；但下一档 payout 跳跃仍会留下一定的 ICM 效应。',
    },
  ],
  'l6-finaltable': [
    {
      id: 'l6-finaltable-q1',
      question: '决赛桌的 payout 跳跃意味着？',
      options: ['ICM 压力消失', '每次淘汰都有显著奖金变化', '所有人都打得很松', '短筹码应该被动等待'],
      correctIndex: 1,
      explanation: '决赛桌 payout 跳跃大，每次淘汰都有显著的奖金变化，所以 ICM 压力仍然很大。',
    },
    {
      id: 'l6-finaltable-q2',
      question: 'BTN 的偷盲范围通常处于哪一档？',
      options: ['只开强牌的一档', '中等偏紧的一档', '开池最宽的一档（约三成半）', '几乎任意两张牌'],
      correctIndex: 2,
      explanation:
        'BTN 偷盲属于开池最宽的一档（约三成半），包括任何 Ax、任何对子、大部分 suited 牌；精确构成见范围训练模块与 GTO 策略表。',
    },
    {
      id: 'l6-finaltable-q3',
      question: 'Re-steal 的最佳筹码量是？',
      options: ['5-10BB', '15-25BB', '40-50BB', '100BB+'],
      correctIndex: 1,
      explanation: 'Re-steal 的最佳筹码量是 15-25BB：太少没有弃牌率，太多浪费筹码。',
    },
    {
      id: 'l6-finaltable-q4',
      question: 'Heads-Up中SB(BTN)的open范围约？',
      options: ['30-40%', '50-60%', '70-80%', '90%+'],
      correctIndex: 2,
      explanation: 'Heads-Up中SB(BTN)open约70-80%的范围，范围极宽。',
    },
    {
      id: 'l6-finaltable-q5',
      question: '偷盲的最佳大小通常是？',
      options: ['3BB', 'Min-raise(2-2.2x)', '5BB', 'Half pot'],
      correctIndex: 1,
      explanation: 'Min-raise给对手最差赔率，减少自己风险，是最常用的偷盲大小。',
    },
    {
      id: 'l6-finaltable-q6',
      question: 'Heads-Up 阶段 BB 的防守范围大约是？',
      options: ['30-40%', '50-55%', '60-70%', '90% 以上'],
      correctIndex: 2,
      explanation:
        '本课口径：HU 阶段 SB（BTN）open 70-80%，BB defend 60-70%。范围之所以极宽，是因为每个盲注相对于有效筹码的价值被放大。',
    },
    {
      id: 'l6-finaltable-q7',
      question: '以下哪一组条件最支持你偷盲？',
      options: ['盲注相对筹码大、对手 fold to steal 高、你在 BTN/CO 有位置', '盲注相对筹码小、对手爱跟注、你在 UTG', '你筹码最短、对手是大筹码', '对手刚被 bad beat 情绪不稳'],
      correctIndex: 0,
      explanation:
        '偷盲三条件：盲注相对筹码够大（值得抢）、对手偏紧（fold to steal 高）、你有位置（BTN/CO）。缺任何一条，偷盲的收益都会下降。',
    },
    {
      id: 'l6-finaltable-q8',
      question: 'Re-steal 时的手牌选择原则是？',
      options: ['优先 Ax 阻断牌与同花可玩性，避免 KJ/QT 这类被压制牌', '只用 AA/KK', '只用非同花高张', '任何两张牌都可以'],
      correctIndex: 0,
      explanation:
        'Re-steal 同时需要弃牌率与被跟注后的可玩性：Ax 阻断对手的 Ax 组合，同花牌有翻后可玩性；KJ/QT 这类容易被压制的牌应避开。',
    },
    {
      id: 'l6-finaltable-q9',
      question: '本课认为对手 open 频率高于多少时适合做 re-steal？',
      options: ['20%', '30%', '40%', '60%'],
      correctIndex: 2,
      explanation:
        '本课条件之一是对手偷盲频率高（open > 40%），同时你需要 15-25BB 的筹码量与 Ax/Kx 这类阻断牌。',
    },
    {
      id: 'l6-finaltable-q10',
      question: '决赛桌上作为中筹码，本课建议的目标是？',
      options: ['避开大筹码冲突、压制短筹码，生存并等待更好的时机', '立刻与大筹码全下对抗抢筹码', '只打 AA/KK 直到进入单挑', '主动提出分奖'],
      correctIndex: 0,
      explanation:
        '中筹码的目标是生存等待：避免与大筹码冲突（淘汰损失远大于翻倍收益），同时压制短筹码积累筹码；只有大筹码才以争第 1 为目标。',
    },
  ],
  'l6-bounty': [
    {
      id: 'l6-bounty-q1',
      question: 'PKO 中淘汰对手可获得其多少赏金？',
      options: ['全部', '一半', '四分之一', '没有'],
      correctIndex: 1,
      explanation: 'PKO中淘汰对手获得其一半赏金，另一半加到自己头上。',
    },
    {
      id: 'l6-bounty-q2',
      question: '覆盖短筹码时应该怎么调整？',
      options: ['更保守', '大幅放宽范围', '和普通赛一样', '只打AA/KK'],
      correctIndex: 1,
      explanation: '覆盖短筹码时赏金价值高，应大幅放宽跟注/加注范围。',
    },
    {
      id: 'l6-bounty-q3',
      question: 'PKO中你的赏金很大时，对手会？',
      options: ['更保守', '更激进地向你加注', '弃牌更多', '没有变化'],
      correctIndex: 1,
      explanation: '你的赏金大时，对手为了获得赏金会更激进地向你加注。',
    },
    {
      id: 'l6-bounty-q4',
      question: '被覆盖时应该怎么打？',
      options: ['更保守', '正常打法，不因3-bet开心', '全下所有手牌', '弃牌所有手牌'],
      correctIndex: 1,
      explanation: '被覆盖时正常打法，不要因为对手的激进而情绪化。',
    },
    {
      id: 'l6-bounty-q5',
      question: 'PKO中最常见的错误是？',
      options: ['打得太紧', '忽视赏金价值或过度追求赏金', '总是全下', '从不弃牌'],
      correctIndex: 1,
      explanation: '最常见的错误是完全忽视赏金价值（太紧）或过度追求赏金（用垃圾牌全下）。',
    },
    {
      id: 'l6-bounty-q6',
      question: '对手赏金 $20、他持有 5000 筹码、全场共 50000 筹码；按本课的简化算法，淘汰他能带来的赏金 $EV 是？',
      options: ['$0.2', '$2', '$10', '$20'],
      correctIndex: 1,
      explanation:
        '淘汰概率 ≈ 筹码占比 5000/50000 = 10%，赏金贡献 = 0.1 × $20 = $2。这正是本课公式块的算例。',
    },
    {
      id: 'l6-bounty-q7',
      question: '计算「赏金调整后的有效赔率」时，分子应该加上什么？',
      options: ['对手的完整赏金', '对手赏金的一半', '你自己的赏金', '桌上所有赏金之和'],
      correctIndex: 1,
      explanation:
        '有效赔率 =（底池 + 对手赏金/2）: 跟注金额。PKO 中淘汰对手只拿到其一半赏金，因此只有一半能计入你这一手的收益。',
    },
    {
      id: 'l6-bounty-q8',
      question: '为什么面对头上有大赏金的对手，跟注范围反而应该收紧？',
      options: ['大赏金对手筹码通常更多，淘汰概率低，赏金贡献的 $EV 有限', '大赏金对手的手牌质量更好', '大赏金会让底池赔率变差', '规则禁止追大赏金'],
      correctIndex: 0,
      explanation:
        '本课的反直觉点：赏金 $EV = 赏金 × 淘汰概率，而大赏金玩家往往筹码多、淘汰概率低，盲目追赏金会做出 -EV 的跟注。',
    },
    {
      id: 'l6-bounty-q9',
      question: 'PKO 中你淘汰对手后，他赏金的另一半会？',
      options: ['归赛事方', '加到你自己的头上', '平均分给全桌', '退回给被淘汰者'],
      correctIndex: 1,
      explanation:
        'PKO 的 Progressive 机制：淘汰者拿其赏金的一半，另一半加到自己头上——所以你的赏金越大，越会被对手主动攻击。',
    },
    {
      id: 'l6-bounty-q10',
      question: '本课给出的「赏金使跟注范围放宽」幅度约为？',
      options: ['1-2%', '5-10%', '20-30%', '50% 以上'],
      correctIndex: 1,
      explanation:
        '本课口径：赏金贡献让跟注范围可以放宽约 5-10%，具体取决于赏金大小与筹码分布，而不是无上限地追赏金。',
    },
  ],
};
