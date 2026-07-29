import type { Lesson } from '../../types';

/**
 * P2-1.4 模块 3：深筹码调整（2 课）
 *
 * 国内俱乐部常出现 500BB+ 的深筹码局，隐含赔率显著提升，
 * 投机牌价值大涨，但同时顶对等中等牌力贬值，需要专门调整策略。
 */
export const DEEP_STACK_LESSONS: Lesson[] = [
  // ===== local-deep-implied-odds =====
  {
    id: 'local-deep-implied-odds',
    level: 7,
    order: 11,
    title: '深筹码的隐含赔率',
    subtitle: '500BB 深筹如何评估投机牌价值',
    duration: '10 min',
    content: [
      { type: 'heading', content: '深筹码的隐含赔率革命' },
      { type: 'text', content: '国内俱乐部深筹码局（200-500BB effective）中，隐含赔率（Implied Odds）发生质变：\n\n• 100BB 深度：投入 3BB 跟注，中 set 可赢 100BB（33:1）\n• 500BB 深度：投入 3BB 跟注，中 set 可赢 500BB（166:1）\n\n这意味着小对子、同花连牌在深筹码中的价值大幅提升——即使你的"立即赔率"不足，隐含赔率也足以支撑跟注。' },
      { type: 'key-point', content: '隐含赔率公式：隐含赔率 = (当前底池 + 后续街预期收益) : 跟注金额。深筹码让"后续街预期收益"大幅提升，从而让许多看似不划算的跟注变得 +EV。' },
      { type: 'heading', content: '深筹码中各类牌的价值变化' },
      { type: 'text', content: '价值大幅提升：\n• 小对子（22-88）：set mine 价值极高，中 set 可赢全部深筹\n• 同花连牌（54s-T9s）：顺子/同花潜力大，深筹下可赢全部筹码\n• 同花 Ax（A2s-A5s）：坚果同花潜力，深筹下极有价值\n• 双高连牌（JTs/QTs）：顺子潜力 + 顶对潜力\n\n价值相对降低：\n• 顶对顶踢脚（AK/AQ 击中顶对）：深筹下不再是"绝对强牌"\n• 中等对子（99-TT）：容易被小对子 set 反超\n• 弱两对：深筹下容易被顺子/同花反超' },
      { type: 'example', content: '示例牌局：国内俱乐部 NL200，500BB effective\nUTG 开牌 8BB（深筹局加大尺度），你 CO 持有 7♠7♣\n\n分析：\n• 立即赔率：跟注 8BB 赢 11.5BB（不利）\n• 隐含赔率：中 set 概率约 12%，中 set 后可赢 500BB\n• 期望收益：0.12 × 500 - 0.88 × 8 = 60 - 7 = +53BB\n\n正确做法：跟注。深筹下 77 的隐含赔率极佳\n错误做法：弃牌"只是小对子"，浪费深筹的隐含赔率优势' },
      { type: 'heading', content: '反向隐含赔率（Reverse Implied Odds）' },
      { type: 'text', content: '深筹码中也要警惕反向隐含赔率：\n\n• 弱 Ax（如 A7o）：击中顶对 A 但被 AT/AJ dominated，深筹下可能输掉 500BB\n• 弱同花（如 92s）：击中同花但被更大同花压制，深筹下损失惨重\n• 顶对弱踢脚：深筹下容易被更强踢脚或两对反超\n\n原则：深筹下应避免"中等牌力被 dominated"的场景，优先打"要么不中、中了大牌"的投机牌。' },
      { type: 'highlight', content: '深筹码最致命的错误：用顶对顶踢脚打光 500BB。深筹下顶对是"中等牌力"，应控制底池；只有两对、三条、顺子+ 才能支撑深筹的全下。' },
      { type: 'pro-tip', content: '深筹码局中，资金管理尤其重要。500BB 的波动远大于 100BB，至少需要 50 个 buy-in 的资金才能承受深筹码的方差。' },
    ],
    quiz: [
      {
        id: 'local-deep-implied-q1',
        question: '500BB 深筹码中，小对子 set mine 的隐含赔率约为？',
        options: ['33:1（同 100BB）', '166:1', '10:1', '500:1'],
        correctIndex: 1,
        explanation: '500BB 深度投入 3BB 跟注，中 set 可赢 500BB，隐含赔率约 166:1，远胜 100BB 的 33:1。',
      },
      {
        id: 'local-deep-implied-q2',
        question: '深筹码中价值相对降低的牌是？',
        options: ['小对子', '同花连牌', '顶对顶踢脚（AK 击中顶对）', '同花 Ax'],
        correctIndex: 2,
        explanation: '深筹下顶对是中等牌力，容易被两对、三条、顺子反超，价值相对降低。小对子和同花连牌价值提升。',
      },
      {
        id: 'local-deep-implied-q3',
        question: '深筹码中应避免的"反向隐含赔率"场景是？',
        options: ['用 55 set mine', '用 87s 同花连牌', '用 A7o 击中顶对 A', '用 76s 顺子听牌'],
        correctIndex: 2,
        explanation: 'A7o 击中顶对 A 容易被 AT/AJ dominated，深筹下可能输掉 500BB，是典型的反向隐含赔率陷阱。',
      },
      {
        id: 'local-deep-implied-q4',
        question: '深筹码中可以支撑全下的最低牌力是？',
        options: ['顶对顶踢脚', '两对或更强', '高对', '顶对弱踢脚'],
        correctIndex: 1,
        explanation: '深筹码中顶对不足以支撑全下，两对或更强的牌才能放心打光深筹。',
      },
    ],
  },

  // ===== local-deep-suited-connectors =====
  {
    id: 'local-deep-suited-connectors',
    level: 7,
    order: 12,
    title: '同花连牌的深筹策略',
    subtitle: '54s-T9s 在 500BB 深度的打法',
    duration: '9 min',
    content: [
      { type: 'heading', content: '为什么同花连牌在深筹中这么值钱？' },
      { type: 'text', content: '同花连牌（Suited Connectors，如 76s、T9s）在深筹码中是"高 EV 投机牌"，原因：\n\n• 顺子潜力：可组成 4 种顺子（如 76s 可组 7-8-9-T-J、6-7-8-9-T、5-6-7-8-9、4-5-6-7-8）\n• 同花潜力：可组成坚果同花（同花 A 在你手里则你是坚果）\n• 隐藏性：顺子/同花不易被对手察觉，可赢大底池\n• 双重听牌：flop 经常组成 OESD + 同花听牌（共 15+ outs）\n\n深筹码中这些潜力被放大——中大牌后可赢全部深筹。' },
      { type: 'key-point', content: '同花连牌 EV 公式（简化）：EV = P(中顺/花) × 平均赢取 - P(未中) × 投入。深筹码让"平均赢取"大幅提升，即使 P(中) 仅约 5-8%，整体 EV 也为正。' },
      { type: 'heading', content: '同花连牌的位置与范围' },
      { type: 'text', content: '深筹码中同花连牌的推荐范围：\n\n• UTG：54s-T9s（仅最强同花连牌，约 6 组）\n• MP：43s-JTs（扩展到 10 组）\n• CO：32s-QJs（最宽，约 12 组）\n• BTN：所有同花连牌 + 一间张（如 86s、97s）\n\n关键：同花连牌需要位置优势。BTN/CO 可以打最宽，UTG 应收紧。' },
      { type: 'example', content: '示例牌局：NL200，500BB effective，BTN 持有 8♠7♠\nCO 开牌 8BB，你 BTN 跟注（深筹 + 位置，76s/87s 等都 +EV）\n\n翻牌：6♠9♠T♦\n• 你持有 OESD（7-8-9-T 或 5-6-7-8-9）+ 同花听牌\n• 共 15 outs（9 同花 + 6 顺子，去除重复的 5♠T♠）\n• 成牌概率：约 32%（一条街）或 54%（两条街）\n\n正确打法：\n• CO C-Bet 6BB → 你跟注（隐含赔率极佳）\n• 转 5♠ → 你成顺花，CO 继续下注 → 你加注或跟注引诱河牌全下\n\n错误打法：翻牌加注暴露牌力，让 CO 弃掉弱牌，损失深筹价值' },
      { type: 'heading', content: '同花连牌的翻后策略' },
      { type: 'text', content: '深筹码中同花连牌的翻后要点：\n\n• 击中强牌（顺子/同花/两对+）：不要急于加注，让对手继续下注建立底池\n• 击中听牌：跟注而非加注（隐含赔率好，且保持隐藏性）\n• 完全 miss：弃牌，不要硬扛\n• 击中顶对：控制底池，深筹下顶对贬值\n\n核心思维：同花连牌要么中大牌赢大底池，要么不中弃牌。避免用顶对等中等牌力在深筹中纠缠。' },
      { type: 'highlight', content: '同花连牌的隐藏性是关键：当你击中顺子时（如 76s 在 4-5-8 翻牌），对手很难将你放在顺子上，会继续用两对/三条 价值下注，让你赢到全部深筹。' },
      { type: 'pro-tip', content: '深筹码中"双 barreling 听牌"是高 EV 策略：flop 跟注 C-Bet，turn 若来额外 outs（如同花听牌加顺子听牌）继续跟注，深筹下隐含赔率支撑这种激进跟注。' },
    ],
    quiz: [
      {
        id: 'local-deep-sc-q1',
        question: '同花连牌在深筹码中价值提升的核心原因是？',
        options: ['胜率提升', '中大牌后可赢全部深筹（隐含赔率）', '对手变弱', '抽水降低'],
        correctIndex: 1,
        explanation: '同花连牌击中顺子/同花后可赢对手全部深筹，隐含赔率极佳，这是深筹下其价值大幅提升的核心原因。',
      },
      {
        id: 'local-deep-sc-q2',
        question: '深筹码中同花连牌在 UTG 的推荐范围是？',
        options: ['所有同花连牌', '54s-T9s（仅最强）', '不打同花连牌', '32s+'],
        correctIndex: 1,
        explanation: 'UTG 无位置优势，应仅打最强同花连牌（54s-T9s）。BTN/CO 可以放宽到所有同花连牌。',
      },
      {
        id: 'local-deep-sc-q3',
        question: '深筹码中击中顺子后应如何打？',
        options: ['立即 All-in', '跟注或小加注引诱对手继续下注', '立即大加注', '弃牌'],
        correctIndex: 1,
        explanation: '深筹中击中顺子应保持隐藏性，跟注或小加注引诱对手继续价值下注，让对手自己把筹码送进来。',
      },
      {
        id: 'local-deep-sc-q4',
        question: '同花连牌在翻牌击中 OESD + 同花听牌（15 outs）的成牌概率（两条街）约为？',
        options: ['约 32%', '约 54%', '约 15%', '约 95%'],
        correctIndex: 1,
        explanation: '15 outs 双重听牌：转牌单街约 32%，翻牌到河牌两条街约 54%（二四法则估算 15×4=60%，略高于精确值），是极强的听牌。',
      },
    ],
  },
];
