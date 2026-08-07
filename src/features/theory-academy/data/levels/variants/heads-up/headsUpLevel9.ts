import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { headsUpRules } from '../variantRules';

const variant: PokerVariant = 'heads-up';

export const HEADS_UP_LEVEL_9: TheoryLevelInfo = {
  id: 't9hu',
  level: 9,
  tier: 'advanced',
  title: '单挑理论大师',
  description: '整合所有技能成为单挑专家',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T8HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l7hu-stakes', title: '单挑策略基础' },
      { id: 'l6hu-tourney', title: '单挑锦标赛' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't9hu-mastery',
      level: 9,
      order: 1,
      title: '全面整合',
      subtitle: '构建个人单挑理论体系',
      duration: '20 min',
      eloDimension: 'postflop',
      objectives: [
        '把 T1-T8 的知识整合为单挑决策的完整闭环：范围→数学→下注→剥削→心理',
        '理解单挑理论在不同筹码深度与游戏类型（现金/锦标赛）的适用变化',
        '建立个人复盘与学习体系，形成持续改进的方法论',
      ],
      content: [
        { type: 'heading', content: '从碎片到体系：单挑决策闭环' },
        {
          type: 'text',
          content:
            'T1-T8 的每一章都是一块积木：T1 概率基础、T2 赔率与 EV、T3 位置与起手、T4 范围、T5 GTO、T6 下注、T7 剥削、T8 心理。单挑大师不是"记住每章"，而是把它们连成一个决策闭环——面对任何局面，按"范围→数学→下注→剥削→心理"的顺序自动运转。这个闭环让你在桌边不再是"这个决策我背过公式"，而是"这个局面的所有维度我都看到了"。',
        },
        {
          type: 'key-point',
          content:
            '单挑决策闭环：先问"双方范围是什么"（T4），再算"我的 EV 与赔率"（T2），然后"用什么尺度下注"（T6），接着"对手有什么偏离可剥削"（T7），最后"我的情绪是否稳定"（T8）。五问缺一不可。',
        },
        { type: 'heading', content: '理论随场景变形' },
        {
          type: 'text',
          content:
            '单挑理论不是铁板一块，它随两个参数变形：筹码深度与游戏类型。深筹码（100BB+）：范围更宽、下注更极化、翻后位置价值更大，SPR 高需规划多街。短筹码（20BB 以下）：翻前全下更频繁、位置价值缩小、下注更直接。现金桌：无限重买、波动可管理、以 bb/100 衡量。锦标赛：筹码是资源、ICM 压力、盲注随时间上涨，策略随阶段动态调整（详见 l6hu-tourney）。',
        },
        {
          type: 'example',
          content:
            '实例：深筹码 100BB，单挑 SB 持 A♠5♠。决策闭环：范围——A5s 是 SB 开池范围成员（约 80% 内）；数学——min-raise 2BB，纯偷盲需 60% 弃牌率；下注——深筹码倾向小注控池+翻后发挥；剥削——若 BB 弃牌多提高开池频率；心理——节奏一致不泄露。一个决策，五问全过。',
        },
        {
          type: 'example',
          content:
            '实例二（短筹码）：单挑 15BB 深，SB 持 K♠Q♠。范围——KQs 面对 BB 宽范围胜率约 60%；数学——全下 15BB 或 min-raise 后全下，KQs 对跟注范围优势明显；下注——短筹码不用多街，直接全下或小加注引诱；剥削——BB 若弃牌过多直接推；心理——接受波动。短筹码的策略比深筹码更直接——筹码深度的变化，让同一手牌的玩法完全不同。',
        },
        {
          type: 'example',
          content:
            '实例三（复盘方法论）：单挑 session 后，用"决策闭环"逐手复盘——这手牌我范围判断对吗？EV 算对了吗？尺度合适吗？对手倾向判断对吗？情绪有没有影响？五个问题把每一手牌变成一次训练。Tendler 强调"过程 vs 结果"：复盘只问过程（决策质量），不问结果（输赢）。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：单挑大师的"聪明"不在于每个决策都完美，而在于"系统稳定"。偶尔的决策失误不可避免，但稳定的决策闭环+严格的情绪纪律，让长期期望曲线稳定向上。追求"每手都完美"反而会导致过度思考与 tilt。',
        },
        {
          type: 'pro-tip',
          content:
            '构建个人体系的四步：学（T1-T8 理论）→ 练（求解器验证）→ 打（实战执行闭环）→ 复（逐手复盘+笔记）。四步循环，你的单挑水平随每个 session 稳定爬升。',
        },
      ],
      quiz: [
        {
          id: 't9hu-mastery-q1',
          question: '单挑决策闭环的正确顺序是：',
          options: [
            '下注→范围→数学→心理',
            '范围→数学→下注→剥削→心理',
            '心理→范围→下注→数学',
            '只看结果',
          ],
          correctIndex: 1,
          explanation: '闭环：范围（T4）→ 数学（T2）→ 下注（T6）→ 剥削（T7）→ 心理（T8），五问缺一不可。',
        },
        {
          id: 't9hu-mastery-q2',
          question: '深筹码（100BB）与短筹码（15BB）单挑的主要差异是：',
          options: [
            '没有差异',
            '深筹码范围更宽、下注更极化、需规划多街；短筹码翻前全下更频繁、更直接',
            '短筹码范围更宽',
            '深筹码不需要下注',
          ],
          correctIndex: 1,
          explanation: '筹码深度改变策略：深筹码 SPR 高需多街规划、下注极化；短筹码翻前全下更频繁、玩法更直接。',
        },
        {
          id: 't9hu-mastery-q3',
          question: '单挑复盘最应关注的是：',
          options: [
            '这手输了多少',
            '决策过程（范围/EV/尺度/剥削/情绪）是否正确',
            '赢了多少手',
            '对手多强',
          ],
          correctIndex: 1,
          explanation: '复盘只问过程（决策质量）不问结果（输赢），把每一手牌变成训练，才能持续改进。',
        },
        {
          id: 't9hu-mastery-q4',
          question: '短筹码（15BB）单挑持 KQs，最合理的玩法是：',
          options: [
            '复杂多街下注',
            '直接全下或小加注引诱，缩短决策树',
            '过牌看翻牌',
            '弃牌',
          ],
          correctIndex: 1,
          explanation: '短筹码不用多街规划，KQs 对宽范围胜率约 60%，直接全下或小加注引诱是标准打法。',
        },
        {
          id: 't9hu-mastery-q5',
          question: '"系统稳定"比"每手完美"更重要的原因是：',
          options: [
            '完美不可能',
            '稳定的决策闭环+情绪纪律让长期期望稳定向上，追求完美反致过度思考与 tilt',
            '系统稳定更省力',
            '对手更喜欢',
          ],
          correctIndex: 1,
          explanation: '偶尔失误不可避免，稳定的闭环与情绪纪律让长期期望曲线向上；追求"每手完美"反而引发过度思考与 tilt。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't9hu-pro-study',
      level: 9,
      order: 2,
      title: '职业选手研究',
      subtitle: '顶级 HU 玩家的决策逻辑',
      duration: '25 min',
      eloDimension: 'handReading',
      objectives: [
        '研究职业单挑选手的决策框架与范围构建习惯',
        '理解顶级玩家的共同特征：频率平衡、范围一致、情绪稳定',
        '学会从职业选手的公开策略与牌例中提炼可复用的方法论',
      ],
      content: [
        { type: 'heading', content: '顶级单挑选手在想什么' },
        {
          type: 'text',
          content:
            '研究职业单挑选手（如 Moshman 体系中的资深 HU 玩家、求解器时代的顶级 Grinder）的核心价值，不是模仿某个动作，而是理解他们的决策框架。顶级玩家的共同特征高度一致：频率平衡（不泄露范围）、范围一致（动作叙事自洽）、情绪稳定（不受结果影响）、纪律执行（严格按预设策略）。',
        },
        {
          type: 'key-point',
          content:
            '职业与业余的分水岭不是"运气"或"天赋"，而是"决策框架"——业余靠感觉，职业靠系统。研究职业选手，是学习他们的系统，而非抄他们的牌。',
        },
        { type: 'heading', content: '职业决策框架拆解' },
        {
          type: 'text',
          content:
            '顶级单挑选手的决策框架通常分四层：(1) 翻前范围构建——以 GTO 基线为起点，按对手倾向微调；(2) 翻后范围分配——按牌面归属（谁的范围优势/坚果优势）决定下注/过牌；(3) 下注尺度纪律——按 SPR 与牌力层级选择尺度；(4) 剥削切换——识别对手偏离时切换到最大剥削，对手调整时回基线。每一层都有明确的输入与输出，而非临场发挥。',
        },
        {
          type: 'example',
          content:
            '实例（翻前范围微调）：职业选手面对某 BB 弃牌过多的对手，会刻意提高 SB 开池频率至接近 100%、降低加注尺度（min-raise 为主），因为宽范围+小尺度最大化偷盲 EV。这不是"感觉该偷"，而是"对手弃牌率统计支持"的可计算决策。',
        },
        {
          type: 'example',
          content:
            '实例二（翻后范围分配）：职业选手在单挑翻牌 A♠8♦3♣（干燥高牌面）会高频小额 C-Bet 整个下注范围——因为加注者范围优势明显（含大量 Ax），跟注者难中 A。而在 7♠6♥4♣ 湿润面会大幅下调 C-Bet 频率——因为跟注者范围含更多顺子/听牌。范围优势决定下注频率，这是可复用的方法论。',
        },
        {
          type: 'example',
          content:
            '实例三（情绪纪律）：顶级选手在连输 10 个 60% 全下后，仍会按同一套框架决策——因为他们把"波动"视为不可控的外部变量，只控制"决策质量"。这正是 T8 强调的"过程 vs 结果"分离在职业层面的极致体现。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：职业选手研究的价值不在"他们多厉害"，而在"他们的系统有多可复制"。一个业余玩家照着职业框架练一个月，往往比"背了十年感觉"进步更快——因为系统可训练，感觉不可复制。',
        },
        {
          type: 'pro-tip',
          content:
            '研究职业牌例的流程：(1) 记录一手牌的所有动作序列；(2) 用决策闭环逐层拆解（范围/数学/下注/剥削/心理）；(3) 对照自己的处理找差距；(4) 提炼一条可复用原则写入笔记。每研究 10 手，你的决策框架就完整一分。',
        },
      ],
      quiz: [
        {
          id: 't9hu-pro-study-q1',
          question: '顶级单挑选手与业余玩家的核心分水岭是：',
          options: [
            '运气',
            '决策框架（系统性 vs 靠感觉）',
            '天赋',
            '筹码量',
          ],
          correctIndex: 1,
          explanation: '职业与业余的差距是"决策框架"——职业靠系统（范围构建、频率平衡、纪律），业余靠感觉。',
        },
        {
          id: 't9hu-pro-study-q2',
          question: '职业选手面对弃牌过多的 BB，会如何微调翻前策略？',
          options: [
            '减少开池',
            '提高开池频率至接近 100%、降低尺度（min-raise）最大化偷盲 EV',
            '只玩坚果',
            '增加跟注',
          ],
          correctIndex: 1,
          explanation: '对手弃牌率统计支持"宽范围+小尺度"最大化偷盲 EV，是可计算决策而非感觉。',
        },
        {
          id: 't9hu-pro-study-q3',
          question: '翻牌 A♠8♦3♣（干燥高牌面），加注者的 C-Bet 频率应：',
          options: [
            '大幅下降',
            '高频小额下注整个范围',
            '完全过牌',
            '只看自己牌',
          ],
          correctIndex: 1,
          explanation: '加注者范围优势明显（含大量 Ax），跟注者难中 A，可高频小额 C-Bet 整个下注范围。',
        },
        {
          id: 't9hu-pro-study-q4',
          question: '顶级选手连输多个 60% 全下后仍按同一框架决策，体现的是：',
          options: [
            '固执',
            '把波动视为不可控变量、只控制决策质量的情绪纪律',
            '不在乎输赢',
            '运气好',
          ],
          correctIndex: 1,
          explanation: '顶级选手把波动当外部变量，只控制决策质量，这正是"过程 vs 结果"分离的极致体现。',
        },
        {
          id: 't9hu-pro-study-q5',
          question: '研究职业牌例最有价值的方式是：',
          options: [
            '照抄他们的动作',
            '用决策闭环逐层拆解，提炼可复用原则',
            '只关注他们赢了多少',
            '模仿他们的运气',
          ],
          correctIndex: 1,
          explanation: '逐层拆解（范围/数学/下注/剥削/心理）+ 对照差距 + 提炼原则，才能把职业框架转化为自己的系统。',
        },
      ],
      variant,
      variantRules: headsUpRules,
    },
  ],
};
