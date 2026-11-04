import type { TheoryQuizQuestion } from '../../../../../types';
import { QUIZ_BANK as T1_QUIZ_BANK } from './t1';
import { QUIZ_BANK as T2_QUIZ_BANK } from './t2';
import { QUIZ_BANK as T3_QUIZ_BANK } from './t3';
import { QUIZ_BANK as T4_QUIZ_BANK } from './t4';
import { QUIZ_BANK as T5_QUIZ_BANK } from './t5';
import { QUIZ_BANK as T6_QUIZ_BANK } from './t6';
import { QUIZ_BANK as T7_QUIZ_BANK } from './t7';
import { QUIZ_BANK as T8_QUIZ_BANK } from './t8';
import { QUIZ_BANK as T9_QUIZ_BANK } from './t9';

export { applyStandardQuizBank } from './applyQuizBank';

/**
 * 标准变体章末小测题库（9 个 Level 文件合并的静态视图）。
 *
 * 为什么从 level/chapter 文件里拆出来：正文与题库的生命周期不同——正文按章节追加、
 * 题库按章扩容；混在同一文件里两者互相抬高行数。拆分后 level 文件只剩正文与元数据，
 * 题库按 Level 单文件维护，运行时由 loaders.ts 经 import.meta.glob 逐级懒加载，
 * 静态/测试路径（variants/standard/index.ts）才一次性合并全部 9 个文件。
 *
 * 注入契约：题库以章节 id 为键；题 id 必须为 `<chapterId>-q<n>`，注入时按 n 升序排序、
 * 按 id 去重、非法 id 直接抛错（数据错误必须 fail loud，不能静默丢题）。
 */
export const STANDARD_QUIZ_BANK: Record<string, TheoryQuizQuestion[]> = {
  ...T1_QUIZ_BANK,
  ...T2_QUIZ_BANK,
  ...T3_QUIZ_BANK,
  ...T4_QUIZ_BANK,
  ...T5_QUIZ_BANK,
  ...T6_QUIZ_BANK,
  ...T7_QUIZ_BANK,
  ...T8_QUIZ_BANK,
  ...T9_QUIZ_BANK,
};
