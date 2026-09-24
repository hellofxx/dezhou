import { useSyncExternalStore } from 'react';
import { getAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import type { AcademyProgressSnapshot } from '@/shared/types/academyDataSource';

/**
 * 学院课程数据源响应式订阅 hook（progress 依赖倒置）。
 * strategy-academy 在 store.bootstrap.ts 注册实现后，progress 组件经此 hook 订阅，
 * 消除对 useAcademyStore 的直接引用。
 *
 * 关键约束：getSnapshot 必须返回 store state 的稳定字段引用（禁止合成新对象），
 * 否则 useSyncExternalStore 会触发无限重渲染；未注册时返回模块级常量兜底。
 */

const EMPTY_PROGRESS: AcademyProgressSnapshot = { completedLessons: [] };
const EMPTY_SCORES: Record<string, number> = {};

/** 模块级稳定 subscribe：桥接数据源 subscribe，未注册时返回空取消函数 */
function subscribeAcademy(listener: () => void): () => void {
  const source = getAcademyDataSource();
  return source ? source.subscribe(listener) : () => {};
}

function getProgressSnapshot(): AcademyProgressSnapshot {
  return getAcademyDataSource()?.getAcademyProgressSnapshot() ?? EMPTY_PROGRESS;
}

function getFirstAttemptSnapshot(): Record<string, number> {
  return getAcademyDataSource()?.getFirstAttemptScoresSnapshot() ?? EMPTY_SCORES;
}

function getLastAttemptSnapshot(): Record<string, number> {
  return getAcademyDataSource()?.getLastAttemptScoresSnapshot() ?? EMPTY_SCORES;
}

/** 订阅学院进度（completedLessons），Dashboard 每日训练计划用 */
export function useAcademyProgressSnapshot(): AcademyProgressSnapshot {
  return useSyncExternalStore(subscribeAcademy, getProgressSnapshot, getProgressSnapshot);
}

/** 订阅课程首次得分，ProgressReplay 进步回放用 */
export function useAcademyFirstAttemptScores(): Record<string, number> {
  return useSyncExternalStore(subscribeAcademy, getFirstAttemptSnapshot, getFirstAttemptSnapshot);
}

/** 订阅课程最近得分，ProgressReplay 进步回放用 */
export function useAcademyLastAttemptScores(): Record<string, number> {
  return useSyncExternalStore(subscribeAcademy, getLastAttemptSnapshot, getLastAttemptSnapshot);
}
