// Shared types barrel
// 仅导出 decisionFeedback 与 elo 相关类型与常量。
// 其他类型仍按原路径导入（@/shared/types/poker 等），避免破坏现有引用。
export type {
  DecisionGrade,
  LegacyDecisionGrade,
  DecisionFeedback,
} from './decisionFeedback';

export {
  GRADE_THRESHOLDS,
  GRADE_DISPLAY_CONFIG,
  calculateGrade,
  migrateGrade,
  buildDecisionFeedback,
} from './decisionFeedback';

export type {
  EloRating,
  EloDimension,
  Rank,
  RankUpEvent,
} from './elo';

export {
  RANKS,
  DEFAULT_ELO,
} from './elo';

// P2-4: 导师角色人格化
export type {
  MentorStyle,
  MentorProfile,
  MentorFeedbackTemplate,
} from './mentor';

export {
  MENTOR_PROFILES,
  DEFAULT_MENTOR,
} from './mentor';
