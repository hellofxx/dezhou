/**
 * 课程路由（批次 3 冻结路由表）：`/lesson/:lessonId`。
 *
 * - `theory:` 前缀的 id 属于理论学院题目/章节命名空间 → 转交 `/theory/chapter/:chapterId`；
 * - 其余 id（标准课程 / local-* 本地课 / drill 型课时）沿用既有 CourseView 全流程。
 */
import { Navigate, useParams } from 'react-router-dom';
import CourseView from './CourseView';
import { useAcademyStore } from '../store';
import { findLessonSummaryById } from '../utils/academyMeta';

/** 理论学院命名空间前缀（与 odds: / 裸 lessonId 三方隔离，见 pot-odds/utils/oddsSrs.ts） */
const THEORY_PREFIX = 'theory:';

export default function LessonRoute() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const basicsCompleted = useAcademyStore((s) => s.basicsProgress.completed);

  if (lessonId?.startsWith(THEORY_PREFIX)) {
    return <Navigate to={`/theory/chapter/${lessonId.slice(THEORY_PREFIX.length)}`} replace />;
  }

  // L1 先修：基础入门未完成时先走 BasicsIntro，避免深链落到锁定页
  const level = lessonId ? findLessonSummaryById(lessonId)?.level : undefined;
  if (!basicsCompleted && level === 1) {
    return <Navigate to="/academy/basics" replace />;
  }

  return <CourseView />;
}
