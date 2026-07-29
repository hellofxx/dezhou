import type { LearningTrack } from '../types';
import { LOCAL_TRACK } from './localTrack';

/**
 * 检查用户是否已完成指定 Track 的前置 Level。
 * prerequisiteLevelIds 格式为 ['l1', 'l2', 'l3']，提取数字后与 certifications 比对。
 */
export function isTrackPrerequisiteMet(
  track: LearningTrack,
  certifiedLevels: Set<number>
): boolean {
  if (!track.prerequisiteLevelIds?.length) return true;
  return track.prerequisiteLevelIds.every((id) => {
    const levelNum = parseInt(id.replace(/^l/i, ''), 10);
    return !isNaN(levelNum) && certifiedLevels.has(levelNum);
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
    relatedTrackIds: ['track-cash-game', 'track-gto'],
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
      'l7-hu',
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
    relatedTrackIds: ['track-cash-game', 'track-tournament'],
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
  // P2-1.9: 本土低级别盈利路径
  LOCAL_TRACK,
];
