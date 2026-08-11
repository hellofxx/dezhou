import type { TrainingResult } from '@/shared/types/common';

/**
 * 训练记录（跨模块事件总线载荷 + progress 持久化）
 *
 * PLAT-01 修复：类型从 features/progress/types 下沉到 shared，
 * 使 shared/stores/trainingEvents 不再依赖 feature 层（shared 不依赖 feature 的分层约束）。
 */
export interface TrainingRecord {
  id: string;
  module: 'range-trainer' | 'pot-odds' | 'gto-simulator' | 'strategy-academy' | 'puzzle-trainer' | 'hand-history' | 'theory-academy';
  mode: string;              // 'quiz', 'practice', etc.
  result: TrainingResult;
  createdAt: number;         // timestamp
}
