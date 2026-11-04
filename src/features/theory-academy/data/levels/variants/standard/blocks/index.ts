import type { TheorySection } from '../../../../../types';
import { CONTENT_BLOCKS as T2_BLOCKS } from './t2';
import { CONTENT_BLOCKS as T4_BLOCKS } from './t4';
import { CONTENT_BLOCKS as T5_BLOCKS } from './t5';
import { CONTENT_BLOCKS as T6_BLOCKS } from './t6';
import { CONTENT_BLOCKS as T7_BLOCKS } from './t7';
import { CONTENT_BLOCKS as T8_BLOCKS } from './t8';
import { CONTENT_BLOCKS as T9_BLOCKS } from './t9';

export { applyStandardContentBlocks } from './applyContentBlocks';

/**
 * 标准变体富文本块（表格 / 范围矩阵 / 决策树）的静态合并视图。
 *
 * 运行时走 loaders.ts 的 import.meta.glob 逐 Level 懒加载；本文件仅供静态/测试路径。
 * 块只追加在章节既有 content 尾部，index 型 i18n key 的既有下标永远不变。
 */
export const STANDARD_CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  ...T2_BLOCKS,
  ...T4_BLOCKS,
  ...T5_BLOCKS,
  ...T6_BLOCKS,
  ...T7_BLOCKS,
  ...T8_BLOCKS,
  ...T9_BLOCKS,
};
