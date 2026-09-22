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
    objectives: [
      '说明 BTN Straddle 与 UTG Straddle 的行动顺序差异，判断 BTN 的"双倍位置优势"来自翻前最后行动加翻后位置',
      '计算 Straddle 对 SPR 的影响（初始底池 1.5BB → 4.5BB，SPR 下降、隐含赔率变差），并区分价值提升的牌（大对子、AK/AQ）与价值降低的牌（小对子、同花连牌、弱 Ax）',
      '给出 Straddle 局开牌加注的调整尺度（4-5BB），并说明加大尺度是为了避免被多人跟注稀释强牌价值',
      '判断 Straddler 的混合策略场景（多数时候 check 看免费翻牌，偶尔用 KK/AA check-raise 偷取加注者筹码）',
    ],
    content: [
      { type: 'heading', content: 'Straddle 是什么？' },
      { type: 'text', content: 'Straddle 是翻前在 UTG 位置（线下常见）或 BTN 位置（国内俱乐部常见）的自愿盲注，通常是 2BB。Straddle 玩家在翻前拥有最后行动权（即"最后加注权"）。\n\n国内俱乐部尤其流行 BTN Straddle：庄家位置在翻前最后行动，相当于"双倍位置优势"。' },
      { type: 'key-point', content: 'Straddle 的核心影响：①初始底池变大（1.5BB → 4.5BB，SPR 下降）；②位置优势重新分配；③投机牌价值降低（隐含赔率变差）。' },
      { type: 'heading', content: 'BTN Straddle 的特殊性' },
      { type: 'text', content: 'BTN Straddle 是国内俱乐部的特色玩法：\n\n• 翻前行动顺序：SB → BB → UTG → ... → CO → BTN（Straddler）\n• BTN 翻前最后行动（保留位置优势）\n• 翻后行动顺序恢复正常：SB → BB → ... → BTN\n• 这意味着 BTN 在翻前和翻后都最后行动，优势巨大\n\n应对策略：BTN Straddle 玩家通常范围偏宽（已投入 2BB），可以用更宽的范围 3-bet 攻击他。' },
      { type: 'example', content: '示例牌局：NL50，BTN Straddle（2BB），100BB 有效\n你 UTG 持有 A♣K♦\n\n分析：\n• Straddle 是自愿投入额外 2BB 盲注，有效筹码仍是~100BB。只是翻前行动规则变化，straddler 玩家自己剩余 98BB。\n• 初始底池从 1.5BB 变为 4.5BB（0.5+1+2），SPR 下降，投机牌的隐含赔率变差\n• AK 在 SPR 偏低的环境是极强牌\n• UTG 开牌加注到 5BB（标准 3-4BB，但 Straddle 局需加大）\n• BTN Straddle 跟注（范围宽，常见）\n• 翻后有效约 93BB，底池已含 straddle 死钱，AK 命中顶对可放心建池\n\n错误做法：UTG 开牌只加注 3BB，被多人跟注，AK 价值被稀释' },
      { type: 'heading', content: 'Straddle 局的范围调整' },
      { type: 'text', content: 'Straddle 使 SPR 降低（底池预置 4.5BB），策略应整体收紧：\n\n价值提升的牌：\n• 大对子（QQ+）：SPR 偏低时可放心建立大底池\n• AK/AQ：顶对即可全下，无需担心深筹操作\n\n价值降低的牌：\n• 小对子（22-77）：set mine 隐含赔率变差（SPR 低，中 set 后难赢满对手深筹）\n• 同花连牌：大底池潜力降低\n• 弱 Ax：容易被 dominated' },
      { type: 'highlight', content: 'Straddle 局最常见错误：仍用无 Straddle 的尺度与范围打。底池预置从 1.5BB 变 4.5BB 后，小对子、同花连牌的隐含赔率变差应大幅减少，强牌应更激进地 3-bet/4-Bet。' },
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
        question: 'Straddle 局（初始底池 1.5→4.5BB）中，哪类牌价值降低最多？',
        options: ['AA/KK', '小对子和同花连牌', 'AK', 'AQ'],
        correctIndex: 1,
        explanation: 'Straddle 使底池预置增大、SPR 下降，小对子（set mine）和同花连牌（大底池潜力）的隐含赔率变差，价值降低。',
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
    objectives: [
      '计算 0.2BB Ante 的 6 人桌初始底池（SB 0.5 + BB 1 + Ante 1.2 = 2.7BB），并与无 Ante 的 1.5BB 比较',
      '计算 BTN 偷盲加注 2.5BB 后 BB 跟注赔率的变化（所需胜率从约 27.3% 降到约 22.4%，分母含 BB 已入池的死钱），判断 Ante 局应放宽防守范围',
      '列出 Ante 结构下翻前范围的四个放宽方向（开牌范围、偷盲范围、3-bet 范围、大盲防守范围）',
      '判断 Ante 越大底池赔率越好的关系，并说明 Big Ante 局 BTN 开池应在标准最宽档之上再明显放宽',
    ],
    content: [
      { type: 'heading', content: 'Ante 结构的特点' },
      { type: 'text', content: 'Ante 是每位玩家翻前强制投入的小额筹码（通常是 0.1-0.25BB）。国内俱乐部常在现金局引入 Ante 来增加底池和动作频率。\n\nAnte 改变了底池赔率：初始底池更大（如 6 人桌 + 0.2BB Ante = 1.2BB Ante + 1.5BB 盲注 = 2.7BB），跟注的赔率更好，应该用更宽的范围入池。' },
      { type: 'key-point', content: 'Ante 的核心影响：①初始底池更大；②跟注赔率更好（应放宽范围）；③偷盲价值提升（偷到的底池更大）；④短码 All-in 的弃牌率要求降低。' },
      { type: 'heading', content: '翻前范围调整' },
      { type: 'text', content: 'Ante 结构下应整体放宽范围：\n\n• 开牌范围：每个位置都在标准宽度上放宽一档（UTG 仍是最紧的一档）\n• 偷盲范围：BTN 在开池最宽档（约三成半）之上再放宽\n• 3-bet 范围：略微放宽，但保持价值为主\n• 大盲防守：跟注范围放宽（赔率更好）\n\n关键公式：Ante 越大，底池赔率越好，跟注/防守范围应越宽。' },
      { type: 'example', content: '示例：6 人桌，0.2BB Ante，NL100\n无 Ante 时：底池 = SB 0.5 + BB 1 = 1.5BB\n有 Ante 时：底池 = SB 0.5 + BB 1 + Ante 1.2 = 2.7BB\n\nBTN 偷盲加注 2.5BB（BB 已投 1BB 为死钱，仍计入分母）：\n• 无 Ante：决策点底池 4BB（0.5+2.5+1），跟 1.5 → 所需胜率 1.5/(4+1.5) ≈ 27.3%\n• 有 Ante：决策点底池 5.2BB（2.7+2.5），跟 1.5 → 所需胜率 1.5/(5.2+1.5) ≈ 22.4%\n\n结论：Ante 局 BB 防守范围应明显放宽（所需胜率从约 27.3% 降到约 22.4%）。' },
      { type: 'heading', content: 'Ante 局的偷盲策略' },
      { type: 'text', content: 'Ante 让偷盲更赚钱：\n• 偷到的底池更大（含 Ante）\n• BB 防守范围更宽，但平均牌力更弱\n• CO/BTN/SB 都应提升偷盲频率\n\n但注意：Ante 也让 3-bet 偷盲的玩家范围更宽，可以用强牌 4-Bet 反击。' },
      { type: 'highlight', content: 'Ante 局最常见的错误：仍用无 Ante 的紧范围打。Ante 结构下你应该明显放宽，特别是偷盲和大盲防守。' },
      { type: 'pro-tip', content: 'Ante 越大，越应该激进。Big Ante（如 0.5BB+）的局，BTN 开池要在标准最宽档之上再明显放宽，因为底池赔率极佳。' },
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
        options: ['应当收紧', '应当放宽', '保持不变', '完全不偷'],
        correctIndex: 1,
        explanation: 'Ante 让偷盲更赚钱（底池更大），BTN 偷盲范围应在标准最宽档之上进一步放宽。',
      },
      {
        id: 'local-ante-q3',
        question: '0.2BB Ante 的 6 人桌，BTN 加注 2.5BB 后 BB 跟注的所需胜率约为？',
        options: ['约 27.3%（无 Ante 水平）', '约 22.4%（赔率更好）', '50%', '15%'],
        correctIndex: 1,
        explanation: '有 Ante 时决策点底池 5.2BB、跟 1.5BB，所需胜率 1.5/6.7 ≈ 22.4%，比无 Ante 的约 27.3% 明显更好，应放宽防守范围。',
      },
    ],
  },
];
