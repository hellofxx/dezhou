import type { Lesson } from '../../types';

/**
 * P2-1.3 模块 2：Ante / Straddle（2 课）
 *
 * 国内俱乐部常启用 Straddle（按钮位或 UTG 位）与 Ante 结构，
 * 这改变了有效筹码深度与位置价值，需要专门调整策略。
 */
export const STRADDLE_LESSONS: Lesson[] = [
  // ===== local-straddle =====
  {
    id: 'local-straddle',
    level: 7,
    order: 9,
    title: 'Straddle 局策略',
    subtitle: '按钮位 Straddle 改变位置优势',
    duration: '9 min',
    content: [
      { type: 'heading', content: 'Straddle 是什么？' },
      { type: 'text', content: 'Straddle 是翻前在 UTG 位置（线下常见）或 BTN 位置（国内俱乐部常见）的自愿盲注，通常是 2BB。Straddle 玩家在翻前拥有最后行动权（即"最后加注权"）。\n\n国内俱乐部尤其流行 BTN Straddle：庄家位置在翻前最后行动，相当于"双倍位置优势"。' },
      { type: 'key-point', content: 'Straddle 的核心影响：①有效筹码减半（100BB 变 50BB effective）；②位置优势重新分配；③翻前底池更大；④投机牌价值降低（隐含赔率变差）。' },
      { type: 'heading', content: 'BTN Straddle 的特殊性' },
      { type: 'text', content: 'BTN Straddle 是国内俱乐部的特色玩法：\n\n• 翻前行动顺序：SB → BB → UTG → ... → CO → BTN（Straddler）\n• BTN 翻前最后行动（保留位置优势）\n• 翻后行动顺序恢复正常：SB → BB → ... → BTN\n• 这意味着 BTN 在翻前和翻后都最后行动，优势巨大\n\n应对策略：BTN Straddle 玩家通常范围偏宽（已投入 2BB），可以用更宽的范围 3-Bet 攻击他。' },
      { type: 'example', content: '示例牌局：NL50，BTN Straddle（2BB），100BB 有效\n你 UTG 持有 A♣K♦\n\n分析：\n• Straddle 是自愿投入额外 2BB 盲注，有效筹码仍是~100BB。只是翻前行动规则变化，straddler 玩家自己剩余 98BB。\n• AK 在 50BB 深度是极强牌\n• UTG 开牌加注到 5BB（标准 3-4BB，但 Straddle 局需加大）\n• BTN Straddle 跟注（范围宽，常见）\n• 翻后 effective 45BB，AK 命中顶对即可打光\n\n错误做法：UTG 开牌只加注 3BB，被多人跟注，AK 价值被稀释' },
      { type: 'heading', content: 'Straddle 局的范围调整' },
      { type: 'text', content: 'Straddle 使有效筹码减半，策略应整体收紧：\n\n价值提升的牌：\n• 大对子（QQ+）：50BB 深度下可放心 5-Bet All-in\n• AK/AQ：顶对即可打光，无需担心深筹操作\n\n价值降低的牌：\n• 小对子（22-77）：set mine 隐含赔率变差（50BB 而非 100BB）\n• 同花连牌：大底池潜力降低\n• 弱 Ax：容易被 dominated' },
      { type: 'highlight', content: 'Straddle 局最常见错误：仍用 100BB 的范围打 50BB effective。小对子、同花连牌在 Straddle 局应大幅减少，强牌应更激进地 3-Bet/4-Bet。' },
      { type: 'pro-tip', content: '如果你是 Straddler（BTN 位置），可以混合策略：大部分时候 check 看免费翻牌，偶尔用强牌（KK/AA）check-raise 偷取加注者的筹码。' },
    ],
    quiz: [
      {
        id: 'local-straddle-q1',
        question: 'BTN Straddle 相比 UTG Straddle 的核心优势是？',
        options: ['筹码更多', '翻前翻后都最后行动', '可以 bluff 更多', '没有区别'],
        correctIndex: 1,
        explanation: 'BTN Straddle 让 BTN 翻前最后行动（Straddle 权）+ 翻后最后行动（位置优势），是"双倍位置优势"。',
      },
      {
        id: 'local-straddle-q2',
        question: 'Straddle 局（100BB→50BB effective）中，哪类牌价值降低最多？',
        options: ['AA/KK', '小对子和同花连牌', 'AK', 'AQ'],
        correctIndex: 1,
        explanation: 'Straddle 使有效筹码减半，小对子（set mine）和同花连牌（大底池潜力）的隐含赔率变差，价值降低。',
      },
      {
        id: 'local-straddle-q3',
        question: 'Straddle 局中开牌加注尺度应如何调整？',
        options: ['减小到 2BB', '保持 3BB 不变', '加大到 4-5BB', '总是 All-in'],
        correctIndex: 2,
        explanation: 'Straddle 局底池更大（已含 2BB Straddle），开牌加注应加大到 4-5BB，避免被多人跟注稀释强牌价值。',
      },
    ],
  },

  // ===== local-ante =====
  {
    id: 'local-ante',
    level: 7,
    order: 10,
    title: 'Ante 结构的翻前调整',
    subtitle: 'Ante 局如何放宽范围与激进打法',
    duration: '8 min',
    content: [
      { type: 'heading', content: 'Ante 结构的特点' },
      { type: 'text', content: 'Ante 是每位玩家翻前强制投入的小额筹码（通常是 0.1-0.25BB）。国内俱乐部常在现金局引入 Ante 来增加底池和动作频率。\n\nAnte 改变了底池赔率：初始底池更大（如 6 人桌 + 0.2BB Ante = 1.2BB Ante + 1.5BB 盲注 = 2.7BB），跟注的赔率更好，应该用更宽的范围入池。' },
      { type: 'key-point', content: 'Ante 的核心影响：①初始底池更大；②跟注赔率更好（应放宽范围）；③偷盲价值提升（偷到的底池更大）；④短码 All-in 的弃牌率要求降低。' },
      { type: 'heading', content: '翻前范围调整' },
      { type: 'text', content: 'Ante 结构下应整体放宽范围：\n\n• 开牌范围：放宽约 15%（如 UTG 从 12% → 14%）\n• 偷盲范围：BTN 可放宽到 45-50%（标准是 35-40%）\n• 3-Bet 范围：略微放宽，但保持价值为主\n• 大盲防守：跟注范围放宽（赔率更好）\n\n关键公式：Ante 越大，底池赔率越好，跟注/防守范围应越宽。' },
      { type: 'example', content: '示例：6 人桌，0.2BB Ante，NL100\n无 Ante 时：底池 = SB 0.5 + BB 1 = 1.5BB\n有 Ante 时：底池 = SB 0.5 + BB 1 + Ante 1.2 = 2.7BB\n\nBTN 偷盲加注 2.5BB：\n• 无 Ante：BB 跟注 1.5BB 赢 4BB（37.5% 赔率）\n• 有 Ante：BB 跟注 1.5BB 赢 5.2BB（28.8% 赔率）\n\n结论：Ante 局 BB 防守范围应明显放宽（所需胜率从 37.5% 降到 28.8%）。' },
      { type: 'heading', content: 'Ante 局的偷盲策略' },
      { type: 'text', content: 'Ante 让偷盲更赚钱：\n• 偷到的底池更大（含 Ante）\n• BB 防守范围更宽，但平均牌力更弱\n• CO/BTN/SB 都应提升偷盲频率\n\n但注意：Ante 也让 3-Bet 偷盲的玩家范围更宽，可以用强牌 4-Bet 反击。' },
      { type: 'highlight', content: 'Ante 局最常见的错误：仍用无 Ante 的紧范围打。Ante 结构下你应该明显放宽，特别是偷盲和大盲防守。' },
      { type: 'pro-tip', content: 'Ante 越大，越应该激进。Big Ante（如 0.5BB+）的局，BTN 开牌范围可以放宽到 55-60%，因为底池赔率极佳。' },
    ],
    quiz: [
      {
        id: 'local-ante-q1',
        question: 'Ante 结构对底池赔率的影响是？',
        options: ['跟注赔率变差', '跟注赔率变好', '没有影响', '只影响翻后'],
        correctIndex: 1,
        explanation: 'Ante 让初始底池更大，跟注同样的金额能赢更多，跟注赔率变好，应放宽跟注范围。',
      },
      {
        id: 'local-ante-q2',
        question: 'Ante 局中 BTN 偷盲范围应如何调整？',
        options: ['收紧到 25%', '放宽到 45-50%', '保持 35% 不变', '完全不偷'],
        correctIndex: 1,
        explanation: 'Ante 让偷盲更赚钱（底池更大），BTN 偷盲范围应放宽到 45-50%。',
      },
      {
        id: 'local-ante-q3',
        question: '0.2BB Ante 的 6 人桌，BTN 加注 2.5BB 后 BB 跟注的赔率约为？',
        options: ['37.5%（无 Ante 水平）', '28.8%（赔率更好）', '50%', '15%'],
        correctIndex: 1,
        explanation: '有 Ante 时 BB 跟注 1.5BB 赢 5.2BB，赔率约 28.8%，比无 Ante 的 37.5% 明显更好，应放宽防守范围。',
      },
    ],
  },
];
