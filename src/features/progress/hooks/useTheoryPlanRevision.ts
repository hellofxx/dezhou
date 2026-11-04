/**
 * 理论数据源版本号（progress 侧响应式订阅，依赖倒置）。
 *
 * 背景：每日训练计划的理论卡元数据经 theoryDataSourceRegistry 取得，而 theory-academy 的
 * bootstrap 可能在 Dashboard 首次渲染**之后**才执行（懒加载 / 注册晚于首帧）。
 * 首次生成计划时注册表为空 → 计划里没有理论卡；注册完成后必须触发一次重算，
 * 否则理论卡永远不出现（直到用户做其它触发 state 变化的操作）。
 *
 * 实现要点：
 * - 只在有订阅者时才向注册表登记（避免空转）；最后一个订阅者退订时同步解除。
 * - 注册表本身对「注册前订阅」的调用方在注册完成时会补发通知（见 theoryDataSourceRegistry），
 *   因此本 hook 无需关心注册时序。
 * - getSnapshot 返回单调递增的 number（稳定原始值），满足 useSyncExternalStore 的稳定性要求。
 *
 * 消费方：Dashboard 将其放入每日推荐 useMemo 的依赖列表（理论卡因此可晚到自愈）。
 */
import { useSyncExternalStore } from 'react';
import { subscribeTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';

let revision = 0;
let unsubscribeRegistry: (() => void) | undefined;
const listeners = new Set<() => void>();

function notify(): void {
  revision += 1;
  // 复制一份再遍历：监听器内部可能退订
  for (const listener of [...listeners]) listener();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    unsubscribeRegistry = subscribeTheoryDataSource(notify);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      unsubscribeRegistry?.();
      unsubscribeRegistry = undefined;
    }
  };
}

function getSnapshot(): number {
  return revision;
}

/** 理论数据源版本号：注册 / 理论进度变化时递增，可安全用作 useMemo 依赖 */
export function useTheoryPlanRevision(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
