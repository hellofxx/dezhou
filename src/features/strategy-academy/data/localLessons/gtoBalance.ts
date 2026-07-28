import type { Lesson } from '../../types';

/**
 * P2-1.6 模块 5：GTO 与剥削平衡（2 课）
 *
 * 国内低级别玩家常纠结"该用 GTO 还是剥削"。
 * 本模块讲解何时坚守 GTO、何时偏离以剥削对手。
 */
export const GTO_BALANCE_LESSONS: Lesson[] = [
  // ===== local-gto-vs-exploit =====
  {
    id: 'local-gto-vs-exploit',
    level: 7,
    order: 17,
    title: 'GTO 与剥削：抉择框架',
    subtitle: '何时坚守 GTO，何时转向剥削',
    duration: '10 min',
    content: [
      { type: 'highlight', content: '💡 此内容与 Level 4 的「GTO基础」(l4-gto-basics) 和「频率平衡」(l4-frequency-balance) 相关联，建议先完成基础课程。本模块将 GTO 思维应用于本土低级别场景，侧重“何时偏离”的实战决策。' },
      { type: 'heading', content: 'GTO 与剥削的本质' },
      { type: 'text', content: 'GTO（Game Theory Optimal）：博弈论最优策略，目标是"不被剥削"。当你不知道对手倾向时，GTO 是最佳默认策略。\n\n剥削（Exploitative）：针对对手特定弱点调整策略，目标是"最大化 EV"。当你知道对手倾向时，剥削比 GTO 更赚钱。\n\n关键认知：GTO 不是"最强策略"，而是"不会被任何策略打败的策略"。面对有弱点的对手，纯 GTO 反而 EV 低于针对性剥削。' },
      { type: 'key-point', content: '决策框架：对手数据充足 + 弱点明显 → 剥削；对手数据不足或水平高 → GTO。两者不是对立，而是动态切换。' },
      { type: 'heading', content: '何时使用 GTO' },
      { type: 'text', content: '以下场景应坚守 GTO：\n\n• 对手未知：没有数据支撑剥削时，GTO 是最安全的默认\n• 对手是强 REG：高水平对手剥削空间小，反被剥削风险高\n• 多人底池：剥削单个对手已复杂，多人底池 GTO 更稳健\n• 线上中高级别（NL200+）：玩家池接近 GTO，剥削空间收窄\n• 锦标赛泡沫期：ICM 压力下 GTO + ICM 调整最安全\n\nGTO 优势：稳定、不易被反剥削、长期 EV 可预测。' },
      { type: 'example', content: '示例：未知对手首次交手\n你 BTN 持有 A♠5♠，开牌 2.5BB\n未知对手 BB 3-Bet 到 10BB\n\nGTO 应对：混合策略——70% 弃牌 / 25% 跟注 / 5% 4-Bet bluff\n• A5s 是 4-Bet bluff 的标准牌（A blocker + 同花潜力）\n• 但对未知对手不必立即使用混合策略\n• 实战可简化为：弃牌（保守）或 4-Bet bluff（试探对手反应）\n\n错误做法：基于"感觉"决定，没有策略框架。先观察对手反应，积累数据后再剥削。' },
      { type: 'heading', content: '何时使用剥削' },
      { type: 'text', content: '以下场景应转向剥削：\n\n• 对手数据充足（>100 手）：VPIP/PFR/AF/Fold to C-Bet 等指标可靠\n• 对手有明显倾向：如 Fold to C-Bet 70%+（应增加 C-Bet bluff）\n• 线上低级别（NL2-NL50）：玩家池普遍偏离 GTO，剥削空间大\n• 线下俱乐部：玩家类型鲜明（跟注站/Maniac 多），剥削收益高\n• 单挑场景：1v1 时剥削单一对手最直接\n\n剥削优势：EV 上限高于 GTO，能榨取对手弱点。' },
      { type: 'highlight', content: 'GTO vs 剥削的核心权衡：GTO 下限高（不会输得太惨），上限低（赢不到太多）；剥削下限低（可能被反剥削），上限高（能赢到很多）。数据越少越偏向 GTO，数据越多越偏向剥削。' },
      { type: 'pro-tip', content: '实战推荐：80% GTO + 20% 剥削。用 GTO 作为基础框架保护自己，在明确有利可图时进行小幅剥削调整。这能兼顾稳定性和收益上限。' },
    ],
    quiz: [
      {
        id: 'local-gto-vs-exploit-q1',
        question: 'GTO 策略的核心目标是？',
        options: ['最大化 EV', '不被剥削', '每手都赢', '诈唬对手'],
        correctIndex: 1,
        explanation: 'GTO 的目标是"不被任何策略剥削"，是防御性最优。面对有弱点的对手，针对性剥削 EV 更高。',
      },
      {
        id: 'local-gto-vs-exploit-q2',
        question: '以下哪种场景应优先使用 GTO？',
        options: ['对手是已知的跟注站', '对手未知或强 REG', '线上 NL10', '线下俱乐部'],
        correctIndex: 1,
        explanation: '对手未知（无数据支撑剥削）或强 REG（剥削空间小）时应使用 GTO 作为默认策略。',
      },
      {
        id: 'local-gto-vs-exploit-q3',
        question: '面对 Fold to C-Bet 70%+ 的对手，应如何调整？',
        options: ['减少 C-Bet', '增加 C-Bet 频率（剥削他弃牌多）', '保持 GTO', '只 value bet'],
        correctIndex: 1,
        explanation: '对手 Fold to C-Bet 70%+，说明他弃牌过多，应增加 C-Bet 频率（含诈唬）来剥削他的过度弃牌。',
      },
      {
        id: 'local-gto-vs-exploit-q4',
        question: '实战推荐的 GTO 与剥削比例约为？',
        options: ['100% GTO', '50% GTO + 50% 剥削', '80% GTO + 20% 剥削', '100% 剥削'],
        correctIndex: 2,
        explanation: '推荐 80% GTO + 20% 剥削，用 GTO 作为基础保护自己，在明确有利时进行小幅剥削调整。',
      },
    ],
  },

  // ===== local-when-to-deviate =====
  {
    id: 'local-when-to-deviate',
    level: 7,
    order: 18,
    title: '何时偏离 GTO',
    subtitle: '基于对手倾向的具体偏离策略',
    duration: '9 min',
    content: [
      { type: 'heading', content: '偏离 GTO 的判断标准' },
      { type: 'text', content: '偏离 GTO 不是"凭感觉"，而是基于对手的统计偏差。判断标准：\n\n1. 数据充足：至少 50 手以上的样本（100+ 更佳）\n2. 偏差显著：对手某项统计偏离 GTO 基准 20% 以上\n3. 单向偏差：对手的偏差是"单向"的（如总是跟注太多，而非随机）\n\nGTO 基准参考：\n• VPIP/PFR：约 22/18（6-max）\n• Fold to C-Bet：约 45-50%\n• 3-Bet：约 7-9%\n• Fold to 3-Bet：约 55%' },
      { type: 'key-point', content: '偏离原则：向对手偏差的"相反方向"调整。对手跟注多 → 多 value 少 bluff；对手弃牌多 → 多 bluff 少 value。' },
      { type: 'heading', content: '常见偏离场景' },
      { type: 'text', content: '场景 1：对手 Fold to C-Bet 65%+（GTO 45-50%）\n• 偏差：弃牌过多（+15-20%）\n• 偏离：增加 C-Bet 频率（含诈唬），减小 C-Bet 尺度\n• 极端：100% C-Bet 1/3 pot，几乎任意两张牌\n\n场景 2：对手 Fold to C-Bet 25%以下（GTO 45-50%）\n• 偏差：跟注过多（-20%）\n• 偏离：减少 C-Bet 诈唬，仅价值 C-Bet，加大尺度\n• 极端：纯价值下注 2/3 pot+，从不诈唬\n\n场景 3：对手 3-Bet 15%+（GTO 7-9%）\n• 偏差：3-Bet 过多（+6-8%）\n• 偏离：收紧开牌范围，用强牌 4-Bet 价值\n• 极端：开牌范围只打 12%（顶级强牌），让他的 3-Bet bluff 失去价值\n\n场景 4：对手 Fold to 3-Bet 75%+（GTO 55%）\n• 偏差：弃牌过多（+20%）\n• 偏离：增加 3-Bet bluff 频率（用 A2s-A5s、K9s 等 blocker）\n• 极端：3-Bet 范围从 8% 扩展到 18%（含大量 bluff）' },
      { type: 'example', content: '示例牌局：对手样本 200 手，Fold to C-Bet 68%（GTO 50%）\n你 BTN 持有 8♣9♦（弱牌，未击中），开牌 2.5BB，对手 BB 跟注\n翻牌：K♠5♦2♥（干燥，你完全 miss）\n对手 check\n\nGTO 策略：约 60% C-Bet（混合价值与诈唬）\n剥削策略：100% C-Bet 1/3 pot（2BB）\n\nEV 分析：\n• 对手 Fold to C-Bet 68%，C-Bet 成功率 68%\n• EV = 0.68 × 5.5 - 0.32 × 2 = +3.16BB\n• GTO 混合策略 EV 约为 +1.5BB\n• 剥削策略 EV 提升 +110%\n\n结论：对手 Fold to C-Bet 偏差显著（+18%），应明确偏离 GTO 转向剥削' },
      { type: 'heading', content: '偏离的风险与边界' },
      { type: 'text', content: '偏离 GTO 不是无限制的，需要注意：\n\n• 数据样本：50 手以下的统计不可靠，避免过早偏离\n• 对手适应：强对手会察觉你的偏离并反剥削，需定期检查\n• 多人场景：多人底池偏离风险更高，应更保守\n• 自身平衡：偏离时仍需保持一定平衡，避免被读死\n\n偏离检查：每隔 50-100 手复查对手统计，确认偏差仍然存在。如果对手调整了，你也应回归 GTO 或重新偏离。' },
      { type: 'highlight', content: '偏离 GTO 最致命的错误：基于"小样本"或"直觉"偏离。20 手的样本看到对手 Fold to C-Bet 80% 就疯狂诈唬，结果他实际是 50% 的 GTO 玩家，你被反剥削。' },
      { type: 'pro-tip', content: '使用 HUD 时关注"样本大小"指标。VPIP/PFR 在 20 手后就比较可靠，但 Fold to C-Bet/3-Bet 等需要 100+ 手才稳定。低于样本阈值的统计不要作为偏离依据。' },
    ],
    quiz: [
      {
        id: 'local-when-to-deviate-q1',
        question: '偏离 GTO 的判断标准不包括？',
        options: ['数据充足（50+ 手）', '偏差显著（>20%）', '对手知名度', '单向偏差'],
        correctIndex: 2,
        explanation: '偏离 GTO 基于对手统计偏差，与对手知名度无关。判断标准是数据充足、偏差显著、单向偏差。',
      },
      {
        id: 'local-when-to-deviate-q2',
        question: '对手 Fold to C-Bet 65%+（GTO 50%），应如何偏离？',
        options: ['减少 C-Bet', '增加 C-Bet 频率（含诈唬）', '保持 GTO', '只 value bet'],
        correctIndex: 1,
        explanation: '对手弃牌过多，应增加 C-Bet 频率（含诈唬）来剥削他的过度弃牌，可减小尺度到 1/3 pot。',
      },
      {
        id: 'local-when-to-deviate-q3',
        question: '对手 3-Bet 15%+（GTO 8%），应如何偏离？',
        options: ['增加开牌范围', '收紧开牌范围，强牌 4-Bet 价值', '不调整', '只 All-in'],
        correctIndex: 1,
        explanation: '对手 3-Bet 过多，应收紧开牌范围（减少被 3-Bet 的牌），用强牌 4-Bet 价值让他宽范围付出代价。',
      },
      {
        id: 'local-when-to-deviate-q4',
        question: '偏离 GTO 的主要风险是？',
        options: ['赢得太多', '强对手会反剥削', '没有风险', '被踢出桌子'],
        correctIndex: 1,
        explanation: '偏离 GTO 是不平衡的，强对手会察觉并反剥削。需定期检查对手是否调整，并相应回归或重新偏离。',
      },
    ],
  },
];
