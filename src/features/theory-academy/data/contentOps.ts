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
    // Heads-up 变体（2026-11-05 单挑全量对齐批次）
    't1hu-probability': '2026-11-05',
    't1hu-outs': '2026-11-05',
    't1hu-variance': '2026-11-05',
    't2hu-odds': '2026-11-05',
    't2hu-ev': '2026-11-05',
    't2hu-risk': '2026-11-05',
    't3hu-sb-strategy': '2026-11-05',
    't3hu-bb-defense': '2026-11-05',
    't3hu-position-reversal': '2026-11-05',
    't4hu-range-width': '2026-11-05',
    't4hu-polarization': '2026-11-05',
    't4hu-blocking': '2026-11-05',
    't4hu-range-advantage': '2026-11-05',
    't4hu-preflop-structure': '2026-11-05',
    't5hu-gto-he': '2026-11-05',
    't5hu-frequency': '2026-11-05',
    't5hu-node-locking': '2026-11-05',
    't5hu-preflop-equilibrium': '2026-11-05',
    't5hu-postflop-equilibrium': '2026-11-05',
    't6hu-sizing-optimal': '2026-11-05',
    't6hu-barrel': '2026-11-05',
    't6hu-bet-purpose': '2026-11-05',
    't6hu-equity-realization': '2026-11-05',
    't7hu-patterns': '2026-11-05',
    't7hu-exploit': '2026-11-05',
    't7hu-stats': '2026-11-05',
    't7hu-hand-reading': '2026-11-05',
    't8hu-pressure': '2026-11-05',
    't8hu-reads': '2026-11-05',
    't8hu-tilt-types': '2026-11-05',
    't8hu-session': '2026-11-05',
    't9hu-mastery': '2026-11-05',
    't9hu-pro-study': '2026-11-05',
    't9hu-mop': '2026-11-05',
    't9hu-icm': '2026-11-05',
    't9hu-unified': '2026-11-05',
    't9hu-cash-vs-mtt': '2026-11-05',
  },
};
