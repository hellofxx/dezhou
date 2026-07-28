import type { Lesson } from '../../types';
import { LIMP_LESSONS } from './limp';
import { STRADDLE_LESSONS } from './straddle';
import { DEEP_STACK_LESSONS } from './deepStack';
import { EXPLOIT_LESSONS } from './exploit';
import { GTO_BALANCE_LESSONS } from './gtoBalance';
import { MENTAL_LESSONS } from './mental';

/**
 * P2-1.2 ~ P2-1.7：本土低级别盈利路径的 16 课内容
 *
 * 共 6 个模块：
 * 1. Limp 局应对（3 课）
 * 2. Ante / Straddle（2 课）
 * 3. 深筹码调整（2 课）
 * 4. 玩家类型剥削（4 课）
 * 5. GTO 与剥削平衡（2 课）
 * 6. 情绪管理（3 课）
 */
export const LOCAL_LESSONS: Lesson[] = [
  ...LIMP_LESSONS,
  ...STRADDLE_LESSONS,
  ...DEEP_STACK_LESSONS,
  ...EXPLOIT_LESSONS,
  ...GTO_BALANCE_LESSONS,
  ...MENTAL_LESSONS,
];

/** 按 ID 查找本土课程 */
export function getLocalLesson(id: string): Lesson | undefined {
  return LOCAL_LESSONS.find((l) => l.id === id);
}
