// PLAT-01：类型引用从 feature 层下沉到 shared 层（shared 不依赖 feature 的分层约束）
import type { TrainingRecord } from '@/shared/types/training';

type TrainingEventCallback = (record: TrainingRecord) => void;

let callbacks: TrainingEventCallback[] = [];

/**
 * 训练事件总线
 * 用于跨模块通信：各 feature 模块完成训练后发布事件，progress store 订阅并记录
 */
export const trainingEvents = {
  subscribe: (cb: TrainingEventCallback): (() => void) => {
    callbacks.push(cb);
    return () => {
      callbacks = callbacks.filter((c) => c !== cb);
    };
  },
  emit: (record: TrainingRecord) => {
    for (const cb of callbacks) {
      try {
        cb(record);
      } catch (err) {
        console.error('[trainingEvents] subscriber failed', err);
      }
    }
  },
};
