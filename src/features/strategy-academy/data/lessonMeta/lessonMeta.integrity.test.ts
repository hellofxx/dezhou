import { describe, expect, it } from 'vitest';
import { getLessonMeta, getLessonMetaMap } from './index';
import { STANDARD_LEVEL_SUMMARIES } from '../lessons/manifest/standard';

/**
 * 课时元数据（ELO 维度 + 理论锚点）完整性守卫。
 *
 * 三件事必须常驻可验证，否则“策略课 → 理论章”的桥接会静默退化成死链：
 * 1. 覆盖：标准变体每一门课（含 21 个 Drill 与 Level 7 挂载的本土 17 课）都有元数据条目；
 * 2. 锚点：每课至少 1 个 theoryAnchors，且每个锚点在理论学院标准数据里真实存在；
 * 3. 维度：eloDimension 属于 EloDimension 五维枚举。
 *
 * 理论章节 id 集合经 Vite 原生 `import.meta.glob(..., '?raw')` 读取理论学院标准数据源码后扫描得出，
 * 不维护手工镜像清单（不 import 理论模块，eslint 模块隔离仍生效）。
 * 扫描范围覆盖 `standardLevel*.ts` 与 `chapters/`（章节型课时单独成文件），题 id（`<chapter>-q<n>`）排除。
 */

const theorySources = import.meta.glob<string>(
  '../../../theory-academy/data/levels/variants/standard/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

const VALID_ELO_DIMENSIONS = new Set(['preflop', 'postflop', 'math', 'handReading', 'mental']);

/** 理论学院标准变体全部章节 id（章节 id 形如 t<n>-<slug>；题 id 为 <chapter>-q<n>） */
function readTheoryChapterIds(): Set<string> {
  const ids = new Set<string>();
  for (const [file, src] of Object.entries(theorySources)) {
    if (file.endsWith('.test.ts')) continue;
    for (const m of src.matchAll(/id: '(t\d-[a-z0-9-]+)'/g)) {
      const id = m[1];
      if (!id || /-q\d+$/.test(id)) continue;
      ids.add(id);
    }
  }
  return ids;
}

/** 标准变体课时 id（manifest 目录摘要为唯一事实源，与完整数据的一致性由 manifest.parity 守卫） */
const STANDARD_LESSON_IDS = STANDARD_LEVEL_SUMMARIES.flatMap((level) =>
  level.lessons.map((lesson) => lesson.id),
);

const metaMap = getLessonMetaMap();

describe('lessonMeta 覆盖完整性', () => {
  it('守卫确实扫描到理论数据与标准课时（防正则失配导致空断言）', () => {
    expect(Object.keys(theorySources).length).toBeGreaterThan(10);
    expect(STANDARD_LESSON_IDS.length).toBeGreaterThanOrEqual(91);
  });

  it('标准变体每一门课都有元数据条目', () => {
    const missing = STANDARD_LESSON_IDS.filter((id) => !(id in metaMap));
    expect({ missing, missingCount: missing.length }).toEqual({ missing: [], missingCount: 0 });
  });

  it('元数据条目没有多余 id（不留已删除课程的幽灵条目）', () => {
    const known = new Set(STANDARD_LESSON_IDS);
    const ghosts = Object.keys(metaMap).filter((id) => !known.has(id));
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
  const chapterIds = readTheoryChapterIds();

  it('理论章节扫描覆盖 standardLevel*.ts 与 chapters/ 两类来源（防 glob 收窄导致漏判）', () => {
    expect(chapterIds.size).toBeGreaterThanOrEqual(40);
    // standardLevel 内联章节
    expect(chapterIds.has('t2-ev')).toBe(true);
    // chapters/ 目录单独成文件的章节型课时
    expect(chapterIds.has('t3-blind-battle')).toBe(true);
  });

  it('每课至少 1 个理论锚点', () => {
    const empty = STANDARD_LESSON_IDS.filter((id) => (metaMap[id]?.theoryAnchors.length ?? 0) === 0);
    expect({ empty, emptyCount: empty.length }).toEqual({ empty: [], emptyCount: 0 });
  });

  it('每个锚点都指向真实存在的理论章节（0 悬空）', () => {
    const dangling: string[] = [];
    for (const lessonId of STANDARD_LESSON_IDS) {
      for (const anchor of metaMap[lessonId]?.theoryAnchors ?? []) {
        if (!chapterIds.has(anchor)) dangling.push(`${lessonId} → ${anchor}`);
      }
    }
    expect({ dangling, danglingCount: dangling.length }).toEqual({ dangling: [], danglingCount: 0 });
  });

  it('同一课时的锚点不重复（防映射复制粘贴残留）', () => {
    const duplicated: string[] = [];
    for (const lessonId of STANDARD_LESSON_IDS) {
      const anchors = metaMap[lessonId]?.theoryAnchors ?? [];
      if (new Set(anchors).size !== anchors.length) duplicated.push(lessonId);
    }
    expect({ duplicated, duplicatedCount: duplicated.length }).toEqual({
      duplicated: [],
      duplicatedCount: 0,
    });
  });
});

describe('lessonMeta ELO 维度', () => {
  it('每课 eloDimension 属于五维枚举', () => {
    const invalid = STANDARD_LESSON_IDS.filter((id) => {
      const dimension = metaMap[id]?.eloDimension;
      return dimension === undefined || !VALID_ELO_DIMENSIONS.has(dimension);
    });
    expect({ invalid, invalidCount: invalid.length }).toEqual({ invalid: [], invalidCount: 0 });
  });

  it('21 个 Drill 全部登记且带 ELO 维度（Drill 结果也要写 ELO）', () => {
    const drillIds = STANDARD_LESSON_IDS.filter((id) => id === 'opp-drill' || id.startsWith('drill'));
    const unregistered = drillIds.filter((id) => !(id in metaMap));
    expect({ drillCount: drillIds.length, unregistered }).toEqual({
      drillCount: 21,
      unregistered: [],
    });
  });
});
