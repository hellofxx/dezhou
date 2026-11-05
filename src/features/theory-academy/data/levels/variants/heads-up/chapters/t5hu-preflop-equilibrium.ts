import type { TheoryChapter } from '../../../../../types';
import { headsUpRules } from '../../variantRules';

// T5 新章：单挑翻前均衡（单挑）。
// 参与率、防守率与继续率都是价格线的推论；边界手牌的相邻动作 EV 相等。
export const HEADS_UP_CHAPTERS: TheoryChapter[] = [
  {
    id: 't5hu-preflop-equilibrium',
    level: 5,
    order: 4,
    title: '单挑翻前均衡',
    subtitle: '参与率、防守率与继续率背后的三条价格线',
    duration: '14 min',
    eloDimension: 'preflop',
    objectives: [
      '拆解 SB 的参与率与 BB 的防守率，说明两者由哪些动作段构成',
      '按无差别原则识别临界手牌，并解释为什么它们在均衡里被混合使用',
      '说明 limp 与 min-raise 在均衡里的分工，以及 3-bet、4-bet 各自的构型',
    ],
    content: [
      { type: 'heading', content: '两张范围，一层一层的价格' },
      {
        type: 'text',
        content:
          '单挑翻前均衡的骨架是两条频率：SB 的参与率约 80%（其中加注约 55%-65%、limp 约 15%-25%，其余弃牌），BB 面对 min-raise 的防守率约 62%（其中 3-bet 约 18%、跟注约 44%）。这两个数字不是风格偏好，而是价格线的推论——把参与率当成"加注率"来读，就会高估对手的弃牌率。',
      },
      {
        type: 'key-point',
        content:
          '均衡的标志是无差别临界手牌：在边界上，相邻两个动作的 EV 相等，所以任何混合比例都不改变期望。均衡里没有"这手牌永远这样打"，只有"这手牌两边一样赚"。',
      },
      {
        type: 'formula',
        content:
          '三个节点的价格（100BB 深，盲注 0.5/1）：\n\nSB limp 到 1.5BB 底池，BB 加注 1BB → Alpha = 1 ÷ (1+1.5) = 40%\nSB min-raise 到 2BB，BB 跟注 1BB → 所需权益 1 ÷ 4 = 25%\nBB 3-bet 到 6BB → Alpha = 5 ÷ 8 = 62.5%，SB 需防 37.5%（约 8% 的 4-bet + 约 29.5% 的跟注）',
      },
      {
        type: 'example',
        content:
          '数值：起手牌组合总数为 1326。BB 防守 62% 约等于 822 个组合（1326 × 0.62 ≈ 822.1）；拆开看，3-bet 约 18% 约 239 个组合（1326 × 0.18 ≈ 238.7），跟注约 44% 约 583 个组合（1326 × 0.44 ≈ 583.4），239 + 583 正好落在 822 上。频率与组合数是同一件事的两种写法。',
      },
      {
        type: 'example',
        content:
          '数值：SB 面对 3-bet 要防 37.5%，而开池范围本身是 80%，两者相乘得到 80% × 37.5% = 30%——即起手牌总量里约三成会进入继续范围。这个乘法就是"频率的复合"：面对 3-bet 的继续率不是独立数字，而是开池率与防守率的乘积。',
      },
      { type: 'heading', content: 'limp 与 min-raise 的分工' },
      {
        type: 'text',
        content:
          'SB 把范围拆成 limp 段与加注段：limp 用 0.5 保留最宽范围与翻后最后行动，强牌与弱牌共享同一个 limp 范围，BB 的加注无法只针对弱牌；加注段负责给 limp 段提供保护，也让强牌在被跟注时能直接把底池做大。BB 一侧则把 3-bet 做成极化结构——顶端价值加带阻断的诈唬，中间牌平跟去实现权益；SB 被 3-bet 之后用 4-bet 保护开池范围，剩下的跟注段靠位置把权益兑现。',
      },
      {
        type: 'highlight',
        content:
          '反直觉点：单挑说的"紧"是频率意义上的紧——面对 4-bet 时弃牌比例很高，而不是范围很窄。参与率 80% 的一方，在被 4-bet 的节点上会弃掉绝大部分范围，这正是"宽范围 + 高弃牌率"而不是"紧范围"的组合。',
      },
      {
        type: 'takeaway',
        content:
          '三个数字撑起单挑翻前：参与率 80%、面对 min-raise 防守 62%、面对 3-bet 继续 37.5%。把每个数字拆成动作段，再按无差别原则给边界手牌分配频率，翻前策略就从牌表变成了价格。',
      },
    ],
    quiz: [],
    variant: 'heads-up',
    variantRules: headsUpRules,
  },
];
