/**
 * 变体理论 Level 数据完整性守卫测试
 * Day 2-3: 游戏变体支持扩展
 *
 * 机械校验固化为常驻门禁：ID 全局唯一性（与标准系列隔离）、T1-T9 全覆盖、
 * 每个 Level 至少 1 个章节、ID 格式正确性（t{level}{suffix}-），
 * 以及完整内容阶段校验（quiz 判分合法性 / content 非空，对齐标准系列守卫口径）。
 */
import { describe, it, expect } from 'vitest';
import { shortDeckLevels, headsUpLevels } from './index';
import type { TheoryChapter, TheoryLevelInfo } from '../../../types';

const VARIANTS: Record<'short-deck' | 'heads-up', TheoryLevelInfo[]> = {
  'short-deck': shortDeckLevels,
  'heads-up': headsUpLevels,
};

describe('variant theory integrity: ID 全局唯一性与格式', () => {
  it('所有变体章节 id 全局唯一（含跨变体）', () => {
    const seen = new Set<string>();
    const dups: string[] = [];
    for (const levels of Object.values(VARIANTS)) {
      for (const chapter of levels.flatMap((l) => l.chapters)) {
        if (seen.has(chapter.id)) dups.push(chapter.id);
        seen.add(chapter.id);
      }
    }
    expect(dups).toEqual([]);
  });

  it('章节 id 遵循 t{level}{suffix}- 格式', () => {
    const bad: string[] = [];
    const collect = (suffix: string, levels: TheoryLevelInfo[]) => {
      for (const chapter of levels.flatMap((l) => l.chapters)) {
        if (!chapter.id.startsWith(`t${chapter.level}${suffix}-`)) {
          bad.push(`${chapter.id}: 期望前缀 t${chapter.level}${suffix}-`);
        }
      }
    };
    collect('sd', VARIANTS['short-deck']);
    collect('hu', VARIANTS['heads-up']);
    expect(bad).toEqual([]);
  });

  it('Level id 遵循 t{level}{suffix} 且与章节 level 一致', () => {
    const bad: string[] = [];
    const collect = (suffix: string, levels: TheoryLevelInfo[]) => {
      for (const level of levels) {
        if (level.id !== `t${level.level}${suffix}`) bad.push(`${level.id}: 期望 t${level.level}${suffix}`);
        if (level.variant !== (suffix === 'sd' ? 'short-deck' : 'heads-up')) {
          bad.push(`${level.id}: variant=${level.variant} 与文件不符`);
        }
        if (level.chapters.some((c) => c.level !== level.level)) bad.push(`${level.id}: 章节 level 不一致`);
        if (level.chapters.some((c) => c.variant !== level.variant)) bad.push(`${level.id}: 章节 variant 不一致`);
      }
    };
    collect('sd', VARIANTS['short-deck']);
    collect('hu', VARIANTS['heads-up']);
    expect(bad).toEqual([]);
  });
});

