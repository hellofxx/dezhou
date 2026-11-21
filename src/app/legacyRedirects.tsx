/**
 * 旧深链重定向（批次 3 冻结路由表的兼容层）。
 *
 * 统一 `replace`：旧地址不留在历史栈里，「后退」不会把用户送回已退役路由。
 * 统一保留 query：`/academy/quick-drill?mode=odds&quick=true`、
 * `/puzzle?theme=x`、`/range-trainer?difficulty=hard` 等参数在重定向后仍生效。
 */
import { Navigate, useLocation, useParams } from 'react-router-dom';

/** 合并目标路径与当前 query（目标自身带 query 时用 `&` 追加） */
function withSearch(to: string, search: string): string {
  if (!search) return to;
  return to.includes('?') ? `${to}&${search.slice(1)}` : `${to}${search}`;
}

interface LegacyRedirectProps {
  /** 新路由（可自带 query，如 `/drill?mode=range`） */
  to: string;
}

/** 静态重定向：保留 query */
export function LegacyRedirect({ to }: LegacyRedirectProps) {
  const { search } = useLocation();
  return <Navigate to={withSearch(to, search)} replace />;
}

/** `/academy/lesson/:lessonId` → `/lesson/:lessonId`：保留 lessonId 与 query */
export function LegacyLessonRedirect() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const { search } = useLocation();
  return <Navigate to={withSearch(`/lesson/${lessonId ?? ''}`, search)} replace />;
}
