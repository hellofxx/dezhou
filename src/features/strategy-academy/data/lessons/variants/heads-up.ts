import type { Lesson } from '../../../types';

/**
 * Heads-Up（单挑）L3-L8 课程骨架（P2 变体支持，Day 3-4）。
 *
 * 2 人对战、SB 强制 Ante、翻后 SB（BTN）先行动、无位置解锁。
 * 当前为骨架：content / quiz / examples / practice 为占位空结构，
 * 实际内容由后续任务（Day 5+）按设计文档填充。
 * variant 显式声明为 'heads-up'；variantContext 标注按钮位归属与 Ante 结构。
 */
export const HEADS_UP_STRATEGY_COURSES: Lesson[] = [
  // ===== L3 翻后策略 =====
  {
    id: 'l3hu-bn-aggression',
    level: 3,
    order: 1,
    title: '按钮位激进度',
    subtitle: '单挑按钮位的频率优势与翻后持续施压',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3hu-bn-aggression-practice', questions: [] }, // 待填充
  },
  {
    id: 'l3hu-sb-continuation',
    level: 3,
    order: 2,
    title: 'SB 持续下注',
    subtitle: '单挑 SB 翻后延续下注的尺度、频率与范围',
    duration: '7 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3hu-sb-continuation-practice', questions: [] }, // 待填充
  },
  {
    id: 'l3hu-bb-defense',
    level: 3,
    order: 3,
    title: 'BB 防守',
    subtitle: '单挑大盲的宽范围防守、过牌加注与不利位置控制',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_BB', anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l3hu-bb-defense-practice', questions: [] }, // 待填充
  },
  // ===== L4A 进阶思维 · 范围与 EV =====
  {
    id: 'l4hu-bn-opening',
    level: 4,
    order: 1,
    title: '按钮位开局加注',
    subtitle: '单挑按钮位接近 100% 的开局频率与尺度调整',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { dealerButtonPosition: 'HU_SB', anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4hu-bn-opening-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4hu-ev-adjustments',
    level: 4,
    order: 2,
    title: 'EV 调整',
    subtitle: '单挑两人底池的 EV 计算差异与决策简化',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4hu-ev-adjustments-practice', questions: [] }, // 待填充
  },
  // ===== L4B 进阶思维 · GTO 与博弈论 =====
  {
    id: 'l4hu-gto-basics',
    level: 4,
    order: 1,
    title: '单挑 GTO 基础',
    subtitle: '单挑均衡策略的结构差异、频率基准与位置对称性',
    duration: '9 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4hu-gto-basics-practice', questions: [] }, // 待填充
  },
  {
    id: 'l4hu-counter-strategies',
    level: 4,
    order: 2,
    title: '反制策略',
    subtitle: '针对单挑对手常见偏离的 GTO 反制与再调整框架',
    duration: '9 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l4hu-counter-strategies-practice', questions: [] }, // 待填充
  },
  // ===== L5 职业素养 =====
  {
    id: 'l5hu-focus',
    level: 5,
    order: 1,
    title: '单挑专注力',
    subtitle: '单挑高速决策节奏下的专注、状态管理与疲劳控制',
    duration: '7 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l5hu-focus-practice', questions: [] }, // 待填充
  },
  {
    id: 'l5hu-opponent-psychology',
    level: 5,
    order: 2,
    title: '对手心理',
    subtitle: '单挑心理博弈：下注节奏、反应时间与行为模式解读',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante' },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l5hu-opponent-psychology-practice', questions: [] }, // 待填充
  },
  // ===== L6 锦标赛策略 =====
  {
    id: 'l6hu-tourney',
    level: 6,
    order: 1,
    title: '单挑锦标赛',
    subtitle: '单挑 SNG / MTT 决赛桌的筹码节奏、ICM 与盲注攻防',
    duration: '8 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante', stackDepth: 40 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l6hu-tourney-practice', questions: [] }, // 待填充
  },
  // ===== L7 现金桌专项 =====
  {
    id: 'l7hu-stakes',
    level: 7,
    order: 1,
    title: '单挑升级',
    subtitle: '单挑升级判据、牌桌选择、级别匹配与对手池筛选',
    duration: '7 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante', stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l7hu-stakes-practice', questions: [] }, // 待填充
  },
  // ===== L8 高级剥削策略 =====
  {
    id: 'l8hu-exploitative',
    level: 8,
    order: 1,
    title: '单挑剥削打法',
    subtitle: '单挑针对性剥削：频率读取、范围极化与动态调整',
    duration: '9 min',
    variant: 'heads-up',
    variantContext: { anteStructure: 'sb_ante', stackDepth: 100 },
    content: [], // 待填充
    quiz: [], // 待填充
    examples: [], // 待填充
    practice: { id: 'l8hu-exploitative-practice', questions: [] }, // 待填充
  },
];
