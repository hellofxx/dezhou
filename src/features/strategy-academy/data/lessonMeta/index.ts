import type { LessonMeta } from '../../types';
import { LEVEL_1_LESSON_META } from './level1';
import { LEVEL_2_LESSON_META } from './level2';
import { LEVEL_3_LESSON_META } from './level3';
import { LEVEL_4_LESSON_META } from './level4';
import { LEVEL_5_LESSON_META } from './level5';
import { LEVEL_6_LESSON_META } from './level6';
import { LEVEL_7_LESSON_META } from './level7';
import { LEVEL_8_LESSON_META } from './level8';
import { LOCAL_LESSON_META } from './local';

/**
 * 课时元数据（ELO 维度 + 理论锚点）。
 *
 * 覆盖标准变体全部课时（L1–L8 + Level 7 挂载的本土路径 17 课，含 21 个 Drill）。
 * 锚点选取规则：① 正文内已内联 `type: 'theory-reference'` 的章节必须保留（正文与锚点同源）；
 * ② 其余按“本课结论在理论学院哪一章给出推导”补一条；③ 每课至少 1 条，通常 2 条。
 * 锚点存在性由 `lessonMeta.integrity.test.ts` 与 `theoryReferenceIntegrity.test.ts` 双守卫。
 * 未登记课时（变体专属课等）由 `getLessonMeta` 回退 postflop / 空锚点。
 */
const STANDARD_LESSON_META: Record<string, LessonMeta> = {
  ...LEVEL_1_LESSON_META,
  ...LEVEL_2_LESSON_META,
  ...LEVEL_3_LESSON_META,
  ...LEVEL_4_LESSON_META,
  ...LEVEL_5_LESSON_META,
  ...LEVEL_6_LESSON_META,
  ...LEVEL_7_LESSON_META,
  ...LEVEL_8_LESSON_META,
  ...LOCAL_LESSON_META,
};

export function getLessonMeta(lessonId: string): LessonMeta {
  return STANDARD_LESSON_META[lessonId] ?? { eloDimension: 'postflop', theoryAnchors: [] };
}

export function getLessonMetaMap(): Readonly<Record<string, LessonMeta>> {
  return STANDARD_LESSON_META;
}
