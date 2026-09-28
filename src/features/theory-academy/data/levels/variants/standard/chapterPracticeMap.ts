import type { PracticeRecommendation } from '../../../../types';

/**
 * 标准变体 35 章的章节级实践推荐（理论→实践桥接的章节粒度层）。
 *
 * 之所以集中在此而非内联进 standardLevelN.ts：章节正文是只增不改的发布内容
 * （id 进 URL 与持久化），而桥接边会随策略学院课程树调整重排；集中一处便于整表复核，
 * 也让 `id 白名单子集` 守卫只需读一个源。由 standard/index.ts 聚合时附加到章节对象。
 *
 * 课时 id 必须落在 data/theoryIntegrity.test.ts 的 EXPECTED_PRACTICE_LESSON_IDS 白名单内
 * （子集断言），且与策略学院权威标题一致（标题仅作 academy.lessonTitle 缺失时的回退）。
 */
const lesson = (id: string, title: string) => ({ id, title });

export const CHAPTER_PRACTICE_RECOMMENDATIONS: Readonly<Record<string, PracticeRecommendation>> = {
  // T1 概率论基础
  't1-combinatorics': { lessons: [lesson('l1-hand-selection', '起手牌选择')] },
  't1-outs': { lessons: [lesson('l3-draws', '听牌处理')] },
  't1-variance': {
    lessons: [lesson('l5-bankroll', '资金管理'), lesson('l5-session-review', 'Session Review 方法论')],
  },

  // T2 期望值与赔率体系
  't2-ev': { lessons: [lesson('l4-ev-thinking', 'EV 思维')] },
  't2-pot-odds': { lessons: [lesson('l3-draws', '听牌处理')] },
  't2-implied-odds': { lessons: [lesson('l4-ev-thinking', 'EV 思维')] },

  // T3 位置理论与起手牌理论
  't3-position-value': { lessons: [lesson('l1-position', '位置的力量')] },
  't3-starting-hands': {
    lessons: [lesson('l1-hand-selection', '起手牌选择'), lesson('l2-raise-sizing', '加注大小')],
  },
  't3-fundamental-theorem': {
    lessons: [lesson('l3-cbet', '持续下注（C-Bet）'), lesson('l3-bet-sizing', '下注尺度理论')],
  },

  // T4 范围理论
  't4-range-thinking': { lessons: [lesson('l4-range-thinking', '范围思维')] },
  't4-combinatorics': { lessons: [lesson('l4-blockers', 'Blocker 效应')] },
  't4-range-advantage': {
    lessons: [lesson('l4-range-construction', '范围建构：极化 vs 合并'), lesson('l4-overbet', 'Overbet 策略')],
  },
  't4-preflop-structure': {
    lessons: [lesson('l2-raise-sizing', '加注大小'), lesson('l4-mdf', '最小防御频率 (MDF)')],
  },

  // T5 博弈论基础
  't5-game-theory': { lessons: [lesson('l4-gto-basics', 'GTO 基础入门')] },
  't5-gto-concept': {
    lessons: [lesson('l4-gto-basics', 'GTO 基础入门'), lesson('l8-exploitative-adjustments', 'Exploitative Adjustments')],
  },
  't5-mdf-alpha': { lessons: [lesson('l4-mdf', '最小防御频率 (MDF)')] },
  't5-mixed-strategy': { lessons: [lesson('l4-frequency-balance', '频率平衡')] },
  't5-multiway-frequency': {
    lessons: [lesson('l7-multiway', '多人底池策略'), lesson('l4-mdf', '最小防御频率 (MDF)')],
  },

  // T6 下注理论
  't6-bet-purpose': {
    lessons: [lesson('l3-cbet', '持续下注（C-Bet）'), lesson('l3-bet-sizing', '下注尺度理论')],
  },
  't6-sizing-theory': {
    lessons: [lesson('l3-bet-sizing', '下注尺度理论'), lesson('l4-overbet', 'Overbet 策略')],
  },
  't6-geometric': { lessons: [lesson('l4-overbet', 'Overbet 策略')] },
  't6-equity-realization': {
    lessons: [lesson('l3-cbet', '持续下注（C-Bet）'), lesson('l3-draws', '听牌处理')],
  },

  // T7 对手分析理论
  't7-stats': { lessons: [lesson('l4-opponent-reading', '对手阅读与剥削策略')] },
  't7-player-types': {
    lessons: [lesson('l4-opponent-reading', '对手阅读与剥削策略'), lesson('l8-pool-tendencies', 'Pool Tendencies 分析')],
  },
  't7-hand-reading': { lessons: [lesson('l4-range-thinking', '范围思维')] },
  't7-exploit': {
    lessons: [lesson('l8-exploitative-adjustments', 'Exploitative Adjustments'), lesson('l8-pool-tendencies', 'Pool Tendencies 分析')],
  },

  // T8 扑克心理学
  't8-tilt': { lessons: [lesson('l5-tilt', '情绪管理（Tilt Control）')] },
  't8-session': {
    lessons: [lesson('l5-session-review', 'Session Review 方法论'), lesson('l5-tilt', '情绪管理（Tilt Control）')],
  },
  't8-bankroll-psych': { lessons: [lesson('l5-bankroll', '资金管理')] },
  't8-mindset': { lessons: [lesson('l5-session-review', 'Session Review 方法论')] },

  // T9 经典理论综合
  't9-mop': {
    lessons: [lesson('l4-ev-thinking', 'EV 思维'), lesson('l4-frequency-balance', '频率平衡')],
  },
  't9-icm': { lessons: [lesson('l6-icm', 'ICM 基础')] },
  't9-multiway': { lessons: [lesson('l7-multiway', '多人底池策略')] },
  't9-alpha': {
    lessons: [lesson('l4-mdf', '最小防御频率 (MDF)'), lesson('l8-exploitative-adjustments', 'Exploitative Adjustments')],
  },
  't9-unified': {
    lessons: [lesson('l8-pool-tendencies', 'Pool Tendencies 分析'), lesson('l4-gto-basics', 'GTO 基础入门')],
  },
};
