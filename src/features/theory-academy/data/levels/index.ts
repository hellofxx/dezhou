import type { TheoryLevelInfo } from '../../types';
import { THEORY_LEVEL_1_CHAPTERS } from './theoryLevel1';
import { THEORY_LEVEL_2_CHAPTERS } from './theoryLevel2';
import { THEORY_LEVEL_3_CHAPTERS } from './theoryLevel3';
import { THEORY_LEVEL_4_CHAPTERS } from './theoryLevel4';
import { THEORY_LEVEL_5_CHAPTERS } from './theoryLevel5';
import { THEORY_LEVEL_6_CHAPTERS } from './theoryLevel6';
import { THEORY_LEVEL_7_CHAPTERS } from './theoryLevel7';
import { THEORY_LEVEL_8_CHAPTERS } from './theoryLevel8';
import { THEORY_LEVEL_9_CHAPTERS } from './theoryLevel9';

// practiceRecommendations 引用 strategy-academy 课程/轨道 ID 字符串（不产生模块 import）。
// 引用完整性由 strategy-academy/data/curriculumIntegrity.test.ts 的 CROSS_MODULE_LESSON_IDS 守卫。
export const THEORY_LEVELS: TheoryLevelInfo[] = [
  {
    id: 't1',
    level: 1,
    tier: 'basic',
    title: '概率论基础',
    description: '组合计数、Outs 与 2/4 法则、方差与长期视角',
    icon: '🎲',
    unlockRequirement: '无',
    chapters: THEORY_LEVEL_1_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l1-basics', title: '德州扑克规则与牌型' },
        { id: 'l1-hand-selection', title: '起手牌选择' },
      ],
      trackId: 'track-beginner',
    },
  },
  {
    id: 't2',
    level: 2,
    tier: 'basic',
    title: '期望值与赔率体系',
    description: 'EV 计算、底池赔率、隐含赔率与反向隐含赔率',
    icon: '⚖️',
    unlockRequirement: '完成 T1 所有章节',
    chapters: THEORY_LEVEL_2_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l4-ev-thinking', title: 'EV 思维' },
        { id: 'l3-draws', title: '听牌处理' },
      ],
    },
  },
  {
    id: 't3',
    level: 3,
    tier: 'basic',
    title: '位置理论与起手牌理论',
    description: '位置价值、Gap Concept、Sklansky 基本定理与主动权',
    icon: '🧭',
    unlockRequirement: '完成 T2 所有章节',
    chapters: THEORY_LEVEL_3_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l1-position', title: '位置的力量' },
        { id: 'l2-raise-sizing', title: '加注大小' },
      ],
    },
  },
  {
    id: 't4',
    level: 4,
    tier: 'intermediate',
    title: '范围理论',
    description: '范围思维、组合数学与 Blockers、范围优势与坚果优势',
    icon: '🗺️',
    unlockRequirement: '完成 T3 所有章节',
    chapters: THEORY_LEVEL_4_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l4-range-thinking', title: '范围思维' },
        { id: 'l4-range-construction', title: '范围建构：极化 vs 合并' },
        { id: 'l4-blockers', title: 'Blocker 效应' },
      ],
    },
  },
  {
    id: 't5',
    level: 5,
    tier: 'intermediate',
    title: '博弈论基础',
    description: '纳什均衡、GTO 概念、MDF 与 Alpha、混合策略与节点锁定',
    icon: '♟️',
    unlockRequirement: '完成 T4 所有章节',
    chapters: THEORY_LEVEL_5_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l4-gto-basics', title: 'GTO 基础入门' },
        { id: 'l4-mdf', title: '最小防御频率 (MDF)' },
        { id: 'l4-frequency-balance', title: '频率平衡' },
      ],
      trackId: 'track-gto',
    },
  },
  {
    id: 't6',
    level: 6,
    tier: 'intermediate',
    title: '下注理论',
    description: '下注目的、极化与线性尺度、SPR 与几何尺度',
    icon: '💠',
    unlockRequirement: '完成 T5 所有章节',
    chapters: THEORY_LEVEL_6_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l3-bet-sizing', title: '下注尺度理论' },
        { id: 'l3-cbet', title: '持续下注（C-Bet）' },
        { id: 'l4-overbet', title: 'Overbet 策略' },
      ],
    },
  },
  {
    id: 't7',
    level: 7,
    tier: 'advanced',
    title: '对手分析理论',
    description: 'VPIP/PFR/AF/WTSD 指标、玩家类型学、读牌流程与剥削调整',
    icon: '🔍',
    unlockRequirement: '完成 T6 所有章节',
    chapters: THEORY_LEVEL_7_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l4-opponent-reading', title: '对手阅读与剥削策略' },
        { id: 'l8-exploitative-adjustments', title: 'Exploitative Adjustments' },
      ],
    },
  },
  {
    id: 't8',
    level: 8,
    tier: 'advanced',
    title: '扑克心理学',
    description: 'Tilt 识别、Session 管理、资金心理与长期心态',
    icon: '🧠',
    unlockRequirement: '完成 T7 所有章节',
    chapters: THEORY_LEVEL_8_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l5-tilt', title: '情绪管理（Tilt Control）' },
        { id: 'l5-bankroll', title: '资金管理' },
        { id: 'l5-session-review', title: 'Session Review 方法论' },
      ],
    },
  },
  {
    id: 't9',
    level: 9,
    tier: 'advanced',
    title: '经典理论综合',
    description: 'MOP 要义、ICM 理论、多人底池与 GTO-剥削统一框架',
    icon: '🏛️',
    unlockRequirement: '完成 T8 所有章节',
    chapters: THEORY_LEVEL_9_CHAPTERS,
    practiceRecommendations: {
      lessons: [
        { id: 'l6-icm', title: 'ICM 基础' },
        { id: 'l7-multiway', title: '多人底池策略' },
        { id: 'l8-pool-tendencies', title: 'Pool Tendencies 分析' },
      ],
      trackId: 'track-cash-game',
    },
  },
];
