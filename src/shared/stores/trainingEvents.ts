import type { TrainingRecord } from '@/features/progress/types';

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
    callbacks.forEach((cb) => cb(record));
  },
};
