/**
 * progress store 启动引导（副作用外移）。
 * 原位于 store.ts 模块顶层的副作用（事件总线订阅 / 成就检查 debounce）
 * 统一移至此，使 store.ts 保持纯 Zustand 定义。
 * 由应用入口调用 initProgressStore()（见 src/main.tsx）。
 * 注：ELO 初始同步已随依赖倒置（P2-2）移入 strategy-academy/store.bootstrap.ts。
 *
 * P1 持久化切片（启动顺序与可重试性）：
 *   1. **先订阅** trainingEvents，再做 hydration / IndexedDB 恢复 —— 初始化窗口内
 *      emit 的训练事件直接入账，不再因为「订阅晚于恢复」而丢失；
 *   2. init 幂等：并发调用共享同一个 promise，订阅只注册一次；
 *   3. init 失败可重试：失败后闸门复位，再次调用会重跑未完成的步骤；
 *   4. records 恢复带 epoch 屏障：等待 getAll 期间若发生清空 / 删除，
 *      返回的旧快照作废（清空）或按 id 过滤（删除），已删数据不复活；
 *   5. 恢复结束（成功或降级）后 markRecordsLoadingDone()，初始化屏障可观测。
 *
 * legacy records 桥接（v13 起 partialize 排除 records）：
 *   - hydration 期间旧快照的 records 由 utils/legacyRecordsBridge 捕获（persistStorage 接线），
 *     并在桥接激活期间被合并回每次写回的载荷，避免迁移完成前被擦除；
 *   - records 迁入 IndexedDB 成功前不清理原载荷、不 markRecordsLoadingDone()，
 *     即不开放破坏性操作；迁入或写回失败时保持桥接激活并上报 records 来源，
 *     下次 init 重试同一批旧记录（persistRecord 幂等：同 id 不覆盖库内已有）。
 */
import { useProgressStore } from './store';
import { recordDatabase } from './utils/recordDatabase';
import {
  getPendingRecordCount,
  getRecordsEpoch,
  isRecordRemoved,
  markRecordsLoadingDone,
  persistRecord,
} from './recordPersistence';
import { classifyPersistenceReason, reportPersistenceFailure } from './persistenceStatus';
import {
  getLegacyRecords,
  isLegacyBridgeActive,
  removeLegacyRecordsFromStorage,
} from './utils/legacyRecordsBridge';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingRecord } from './types';

/** 引导闸门：并发调用共享同一个 promise；失败（或桥接未完成）后复位以允许重试 */
let initPromise: Promise<void> | null = null;
/** 事件总线退订句柄：兼作「已订阅」标记，保证只订阅一次 */
let unsubscribeTrainingEvents: (() => void) | null = null;

export function initProgressStore(): Promise<void> {
  if (initPromise) return initPromise;
  const attempt = runInit();
  initPromise = attempt;
  // 失败复位（不吞掉调用方的 rejection）：后续调用可重试未完成的步骤；
  // legacy 桥接仍未释放时同样复位闸门，让下一次 init 继续迁移同一批旧记录。
  void attempt.then(
    () => {
      if (initPromise === attempt && isLegacyBridgeActive()) initPromise = null;
    },
    () => {
      if (initPromise === attempt) initPromise = null;
    },
  );
  return attempt;
}

async function runInit(): Promise<void> {
  // 1. 先订阅：初始化窗口内 emit 的训练事件不丢
  subscribeTrainingEvents();
  // 2. 等 persist hydration（localStorage 同步层）完成
  await waitForProgressHydration();
  if (isLegacyBridgeActive()) {
    // 3a. 升级首启：旧 localStorage 载荷里仍有 records，先幂等落库
    if (!(await migrateBridgedRecordsToDatabase())) return;
    // 3b. 落库确认成功后才从原载荷摘掉 records；失败则保持桥接（下次 init 重试）
    if (!removeLegacyRecordsFromStorage()) return;
  } else {
    // 3c. 无桥接：内存遗留 records（旧路径 / 直接 setState）仍按原方式迁入
    await migrateInMemoryRecordsToDatabase();
  }
  // 4. 从 IndexedDB 恢复 records 到内存（带 epoch 屏障）
  await loadRecordsFromDatabase();
}

