import { describe, expect, it } from 'vitest';
import {
  getHeadsUpLessonMetaMap,
  getLessonMeta,
  getLessonMetaMap,
  getStandardLessonMetaMap,
} from './index';
import { HEADS_UP_LEVEL_SUMMARIES, STANDARD_LEVEL_SUMMARIES } from '../lessons/manifest';

/**
 * 课时元数据（ELO 维度 + 理论锚点）完整性守卫。
 *
 * 覆盖两套独立映射：
 * - 标准变体（含 21 个 Drill 与 Level 7 挂载的本土 17 课）→ 标准理论章 `t<n>-*`
 * - 单挑变体 L3–L8 共 12 课 → 单挑理论章 `t<n>hu-*`
 *
 * 三件事必须常驻可验证，否则“策略课 → 理论章”的桥接会静默退化成死链：
 * 1. 覆盖：每个变体的每一门课都有元数据条目；
 * 2. 锚点：每课至少 1 个 theoryAnchors，且锚点在该变体的理论数据里真实存在（不得跨变体）；
 * 3. 维度：eloDimension 属于 EloDimension 五维枚举。
 *
 * 理论章节 id 集合经 Vite 原生 `import.meta.glob(..., '?raw')` 读取理论学院源码后扫描得出，
 * 不维护手工镜像清单（不 import 理论模块，eslint 模块隔离仍生效）。
 * 扫描范围覆盖 Level 文件与 `chapters/`（章节型课时单独成文件），题 id（`<chapter>-q<n>`）排除。
 */

