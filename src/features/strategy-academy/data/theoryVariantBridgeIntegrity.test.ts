import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

/**
 * 理论学院变体章节 → 策略学院变体课时 引用完整性守卫（与 theoryReferenceIntegrity 同方向）。
 *
 * 为什么需要单独一个守卫：变体课时（`l<n>hu-*` / `l<n>sd-*`）**不在** `LEVELS` 里，
 * 因此既不能进策略学院 `curriculumIntegrity` 的 `CROSS_MODULE_LESSON_IDS`
 * （那里的存在性断言以 `LEVELS` 为全集，加了必红），也不能进理论侧
 * `theoryIntegrity` 的 `EXPECTED_PRACTICE_LESSON_IDS`（它由标准变体 Level 派生）。
 * 于是 Level 级与章节级的变体桥接 id 长期处于"两不管"状态——本守卫补上这一段。
 *
 * 引用只能以 ID 字符串存在（ALLOWED_CROSS_IMPORTS 禁止两模块互相 import），
 * 所以目标存在性必须由源码扫描保证；被引用集与课时全集都即时从源码/数据求得，不留手工镜像。
 *
 * 引用面含两种命名空间，各自对面不同全集校验：变体专属课 `l<n>hu|sd-*`（只存在于
 * `ALL_VARIANT_LESSONS`，且必须**不在** `LEVELS` 内）与三变体共享地基课 `l<n>-*`
 * （变体章节的 T1/T2 桥接复用，必须**在** `LEVELS` 内）。
 */

/** 理论变体数据源码（含 Level 文件与 chapterPracticeMap） */
const theoryVariantSources = {
  ...import.meta.glob<string>('../../theory-academy/data/levels/variants/heads-up/*.ts', {
    query: '?raw', import: 'default', eager: true,
  }),
  ...import.meta.glob<string>('../../theory-academy/data/levels/variants/short-deck/*.ts', {
    query: '?raw', import: 'default', eager: true,
  }),
};

import { ALL_VARIANT_LESSONS } from './lessons/variants';
import { LEVELS } from './levels';

/** 引号内的课时 id：只认数据引用形态（`{ id: '…' }` / `lesson('…', …)`），不认散文里的裸 id */
const REFERENCE_RE = /'(l\d+(?:hu|sd)?-[a-z0-9-]+)'/g;

/** 变体专属课时（进不了任何白名单，本守卫的唯一对象）vs 三变体共享地基课（在 LEVELS 内） */
const isVariantLessonId = (id: string) => /^l\d+(?:hu|sd)-/.test(id);

interface BridgeRef {
  at: string;
  lessonId: string;
  /** 引用点自带的展示标题（仅作 lessonTitle 缺失时的回退，须与权威标题一致） */
  title?: string;
}

/**
 * 引用点的展示标题只从两种成型写法提取，避免把正文散文里的字符串误当标题：
 * `{ id: 'l…', title: '…' }`（Level 级）与 `lesson('l…', '…')`（章节级 map）。
 */
const PAIRED_REF_RES = [
  /\{ id: '(l\d+(?:hu|sd)?-[a-z0-9-]+)', title: '([^']+)' \}/g,
  /lesson\('(l\d+(?:hu|sd)?-[a-z0-9-]+)', '([^']+)'\)/g,
];

function collectRefs(): BridgeRef[] {
  const refs: BridgeRef[] = [];
  for (const [file, src] of Object.entries(theoryVariantSources)) {
    if (file.endsWith('.test.ts')) continue;
    // 取末两段路径：两个变体目录下的 chapterPracticeMap.ts 同名，只留 basename 会让定位歧义。
    const parts = file.split('/');
    const shortName = parts.slice(-2).join('/');
    const titles = new Map<string, string>();
    for (const re of PAIRED_REF_RES) {
      for (const m of src.matchAll(re)) if (m[1] && m[2]) titles.set(m[1], m[2]);
    }
    for (const m of src.matchAll(REFERENCE_RE)) {
      const lessonId = m[1];
      if (!lessonId) continue;
      const line = src.slice(0, m.index ?? 0).split('\n').length;
      refs.push({ at: `${shortName}:${line}`, lessonId, title: titles.get(lessonId) });
    }
  }
  return refs;
}

const zhTitles = JSON.parse(
  fs.readFileSync('src/i18n/locales/zh/academy.json', 'utf8'),
) as { lessonTitle?: Record<string, string> };

