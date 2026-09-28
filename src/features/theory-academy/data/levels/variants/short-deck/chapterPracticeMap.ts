import type { PracticeRecommendation } from '../../../../types';

/**
 * 短牌变体全部章节的章节级实践推荐（理论→实践桥接的章节粒度层）。
 *
 * 与标准变体的两条差异同 `heads-up/chapterPracticeMap.ts`：目标以短牌专属课
 * （`l<n>sd-*`）为主、入门章节复用变体无关的共享地基课；且变体课时 id 没有
 * 白名单可进，引用完整性由 `strategy-academy/data/theoryVariantBridgeIntegrity.test.ts`
 * 反向断言（存在性 + 回退标题与权威一致）。
 */
const lesson = (id: string, title: string) => ({ id, title });

export const CHAPTER_PRACTICE_RECOMMENDATIONS: Readonly<Record<string, PracticeRecommendation>> = {
  // T1 组合计数与波动
  't1sd-combinatorics': {
    lessons: [lesson('l4sd-nuts-equity', '坚果与权益计算'), lesson('l1-hand-selection', '起手牌选择')],
  },
  't1sd-outs': { lessons: [lesson('l3-draws', '听牌处理')] },
  't1sd-variance': { lessons: [lesson('l5sd-bankroll', '短牌资金管理')] },

  // T2 赔率体系
  't2sd-potodds': { lessons: [lesson('l4sd-nuts-equity', '坚果与权益计算')] },
  't2sd-implied': { lessons: [lesson('l7sd-deep-stack', '短牌深筹码')] },
  't2sd-reverse': { lessons: [lesson('l7sd-shallow-stack', '短牌浅筹码')] },

  // T3 牌力重排与位置
  't3sd-rankings': {
    lessons: [lesson('l3sd-intro', '短牌德州入门'), lesson('l4sd-preflop-ranges', '短牌翻前范围')],
  },
  't3sd-suitedness': { lessons: [lesson('l4sd-preflop-ranges', '短牌翻前范围')] },
  't3sd-position': { lessons: [lesson('l3sd-cbet', '短牌持续下注')] },

  // T4 范围与权益
  't4sd-range-construction': { lessons: [lesson('l4sd-preflop-ranges', '短牌翻前范围')] },
  't4sd-equity': { lessons: [lesson('l4sd-nuts-equity', '坚果与权益计算')] },
  't4sd-blockers': { lessons: [lesson('l4sd-blocker-bluff', '阻断牌诈唬')] },

  // T5 博弈平衡
  't5sd-gto-short': { lessons: [lesson('l4sd-gto-fundamentals', '短牌 GTO 基础')] },
  't5sd-bluff': {
    lessons: [lesson('l4sd-blocker-bluff', '阻断牌诈唬'), lesson('l4sd-gto-fundamentals', '短牌 GTO 基础')],
  },
  't5sd-mixed-strategy': {
    lessons: [lesson('l4sd-solver-readout', 'Solver 结果解读'), lesson('l4sd-gto-fundamentals', '短牌 GTO 基础')],
  },

  // T6 下注策略
  't6sd-sizing': { lessons: [lesson('l3sd-cbet', '短牌持续下注')] },
  't6sd-barrel': {
    lessons: [lesson('l3sd-cbet', '短牌持续下注'), lesson('l3sd-check-raise', '短牌过牌加注')],
  },
  't6sd-equity-realization': {
    lessons: [lesson('l4sd-nuts-equity', '坚果与权益计算'), lesson('l7sd-deep-stack', '短牌深筹码')],
  },

  // T7 对手阅读
  't7sd-mistakes': { lessons: [lesson('l8sd-exploit-i', '短牌剥削（一）')] },
  't7sd-adjustment': {
    lessons: [lesson('l8sd-exploit-i', '短牌剥削（一）'), lesson('l8sd-exploit-ii', '短牌剥削（二）')],
  },
  't7sd-hud': {
    lessons: [lesson('l8sd-exploit-i', '短牌剥削（一）'), lesson('l8sd-exploit-ii', '短牌剥削（二）')],
  },

  // T8 心理管理
  't8sd-variance': { lessons: [lesson('l5sd-bankroll', '短牌资金管理')] },
  't8sd-tilt': { lessons: [lesson('l5sd-tilt-control', '短牌情绪控制')] },

  // T9 理论整合
  't9sd-integration': {
    lessons: [lesson('l4sd-solver-readout', 'Solver 结果解读'), lesson('l7sd-deep-stack', '短牌深筹码')],
  },
  't9sd-case-study': {
    lessons: [lesson('l8sd-exploit-ii', '短牌剥削（二）'), lesson('l6sd-tourney-i', '短牌锦标赛（一）')],
  },
};
