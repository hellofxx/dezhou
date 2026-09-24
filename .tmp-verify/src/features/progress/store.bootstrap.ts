/**
 * progress store 启动引导（副作用外移）。
 * 原位于 store.ts 模块顶层的副作用（事件总线订阅 / 成就检查 debounce）
 * 统一移至此，使 store.ts 保持纯 Zustand 定义。
 * 由应用入口调用 initProgressStore()（见 src/main.tsx）。
 * 注：ELO 初始同步已随依赖倒置（P2-2）移入 strategy-academy/store.bootstrap.ts。
 *
 * P2-01 阶段 A：引导流程改为 async（records 外迁 IndexedDB）：
 *   1. 等待 persist hydration 完成 —— 升级首启（v12→v13）时 localStorage 遗留的
 *      records 会在 hydration merge 时进入内存，必须先于 IndexedDB 加载完成，
 *      避免 setState 覆盖遗留数据；
 *   2. hydration 完成后把内存 records 一次性迁入 IndexedDB（put 幂等，重复执行
 *      无副作用；日常新增 records 已由 addRecord side-effect 落库）；
 *   3. 从 IndexedDB 加载 records 到内存（实时查询/统计的数据源）；
 *   4. 订阅 trainingEvents 总线（原有逻辑，保持不变）。
 */
import { useProgressStore } from './store';
import { recordDatabase } from './utils/recordDatabase';
import { trainingEvents } from '@/shared/stores/trainingEvents';

let bootstrapped = false;

export async function initProgressStore() {
  if (bootstrapped) return;
  bootstrapped = true;

  // 1+2. 等 hydration 完成，并将内存 records（含升级首启的遗留数据）落库 IndexedDB
  await waitForHydrationAndMigrateLegacyRecords();

  // 3. 从 IndexedDB 加载 records 到内存（本地实时查询/统计数据源；IndexedDB 不可用
  //    时降级为内存模式 —— 本次会话新增记录仍可用，仅失去跨会话持久化）
  try {
    const records = await recordDatabase.getAll();
    useProgressStore.setState({ records });
  } catch (err) {
    console.warn('[progress] 从 IndexedDB 加载 records 失败，降级为内存模式', err);
  }

  // 4. debounce timer（原 store.ts 的 debounce 相关代码）
  let checkTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedCheckAchievements = () => {
    if (checkTimeout) clearTimeout(checkTimeout);
    checkTimeout = setTimeout(() => {
      useProgressStore.getState().checkAchievements();
    }, 300);
  };

  // 5. 事件总线订阅（原 store.ts 的 trainingEvents.subscribe 代码）
  trainingEvents.subscribe((record) => {
    useProgressStore.getState().addRecord(record);
    // 训练完成后触发成就检查（debounced）
    debouncedCheckAchievements();
  });
}

/**
 * 等待 persist hydration 完成并将内存 records 迁入 IndexedDB：
 * - 升级首启时，localStorage 遗留 records 在 hydration merge 时进入内存（v13 起
 *   partialize 已排除 records，本次迁移后 localStorage 不再持有 records）；
 * - 先注册 onFinishHydration 再查 hasHydrated，避免 hydration 已完成时的竞态漏触发。
 */
function waitForHydrationAndMigrateLegacyRecords(): Promise<void> {
  return new Promise((resolve) => {
    const migrate = async () => {
      try {
        const records = useProgressStore.getState().records;
        if (records.length > 0) {
          await recordDatabase.add(records);
        }
      } catch (err) {
        console.warn('[progress] 遗留 records 迁入 IndexedDB 失败', err);
      }
      resolve();
    };
    if (useProgressStore.persist.hasHydrated()) {
      void migrate();
      return;
    }
    const unsub = useProgressStore.persist.onFinishHydration(() => {
      unsub();
      void migrate();
    });
  });
}
