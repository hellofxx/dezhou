import type { EloDimension, PokerVariant } from '@/shared/types/elo';

/** 课后尝试记录：首次成绩计掌握度/ELO，重考只更新 best/last。 */
export interface LessonAttemptRecord {
  attempts: number;
  firstScore: number;
  firstCorrect: number;
  firstTotal: number;
  bestScore: number;
  lastScore: number;
  lastAt: number;
}

/** 课时元数据：ELO 维度 + 理论锚点（T3 填充；组件只读）。 */
export interface LessonMeta {
  eloDimension: EloDimension;
  theoryAnchors: string[];
}

/** 认证提交载荷：题量由组件实际抽题结果传入，禁止 store 再按公式推导。 */
export interface CertificationAttemptPayload {
  score: number;
  totalQuestions: number;
  poolSize?: number;
  questionIds?: string[];
}

export type CertificationAttemptResult =
  | { accepted: true }
  | {
      accepted: false;
      reason:
        | 'invalid'
        | 'not-completed'
        | 'wrong-variant'
        | 'already-certified'
        | 'cooldown';
      nextAttemptAt?: number;
    };

export type CertificationStatus =
  | 'locked'
  | 'available'
  | 'cooldown'
  | 'valid'
  | 'expiring'
  | 'expired';

export interface CertificationState {
  status: CertificationStatus;
  nextAttemptAt?: number;
  validUntil?: number;
  daysLeft?: number;
}

/** 标准变体标识（认证记录用；变体认证本批 de-scope）。 */
export type CertificationVariant = Extract<PokerVariant, 'standard'>;

/** 策略定位测评：只放宽解锁，不写 completedLessons。 */
export interface PlacementState {
  recommendedLevelId: string;
  creditLevels: string[];
  correct: number;
  total: number;
  takenAt: number;
}

/** Level Checkpoint：形成性成绩，不发证、不解锁。 */
export interface CheckpointRecord {
  attempts: number;
  firstScore: number;
  bestScore: number;
  lastScore: number;
  questionIds: string[];
  lastAt: number;
}

/** 课时笔记（纯文本；上限由 store 常量控制）。 */
export interface LessonNote {
  text: string;
  updatedAt: number;
}
