import type { PracticeRecommendation } from '../../../../types';

/**
 * 单挑变体全部章节的章节级实践推荐（理论→实践桥接的章节粒度层）。
 *
 * 与标准变体的两条差异：
 * 1. 目标课时以单挑专属课（`l<n>hu-*`）为主，入门章节复用变体无关的共享地基课
 *    （策略学院的 L1/L2 是三变体共用的通用地基，经 getLessonsByVariantAndLevel 自动回退）；
 * 2. **没有机器白名单可复用**——变体课时不在策略学院 `LEVELS` 内，
 *    既不能进 `CROSS_MODULE_LESSON_IDS` 也不能进 `EXPECTED_PRACTICE_LESSON_IDS`。
 *    引用完整性由 `strategy-academy/data/theoryVariantBridgeIntegrity.test.ts` 保证
 *    （反向扫描本表引用的 id，对 `ALL_VARIANT_LESSONS` 断言存在，并核对回退标题）。
 *
 * 标题字面量只是 i18n 缺 key 时的回退，须与 `academy.lessonTitle.*` 权威值一致
 * （尾部消歧括号可省略，守卫按去后缀比对）。
 */
const lesson = (id: string, title: string) => ({ id, title });

export const CHAPTER_PRACTICE_RECOMMENDATIONS: Readonly<Record<string, PracticeRecommendation>> = {
  // T1 概率与波动
  't1hu-probability': { lessons: [lesson('l1-hand-selection', '起手牌选择')] },
  't1hu-outs': { lessons: [lesson('l3-draws', '听牌处理')] },
  't1hu-variance': { lessons: [lesson('l7hu-stakes', '单挑策略基础')] },

  // T2 赔率与风险
  't2hu-odds': { lessons: [lesson('l3hu-bb-defense', 'BB 防守')] },
  't2hu-ev': { lessons: [lesson('l4hu-ev-adjustments', 'EV 调整')] },
  't2hu-risk': { lessons: [lesson('l4hu-counter-strategies', '反制策略')] },

  // T3 位置动态
  't3hu-sb-strategy': {
    lessons: [lesson('l3hu-bn-aggression', '按钮位激进度'), lesson('l3hu-sb-continuation', 'SB 持续下注')],
  },
  't3hu-bb-defense': { lessons: [lesson('l3hu-bb-defense', 'BB 防守')] },
  't3hu-position-reversal': {
    lessons: [lesson('l3hu-bn-aggression', '按钮位激进度'), lesson('l3hu-sb-continuation', 'SB 持续下注')],
  },

  // T4 范围与挡牌
  't4hu-range-width': { lessons: [lesson('l4hu-bn-opening', '按钮位开局加注')] },
  't4hu-polarization': { lessons: [lesson('l4hu-gto-basics', '单挑 GTO 基础')] },
  't4hu-blocking': { lessons: [lesson('l4hu-counter-strategies', '反制策略')] },

  // T5 博弈论
  't5hu-gto-he': { lessons: [lesson('l4hu-gto-basics', '单挑 GTO 基础')] },
  't5hu-frequency': {
    lessons: [lesson('l4hu-gto-basics', '单挑 GTO 基础'), lesson('l3hu-sb-continuation', 'SB 持续下注')],
  },

  // T6 下注工程
  't6hu-sizing-optimal': { lessons: [lesson('l3hu-sb-continuation', 'SB 持续下注')] },
  't6hu-barrel': { lessons: [lesson('l3hu-sb-continuation', 'SB 持续下注'), lesson('l3hu-bn-aggression', '按钮位激进度')] },

  // T7 对手剥削
  't7hu-patterns': { lessons: [lesson('l5hu-opponent-psychology', '对手心理')] },
  't7hu-exploit': { lessons: [lesson('l8hu-exploitative', '单挑剥削打法')] },

  // T8 心理战
  't8hu-pressure': { lessons: [lesson('l5hu-focus', '单挑专注力')] },
  't8hu-reads': { lessons: [lesson('l5hu-opponent-psychology', '对手心理')] },

  // T9 整合
  't9hu-mastery': { lessons: [lesson('l7hu-stakes', '单挑策略基础')] },
  't9hu-pro-study': { lessons: [lesson('l8hu-exploitative', '单挑剥削打法')] },
};
