/**
 * progress store 启动引导（副作用外移）。
 * 原位于 store.ts 模块顶层的副作用（事件总线订阅 / 成就检查 debounce）
 * 统一移至此，使 store.ts 保持纯 Zustand 定义。
 * 由应用入口调用 initProgressStore()（见 src/main.tsx）。
 * 注：ELO 初始同步已随依赖倒置（P2-2）移入 strategy-academy/store.bootstrap.ts。
 */
import { useProgressStore } from './store';
import { trainingEvents } from '@/shared/stores/trainingEvents';

let bootstrapped = false;

export function initProgressStore() {
  if (bootstrapped) return;
  bootstrapped = true;

  // 2. debounce timer（原 store.ts 的 debounce 相关代码）
  let checkTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedCheckAchievements = () => {
    if (checkTimeout) clearTimeout(checkTimeout);
    checkTimeout = setTimeout(() => {
      useProgressStore.getState().checkAchievements();
    }, 300);
  };

  // 1. 事件总线订阅（原 store.ts 的 trainingEvents.subscribe 代码）
  trainingEvents.subscribe((record) => {
    useProgressStore.getState().addRecord(record);
    // 训练完成后触发成就检查（debounced）
    debouncedCheckAchievements();
  });
}
