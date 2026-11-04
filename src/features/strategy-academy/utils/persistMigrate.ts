import { DEFAULT_VARIANT } from '@/shared/types/elo';
import type {
  AcademyProgress,
  CheckpointRecord,
  LessonAttemptRecord,
  LessonNote,
  LevelCertification,
  PlacementState,
  PracticeResult,
} from '../types';
import { findLessonSummaryById } from './academyMeta';

interface PersistedShape {
  progress?: Partial<AcademyProgress>;
  abilityAssessment?: unknown;
  firstAttemptScores?: Record<string, number>;
  lastAttemptScores?: Record<string, number>;
  lessonAttempts?: Record<string, LessonAttemptRecord>;
  practiceResults?: PracticeResult[];
  certifications?: Record<string, LevelCertification>;
  placement?: PlacementState | null;
  checkpoints?: Record<number, CheckpointRecord>;
  bookmarkedLessons?: string[];
  lessonNotes?: Record<string, LessonNote>;
  activeVariant?: string;
  [key: string]: unknown;
}

const EMPTY_PROGRESS: AcademyProgress = {
  completedLessons: [],
  quizScores: {},
  currentLesson: null,
  startedAt: 0,
  completedUnits: {},
};

/** strategy-academy persist v0 → v8 迁移（纯函数，便于单测）。 */
export function migrateStrategyAcademyState(
  persistedState: unknown,
  fromVersion: number,
): unknown {
  const next = (persistedState ?? {}) as PersistedShape;

  // v0 → v1：注入进步回放得分记录默认值
  if (fromVersion < 1) {
    next.firstAttemptScores ??= {};
    next.lastAttemptScores ??= {};
  }

  // v1 → v2：裁剪 practiceResults 至最近 200 条
  if (fromVersion < 2 && Array.isArray(next.practiceResults) && next.practiceResults.length > 200) {
    next.practiceResults = next.practiceResults.slice(-200);
  }

  // v2 → v3：认证系统新增 cooldownPeriod/validUntil/lastAttemptAt
  if (fromVersion < 3) {
    const certs = next.certifications ?? {};
    for (const level in certs) {
      const cert = certs[level];
      if (!cert) continue;
      cert.cooldownPeriod = cert.cooldownPeriod ?? 24;
      cert.lastAttemptAt = cert.lastAttemptAt ?? Date.now();
    }
    next.certifications = certs;
  }

  // v3 → v4：新增 completedUnits；防御性合并缺失 progress 字段
  if (fromVersion < 4) {
    const progress = next.progress ?? {};
    next.progress = {
      ...EMPTY_PROGRESS,
      ...progress,
      completedUnits: progress.completedUnits ?? {},
    };
  }

  // v4 → v5：新增 activeVariant（默认 standard）
  if (fromVersion < 5) {
    next.activeVariant = next.activeVariant ?? DEFAULT_VARIANT;
  }

  // v5 → v6：新增 lessonAttempts；由旧分数镜像反推，已完成课时补 attempts=1
  if (fromVersion < 6) {
    const progress = next.progress ?? {};
    const completed = new Set(progress.completedLessons ?? []);
    const firstScores = next.firstAttemptScores ?? {};
    const lastScores = next.lastAttemptScores ?? {};
    const quizScores = progress.quizScores ?? {};
    const ids = new Set<string>([
      ...completed,
      ...Object.keys(firstScores),
      ...Object.keys(lastScores),
      ...Object.keys(quizScores),
    ]);
    const seeded: Record<string, LessonAttemptRecord> = { ...(next.lessonAttempts ?? {}) };

    for (const lessonId of ids) {
      if (seeded[lessonId]) continue;
      const total = findLessonSummaryById(lessonId)?.quizCount ?? 0;
      const first = firstScores[lessonId] ?? quizScores[lessonId] ?? lastScores[lessonId] ?? 0;
      const last = lastScores[lessonId] ?? first;
      seeded[lessonId] = {
        attempts: 1,
        firstScore: first,
        firstCorrect: total > 0 ? Math.round((first / 100) * total) : 0,
        firstTotal: total,
        bestScore: Math.max(first, last),
        lastScore: last,
        lastAt: Date.now(),
      };
    }
    next.lessonAttempts = seeded;
  }

  // v6 → v7：定位/Checkpoint/书签/笔记默认值
  if (fromVersion < 7) {
    next.placement ??= null;
    next.checkpoints ??= {};
    next.bookmarkedLessons ??= [];
    next.lessonNotes ??= {};
  }

  // v7 → v8：技术债清理 — 删除内存能力评估与首末次得分镜像。
  // 首要事实源改为 lessonAttempts（进步回放/掌握度均读它），旧镜像仅在前序迁移中
  // 用于反推 lessonAttempts；此处只删字段，不动 progress/certifications/lessonAttempts。
  if (fromVersion < 8) {
    delete next.abilityAssessment;
    delete next.firstAttemptScores;
    delete next.lastAttemptScores;
  }

  return next;
}
