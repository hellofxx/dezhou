import type { LearningTrack } from '../types';
import { LOCAL_TRACK } from './localTrack';
import { LEVELS } from './levels';

/**
 * 检查用户是否已完成指定 Track 的前置 Level。
 *
 * P1E-02: 统一为「课程完成口径」（与 CourseView 本土课门禁一致）：
 * prerequisiteLevelIds 格式为 ['l1', 'l2', 'l3']，按 LevelInfo 条目的
 * 全部课程是否都在 completedLessons 中判定（不再依赖认证 certifications）。
 */
export function isTrackPrerequisiteMet(
  track: LearningTrack,
  completedLessons: readonly string[]
): boolean {
  if (!track.prerequisiteLevelIds?.length) return true;
  const completed = new Set(completedLessons);
  return track.prerequisiteLevelIds.every((id) => {
    const entry = LEVELS.find((l) => l.id === id);
    if (!entry || entry.lessons.length === 0) return false;
    return entry.lessons.every((lesson) => completed.has(lesson.id));
  });
}

/** 生成前置条件未满足时的提示文字 */
export function getPrerequisiteHint(prerequisiteLevelIds: string[]): string {
  const labels = prerequisiteLevelIds.map((id) => id.replace(/^l/i, 'Level '));
  return `建议先完成 ${labels.join('、')} 的课程`;
}

export const LEARNING_TRACKS: LearningTrack[] = [
  {
    id: 'track-beginner',
    name: '零基础快速入门',
    description: '从未接触过德州扑克？从这里开始，用最短时间掌握核心规则与基本打法',
    icon: '🌱',
    targetAudience: '完全零基础的新玩家',
    estimatedDuration: '2-3 小时',
    lessonIds: [
      // P0-3.8: 在合适位置插入 4 个 Drill（保留已有 lessonIds 不动）
      'drill-hand-ranking',      // 新增：牌力排名闪电战（先做摸底训练）
      'l1-basics',               // 规则基础
      'drill-position',          // 新增：位置认知训练
      'l1-position',             // 位置详解
      'drill-outs',              // 新增：Outs 速算
      'drill-pot-odds',          // 新增：底池赔率直觉
      'l1-hand-selection',       // 起手牌选择
      'l1-bankroll',             // 资金管理
      'l1-leaks',                // 常见错误
      'l2-raise-sizing',         // 进阶：加注尺度
    ],
    color: '#7fb883',
    relatedTrackIds: ['track-cash-game', 'track-gto', 'track-theory-bridge'],
  },
  {
    id: 'track-cash-game',
    name: '现金桌稳定盈利',
    description: '系统学习现金桌从翻前到翻后的完整策略，掌握在微额和低额级别持续盈利的技能',
    icon: '💰',
    targetAudience: '想在线上/线下现金桌盈利的玩家',
    estimatedDuration: '15-20 小时',
    lessonIds: [
      'l2-raise-sizing',
      'l2-3bet-basics',
      'l2-4bet-strategy',
      'l2-squeeze',
      'l2-bb-defense',
      'l2-blind-war',
      'l2-short-stack',
      'l3-cbet',
      'l3-draws',
      'l3-multistreet',
      'l3-checkraise',
      'l3-float-probe',
      'l3-bet-sizing',
      'l3-bluffing',
      'l3-texture',
      'l3-check-range',
      'l3-3bet-postflop',
      'l7-deepstack',
      'l7-multiway',
      'l7-straddle',
      'l7-rake',
      'l7-table-selection',
    ],
    color: '#c9a25e',
    relatedTrackIds: ['track-gto', 'track-local-cn'],
  },
  {
    id: 'track-tournament',
    name: '锦标赛速成',
    description: '掌握 MTT/SNG 的核心策略，学习 ICM、Push/Fold 和泡沫期打法',
    icon: '🏆',
    targetAudience: '想参加线上/线下锦标赛的玩家',
    estimatedDuration: '10-12 小时',
    lessonIds: [
      'l2-raise-sizing',
      'l2-3bet-basics',
      'l2-4bet-strategy',
      'l2-short-stack',
      'l3-cbet',
      'l3-draws',
      'l4-range-thinking',
      'l6-icm',
      'l6-pushfold',
      'l6-bubble',
      'l6-finaltable',
      'l6-bounty',
      'l5-online-vs-live',
    ],
    color: '#4a5a7a',
    relatedTrackIds: ['track-cash-game'],
  },
  {
    id: 'track-gto',
    name: 'GTO 思维训练',
    description: '深入理解博弈论最优策略，学习频率控制、节点锁定和范围构建',
    icon: '🧠',
    targetAudience: '有基础但想提升理论深度的进阶玩家',
    estimatedDuration: '12-15 小时',
    lessonIds: [
      'l3-bet-sizing',
      'l3-bluffing',
      'l3-texture',
      'l3-check-range',
      'l4-range-thinking',
      'l4-opponent-reading',
      'l5-tilt',
      'l4-game-tree',
      'l4-frequency-balance',
      'l5-tools',
      'l8-pool-tendencies',
      'l8-population-analysis',
      'l8-exploitative-adjustments',
    ],
    color: '#a8c4cf',
    relatedTrackIds: ['track-cash-game', 'track-tournament', 'track-theory-bridge'],
  },
  {
    id: 'track-leak-fix',
    name: '实战弱点修补',
    description: '基于你的能力评估，针对性训练最薄弱的环节。完成评估后将动态推荐课程',
    icon: '🔧',
    targetAudience: '有经验但遇到瓶颈的玩家',
    estimatedDuration: '动态调整',
    lessonIds: [], // 动态根据能力评估填充
    color: '#c25a4c',
    relatedTrackIds: ['track-beginner'],
  },
  // 理论学院（2026-07）：通用「理论→实践」入口轨道。
  // P1F-05 定性（专批 A，2026-07-31）：theory-academy 各 Level 的 practiceRecommendations
  // 定向推荐均指向 track-beginner / track-gto / track-cash-game，不引用本轨道；
  // 本轨道不是各 Level 的定向推荐目标，而是经 /academy/tracks 泛浏览发现的通用衔接路径
  // （按理论支柱顺序串联对应实战课程，lessonIds 行内注释标注 T1-T9 对应关系）。
  {
    id: 'track-theory-bridge',
    name: '理论到实践',
    description: '完成理论学院对应 Level 后，按理论支柱顺序将知识转化为实战决策能力',
    icon: '📖',
    targetAudience: '在理论学院完成了系统学习、需要落地实践的玩家',
    estimatedDuration: '10-15 小时',
    lessonIds: [
      'l1-basics',            // T1 概率论 → 规则与牌型
      'l1-position',          // T3 位置理论 → 位置的力量
      'l2-raise-sizing',      // T3 起手牌理论 → 加注尺度
      'l3-draws',             // T2 赔率体系 → 听牌处理
      'l4-ev-thinking',       // T2 期望值 → EV 思维
      'l4-range-thinking',    // T4 范围理论 → 范围思维
      'l4-gto-basics',        // T5 博弈论 → GTO 基础
      'l4-mdf',               // T5 MDF → 最小防御频率
      'l3-bet-sizing',        // T6 下注理论 → 下注尺度
      'l4-opponent-reading',  // T7 对手分析 → 对手阅读
      'l5-tilt',              // T8 心理学 → 情绪管理
      'l6-icm',               // T9 经典综合 → ICM 基础
    ],
    color: '#8ba59b',
    relatedTrackIds: ['track-gto', 'track-beginner'],
  },
  // P2-1.9: 本土低级别盈利路径
  LOCAL_TRACK,
];