const standardTheorySources = import.meta.glob<string>(
  '../../../theory-academy/data/levels/variants/standard/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

const headsUpTheorySources = import.meta.glob<string>(
  '../../../theory-academy/data/levels/variants/heads-up/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

const VALID_ELO_DIMENSIONS = new Set(['preflop', 'postflop', 'math', 'handReading', 'mental']);

function readChapterIds(sources: Record<string, string>, pattern: RegExp): Set<string> {
  const ids = new Set<string>();
  for (const [file, src] of Object.entries(sources)) {
    if (file.endsWith('.test.ts')) continue;
    for (const m of src.matchAll(pattern)) {
      const id = m[1];
      if (!id || /-q\d+$/.test(id)) continue;
      ids.add(id);
    }
  }
  return ids;
}

const STANDARD_CHAPTER_IDS = readChapterIds(standardTheorySources, /id: '(t\d-[a-z0-9-]+)'/g);
const HEADS_UP_CHAPTER_IDS = readChapterIds(headsUpTheorySources, /id: '(t\d+hu-[a-z0-9-]+)'/g);

/** manifest 目录摘要为唯一事实源；L4 在 l4a/l4b 下重复，按 id 去重 */
const STANDARD_LESSON_IDS = [
  ...new Set(STANDARD_LEVEL_SUMMARIES.flatMap((level) => level.lessons.map((lesson) => lesson.id))),
];
const HEADS_UP_LESSON_IDS = [
  ...new Set(HEADS_UP_LEVEL_SUMMARIES.flatMap((level) => level.lessons.map((lesson) => lesson.id))),
];

const STANDARD_META = getStandardLessonMetaMap();
const HEADS_UP_META = getHeadsUpLessonMetaMap();
const ALL_META = getLessonMetaMap();

describe('lessonMeta 覆盖完整性', () => {
  it('守卫确实扫描到两套理论数据与课时（防正则失配导致空断言）', () => {
    expect(Object.keys(standardTheorySources).length).toBeGreaterThan(10);
    expect(Object.keys(headsUpTheorySources).length).toBeGreaterThan(10);
    expect(STANDARD_LESSON_IDS.length).toBeGreaterThanOrEqual(91);
    expect(HEADS_UP_LESSON_IDS.length).toBe(12);
  });

  it('标准变体每一门课都有元数据条目', () => {
    const missing = STANDARD_LESSON_IDS.filter((id) => !(id in STANDARD_META));
    expect({ missing, missingCount: missing.length }).toEqual({ missing: [], missingCount: 0 });
  });

  it('单挑变体每一门课都有元数据条目', () => {
    const missing = HEADS_UP_LESSON_IDS.filter((id) => !(id in HEADS_UP_META));
    expect({ missing, missingCount: missing.length }).toEqual({ missing: [], missingCount: 0 });
  });

  it('合并表没有多余 id（不留已删除课程的幽灵条目）', () => {
    const known = new Set([...STANDARD_LESSON_IDS, ...HEADS_UP_LESSON_IDS]);
    const ghosts = Object.keys(ALL_META).filter((id) => !known.has(id));
    expect({ ghosts, ghostCount: ghosts.length }).toEqual({ ghosts: [], ghostCount: 0 });
  });

  it('未登记 id 回退 postflop / 空锚点，不抛错', () => {
    expect(getLessonMeta('not-a-real-lesson')).toEqual({
      eloDimension: 'postflop',
      theoryAnchors: [],
    });
  });
});

describe('lessonMeta 理论锚点', () => {
  it('理论章节扫描覆盖 Level 文件与 chapters/ 两类来源', () => {
    expect(STANDARD_CHAPTER_IDS.size).toBeGreaterThanOrEqual(40);
    expect(HEADS_UP_CHAPTER_IDS.size).toBeGreaterThanOrEqual(37);
    expect(STANDARD_CHAPTER_IDS.has('t2-ev')).toBe(true);
    expect(STANDARD_CHAPTER_IDS.has('t3-blind-battle')).toBe(true);
    expect(HEADS_UP_CHAPTER_IDS.has('t5hu-node-locking')).toBe(true);
  });

  const cases = [
    {
      name: '标准',
      lessonIds: STANDARD_LESSON_IDS,
      meta: STANDARD_META,
      chapterIds: STANDARD_CHAPTER_IDS,
    },
    {
      name: '单挑',
      lessonIds: HEADS_UP_LESSON_IDS,
      meta: HEADS_UP_META,
      chapterIds: HEADS_UP_CHAPTER_IDS,
    },
  ] as const;

  for (const entry of cases) {
    it(`${entry.name}：每课至少 1 个理论锚点`, () => {
      const empty = entry.lessonIds.filter(
        (id) => (entry.meta[id]?.theoryAnchors.length ?? 0) === 0,
      );
      expect({ empty, emptyCount: empty.length }).toEqual({ empty: [], emptyCount: 0 });
    });

    it(`${entry.name}：每个锚点都指向真实存在的理论章节（0 悬空）`, () => {
      const dangling: string[] = [];
      for (const lessonId of entry.lessonIds) {
        for (const anchor of entry.meta[lessonId]?.theoryAnchors ?? []) {
          if (!entry.chapterIds.has(anchor)) dangling.push(`${lessonId} → ${anchor}`);
        }
      }
      expect({ dangling, danglingCount: dangling.length }).toEqual({
        dangling: [],
        danglingCount: 0,
      });
    });

    it(`${entry.name}：同一课时的锚点不重复`, () => {
      const duplicated: string[] = [];
      for (const lessonId of entry.lessonIds) {
        const anchors = entry.meta[lessonId]?.theoryAnchors ?? [];
        if (new Set(anchors).size !== anchors.length) duplicated.push(lessonId);
      }
      expect({ duplicated, duplicatedCount: duplicated.length }).toEqual({
        duplicated: [],
        duplicatedCount: 0,
      });
    });
  }

  it('单挑锚点只落在 t*hu-*，不混入标准桥接', () => {
    const wrong = Object.entries(HEADS_UP_META).flatMap(([lessonId, meta]) =>
      meta.theoryAnchors
        .filter((anchor) => !/^t\d+hu-/.test(anchor))
        .map((anchor) => `${lessonId} → ${anchor}`),
    );
    expect(wrong).toEqual([]);
  });

  it('标准锚点不混入单挑 / 短牌章节', () => {
    const wrong = Object.entries(STANDARD_META).flatMap(([lessonId, meta]) =>
      meta.theoryAnchors
        .filter((anchor) => /^t\d+(?:sd|hu)-/.test(anchor))
        .map((anchor) => `${lessonId} → ${anchor}`),
    );
    expect(wrong).toEqual([]);
  });
});

describe('lessonMeta ELO 维度', () => {
  it('标准与单挑每课 eloDimension 属于五维枚举', () => {
    const invalid = [...STANDARD_LESSON_IDS, ...HEADS_UP_LESSON_IDS].filter((id) => {
      const dimension = ALL_META[id]?.eloDimension;
      return dimension === undefined || !VALID_ELO_DIMENSIONS.has(dimension);
    });
    expect({ invalid, invalidCount: invalid.length }).toEqual({ invalid: [], invalidCount: 0 });
  });

  it('21 个 Drill 全部登记且带 ELO 维度（Drill 结果也要写 ELO）', () => {
    const drillIds = STANDARD_LESSON_IDS.filter(
      (id) => id === 'opp-drill' || id.startsWith('drill'),
    );
    const unregistered = drillIds.filter((id) => !(id in STANDARD_META));
    expect({ drillCount: drillIds.length, unregistered }).toEqual({
      drillCount: 21,
      unregistered: [],
    });
  });
});
