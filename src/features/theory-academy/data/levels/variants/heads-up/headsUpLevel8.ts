import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { headsUpRules } from '../variantRules';
import { HEADS_UP_CHAPTERS as TILT_TYPES_CHAPTERS } from './chapters/t8hu-tilt-types';
import { HEADS_UP_CHAPTERS as SESSION_PSYCH_CHAPTERS } from './chapters/t8hu-session';

const variant: PokerVariant = 'heads-up';

export const HEADS_UP_LEVEL_8: TheoryLevelInfo = {
  id: 't8hu',
  level: 8,
  tier: 'advanced',
  title: '单挑心理战',
  description: '在高压一对一环境中保持心理优势',
  icon: '👤',
  variant,
  unlockRequirement: '完成 T7HU 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l5hu-focus', title: '单挑专注力' },
      { id: 'l5hu-opponent-psychology', title: '对手心理' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't8hu-pressure',
      level: 8,
      order: 1,
      title: '压力管理',
      subtitle: '单挑的持续紧张感应对',
      duration: '12 min',
      eloDimension: 'mental',
      objectives: [
        '理解单挑高频对抗下的波动密度与情绪触发机制',
        '掌握避免 tilt（情绪失控）的策略与自我觉察方法',
        '学会用"过程 vs 结果"分离保持长期决策质量',
      ],
      content: [
        { type: 'heading', content: '单挑：情绪的极限测试' },
        {
          type: 'text',
          content:
            '单挑是扑克中情绪压力最大的形式：每手牌都在盲注位、每小时 200+ 手、波动浓缩、没有队友分担、对手全程盯着你。连续输掉 8-10 个全下是数学常态（T1 的 55%-60% 全下胜率意味着 0.45^8 ≈ 0.17% 的连败常出现）。在这种环境下，情绪管理（Emotion Management）与策略本身同等重要——一个 tilt 的决策能抹掉数小时的正 EV。',
        },
        {
          type: 'key-point',
          content:
            '单挑下风期不是异常，是必然。把连续输牌当成"天气"而非"审判"，才能避免在波动最剧烈时做出最差的策略调整。',
        },
        { type: 'heading', content: 'tilt 的机制与防线' },
        {
          type: 'text',
          content:
            'Tilt（情绪失控）源于三个触发：结果依赖（赢了开心、输了痛苦）、期望落空（"我该赢的"）、报复心理（"下一把一定要赢回来"）。tilt 的可怕在于它会扭曲你的范围——你会开池更松、跟注更宽、追听更凶，全部偏离基线。防线有三：(1) 自我觉察——设定"情绪红灯"（连续 N 手想报复、想加注翻本）并强制暂停；(2) 预先承诺——桌外定好止损点，到点就离桌；(3) 过程归因——只复盘决策的 EV 是否正确，不因结果好坏改变打法。',
        },
        {
          type: 'example',
          content:
            '实例：单挑你连输 6 个 60% 胜率的全下（概率 0.4^6 ≈ 0.4%，虽低但每小时遇到几次）。此时你的理智知道"打对了"，但情绪想"翻本"。若你继续加大尺度追回损失，就是典型的 tilt 循环。正确做法：识别到报复冲动 → 暂停 10 分钟 → 重新用"这手牌 EV 是多少"而非"我要赢回来"来决策。',
        },
        {
          type: 'example',
          content:
            '实例二（过程 vs 结果）：你持 AK 对 55 全下，55 胜出。结果：你输了。过程：AK 对 55 约 43% 胜率，全下 EV 取决于底池赔率，若赔率合适则 +EV，打对了。单挑高手复盘只看过程："这个决策 EV 对吗？"而 tilt 玩家只看结果："我又输给垃圾牌了。"两者的长期差异是天文数字。',
        },
        {
          type: 'formula',
          content:
            '单挑波动预算（Tendler 的心理管理框架）：\n\n单次全下标准差 σ = √(p(1−p)) × 池底（伯努利近似）\nN 手累计波动 = σ×√N，期望 = N×边际胜率×池底\n\n例：p=60%、池底 100、边际 20：\n期望(50 手) = 50×0.2×100 = 1000\n波动(50 手) = 49×√50 ≈ 346\n\n结论：即使期望为正，单挑中"赢家长期回撤"也是常态——这是心理压力的数学根源，也是你需预设波动预算的原因。（概念源自：《The Mental Game of Poker》Jared Tendler Ch.4 波动耐受与情绪）',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：tilt 最危险的不是"输钱时的冲动"，而是"赢钱后的松懈"。赢了几手后玩家常放松警惕、开始玩边缘牌，把优势送回去。单挑的纪律必须全程一致，无论牌势顺逆。',
        },
        {
          type: 'pro-tip',
          content:
            '单挑 session 管理三件套：(1) 预设波动预算——输 40-50BB 即暂停复盘，是止损重开而非翻本；(2) 每 100 手起身一次，切断连败的心理惯性；(3) 复盘只问 EV 不问结果。',
        },
      ],
      quiz: [],
      variant,
      variantRules: headsUpRules,
    },
    {
      id: 't8hu-reads',
      level: 8,
      order: 2,
      title: '心理读取',
      subtitle: '观察与反观察的技巧',
      duration: '10 min',
      eloDimension: 'mental',
      objectives: [
        '理解线下物理读取（tell）与线上频率读取的区别与局限',
        '掌握反读取（平衡自己的动作，避免泄露范围）',
        '学会用"叙事一致性"判断对手意图，避免过拟合',
      ],
      content: [
        { type: 'heading', content: '读取：把观察变成信息' },
        {
          type: 'text',
          content:
            '读取（Read）分为两类：线下物理读取（Physical Tells——下注手势、肢体、眼神）与线上频率读取（Frequency Reads——下注节奏、时间、尺度）。单挑中读取的价值高，但陷阱也多：物理 tell 被反制（对手演戏）、频率 tell 样本不足。最可靠的是把"观察"与"动作叙事"结合——对手的动作序列是否讲一个自洽的故事。',
        },
        {
          type: 'key-point',
          content:
            '最好的读取是"动作一致性"：一个对手翻牌转牌都过牌、河牌突然超池全下，他的叙事是"我有坚果"。若这个叙事与他的频率统计矛盾，就是读取信号。',
        },
        { type: 'heading', content: '反读取：平衡你的动作' },
        {
          type: 'text',
          content:
            '你在读对手，对手也在读你。反读取（Balanced Play）要求你的动作不泄露范围信息：不要因为"这手牌强"就下注快、因为"在诈唬"就犹豫。单挑中对手盯着你的每一个节奏，无意识的"强牌下注快、弱牌下注慢"是经典的泄露。专业玩家的反读取是刻意保持动作节奏一致，或用混合频率掩盖。',
        },
        {
          type: 'example',
          content:
            '实例：线上单挑，对手转牌面对你的下注思考了 20 秒才跟注。频率读取：思考时间长 = 他在艰难决策，可能边缘牌（跟注站特征）或听牌。但样本不足时，这可能是演戏。正确做法是交叉验证：他面对大注的跟注倾向、他河牌的摊牌选择，综合判断而非单独依赖一次节奏。',
        },
        {
          type: 'example',
          content:
            '实例二（反读取）：你持 AA，翻牌下注时注意自己的节奏。若你因为"我有强牌"而下注飞快、又因为"我在诈唬"而下注犹豫，对手会很快破解。反读取练习：规定自己所有下注用相同思考时间，或在关键时刻刻意打乱节奏（强牌也犹豫、诈唬也果断）。',
        },
        {
          type: 'example',
          content:
            '实例三（叙事一致性）：对手翻牌下注、转牌下注、河牌过牌。叙事：翻牌转牌有牌力、河牌放弃。若他河牌过牌但下注尺度反常（翻牌大注、河牌小注），结合他的频率，可能是"薄价值"而非"放弃"。读取要结合"动作序列"与"频率统计"，单一动作不作数。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：读取的敌人不是"读错"，而是"过度自信"。单挑高手会承认"这个读取只有 60% 把握"并据此下注，而不是"我确定他有什么"。把读取转化为概率而非确定性，才是可持续的策略。',
        },
        {
          type: 'pro-tip',
          content:
            '读取纪律：(1) 只用统计显著的频率（50+ 手样本）下结论；(2) 结合动作叙事与频率交叉验证；(3) 承认读取的不确定性，把它折入胜率与赔率计算。三件事做完，读取就从玄学变成数学。',
        },
      ],
      quiz: [],
      variant,
      variantRules: headsUpRules,
    },
    ...TILT_TYPES_CHAPTERS,
    ...SESSION_PSYCH_CHAPTERS,
  ],
};

// ========== T9: 经典理论综合（单挑版）==========