describe('variant theory integrity: T1-T9 全覆盖', () => {
  it('short-deck 覆盖 T1-T9，且每个 Level 至少有 1 个章节', () => {
    expect(shortDeckLevels.map((l) => l.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const level of shortDeckLevels) {
      expect(level.chapters.length, `${level.id} 无章节`).toBeGreaterThanOrEqual(1);
    }
  });

  it('heads-up 覆盖 T1-T9，且每个 Level 至少有 1 个章节', () => {
    expect(headsUpLevels.map((l) => l.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const level of headsUpLevels) {
      expect(level.chapters.length, `${level.id} 无章节`).toBeGreaterThanOrEqual(1);
    }
  });

  it('章节 order 连续且无重复', () => {
    const bad: string[] = [];
    for (const levels of Object.values(VARIANTS)) {
      for (const level of levels) {
        const orders = level.chapters.map((c) => c.order);
        if (new Set(orders).size !== orders.length) bad.push(`${level.id}: order 重复`);
        const sorted = [...orders].sort((a, b) => a - b);
        if (sorted.some((o, i) => o !== i + 1)) bad.push(`${level.id}: order 不连续`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('variant theory integrity: 章节结构合法性', () => {
  it('eloDimension 合法且必填字段非空', () => {
    const ELO_DIMENSIONS = new Set(['preflop', 'postflop', 'math', 'handReading', 'mental']);
    const bad: string[] = [];
    const allChapters: TheoryChapter[] = Object.values(VARIANTS).flatMap((levels) =>
      levels.flatMap((l) => l.chapters)
    );
    for (const chapter of allChapters) {
      if (!ELO_DIMENSIONS.has(chapter.eloDimension)) bad.push(`${chapter.id}: eloDimension=${chapter.eloDimension}`);
      if (!chapter.title.trim()) bad.push(`${chapter.id}: title 为空`);
      if (!chapter.subtitle.trim()) bad.push(`${chapter.id}: subtitle 为空`);
      if (!chapter.duration.trim()) bad.push(`${chapter.id}: duration 为空`);
      if (chapter.duration && !/\d+\s*(min|分钟)/.test(chapter.duration)) {
        bad.push(`${chapter.id}: duration 格式异常=${chapter.duration}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('tier 归属正确（T1-T3 basic / T4-T6 intermediate / T7-T9 advanced）', () => {
    const bad: string[] = [];
    const tierOf = (level: number) =>
      level <= 3 ? 'basic' : level <= 6 ? 'intermediate' : 'advanced';
    for (const levels of Object.values(VARIANTS)) {
      for (const l of levels) {
        if (l.tier !== tierOf(l.level)) bad.push(`${l.id}: tier=${l.tier}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('variant theory integrity: 完整内容阶段校验（对齐标准系列守卫口径）', () => {
  // 骨架阶段注释承诺"完整内容阶段由各变体专属守卫接管"——
  // 本组断言即该接管：与 data/theoryIntegrity.test.ts 的判分校验同口径。
  const allVariantChapters: TheoryChapter[] = Object.values(VARIANTS).flatMap((levels) =>
    levels.flatMap((l) => l.chapters),
  );

  it('quiz id 全局唯一且以所属章节 id 为前缀', () => {
    const seen = new Set<string>();
    const bad: string[] = [];
    for (const chapter of allVariantChapters) {
      for (const q of chapter.quiz) {
        if (seen.has(q.id)) bad.push(`${q.id}: 重复`);
        seen.add(q.id);
        if (!q.id.startsWith(`${chapter.id}-`)) bad.push(`${q.id}: 前缀不符`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('quiz：correctIndex 界内、选项 ≥2 且无重复、题干/解析非空、每章 3-5 题', () => {
    const bad: string[] = [];
    for (const chapter of allVariantChapters) {
      if (chapter.quiz.length < 3 || chapter.quiz.length > 5) {
        bad.push(`${chapter.id}: 题数=${chapter.quiz.length}`);
      }
      for (const q of chapter.quiz) {
        if (q.options.length < 2) bad.push(`${q.id}: 选项不足`);
        if (new Set(q.options).size !== q.options.length) bad.push(`${q.id}: 选项重复`);
        if (q.correctIndex < 0 || q.correctIndex >= q.options.length) bad.push(`${q.id}: correctIndex 越界`);
        if (!q.explanation.trim()) bad.push(`${q.id}: explanation 为空`);
        if (!q.question.trim()) bad.push(`${q.id}: question 为空`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('content 非空且无空段落，objectives 不为空数组/无空条目', () => {
    const bad: string[] = [];
    for (const chapter of allVariantChapters) {
      if (chapter.content.length === 0) bad.push(`${chapter.id}: content 为空`);
      if (chapter.content.some((s) => !s.content.trim())) bad.push(`${chapter.id}: 存在空段落`);
      // 与标准侧同源约束：类型可选、守卫必填（变体 44 章本就全部声明，缺漏应被拦下而非静默通过）
      if (chapter.objectives === undefined) {
        bad.push(`${chapter.id}: 缺少 objectives（每章须声明 3-5 条学习目标）`);
      } else {
        if (chapter.objectives.length === 0) bad.push(`${chapter.id}: objectives 为空数组`);
        if (chapter.objectives.length < 3 || chapter.objectives.length > 5) {
          bad.push(`${chapter.id}: objectives 条数 ${chapter.objectives.length} 不在 3-5 区间`);
        }
        if (chapter.objectives.some((o) => !o.trim())) bad.push(`${chapter.id}: objectives 存在空条目`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe('variant theory integrity: 章节级实践推荐桥接', () => {
  // 变体课时不在策略学院 LEVELS 内，进不了任何白名单，标准侧那条"子集 + 非空"断言在此无从复用。
  // 这里能机器校验的只剩两件事：**覆盖率**（防 chapterPracticeMap 漏章，或聚合链
  // variants/<v>/index.ts 的 withChapterPractice 被误删后静默失效）与**命名空间**。
  // 被引用的 id 是否真实存在由 strategy-academy/data/theoryVariantBridgeIntegrity.test.ts 反向断言。
  const bridgeChapters: TheoryChapter[] = Object.values(VARIANTS).flatMap((levels) =>
    levels.flatMap((l) => l.chapters),
  );

  it('每个变体章节都携带非空的章节级实践推荐', () => {
    const uncovered = bridgeChapters
      .filter((chapter) => (chapter.practiceRecommendations?.lessons.length ?? 0) === 0)
      .map((chapter) => `${chapter.id} (t${chapter.level})`);
    expect({ uncovered, uncoveredCount: uncovered.length }).toEqual({ uncovered: [], uncoveredCount: 0 });
  });

  it('章节级推荐引用的课时 id 只能是变体专属课或三变体共享地基课', () => {
    // l<n>hu-* / l<n>sd-* 为变体专属；l<n>-* 为策略学院三变体共用的通用地基课。
    // 出现第三种形态说明把标准侧 Level 白名单里的 id 误抄进了变体表。
    const bad: string[] = [];
    for (const chapter of bridgeChapters) {
      for (const lesson of chapter.practiceRecommendations?.lessons ?? []) {
        if (!/^l\d(hu|sd)-/.test(lesson.id) && !/^l\d-[a-z0-9-]+$/.test(lesson.id)) {
          bad.push(`${chapter.id} → ${lesson.id}: 非 l<n>hu|sd- / l<n>- 前缀`);
        }
        if (!lesson.title.trim()) bad.push(`${chapter.id} → ${lesson.id}: title 为空`);
      }
    }
    expect(bad).toEqual([]);
  });
});
