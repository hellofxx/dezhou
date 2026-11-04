import type { LessonMeta } from '../../types';

/**
 * Level 7 本土低级别盈利路径 17 课元数据（Limp / Straddle / 深筹 / 玩家类型剥削 / 情绪管理）。
 * 这些课时结构上挂在 Level 7，但语义是“针对国内低级别牌桌的剥削与自律”，
 * 故锚点以 T7（玩家类型/剥削）与 T8（心态/资金）为主线。
 */
export const LOCAL_LESSON_META: Record<string, LessonMeta> = {
  // ===== Limp 局应对 =====
  'local-limp-intro': { eloDimension: 'preflop', theoryAnchors: ['t7-exploit', 't4-preflop-structure'] },
  'local-limp-isolate': {
    eloDimension: 'preflop',
    theoryAnchors: ['t3-starting-hands', 't7-exploit'],
  },
  'local-limp-multiway': {
    eloDimension: 'postflop',
    theoryAnchors: ['t9-multiway', 't5-multiway-frequency'],
  },
  // ===== Ante / Straddle =====
  'local-straddle': {
    eloDimension: 'preflop',
    theoryAnchors: ['t4-structure-economics', 't3-position-value'],
  },
  'local-ante': { eloDimension: 'preflop', theoryAnchors: ['t4-structure-economics', 't4-preflop-structure'] },
  // ===== 深筹码调整 =====
  'local-deep-implied-odds': {
    eloDimension: 'postflop',
    theoryAnchors: ['t2-implied-odds', 't6-geometric'],
  },
  'local-deep-suited-connectors': {
    eloDimension: 'preflop',
    theoryAnchors: ['t3-starting-hands', 't2-implied-odds'],
  },
  // ===== 玩家类型剥削 =====
  'local-exploit-calling-station': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7-player-types', 't7-exploit'],
  },
  'local-exploit-maniac': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7-player-types', 't7-exploit'],
  },
  'local-exploit-nit': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7-player-types', 't7-exploit'],
  },
  'local-exploit-lag': {
    eloDimension: 'handReading',
    theoryAnchors: ['t7-player-types', 't7-exploit'],
  },
  // 对手画像 Drill：识别靠类型学，校准靠统计指标
  'opp-drill': { eloDimension: 'handReading', theoryAnchors: ['t7-player-types', 't7-stats'] },
  // ===== GTO 与剥削平衡 =====
  'local-gto-vs-exploit': { eloDimension: 'handReading', theoryAnchors: ['t5-gto-concept', 't9-unified'] },
  'local-when-to-deviate': { eloDimension: 'handReading', theoryAnchors: ['t7-exploit', 't9-unified'] },
  // ===== 情绪管理 =====
  'local-mental-tilt-recognition': {
    eloDimension: 'mental',
    theoryAnchors: ['t8-tilt', 't8-mindset'],
  },
  'local-mental-stop-loss': {
    eloDimension: 'mental',
    theoryAnchors: ['t8-session', 't8-bankroll-psych'],
  },
  'local-mental-session-management': {
    eloDimension: 'mental',
    theoryAnchors: ['t8-session', 't8-bankroll-psych'],
  },
};
