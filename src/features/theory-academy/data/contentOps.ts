import type { TheoryContentOps } from '../types';

/**
 * 内容运营元数据（纯前端静态数据，无后端）。
 *
 * lastReviewed：章节目录的最近一次人工校对日期（ISO 8601，YYYY-MM-DD）。
 * 发现层用它展示「内容新鲜度」；新增/修改章节正文或题库时同步刷新对应条目。
 * 本文件只记录日期，不记录校对人与变更说明（那些属于提交历史与 CHANGELOG）。
 */
export const THEORY_CONTENT_OPS: TheoryContentOps = {
  lastReviewed: {
    // T1 概率论基础
    't1-combinatorics': '2026-11-02',
    't1-outs': '2026-11-02',
    't1-variance': '2026-11-02',
    't1-sixmax-table': '2026-11-02',
    // T2 期望值与赔率体系
    't2-ev': '2026-11-02',
    't2-pot-odds': '2026-11-02',
    't2-implied-odds': '2026-11-02',
    // T3 位置与起手牌
    't3-position-value': '2026-11-02',
    't3-starting-hands': '2026-11-02',
    't3-fundamental-theorem': '2026-11-02',
    't3-blind-battle': '2026-11-02',
    // T4 范围理论
    't4-range-thinking': '2026-11-02',
    't4-combinatorics': '2026-11-02',
    't4-range-advantage': '2026-11-02',
    't4-preflop-structure': '2026-11-02',
    't4-structure-economics': '2026-11-02',
    't4-sixmax-ranges': '2026-11-02',
    // T5 博弈论基础
    't5-game-theory': '2026-11-02',
    't5-gto-concept': '2026-11-02',
    't5-mdf-alpha': '2026-11-02',
    't5-mixed-strategy': '2026-11-02',
    't5-multiway-frequency': '2026-11-02',
    // T6 下注理论
    't6-bet-purpose': '2026-11-02',
    't6-sizing-theory': '2026-11-02',
    't6-geometric': '2026-11-02',
    't6-equity-realization': '2026-11-02',
    't6-srp-postflop': '2026-11-02',
    't6-3bet-pot': '2026-11-02',
    't6-turn-river': '2026-11-02',
    // T7 对手分析
    't7-stats': '2026-11-02',
    't7-player-types': '2026-11-02',
    't7-hand-reading': '2026-11-02',
    't7-exploit': '2026-11-02',
    // T8 扑克心理学
    't8-tilt': '2026-11-02',
    't8-session': '2026-11-02',
    't8-bankroll-psych': '2026-11-02',
    't8-mindset': '2026-11-02',
    // T9 经典理论综合
    't9-mop': '2026-11-02',
    't9-icm': '2026-11-02',
    't9-multiway': '2026-11-02',
    't9-alpha': '2026-11-02',
    't9-unified': '2026-11-02',
    't9-cash-vs-mtt': '2026-11-02',
    't9-sixmax-capstone': '2026-11-02',
  },
};
