import { useSyncExternalStore } from 'react';
import { getAcademyDataSource, onAcademyDataRegister } from '@/shared/stores/academyDataSourceRegistry';
import type {
  AcademyLessonAttemptSnapshot,
  AcademyProgressSnapshot,
} from '@/shared/types/academyDataSource';

/**
 * 学院课程数据源响应式订阅 hook（progress 依赖倒置）。
 * strategy-academy / puzzle-trainer / theory-academy 在各自 bootstrap 中注册数据源，
 * progress 组件经此 hook 订阅，消除对 useAcademyStore 的直接引用。
 *
 * P0-03 时序修复：使用 onAcademyDataRegister 实现「late registration 自愈」——
 * - 若渲染时数据源已注册：立即获取 snapshot，subscribe 桥接数据源的 subscribe
 * - 若渲染时数据源未注册：先订阅，一旦注册成功即转发订阅者通知（自愈）
 * 
 * 关键约束：getSnapshot 必须返回 store state 的稳定字段引用（禁止合成新对象），
 * 否则 useSyncExternalStore 会触发无限重渲染；未注册时返回模块级常量兜底。
 */

const EMPTY_PROGRESS: AcademyProgressSnapshot = { completedLessons: [] };
const EMPTY_ATTEMPTS: Record<string, AcademyLessonAttemptSnapshot> = {};

/** 模块级稳定 subscribe：桥接数据源 subscribe + late registration 自愈 */
function subscribeAcademy(listener: () => void): () => void {
  const source = getAcademyDataSource();
  if (source) {
    // 已注册：直接桥接数据源的 subscribe，返回其取消函数
    return source.subscribe(listener);
  }
  // 未注册：订阅注册事件；注册成功时补桥接真实数据源的 subscribe，再触发一次快照刷新（自愈）。
  // 必须补桥接——否则自愈后组件只拿到一次性快照，后续学院进度变更不再触发重渲染。
  let unsubscribeSource: (() => void) | undefined;
  const unsubscribeRegister = onAcademyDataRegister(() => {
    unsubscribeSource = getAcademyDataSource()?.subscribe(listener);
    listener();
  });
  return () => {
    unsubscribeRegister();
    unsubscribeSource?.();
  };
}

function getProgressSnapshot(): AcademyProgressSnapshot {
  return getAcademyDataSource()?.getAcademyProgressSnapshot() ?? EMPTY_PROGRESS;
}

function getLessonAttemptsSnapshot(): Record<string, AcademyLessonAttemptSnapshot> {
  return getAcademyDataSource()?.getLessonAttemptsSnapshot() ?? EMPTY_ATTEMPTS;
}

/** 订阅学院进度（completedLessons），Dashboard 每日训练计划用 */
export function useAcademyProgressSnapshot(): AcademyProgressSnapshot {
  return useSyncExternalStore(subscribeAcademy, getProgressSnapshot, getProgressSnapshot);
}

/** 订阅课程首末次成绩与尝试次数，ProgressReplay 进步回放用 */
export function useAcademyLessonAttemptsSnapshot(): Record<string, AcademyLessonAttemptSnapshot> {
  return useSyncExternalStore(
    subscribeAcademy,
    getLessonAttemptsSnapshot,
    getLessonAttemptsSnapshot,
  );
}
