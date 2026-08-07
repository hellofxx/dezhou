import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { shortDeckRules } from '../variantRules';

const variant: PokerVariant = 'short-deck';

export const SHORT_DECK_LEVEL_9: TheoryLevelInfo = {
  id: 't9sd',
  level: 9,
  tier: 'advanced',
  title: '短牌理论大师',
  description: '整合所有理论构建完整短牌体系',
  icon: '♦️',
  variant,
  unlockRequirement: '完成 T8SD 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l7sd-deep-stack', title: '短牌深筹码' },
      { id: 'l7sd-shallow-stack', title: '短牌浅筹码' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't9sd-integration',
      level: 9,
      order: 1,
      title: '系统整合',
      subtitle: '从理论到实战的全链路',
      duration: '20 min',
      eloDimension: 'postflop',
      objectives: [
        '把 T1-T8 的短牌知识整合为完整决策闭环',
        '理解短牌理论在不同筹码深度与游戏类型的适用变化',
        '建立个人短牌复盘与学习体系',
      ],
      content: [
        { type: 'heading', content: '从碎片到体系：短牌决策闭环' },
        {
          type: 'text',
          content:
            'T1-T8 的每一章都是短牌体系的积木：T1 概率（36 张组合/outs）、T2 赔率（Ante 制/隐含赔率）、T3 起手（对子>AK/同花）、T4 范围、T5 GTO、T6 下注、T7 对手、T8 心理。短牌大师不是"记住每章"，而是把它们连成决策闭环——面对任何局面，按"范围→数学→下注→对手→心理"自动运转。',
        },
        {
          type: 'key-point',
          content: '短牌决策闭环：先问"我的范围在这个牌面占优吗"（T4），再算"EV 与赔率"（T2），然后"用什么尺度"（T6），接着"对手有什么短牌惯性可剥削"（T7），最后"我情绪稳定吗"（T8）。五问缺一不可。',
        },
        { type: 'heading', content: '理论随场景变形' },
        {
          type: 'text',
          content:
            '短牌理论随两个参数变形：筹码深度与游戏类型。深筹码（100BB+）：范围更宽、下注更极化、听牌追注更积极（隐含赔率好）。短筹码（20BB 以下）：翻前全下更频繁、set mining 门槛调整、位置价值缩小。现金桌：无限重买、波动可管理、以 bb/100 衡量。锦标赛：筹码有限、ICM 压力、策略随阶段调整（详见 l6sd-tourney）。',
        },
        {
          type: 'example',
          content:
            '实例：短牌深筹码 100BB，你持 7♠8♠ 面对 BTN 开池。决策闭环：范围——78s 是短牌投机层（能成同花/顺子）；数学——跟注价格 vs 隐含赔率（成牌价值高）；下注——追听积极但湿润面控池；对手——看他是否有短牌惯性（高估 AK/低估同花）；心理——追听被反超不 tilt。一个决策，五问全过。',
        },
        {
          type: 'example',
          content:
            '实例二（短筹码）：短牌 20BB 深，你持 A♠Q♠。范围——AQ 短牌次级价值；数学——全下 vs min-raise 的 EV；下注——短筹码直接用全下；对手——看弃牌率；心理——接受波动。筹码深度改变同一手牌的打法——短筹码更直接。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌大师的"聪明"不在于每个决策都完美，而在于"系统稳定"。偶尔的失误不可避免，但稳定的决策闭环 + 严格的情绪纪律，让长期期望曲线稳定向上。追求"每手完美"反而导致过度思考与 tilt。',
        },
        {
          type: 'pro-tip',
          content:
            '构建短牌体系四步：学（T1-T8 理论）→ 练（求解器/牌例验证）→ 打（实战执行闭环）→ 复（逐手复盘 + 笔记）。四步循环，你的短牌水平随每个 session 稳定爬升。',
        },
      ],
      quiz: [
        {
          id: 't9sd-integration-q1',
          question: '短牌决策闭环的正确顺序是：',
          options: [
            '下注→范围→数学→心理',
            '范围→数学→下注→对手→心理',
            '心理→范围→下注→数学',
            '只看结果',
          ],
          correctIndex: 1,
          explanation: '闭环：范围（T4）→ 数学（T2）→ 下注（T6）→ 对手（T7）→ 心理（T8），五问缺一不可。',
        },
        {
          id: 't9sd-integration-q2',
          question: '短牌深筹码与短筹码的主要策略差异是：',
          options: [
            '没有差异',
            '深筹码范围宽、追听积极；短筹码翻前全下更频繁、更直接',
            '短筹码范围更宽',
            '深筹码不追听',
          ],
          correctIndex: 1,
          explanation: '深筹码范围宽、追听积极（隐含赔率好）；短筹码翻前全下更频繁、set mining 调整、更直接。',
        },
        {
          id: 't9sd-integration-q3',
          question: '短牌复盘最应关注的是：',
          options: [
            '这手输了多少',
            '决策过程（范围/EV/尺度/对手/情绪）是否正确',
            '赢了多少手',
            '对手多强',
          ],
          correctIndex: 1,
          explanation: '复盘只问过程（决策质量）不问结果（输赢），把每一手牌变成训练，才能持续改进。',
        },
        {
          id: 't9sd-integration-q4',
          question: '短牌短筹码（20BB）持 AQs，最合理的玩法是：',
          options: [
            '复杂多街下注',
            '直接全下或小加注，缩短决策树',
            '过牌看翻牌',
            '弃牌',
          ],
          correctIndex: 1,
          explanation: '短筹码不用多街规划，AQ 对宽范围胜率不错，直接全下或小加注是标准打法。',
        },
        {
          id: 't9sd-integration-q5',
          question: '"系统稳定"比"每手完美"更重要的原因是：',
          options: [
            '完美不可能',
            '稳定的决策闭环+情绪纪律让长期期望稳定向上，追求完美反致过度思考与 tilt',
            '系统稳定更省力',
            '对手更喜欢',
          ],
          correctIndex: 1,
          explanation: '偶尔失误不可避免，稳定的闭环与纪律让长期期望曲线向上；追求"每手完美"反致过度思考与 tilt。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't9sd-case-study',
      level: 9,
      order: 2,
      title: '案例分析',
      subtitle: '职业玩家的短牌决策',
      duration: '25 min',
      eloDimension: 'handReading',
      objectives: [
        '研究职业短牌玩家的决策框架与短牌特有调整',
        '理解顶级玩家的共同特征：短牌思维、频率平衡、情绪稳定',
        '学会从职业短牌案例中提炼可复用方法论',
      ],
      content: [
        { type: 'heading', content: '职业短牌玩家在想什么' },
        {
          type: 'text',
          content:
            '研究职业短牌玩家（如 Triton 系列赛顶级选手）的核心价值，是理解他们的决策框架而非模仿某个动作。顶级短牌玩家的共同特征：短牌思维（outs 重算、牌型排序正确）、频率平衡（不泄露范围）、范围极化（价值对子 + 半诈唬听牌）、情绪稳定（高波动下保持质量）。',
        },
        {
          type: 'key-point',
          content: '职业与业余的分水岭不是运气，而是"决策框架"。职业短牌玩家靠系统（短牌思维 + 频率平衡 + 纪律），业余靠满员桌直觉。研究职业玩家是学习系统，而非抄牌。',
        },
        { type: 'heading', content: '职业短牌决策框架拆解' },
        {
          type: 'text',
          content:
            '顶级短牌玩家的框架通常四层：(1) 翻前范围——对子与同花优先、AK 次之，按对手调整；(2) 翻后范围——按牌面归属（谁的范围优势/坚果优势）决定下注/过牌；(3) 下注尺度——湿润面大尺度保护、干燥面小注；(4) 心理——高波动下保持决策质量。每一层有明确输入输出，而非临场发挥。',
        },
        {
          type: 'example',
          content:
            '实例（翻前范围）：职业短牌玩家面对某 BB 3Bet 过多的对手，会收窄开池范围、减少被 3Bet 后只能弃牌的边缘牌；面对弃牌多的对手，会提高开池频率至接近 100%。这是"按对手倾向微调范围"的可计算决策，而非感觉。',
        },
        {
          type: 'example',
          content:
            '实例二（翻后范围分配）：职业短牌玩家在湿润面（9♦8♣3♥）会用 2/3 池以上大注保护超对，因为在短牌听牌密度高，小注给听牌太便宜。而在干燥面（K♠7♦2♣）用小注薄价值。短牌特有的"湿润面大尺度"是职业与业余的分水岭。',
        },
        {
          type: 'example',
          content:
            '实例三（情绪纪律）：顶级短牌玩家在连输 10 个 45%-55% 全下后，仍按同一框架决策——他们视波动为不可控变量，只控制决策质量。这正是 T8 强调的"过程 vs 结果"分离在职业层面的体现。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：职业短牌研究的价值不在"他们多厉害"，而在"他们的系统有多可复制"。一个业余玩家照职业框架练一个月，往往比"背了十年满员桌感觉"进步更快——因为系统可训练，感觉不可复制。',
        },
        {
          type: 'pro-tip',
          content:
            '研究职业短牌牌例流程：(1) 记录一手牌所有动作；(2) 用决策闭环逐层拆解（范围/数学/下注/对手/心理）；(3) 对照自己的处理找差距；(4) 提炼一条可复用原则。每研究 10 手，你的短牌框架就完整一分。',
        },
      ],
      quiz: [
        {
          id: 't9sd-case-study-q1',
          question: '顶级短牌玩家与业余玩家的核心分水岭是：',
          options: [
            '运气',
            '决策框架（短牌思维+频率平衡+纪律）',
            '天赋',
            '筹码量',
          ],
          correctIndex: 1,
          explanation: '职业靠系统（短牌思维、频率平衡、纪律），业余靠满员桌直觉。',
        },
        {
          id: 't9sd-case-study-q2',
          question: '职业短牌玩家面对 3Bet 过多的对手，会如何调整翻前范围？',
          options: [
            '扩大开池',
            '收窄开池，减少被 3Bet 后只能弃牌的边缘牌',
            '完全停手',
            '无脑全下',
          ],
          correctIndex: 1,
          explanation: '面对 3Bet 过多的对手，边缘牌被 3Bet 后只能弃牌，应收窄开池范围。',
        },
        {
          id: 't9sd-case-study-q3',
          question: '职业短牌玩家在湿润面（9♦8♣3♥）持超对，正确做法是：',
          options: [
            '1/3 池小注',
            '2/3 池以上大注保护（短牌听牌密度高）',
            '过牌',
            '立即弃牌',
          ],
          correctIndex: 1,
          explanation: '短牌湿润面听牌密度高，小注给听牌太便宜，职业玩家用大尺度保护超对。',
        },
        {
          id: 't9sd-case-study-q4',
          question: '顶级短牌玩家连输多个全下后仍按同一框架决策，体现的是：',
          options: [
            '固执',
            '把波动视为不可控变量、只控制决策质量的情绪纪律',
            '不在乎输赢',
            '运气好',
          ],
          correctIndex: 1,
          explanation: '顶级玩家把波动当外部变量，只控制决策质量，是"过程 vs 结果"分离的极致。',
        },
        {
          id: 't9sd-case-study-q5',
          question: '研究职业短牌牌例最有价值的方式是：',
          options: [
            '照抄动作',
            '用决策闭环逐层拆解，提炼可复用原则',
            '只关注赢多少',
            '模仿运气',
          ],
          correctIndex: 1,
          explanation: '逐层拆解 + 对照差距 + 提炼原则，才能把职业框架转化为自己的系统。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
  ],
};
