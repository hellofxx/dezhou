import type { Lesson } from '../../types';

/**
 * P2-1.8：对手画像识别 Drill（本土路径模块 4.5，综合训练）
 *
 * 题库为 data/opponentProfiles.ts 的 OPPONENT_DRILL_QUESTIONS（8 题双问结构），
 * 由 components/drills/OpponentDrill.tsx 渲染。
 */
export const OPP_DRILL_LESSONS: Lesson[] = [
  {
    id: 'opp-drill',
    level: 7,
    // 与 local-gto-vs-exploit 并列 order 17，LOCAL_LESSONS 中位于其前（稳定排序保证展示顺序）
    order: 17,
    title: '对手画像识别 Drill',
    subtitle: '根据 VPIP/PFR/AF 等数据判断对手类型，并选择最优剥削策略',
    duration: '8 min',
    objectives: [
      '依据 VPIP/PFR/AF/3-bet 等统计数值识别对手类型（跟注站、Maniac、Nit、LAG、TAG、未知）',
      '比较相似类型的核心差异（LAG 有逻辑会弃牌而 Maniac 不弃牌、TAG 接近均衡），并判断给定数据对应的类型',
      '给出面对特定类型时的最优剥削策略（跟注站纯价值、Maniac 紧凶陷阱、Nit 偷盲诈唬、LAG 4-Bet 与位置压制）',
      '判断样本不足时（如仅数十手）应使用 GTO 默认策略积累数据，而非急于剥削',
    ],
    content: [],
    quiz: [],
    type: 'drill',
    drillComponent: 'OpponentDrill',
  },
];
