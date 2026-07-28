import type { LevelInfo } from '../../types';
import { LEVEL_1_LESSONS } from './level1';
import { LEVEL_2_LESSONS } from './level2';
import { LEVEL_3_LESSONS } from './level3';
import { LEVEL_4A_LESSONS } from './level4a';
import { LEVEL_4B_LESSONS } from './level4b';
import { LEVEL_5_LESSONS } from './level5';
import { LEVEL_6_LESSONS } from './level6';
import { LEVEL_7_LESSONS } from './level7';
import { LEVEL_8_LESSONS } from './level8';

export const LEVELS: LevelInfo[] = [
  {
    id: 'l1',
    level: 1,
    title: '基础入门',
    description: '掌握德州扑克的基本规则和核心概念',
    icon: '🌱',
    unlockRequirement: '无',
    lessons: LEVEL_1_LESSONS,
  },
  {
    id: 'l2',
    level: 2,
    title: '翻前策略',
    description: '掌握翻牌前的关键决策',
    icon: '📈',
    unlockRequirement: '完成 Level 1 所有课程',
    lessons: LEVEL_2_LESSONS,
  },
  {
    id: 'l3',
    level: 3,
    title: '翻后策略',
    description: '学习翻牌后的核心技术',
    icon: '🎯',
    unlockRequirement: '完成 Level 2 所有课程',
    lessons: LEVEL_3_LESSONS,
  },
  {
    id: 'l4a',
    level: 4,
    title: '进阶思维 · 范围与EV',
    description: '培养范围阅读、EV计算和对手分析的能力',
    icon: '🧠',
    unlockRequirement: '完成 Level 3 所有课程',
    lessons: LEVEL_4A_LESSONS,
  },
  {
    id: 'l4b',
    level: 4,
    title: '进阶思维 · GTO与博弈论',
    description: '掌握GTO理论、博弈树和频率平衡的核心概念',
    icon: '🎲',
    unlockRequirement: '完成 进阶思维·范围与EV 所有课程',
    lessons: LEVEL_4B_LESSONS,
  },
  {
    id: 'l5',
    level: 5,
    title: '职业素养',
    description: '养成职业牌手的核心素质',
    icon: '🏆',
    unlockRequirement: '完成 Level 4 所有课程',
    lessons: LEVEL_5_LESSONS,
  },
  {
    id: 'l6',
    level: 6,
    title: '锦标赛策略',
    description: '掌握 MTT/SNG 的核心策略：ICM、Push/Fold、泡沫期打法',
    icon: '🎖️',
    unlockRequirement: '完成 Level 5 所有课程',
    lessons: LEVEL_6_LESSONS,
  },
  {
    id: 'l7',
    level: 7,
    title: '现金桌专项',
    description: '掌握现金桌独有的策略要素：深筹码、多人底池、Straddle',
    icon: '💰',
    unlockRequirement: '完成 Level 3（翻后策略）和 Level 5（职业素养）所有课程',
    prerequisiteLevelIds: ['l3', 'l5'],
    lessons: LEVEL_7_LESSONS,
  },
  {
    id: 'l8',
    level: 8,
    title: '高级剥削策略',
    description: '掌握针对特定玩家池和对手类型的剥削调整策略',
    icon: '🔬',
    unlockRequirement: '完成 Level 4B（GTO与博弈论）所有课程',
    prerequisiteLevelIds: ['l4b'],
    lessons: LEVEL_8_LESSONS,
  },
];
