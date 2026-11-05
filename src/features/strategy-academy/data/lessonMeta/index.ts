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
import { HEADS_UP_LESSON_META } from './headsUp';

/**
 * 课时元数据（ELO 维度 + 理论锚点）。
 *
 * 标准变体覆盖 L1–L8 + Level 7 挂载的本土路径 17 课（含 21 个 Drill）；
 * 单挑变体覆盖 L3–L8 共 12 课（`headsUp.ts`）。两表分开导出，守卫按变体分别校验锚点集合，
 * 避免 `t*hu-*` 锚点混入标准桥接。
 *
 * 锚点选取规则：① 正文内已内联 `type: 'theory-reference'` 的章节必须保留（正文与锚点同源）；
 * ② 其余按“本课结论在理论学院哪一章给出推导”补一条；③ 每课至少 1 条，通常 2 条。
 * 锚点存在性由 `lessonMeta.integrity.test.ts` 与 `theoryReferenceIntegrity.test.ts` 双守卫。
 * 未登记课时（短牌等）由 `getLessonMeta` 回退 postflop / 空锚点。
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

const ALL_LESSON_META: Record<string, LessonMeta> = {
  ...STANDARD_LESSON_META,
  ...HEADS_UP_LESSON_META,
};

export function getLessonMeta(lessonId: string): LessonMeta {
  return ALL_LESSON_META[lessonId] ?? { eloDimension: 'postflop', theoryAnchors: [] };
}

/** 运行时合并表（标准 + 单挑）；未登记变体仍走 postflop / 空锚点回退。 */
export function getLessonMetaMap(): Readonly<Record<string, LessonMeta>> {
  return ALL_LESSON_META;
}

/** 守卫用：标准变体元数据分表 */
export function getStandardLessonMetaMap(): Readonly<Record<string, LessonMeta>> {
  return STANDARD_LESSON_META;
}

/** 守卫用：单挑变体元数据分表 */
export function getHeadsUpLessonMetaMap(): Readonly<Record<string, LessonMeta>> {
  return HEADS_UP_LESSON_META;
}
