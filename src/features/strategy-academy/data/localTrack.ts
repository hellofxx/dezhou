import type { LearningTrack } from '../types';

/**
 * P2-1.1: 本土低级别盈利路径
 *
 * 针对国内常见 Limp 局 / Straddle / 深筹 / 跟注站 等本土场景的实战策略学习路径。
 * 共 6 个模块（含模块 4.5 对手画像 Drill）、17 节课，预计 8-10 小时。
 */
export const LOCAL_TRACK: LearningTrack = {
  id: 'track-local-cn',
  name: '本土低级别盈利路径',
  description: '针对国内常见Limp局/Straddle/深筹/跟注站的实战策略',
  icon: '🇨🇳',
  targetAudience: '活跃在国内低级别局的玩家',
  estimatedDuration: '8-10小时',
  color: '#965a3e',
  prerequisiteLevelIds: ['l1', 'l2', 'l3'],
  relatedTrackIds: ['track-cash-game'],
  lessonIds: [
    // 模块1：Limp 局应对
    'local-limp-intro',
    'local-limp-isolate',
    'local-limp-multiway',
    // 模块2：Ante / Straddle
    'local-straddle',
    'local-ante',
    // 模块3：深筹码调整
    'local-deep-implied-odds',
    'local-deep-suited-connectors',
    // 模块4：玩家类型剥削
    'local-exploit-calling-station',
    'local-exploit-maniac',
    'local-exploit-nit',
    'local-exploit-lag',
    // 模块4.5：对手画像 Drill（综合训练）
    'opp-drill',
    // 模块5：GTO 与剥削平衡
    'local-gto-vs-exploit',
    'local-when-to-deviate',
    // 模块6：情绪管理
    'mental-tilt-recognition',
    'mental-stop-loss',
    'mental-session-management',
  ],
};
