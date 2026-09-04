import { describe, expect, it } from 'vitest';

/**
 * 策略学院 → 理论学院 引用完整性守卫（反向死链）。
 *
 * 课时正文中 `type: 'theory-reference'` 段落通过 `data.theoryChapterId` 指向理论学院章节。
 * 两模块互相 import 被 eslint 的 ALLOWED_CROSS_IMPORTS 禁止，故该引用只能以 ID 字符串存在、
 * 无法由类型系统约束 —— 目标是否存在必须由本守卫保证。
 *
 * 目标 ID 集合经 Vite 原生 `import.meta.glob(..., '?raw')` 读取理论学院数据源码后扫描得出，
 * 不维护手工镜像清单，因此不会随章节增删而漂移；也不依赖 Node 类型（src 的 typecheck 为浏览器口径）。
 */

const theorySources = import.meta.glob<string>(
  '../../theory-academy/data/levels/variants/standard/standardLevel*.ts',
  { query: '?raw', import: 'default', eager: true },
);

const lessonSources = import.meta.glob<string>(
  './lessons/variants/**/*.ts',
  { query: '?raw', import: 'default', eager: true },
);

/** 理论学院 standard 全部章节 id（章节 id 形如 t<n>-<slug>；Level 对象 id 为 t<n>，无连字符） */
function readTheoryChapterIds(): Set<string> {
  const ids = new Set<string>();
  for (const src of Object.values(theorySources)) {
    for (const m of src.matchAll(/^ {4}id: '(t\d-[a-z0-9-]+)',/gm)) if (m[1]) ids.add(m[1]);
  }
  return ids;
}

interface TheoryRef {
  /** 形如 standardLevel5.ts:49，便于直接跳转 */
  at: string;
  chapterId: string;
}

/** 收集策略课时中的 theory-reference 引用点 */
function collectReferences(): { refs: TheoryRef[]; refBlockCount: number } {
  const refs: TheoryRef[] = [];
  let refBlockCount = 0;

  for (const [file, src] of Object.entries(lessonSources)) {
    if (file.endsWith('.test.ts')) continue;
    const shortName = file.split('/').pop() ?? file;

    refBlockCount += (src.match(/type: 'theory-reference'/g) ?? []).length;

    for (const m of src.matchAll(/theoryChapterId: '(t\d[a-z0-9-]*)'/g)) {
      if (!m[1]) continue;
      const line = src.slice(0, m.index ?? 0).split('\n').length;
      refs.push({ at: `${shortName}:${line}`, chapterId: m[1] });
    }
  }

  return { refs, refBlockCount };
}

describe('策略学院 theory-reference → 理论学院章节 引用完整性', () => {
  const theoryChapterIds = readTheoryChapterIds();
  const { refs, refBlockCount } = collectReferences();

  it('守卫确实扫描到理论章节与引用点（防正则失配导致空断言）', () => {
    expect(theoryChapterIds.size).toBeGreaterThan(25);
    expect(refs.length).toBeGreaterThan(20);
  });

  it('每条 theoryChapterId 都指向真实存在的理论章节', () => {
    const dangling = refs
      .filter((r) => !theoryChapterIds.has(r.chapterId))
      .map((r) => `${r.at} → ${r.chapterId}`);
    expect({ dangling, danglingCount: dangling.length }).toEqual({ dangling: [], danglingCount: 0 });
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