describe('理论学院变体章节 → 策略学院变体课时 引用完整性', () => {
  const refs = collectRefs();
  const variantLessonIds = new Set(ALL_VARIANT_LESSONS.map((l) => l.id));
  const standardLevelLessonIds = new Set(LEVELS.flatMap((level) => level.lessons.map((l) => l.id)));

  it('守卫确实扫到变体桥接引用与变体课时全集（防正则失配导致空断言）', () => {
    expect(refs.length, '未从理论变体数据中提取到任何课时引用').toBeGreaterThan(20);
    expect(variantLessonIds.size).toBeGreaterThan(100);
  });

  // 章节级桥接落地后，引用面来自两个不同形态的文件（Level 级 `{ id, title }` 与章节级 `lesson()`）。
  // 只断言总数会让"chapterPracticeMap 整体没被扫到"这类失配静默通过，故按来源分档断言。
  it('章节级 map 与 Level 级推荐两个来源都被扫到', () => {
    for (const variantDir of ['heads-up', 'short-deck']) {
      const fromMap = refs.filter((r) => r.at.startsWith(`${variantDir}/chapterPracticeMap.ts`));
      expect(fromMap.length, `${variantDir} 章节级 map 未产生引用`).toBeGreaterThanOrEqual(22);
      const fromLevels = refs.filter((r) => !r.at.startsWith(`${variantDir}/chapterPracticeMap.ts`));
      expect(fromLevels.length, `${variantDir} Level 级推荐未产生引用`).toBeGreaterThan(0);
    }
  });

  it('每个被引用的变体课时都真实存在于 ALL_VARIANT_LESSONS', () => {
    const dangling = refs
      .filter((r) => !variantLessonIds.has(r.lessonId))
      .map((r) => `${r.at} → ${r.lessonId}`);
    expect({ dangling, danglingCount: dangling.length }).toEqual({ dangling: [], danglingCount: 0 });
  });

  it('变体专属课时确实不在 LEVELS 内（解释为何它们不能进 CROSS_MODULE_LESSON_IDS）', () => {
    const leakedIntoLevelWhitelist = refs
      .filter((r) => isVariantLessonId(r.lessonId))
      .filter((r) => standardLevelLessonIds.has(r.lessonId))
      .map((r) => r.lessonId);
    expect([...new Set(leakedIntoLevelWhitelist)]).toEqual([]);
  });

  // 章节级 map 里 T1 类章节会复用三变体共享地基课（策略学院变体课程从 L3 起，L1/L2 回退标准课）。
  // 这类 id 不受上一条保护，也不属于任何变体白名单，故单独断言它们在 LEVELS 内可解析——
  // 否则"把标准课 id 打错一个字母"是本页唯一无人拦截的漂移路径。
  it('共享地基课引用（l<n>-*）在 LEVELS 内可解析', () => {
    const unresolved = refs
      .filter((r) => !isVariantLessonId(r.lessonId))
      .map((r) => r.lessonId)
      .filter((id) => !standardLevelLessonIds.has(id));
    expect([...new Set(unresolved)]).toEqual([]);
  });

  it('引用自带的回退标题与策略学院权威 lessonTitle 一致（忽略尾部括号后缀）', () => {
    // 权威值可能带 ASCII 撇号与消歧后缀（如「短牌德州入门 (6+ Hold'em)」）。回退标题只在 i18n
    // 缺 key 时兜底显示，不值得为它在 TS 单引号串里塞转义撇号，故比对前剥掉尾部括号成分；
    // 真实改名（词根变了）仍会被抓，只是允许省略消歧后缀。
    const norm = (s: string) => s.replace(/\s*[（(][^）)]*[）)]\s*$/, '').trim();
    const mismatched = refs
      .filter((r) => {
        const authority = zhTitles.lessonTitle?.[r.lessonId];
        return !!r.title && !!authority && norm(r.title) !== norm(authority);
      })
      .map((r) => `${r.at} → ${r.lessonId}: 回退标题「${r.title}」≠ 权威「${zhTitles.lessonTitle?.[r.lessonId]}」`);
    expect({ mismatched, mismatchedCount: mismatched.length }).toEqual({ mismatched: [], mismatchedCount: 0 });
  });

  it('每个引用点都带 文件:行号 定位（防定位逻辑退化）', () => {
    expect(refs.filter((r) => !/^[^:]+\.ts:\d+$/.test(r.at)).length).toBe(0);
  });
});
