import { mergeQuizBank } from '@/shared/utils/academyQuizBank';
import type { Lesson, QuizQuestion } from '../types';

/**
 * 策略学院题库注入（薄包装 shared mergeQuizBank）。
 * 只替换已登记 lessonId 的 quiz；未登记课时沿用内联 quiz，
 * 便于 content 轨按 Level 分批迁移、空题库期间行为不变。
 */
export function applyQuizBank(
  lessons: readonly Lesson[],
  bank: Readonly<Record<string, QuizQuestion[]>>,
): Lesson[] {
  return mergeQuizBank(lessons, bank);
}
