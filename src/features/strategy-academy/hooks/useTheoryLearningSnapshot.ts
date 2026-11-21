import { useSyncExternalStore } from 'react';
import { getTheoryDataSource, subscribeTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { TheoryLearningSnapshot } from '@/shared/types/theoryDataSource';

function getSnapshot(): TheoryLearningSnapshot | undefined {
  return getTheoryDataSource()?.getLearningSnapshot?.();
}

/**
 * 理论学习快照订阅（只读）。
 * 未注册 / 未实现时返回稳定的 undefined；注册完成由注册表 notify 自愈。
 */
export function useTheoryLearningSnapshot(): TheoryLearningSnapshot | undefined {
  return useSyncExternalStore(subscribeTheoryDataSource, getSnapshot, getSnapshot);
}