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

/** 引号内的变体课时 id：只认数据引用形态（`{ id: '…' }` / `lesson('…', …)`），不认散文里的裸 id */
const REFERENCE_RE = /'(l\d+(?:hu|sd)-[a-z0-9-]+)'/g;

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
  /\{ id: '(l\d+(?:hu|sd)-[a-z0-9-]+)', title: '([^']+)' \}/g,
  /lesson\('(l\d+(?:hu|sd)-[a-z0-9-]+)', '([^']+)'\)/g,
];

function collectRefs(): BridgeRef[] {
  const refs: BridgeRef[] = [];
  for (const [file, src] of Object.entries(theoryVariantSources)) {
    if (file.endsWith('.test.ts')) continue;
    const shortName = file.split('/').pop() ?? file;
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

  it('每个被引用的变体课时都真实存在于 ALL_VARIANT_LESSONS', () => {
    const dangling = refs
      .filter((r) => !variantLessonIds.has(r.lessonId))
      .map((r) => `${r.at} → ${r.lessonId}`);
    expect({ dangling, danglingCount: dangling.length }).toEqual({ dangling: [], danglingCount: 0 });
  });

  it('变体课时确实不在 LEVELS 内（解释为何它们不能进 CROSS_MODULE_LESSON_IDS）', () => {
    const leakedIntoLevelWhitelist = refs
      .filter((r) => standardLevelLessonIds.has(r.lessonId))
      .map((r) => r.lessonId);
    expect([...new Set(leakedIntoLevelWhitelist)]).toEqual([]);
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