/** 订阅训练事件总线（幂等）：emit 立即入账，并 debounce 触发成就检查。 */
function subscribeTrainingEvents(): void {
  if (unsubscribeTrainingEvents) return;
  const debouncedCheckAchievements = createDebouncedAchievementCheck();
  unsubscribeTrainingEvents = trainingEvents.subscribe((record) => {
    useProgressStore.getState().addRecord(record);
    // 训练完成后触发成就检查（debounced）
    debouncedCheckAchievements();
  });
}

function createDebouncedAchievementCheck(): () => void {
  let checkTimeout: ReturnType<typeof setTimeout> | null = null;
  return () => {
    if (checkTimeout) clearTimeout(checkTimeout);
    checkTimeout = setTimeout(() => {
      useProgressStore.getState().checkAchievements();
    }, 300);
  };
}

/**
 * 等待 persist hydration 完成（不触碰 IndexedDB）。
 * 首屏渲染闸门只等这一层；records 加载与事件订阅由 initProgressStore 在后台完成。
 */
export function waitForProgressHydration(): Promise<void> {
  if (useProgressStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = useProgressStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

/**
 * legacy 桥接记录落库：经 recordPersistence 的持久化路径（addIfAbsent 幂等，
 * 失败进入待重试队列并上报 records 来源）。
 * @returns true = 全部可持久化记录已落库（invalid / cancelled 视为已了结）
 */
async function migrateBridgedRecordsToDatabase(): Promise<boolean> {
  let allPersisted = true;
  for (const record of getLegacyRecords()) {
    const result = await persistRecord(record);
    if (!result.ok && result.reason === 'failed') allPersisted = false;
  }
  return allPersisted;
}

/**
 * 将内存 records（升级首启时来自 localStorage 遗留数据，且未触发桥接）迁入 IndexedDB：
 * v13 起 partialize 已排除 records，本次迁移后 localStorage 不再持有 records。
 */
async function migrateInMemoryRecordsToDatabase(): Promise<void> {
  try {
    const records = useProgressStore.getState().records;
    if (records.length > 0) {
      await recordDatabase.add(records);
    }
  } catch (error) {
    console.warn('[progress] 遗留 records 迁入 IndexedDB 失败', error);
  }
}

/** 从 IndexedDB 恢复 records：epoch 变化（期间清空）时丢弃旧快照，删除过的记录不再复活。 */
async function loadRecordsFromDatabase(): Promise<void> {
  const epoch = getRecordsEpoch();
  try {
    const stored = await recordDatabase.getAll();
    if (getRecordsEpoch() !== epoch) return;
    useProgressStore.setState((state) => mergeLoadedRecords(state.records, stored));
  } catch (error) {
    console.warn('[progress] 从 IndexedDB 加载 records 失败，降级为内存模式', error);
    reportPersistenceFailure('records', {
      reason: classifyPersistenceReason(error),
      operation: 'load',
      pending: getPendingRecordCount(),
    });
  } finally {
    markRecordsLoadingDone();
  }
}

/** 内存与库内记录合并：内存优先（含初始化期间新入账的记录），按 createdAt 升序。 */
function mergeLoadedRecords(
  current: TrainingRecord[],
  stored: TrainingRecord[],
): { records: TrainingRecord[] } {
  const visible = stored.filter((record) => !isRecordRemoved(record.id));
  if (current.length === 0) return { records: visible };
  const merged = new Map(current.map((record) => [record.id, record]));
  for (const record of visible) {
    if (!merged.has(record.id)) merged.set(record.id, record);
  }
  return { records: [...merged.values()].toSorted((a, b) => a.createdAt - b.createdAt) };
}
