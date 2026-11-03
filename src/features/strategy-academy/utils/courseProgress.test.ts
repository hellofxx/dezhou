import { describe, expect, it } from 'vitest';
import {
  findLessonById,
  getAllLessons,
  getLessonProgressMeta,
  getLevelCompletedCount,
  getNextLesson,
  getTotalLessonCount,
} from './courseProgress';
import { LEVELS } from '../data/courses';
import { ALL_VARIANT_LESSONS } from '../data/lessons/variants';
import type { Lesson } from '../types';

/**
 * 课程扁平化与序列定位契约（utils/courseProgress）：
 * - 标准课程按 LEVELS 顺序扁平化；变体课程在标准未命中时回退（ACAD-05）
 * - 同 level 多条目（L4 = 4A + 4B）的完成数按合并口径
 * - 未知课程/末课返回 undefined；退化输入不抛错
 */

const standardLessons = getAllLessons();
const firstStandardId = standardLessons[0]!.id;
const lastStandardId = standardLessons.at(-1)!.id;

/** 变体专属课程（ALL_VARIANT_LESSONS 前段是标准课程，必须取 sd-/hu- 前缀项） */
const variantOnlyLessons = ALL_VARIANT_LESSONS.filter((lesson) => /^l\d+(sd|hu)-/.test(lesson.id));
const firstVariantId = variantOnlyLessons[0]!.id;
const lastVariantId = variantOnlyLessons.at(-1)!.id;

function sampleVariantLesson(): Lesson {
  return variantOnlyLessons[1]!;
}

describe('courseProgress：标准课程扁平化', () => {
  it('getAllLessons 按 LEVELS 顺序拼接全部课程', () => {
    const expectedCount = LEVELS.reduce((sum, level) => sum + level.lessons.length, 0);
    expect(standardLessons).toHaveLength(expectedCount);
    expect(standardLessons[0]!.id).toBe(LEVELS[0]!.lessons[0]!.id);
    expect(standardLessons.at(-1)!.id).toBe(LEVELS.at(-1)!.lessons.at(-1)!.id);
  });

  it('getTotalLessonCount 与扁平化长度一致', () => {
    expect(getTotalLessonCount()).toBe(standardLessons.length);
  });

  it('findLessonById 命中标准课程', () => {
    expect(findLessonById(firstStandardId)?.id).toBe(firstStandardId);
  });

  it('findLessonById 标准未命中时回退变体课程', () => {
    expect(ALL_VARIANT_LESSONS.some((l) => l.id === firstVariantId)).toBe(true);
    expect(findLessonById(firstVariantId)?.id).toBe(firstVariantId);
  });

  it('findLessonById 未知 id 返回 undefined', () => {
    expect(findLessonById('not-a-real-lesson')).toBeUndefined();
  });
});

describe('courseProgress：课程序列导航', () => {
  it('getNextLesson 返回标准序列的下一课', () => {
    const first = standardLessons[0]!;
    const second = standardLessons[1]!;
    expect(getNextLesson(first.id)?.id).toBe(second.id);
  });

  it('序列最后一课返回 undefined', () => {
    expect(getNextLesson(lastStandardId)).toBeUndefined();
  });

  it('变体课程走变体全集序列', () => {
    const index = ALL_VARIANT_LESSONS.findIndex((lesson) => lesson.id === firstVariantId);
    expect(getNextLesson(firstVariantId)?.id).toBe(ALL_VARIANT_LESSONS[index + 1]!.id);
    expect(getNextLesson(lastVariantId)).toBeUndefined();
  });

  it('未知课程返回 undefined', () => {
    expect(getNextLesson('not-a-real-lesson')).toBeUndefined();
  });
});

describe('courseProgress：完成度统计', () => {
  it('getLevelCompletedCount 只统计指定 level 的已完成课程', () => {
    const level1Ids = LEVELS.filter((level) => level.level === 1)
      .flatMap((level) => level.lessons)
      .map((lesson) => lesson.id);
    const completed = [level1Ids[0]!, level1Ids[1]!, 'l2-raise-sizing'];
    expect(getLevelCompletedCount(1, completed)).toBe(2);
  });

  it('L4 合并 4A + 4B 两个条目的课程数', () => {
    const level4Entries = LEVELS.filter((level) => level.level === 4);
    const level4Ids = level4Entries.flatMap((level) => level.lessons.map((lesson) => lesson.id));
    expect(level4Entries.length).toBeGreaterThanOrEqual(2);
    expect(getLevelCompletedCount(4, level4Ids)).toBe(level4Ids.length);
  });

  it('不存在的 level 返回 0', () => {
    expect(getLevelCompletedCount(99, standardLessons.map((lesson) => lesson.id))).toBe(0);
  });
});

describe('courseProgress：进度位置', () => {
  it('标准课程位置基于标准全集', () => {
    const target = standardLessons[2]!;
    const meta = getLessonProgressMeta(target);
    expect(meta.current).toBe(3);
    expect(meta.total).toBe(standardLessons.length);
    expect(meta.percent).toBeCloseTo((3 / standardLessons.length) * 100, 6);
  });

  it('变体课程位置基于变体全集', () => {
    const target = sampleVariantLesson();
    const index = ALL_VARIANT_LESSONS.findIndex((lesson) => lesson.id === target.id);
    const meta = getLessonProgressMeta(target);
    expect(meta.current).toBe(index + 1);
    expect(meta.total).toBe(ALL_VARIANT_LESSONS.length);
    expect(meta.percent).toBeCloseTo(((index + 1) / ALL_VARIANT_LESSONS.length) * 100, 6);
  });

  it('未知课程退化为 current=0 / percent=0（不抛错）', () => {
    const unknown = { id: 'not-a-real-lesson' } as Lesson;
    const meta = getLessonProgressMeta(unknown);
    expect(meta.current).toBe(0);
    expect(meta.percent).toBe(0);
    expect(meta.total).toBe(ALL_VARIANT_LESSONS.length);
  });
});
