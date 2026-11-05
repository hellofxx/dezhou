/**
 * 内容运营元数据（课时 lastReviewed / sources）守卫：
 * - 覆盖率：标准变体全部课时（manifest 摘要层全集）逐条有登记，且无多余的悬空条目；
 * - 日期：ISO 8601（YYYY-MM-DD）且为真实日期，当前批次统一取批量基准日期；
 * - 出处：sources 只引用 bibliography 真实存在的条目 id（不虚构出处）；
 * - 未知课时（变体课 / 无效 id）返回 undefined，由 UI 隐藏。
 */
import { describe, expect, it } from 'vitest';
import { HEADS_UP_LEVEL_SUMMARIES, STANDARD_LEVEL_SUMMARIES } from './lessons/manifest';
import {
  DEFAULT_LAST_REVIEWED,
  HEADS_UP_LAST_REVIEWED,
  LESSON_CONTENT_META,
  getLessonContentMeta,
} from './contentOps';
import { STRATEGY_BIBLIOGRAPHY } from './bibliography';

const STANDARD_LESSON_IDS = STANDARD_LEVEL_SUMMARIES.flatMap((level) =>
  level.lessons.map((lesson) => lesson.id),
);

/** manifest 的变体 L4 在 l4a/l4b 下重复，按 id 去重 */
const HEADS_UP_LESSON_IDS = [
  ...new Set(
    HEADS_UP_LEVEL_SUMMARIES.flatMap((level) => level.lessons.map((lesson) => lesson.id)),
  ),
];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

describe('contentOps：覆盖率', () => {
  it('标准变体课时总数与 manifest 一致（92 门）', () => {
    expect(new Set(STANDARD_LESSON_IDS).size).toBe(STANDARD_LESSON_IDS.length);
    expect(STANDARD_LESSON_IDS.length).toBe(92);
  });

  it('每门标准课时都有内容运营条目', () => {
    const missing = STANDARD_LESSON_IDS.filter(
      (lessonId) => getLessonContentMeta(lessonId) === undefined,
    );
    expect(missing).toEqual([]);
  });

  it('每门单挑课时都有内容运营条目（12 门）', () => {
    expect(HEADS_UP_LESSON_IDS).toHaveLength(12);
    const missing = HEADS_UP_LESSON_IDS.filter(
      (lessonId) => getLessonContentMeta(lessonId) === undefined,
    );
    expect(missing).toEqual([]);
  });

  it('条目集合与标准 + 单挑课时集合完全相等（无悬空 / 无重复来源）', () => {
    expect(Object.keys(LESSON_CONTENT_META).toSorted()).toEqual(
      [...STANDARD_LESSON_IDS, ...HEADS_UP_LESSON_IDS].toSorted(),
    );
  });

  it('短牌变体课与无效 id 不登记（UI 据此隐藏）', () => {
    expect(getLessonContentMeta('l3sd-intro')).toBeUndefined();
    expect(getLessonContentMeta('not-a-lesson')).toBeUndefined();
  });
});

describe('contentOps：日期', () => {
  it('所有日期为合法 ISO 日期且取所属内容轨的批量基准', () => {
    const headsUpIds = new Set(HEADS_UP_LESSON_IDS);
    for (const [lessonId, meta] of Object.entries(LESSON_CONTENT_META)) {
      expect(isRealDate(meta.lastReviewed), `${lessonId} 日期非法：${meta.lastReviewed}`).toBe(
        true,
      );
      const expected = headsUpIds.has(lessonId) ? HEADS_UP_LAST_REVIEWED : DEFAULT_LAST_REVIEWED;
      expect(meta.lastReviewed, `${lessonId} 未取内容轨基准日期`).toBe(expected);
    }
    expect(isRealDate(DEFAULT_LAST_REVIEWED)).toBe(true);
    expect(isRealDate(HEADS_UP_LAST_REVIEWED)).toBe(true);
  });
});

describe('contentOps：出处', () => {
  it('sources 只引用 bibliography 现有条目', () => {
    const bibliographyIds = new Set(STRATEGY_BIBLIOGRAPHY.map((entry) => entry.id));
    const unknown: string[] = [];
    for (const [lessonId, meta] of Object.entries(LESSON_CONTENT_META)) {
      if (!meta.sources) continue;
      expect(meta.sources.length, `${lessonId} 的 sources 不应为空数组`).toBeGreaterThan(0);
      for (const sourceId of meta.sources) {
        if (!bibliographyIds.has(sourceId)) unknown.push(`${lessonId} → ${sourceId}`);
      }
    }
    expect(unknown).toEqual([]);
  });

  it('未登记出处的课时不带 sources 字段（不伪造空引用）', () => {
    expect(getLessonContentMeta('l1-basics')?.sources).toBeUndefined();
    expect(getLessonContentMeta('l6-icm')?.sources).toEqual(['mathematics-of-poker']);
  });
});
