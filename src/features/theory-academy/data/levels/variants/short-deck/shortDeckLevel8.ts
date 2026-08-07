import type { TheoryLevelInfo } from '../../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { shortDeckRules } from '../variantRules';

const variant: PokerVariant = 'short-deck';

export const SHORT_DECK_LEVEL_8: TheoryLevelInfo = {
  id: 't8sd',
  level: 8,
  tier: 'advanced',
  title: '短牌心理管理',
  description: '应对短牌的高波动情绪挑战',
  icon: '♦️',
  variant,
  unlockRequirement: '完成 T7SD 全部章节',
  practiceRecommendations: {
    lessons: [
      { id: 'l5sd-tilt-control', title: '短牌情绪控制' },
      { id: 'l5sd-bankroll', title: '短牌资金管理' },
    ],
    trackId: undefined,
  },
  chapters: [
    {
      id: 't8sd-variance',
      level: 8,
      order: 1,
      title: '波动承受',
      subtitle: '心理韧性的培养',
      duration: '12 min',
      eloDimension: 'mental',
      objectives: [
        '理解短牌高波动对心理韧性的考验',
        '掌握承受短牌波动的心理策略与波动预算',
        '学会在短牌高频波动中保持决策质量',
      ],
      content: [
        { type: 'heading', content: '短牌波动：心理韧性的试金石' },
        {
          type: 'text',
          content:
            '短牌的波动显著高于标准德州（翻牌率/听牌/底池大），心理韧性是短牌玩家的核心资产。连续输掉多个 45%-55% 全下在短牌中是数学常态。承受波动的关键不是"忍住不哭"，而是"把波动视为不可控的外部变量，只控制决策质量"。',
        },
        {
          type: 'key-point',
          content: '短牌波动承受铁律：波动是不可控的天气，决策质量是可控的能力。把连败当天气而非审判，才能在波动中保持策略不扭曲。',
        },
        { type: 'heading', content: '波动预算与心理韧性' },
        {
          type: 'formula',
          content:
            '短牌波动预算（心理韧性框架）：\n\n单次全下标准差 σ = √(p(1−p)) × 池底\n短牌全下胜率 p 多落在 45%-55%，σ 相对高\n\nN 手累计波动 = σ×√N，期望 = N×边际胜率×池底\n\n实例：p=50%、池底 100：\nσ = √(0.5×0.5)×100 = 50\n50 手累计波动 = 50×√50 ≈ 354，期望 0\n\n结论：即使 EV 中性，短牌 50 手也可能波动 ±350 筹码——波动预算是心理承受的数学基础。（概念源自：The Mathematics of Poker 波动框架 + 短牌高波动）',
        },
        {
          type: 'text',
          content:
            '短牌心理韧性的实践：预设波动预算（输 40-50BB 暂停）、用决策日志替代输赢日志、接受"短牌波动是结构使然"。韧性不是"扛住更大的输"，而是"在输赢都剧烈时保持同样的决策质量"。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你以 50% 胜率连续全下 8 手（听牌对成牌频繁碰撞），连输 8 手概率 0.5^8 ≈ 0.4%，短牌每小时全下频繁，一个 session 可能遇到。你的理智知道"EV 中性"，但情绪想"翻本"。正确做法：识别报复冲动 → 暂停 → 重新用"这手 EV 是多少"决策。',
        },
        {
          type: 'example',
          content:
            '实例二（波动预算执行）：短牌 session 你已输 45BB（接近预算 50BB）。虽牌势仍可，但执行"输 50BB 即暂停"——因为继续可能在波动最剧烈时做最差调整。止损重开，而非翻本追加。',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌波动承受最难的是"赢钱后的松懈"。赢了几手后玩家常放松警惕、开始玩边缘牌，把优势送回去。短牌纪律必须全程一致，无论牌势顺逆。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌波动承受三件套：(1) 预设波动预算（输 40-50BB 暂停）；(2) 用决策日志代替输赢日志；(3) 每 100 手起身切断连败惯性。三件事让波动不再左右你的策略。',
        },
      ],
      quiz: [
        {
          id: 't8sd-variance-q1',
          question: '承受短牌波动的核心是：',
          options: [
            '忍住不哭',
            '把波动视为不可控变量，只控制决策质量',
            '加注翻本',
            '完全停手',
          ],
          correctIndex: 1,
          explanation: '波动是不可控的天气，决策质量是可控的能力。承受波动的关键是保持策略不扭曲。',
        },
        {
          id: 't8sd-variance-q2',
          question: '短牌连续输掉多个 50% 全下的正确理解是：',
          options: [
            '运气差到极点',
            '高频对抗下的数学常态，应保持决策质量',
            '打得不好',
            '对手作弊',
          ],
          correctIndex: 1,
          explanation: '短牌高频全下，0.5^N 的连败是数学常态，应保持决策质量而非怀疑水平。',
        },
        {
          id: 't8sd-variance-q3',
          question: '"输 50BB 即暂停"的波动预算是为了：',
          options: [
            '限制最多能输多少',
            '止损重开，避免翻本式追加',
            '确保每次都赢',
            '计算期望',
          ],
          correctIndex: 1,
          explanation: '波动预算是止损纪律，输到预算点暂停，切断"翻本"冲动，避免在波动剧烈时做差调整。',
        },
        {
          id: 't8sd-variance-q4',
          question: '短牌波动承受最难的情况是：',
          options: [
            '连续输牌',
            '赢钱后的松懈（放松警惕玩边缘牌）',
            '平局',
            '牌发得慢',
          ],
          correctIndex: 1,
          explanation: '赢钱后的松懈最危险——玩家放松警惕玩边缘牌，把优势送回去。短牌纪律须全程一致。',
        },
        {
          id: 't8sd-variance-q5',
          question: '短牌心理韧性的最佳复盘方式是：',
          options: [
            '只看输赢',
            '用决策日志记录推理，只问 EV 不问结果',
            '只复盘赢的牌',
            '不复盘',
          ],
          correctIndex: 1,
          explanation: '用决策日志记录每个关键决策的推理，只问 EV 不问结果，才能在波动中保持质量。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
    {
      id: 't8sd-tilt',
      level: 8,
      order: 2,
      title: '情绪控制',
      subtitle: '防止 tilt 连锁反应',
      duration: '10 min',
      eloDimension: 'mental',
      objectives: [
        '理解短牌高波动下 tilt 的高发机制',
        '掌握避免 tilt 的自我觉察与预设纪律',
        '学会用"过程 vs 结果"分离控制情绪',
      ],
      content: [
        { type: 'heading', content: '短牌 tilt：高波动的情绪陷阱' },
        {
          type: 'text',
          content:
            '短牌是 tilt 的高发区：高波动、翻牌率高、底池大、胜负交替剧烈。tilt 源于三个触发：结果依赖、期望落空、报复心理。短牌中因波动大、连败常见，tilt 更容易被触发。tilt 会扭曲你的范围（开池过松、跟注过宽、追听过凶），系统性偏离基线。',
        },
        {
          type: 'key-point',
          content: '短牌 tilt 防线三件套：自我觉察（设情绪红灯）、预设纪律（止损点）、过程归因（只问 EV）。防线在桌外建立，tilt 时才来得及用。',
        },
        { type: 'heading', content: 'tilt 机制与防线' },
        {
          type: 'text',
          content:
            'tilt 的可怕在于它扭曲范围：你会开池更松、跟注更宽、追听更凶，全部偏离均衡。防线有三：(1) 自我觉察——设定"情绪红灯"（连续 N 手想报复/加注翻本）并强制暂停；(2) 预先承诺——桌外定好止损点，到点就离桌；(3) 过程归因——只复盘决策 EV 是否正确，不因结果好坏改变打法。',
        },
        {
          type: 'example',
          content:
            '实例：短牌你连输 6 个 50% 全下（概率 0.5^6 ≈ 1.6%，短牌每小时遇到几次）。理智知道"打对了"，情绪想"翻本"。若你加大尺度追回损失，就是 tilt 循环。正确做法：识别报复冲动 → 暂停 10 分钟 → 重新用"这手牌 EV 是多少"决策。',
        },
        {
          type: 'example',
          content:
            '实例二（过程 vs 结果）：短牌你持 AK 对 55 全下（短牌 AK 对 55 约 43%-45%），55 胜出。结果你输了，但过程：若底池赔率合适，跟注 +EV，打对了。短牌高手复盘只看过程："这个决策 EV 对吗？"而 tilt 玩家只看结果："我又输给垃圾牌了。"',
        },
        {
          type: 'highlight',
          content:
            '反直觉点：短牌 tilt 最危险的不是"输钱时的冲动"，而是"赢钱后的松懈"。赢了几手后放松警惕、玩边缘牌，把优势送回去。短牌纪律必须全程一致，无论牌势顺逆。',
        },
        {
          type: 'pro-tip',
          content:
            '短牌 tilt 控制三件套：(1) 情绪红灯——连续 N 手想报复即暂停；(2) 预设止损——输 40-50BB 离桌；(3) 过程归因——复盘只问 EV。三件事在桌外建立，tilt 时才来得及用。',
        },
      ],
      quiz: [
        {
          id: 't8sd-tilt-q1',
          question: '短牌是 tilt 高发区的原因是：',
          options: [
            '牌发得慢',
            '高波动、翻牌率高、底池大、胜负交替剧烈',
            '规则复杂',
            '没有原因',
          ],
          correctIndex: 1,
          explanation: '短牌高波动、翻牌率高、底池大、胜负交替剧烈，tilt 更容易被触发。',
        },
        {
          id: 't8sd-tilt-q2',
          question: 'tilt 对范围最典型的破坏是：',
          options: [
            '让范围收紧',
            '开池过松、跟注过宽、追听过凶',
            '让打法更保守',
            '没有影响',
          ],
          correctIndex: 1,
          explanation: 'tilt 扭曲范围：开池过松、跟注过宽、追听过凶，系统性偏离均衡基线。',
        },
        {
          id: 't8sd-tilt-q3',
          question: '"过程 vs 结果"分离的核心是：',
          options: [
            '赢钱才算对',
            '复盘只看决策 EV，不因结果改变打法',
            '输钱就改策略',
            '过程不重要',
          ],
          correctIndex: 1,
          explanation: '复盘只看过程（决策 EV）而非结果（输赢），才能保持长期质量。',
        },
        {
          id: 't8sd-tilt-q4',
          question: '短牌 tilt 防线三件套是：',
          options: [
            '情绪红灯、预设止损、过程归因',
            '只靠意志力',
            '加注翻本',
            '完全停手',
          ],
          correctIndex: 0,
          explanation: '自我觉察（情绪红灯）、预设纪律（止损点）、过程归因（只问 EV）三件套，桌外建立。',
        },
        {
          id: 't8sd-tilt-q5',
          question: '关于短牌 tilt 的高发时点，正确的说法是：',
          options: [
            '只在连续输牌时',
            '赢钱后的松懈同样危险',
            '从不发生',
            '只在锦标赛',
          ],
          correctIndex: 1,
          explanation: '赢钱后的松懈同样危险——放松警惕玩边缘牌，把优势送回去。纪律须全程一致。',
        },
      ],
      variant,
      variantRules: shortDeckRules,
    },
  ],
};

// ========== T9: 经典理论综合（短牌版）==========
