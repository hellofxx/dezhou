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
    content: [],
    quiz: [],
    type: 'drill',
    drillComponent: 'OpponentDrill',
  },
];
