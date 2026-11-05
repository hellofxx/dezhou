import { describe, expect, it } from 'vitest';
import { getHeadsUpLessonMetaMap, getStandardLessonMetaMap } from './lessonMeta';

/**
 * 策略学院 → 理论学院 引用完整性守卫（反向死链）。
 *
 * 课时正文中 `type: 'theory-reference'` 段落通过 `data.theoryChapterId` 指向理论学院章节。
 * 两模块互相 import 被 eslint 的 ALLOWED_CROSS_IMPORTS 禁止，故该引用只能以 ID 字符串存在、
 * 无法由类型系统约束 —— 目标是否存在必须由本守卫保证。
 *
 * T3 起本文件同时守卫第二个方向：`data/lessonMeta/*` 的 `theoryAnchors`（策略课→理论章桥接卡数据源）
 * 也必须全部指向真实章节。两处失效模式不同（正文段落漏改 / 元数据手写错 id），故共用同一份章节集合。
 *
 * 目标 ID 集合经 Vite 原生 `import.meta.glob(..., '?raw')` 读取理论学院数据源码后扫描得出，
 * 不维护手工镜像清单，因此不会随章节增删而漂移；也不依赖 Node 类型（src 的 typecheck 为浏览器口径）。
 */

const standardTheorySources = import.meta.glob<string>(
  '../../theory-academy/data/levels/variants/standard/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

const headsUpTheorySources = import.meta.glob<string>(
  '../../theory-academy/data/levels/variants/heads-up/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

const lessonSources = import.meta.glob<string>(
  './lessons/variants/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

/**
 * 按变体读取理论章节 id（章节 id 形如 t<n>-<slug> / t<n>hu-<slug>）。
 * 扫描范围含 Level 文件与 `chapters/`（章节型课时单独成文件），题 id（`<chapter>-q<n>`）排除。
 */
function readTheoryChapterIds(sources: Record<string, string>, pattern: RegExp): Set<string> {
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

interface TheoryRef {
  /** 形如 standardLevel5.ts:49，便于直接跳转 */
  at: string;
  chapterId: string;
  /** 引用点所属变体：单挑课时只能引用 t*hu-*，标准课时只能引用标准章 */
  isHeadsUp: boolean;
}

/** 收集策略课时中的 theory-reference 引用点 */
function collectReferences(): { refs: TheoryRef[]; refBlockCount: number } {
  const refs: TheoryRef[] = [];
  let refBlockCount = 0;

  for (const [file, src] of Object.entries(lessonSources)) {
    if (file.endsWith('.test.ts')) continue;
    const shortName = file.split('/').pop() ?? file;
    const isHeadsUp = /l\d+hu-/.test(file);

    refBlockCount += (src.match(/type: 'theory-reference'/g) ?? []).length;

    for (const m of src.matchAll(/theoryChapterId: '(t\d[a-z0-9-]*)'/g)) {
      if (!m[1]) continue;
      const line = src.slice(0, m.index ?? 0).split('\n').length;
      refs.push({ at: `${shortName}:${line}`, chapterId: m[1], isHeadsUp });
    }
  }

  return { refs, refBlockCount };
}

/** 两套理论章节集合（引用方向与元数据锚点共用） */
const STANDARD_CHAPTER_IDS = readTheoryChapterIds(
  standardTheorySources,
  /id: '(t\d-[a-z0-9-]+)'/g,
);
const HEADS_UP_CHAPTER_IDS = readTheoryChapterIds(
  headsUpTheorySources,
  /id: '(t\d+hu-[a-z0-9-]+)'/g,
);

describe('策略学院 theory-reference → 理论学院章节 引用完整性', () => {
  const { refs, refBlockCount } = collectReferences();

  it('守卫确实扫描到两套理论章节与引用点（防正则失配导致空断言）', () => {
    expect(STANDARD_CHAPTER_IDS.size).toBeGreaterThan(25);
    expect(HEADS_UP_CHAPTER_IDS.size).toBeGreaterThanOrEqual(37);
    expect(Object.keys(headsUpTheorySources).length).toBeGreaterThan(10);
    expect(refs.length).toBeGreaterThan(20);
  });

  it('每条 theoryChapterId 都指向所属变体真实存在的理论章节', () => {
    const dangling = refs
      .filter((r) => {
        const ids = r.isHeadsUp ? HEADS_UP_CHAPTER_IDS : STANDARD_CHAPTER_IDS;
        return !ids.has(r.chapterId);
      })
      .map((r) => `${r.at} → ${r.chapterId}`);
    expect({ dangling, danglingCount: dangling.length }).toEqual({ dangling: [], danglingCount: 0 });
  });

  it('跨变体引用为零：单挑课时只引 t*hu，标准课时不引变体章', () => {
    const wrong = refs
      .filter((r) =>
        r.isHeadsUp ? !/^t\d+hu-/.test(r.chapterId) : /^t\d+(?:sd|hu)-/.test(r.chapterId),
      )
      .map((r) => `${r.at} → ${r.chapterId}`);
    expect(wrong).toEqual([]);
  });

  it('每个 theory-reference 段落都携带可跳转的 theoryChapterId（否则只能渲染为死文字）', () => {
    expect({ refBlocks: refBlockCount, withChapterId: refs.length }).toEqual({
      refBlocks: refBlockCount,
      withChapterId: refBlockCount,
    });
  });

  it('每条引用都有可跳转的 文件:行号 定位（防定位逻辑退化）', () => {
    const unlocated = refs.filter((r) => !/^[^:]+\.ts:\d+$/.test(r.at));
    expect({ unlocatedCount: unlocated.length }).toEqual({ unlocatedCount: 0 });
  });
});

describe('lessonMeta.theoryAnchors → 理论学院章节 引用完整性', () => {
  const standardAnchors = Object.entries(getStandardLessonMetaMap()).flatMap(([lessonId, meta]) =>
    meta.theoryAnchors.map((anchor) => ({ lessonId, anchor, isHeadsUp: false })),
  );
  const headsUpAnchors = Object.entries(getHeadsUpLessonMetaMap()).flatMap(([lessonId, meta]) =>
    meta.theoryAnchors.map((anchor) => ({ lessonId, anchor, isHeadsUp: true })),
  );

  it('守卫确实扫描到两套课时元数据锚点（防元数据清空导致空断言）', () => {
    expect(Object.keys(getStandardLessonMetaMap()).length).toBeGreaterThanOrEqual(91);
    expect(standardAnchors.length).toBeGreaterThanOrEqual(91);
    expect(Object.keys(getHeadsUpLessonMetaMap()).length).toBe(12);
    expect(headsUpAnchors.length).toBe(24);
  });

  it('每条 theoryAnchors 都指向所属变体真实存在的理论章节（桥接卡不会把学员带到死链）', () => {
    const dangling = [...standardAnchors, ...headsUpAnchors]
      .filter((entry) => {
        const ids = entry.isHeadsUp ? HEADS_UP_CHAPTER_IDS : STANDARD_CHAPTER_IDS;
        return !ids.has(entry.anchor);
      })
      .map((entry) => `${entry.lessonId} → ${entry.anchor}`);
    expect({ dangling, danglingCount: dangling.length }).toEqual({
      dangling: [],
      danglingCount: 0,
    });
  });

  it('标准锚点不落在变体章节集合内（t*sd-* / t*hu-* 不属于标准桥接）', () => {
    const variantAnchors = standardAnchors.filter((entry) =>
      /^t\d(?:sd|hu)-/.test(entry.anchor),
    );
    expect({ variantAnchors, variantCount: variantAnchors.length }).toEqual({
      variantAnchors: [],
      variantCount: 0,
    });
  });

  it('单挑锚点只落在 t*hu-*（不回到标准章）', () => {
    const wrong = headsUpAnchors.filter((entry) => !/^t\d+hu-/.test(entry.anchor));
    expect(wrong).toEqual([]);
  });
});
