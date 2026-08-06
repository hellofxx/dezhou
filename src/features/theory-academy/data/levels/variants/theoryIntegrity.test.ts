/**
 * 变体理论 Level 数据完整性守卫测试
 * Day 2-3: 游戏变体支持扩展
 *
 * 机械校验固化为常驻门禁：ID 全局唯一性（与标准系列隔离）、T1-T9 全覆盖、
 * 每个 Level 至少 1 个章节、ID 格式正确性（t{level}{suffix}-）。
 * 骨架阶段允许 content/quiz 为空，完整内容阶段由各变体专属守卫接管。
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
