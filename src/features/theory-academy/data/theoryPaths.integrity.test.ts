import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TheoryPathTag } from '../types';
import { THEORY_PATHS } from './theoryPaths';
import { getChapterSummariesByVariant } from '../utils/theoryMeta';

/**
 * 学习路径数据完整性守卫。
 *
 * 路径是纯静态清单，不与章节数据同源，因此有四类漂移只有这里能拦：
 * 1. 成员 id 打错 / 章节被删改（悬空成员 → 卡片进度永远到不了 x/y）；
 * 2. 成员与主题标签脱钩（路径按 tag 声明主题，成员却不在该主题里 → 语义名不副实）；
 * 3. 路径 id 重复或路径内成员重复（进度分母虚高、同章计两次）；
 * 4. 路径标题/描述 key 缺双语（`t()` 用动态拼接，staticKeyGuard 覆盖不到）。
 *
 * 成员集合用「计划书原样」逐条锁定：成员增删必须同时改本文件，避免路径在无人察觉时变味。
 */

const EXPECTED_PATHS: Record<string, { tag: TheoryPathTag; chapterIds: string[] }> = {
  'sixmax-cash-core': {
    tag: 'six-max',
    chapterIds: [
      't1-sixmax-table',
      't3-blind-battle',
      't4-sixmax-ranges',
      't6-srp-postflop',
      't6-3bet-pot',
      't6-turn-river',
      't9-sixmax-capstone',
    ],
  },
  'postflop-deep': {
    tag: 'postflop',
    chapterIds: [
      't4-range-advantage',
      't5-mdf-alpha',
      't6-bet-purpose',
      't6-sizing-theory',
      't6-geometric',
      't6-srp-postflop',
      't6-3bet-pot',
      't6-turn-river',
    ],
  },
  'mtt-bridge': {
    tag: 'mtt',
    chapterIds: [
      't4-structure-economics',
      't5-multiway-frequency',
      't9-icm',
      't9-multiway',
      't9-cash-vs-mtt',
    ],
  },
};

const STANDARD_CHAPTERS = new Map(
  getChapterSummariesByVariant('standard').map((chapter) => [chapter.id, chapter]),
);

const SIDES = ['zh', 'en'] as const;
const CJK = /[\u4e00-\u9fff]/;

interface PathsChrome {
  paths?: Record<string, { title?: string; description?: string }>;
}

const PATHS_CHROME: Record<(typeof SIDES)[number], PathsChrome> = {
  zh: JSON.parse(readFileSync('src/i18n/locales/zh/theory.json', 'utf8')) as PathsChrome,
  en: JSON.parse(readFileSync('src/i18n/locales/en/theory.json', 'utf8')) as PathsChrome,
};

describe('theoryPaths 数据完整性', () => {
  it('路径 id 唯一且集合与计划一致（顺序即展示顺序）', () => {
    const ids = THEORY_PATHS.map((path) => path.id);

    expect(ids).toEqual(Object.keys(EXPECTED_PATHS));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每条路径的主题标签与成员集合与计划逐条一致', () => {
    for (const path of THEORY_PATHS) {
      const expected = EXPECTED_PATHS[path.id];
      expect(expected, `未登记的路径 id：${path.id}`).toBeDefined();
      expect(path.tag, `${path.id} 主题标签`).toBe(expected!.tag);
      expect(path.chapterIds, `${path.id} 成员章节`).toEqual(expected!.chapterIds);
    }
  });

  it('单条路径内成员不重复', () => {
    const duplicated = THEORY_PATHS.flatMap((path) => {
      const unique = new Set(path.chapterIds);
      return unique.size === path.chapterIds.length ? [] : [path.id];
    });

    expect(duplicated).toEqual([]);
  });

  it('成员章节全部存在于标准变体目录（无悬空 id）', () => {
    const missing = THEORY_PATHS.flatMap((path) =>
      path.chapterIds
        .filter((chapterId) => !STANDARD_CHAPTERS.has(chapterId))
        .map((chapterId) => `${path.id} → ${chapterId}`),
    );

    expect(missing).toEqual([]);
  });

  it('每个成员章节的 pathTags 都含该路径的主题标签', () => {
    const mismatched = THEORY_PATHS.flatMap((path) =>
      path.chapterIds
        .filter((chapterId) => !(STANDARD_CHAPTERS.get(chapterId)?.pathTags ?? []).includes(path.tag))
        .map((chapterId) => `${path.id} → ${chapterId} 缺 pathTags:${path.tag}`),
    );

    expect(mismatched).toEqual([]);
  });

  for (const side of SIDES) {
    it(`${side}：三条路径都有非空 title 与 description`, () => {
      const missing = THEORY_PATHS.flatMap((path) => {
        const entry = PATHS_CHROME[side].paths?.[path.id];
        const bad: string[] = [];
        if (!entry?.title?.trim()) bad.push(`${path.id}: 缺 theory.paths.${path.id}.title`);
        if (!entry?.description?.trim()) bad.push(`${path.id}: 缺 theory.paths.${path.id}.description`);
        return bad;
      });

      expect(missing).toEqual([]);
    });
  }

  it('en：路径标题与描述不含汉字', () => {
    const cjk = THEORY_PATHS.flatMap((path) => {
      const entry = PATHS_CHROME.en.paths?.[path.id];
      const bad: string[] = [];
      if (CJK.test(entry?.title ?? '')) bad.push(`${path.id}: en title 含汉字`);
      if (CJK.test(entry?.description ?? '')) bad.push(`${path.id}: en description 含汉字`);
      return bad;
    });

    expect(cjk).toEqual([]);
  });
});
