/**
 * 课程入口（批次 3 冻结路由表）：`/lesson`（无 id）。
 *
 * 「下一课」的判定不在本文件重复实现：从课程数据源注册表取
 * `findNextLesson(completedLessons)`（progress 每日计划走同一入口），
 * completedLessons 也从同一份快照读取，保证「学习路径 / 每日计划 / 课程入口」三处一致。
 * 数据源由 store.bootstrap 在首屏后后台注册，未就绪时先挂骨架并通过
 * onAcademyDataRegister 自愈重渲染（与 progress 侧 hook 同一时序契约）。
 */
import { useEffect, useReducer } from 'react';
import { Navigate } from 'react-router-dom';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import {
  getAcademyDataSource,
  onAcademyDataRegister,
} from '@/shared/stores/academyDataSourceRegistry';
import { useAcademyStore } from '../store';

export default function LessonEntry() {
  const [, refresh] = useReducer((tick: number) => tick + 1, 0);
  const basicsCompleted = useAcademyStore((s) => s.basicsProgress.completed);

  // 数据源 late registration 自愈：注册完成即重渲染，避免把「未就绪」误判成「无下一课」
  useEffect(() => onAcademyDataRegister(() => refresh()), []);

  // L1 先修：基础入门未完成时先进入 BasicsIntro，避免课程入口直达被锁
  if (!basicsCompleted) return <Navigate to="/academy/basics" replace />;

  const source = getAcademyDataSource();
  if (!source) return <PageSkeleton />;

  const { completedLessons } = source.getAcademyProgressSnapshot();
  const nextLesson = source.findNextLesson(completedLessons);

  return <Navigate to={nextLesson ? `/lesson/${nextLesson.id}` : '/'} replace />;
}
