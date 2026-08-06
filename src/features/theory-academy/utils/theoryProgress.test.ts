/**
 * 理论进度纯函数测试（P1F-02 回归 + 变体 Level 解锁门禁缺陷修复）：
 * 「下一章」跨 Level 顺延时必须先校验目标 Level 解锁态，
 * 否则点击后被章节页门禁 Navigate 静默弹回 /theory。
 * ① getNextChapter 跨 Level 顺延行为 ② isLevelUnlockedByCompleted 解锁判定
 * ③ 跨 Level 未解锁场景（bug 复现路径） ④ 正常顺序学习流不会出现锁定提示
 * ⑤ 变体 Level 解锁链独立于标准序列（t1hu 恒解锁，t2hu 需 t1hu 全完成）
 */
import { describe, it, expect } from 'vitest';
import { THEORY_LEVELS } from '../data/levels';
import { headsUpLevels } from '../data/levels/variants/heads-up';
import {
  getAllChapters,
  getNextChapter,
  findChapterById,
  findLevelByChapterId,
  isLevelUnlockedByCompleted,
  isLevelFullyCompleted,
} from './theoryProgress';

const t1 = THEORY_LEVELS[0]!;
const t2 = THEORY_LEVELS[1]!;
const lastT1Chapter = t1.chapters[t1.chapters.length - 1]!;

const t1hu = headsUpLevels[0]!;
const t2hu = headsUpLevels[1]!;
const lastT1huChapter = t1hu.chapters[t1hu.chapters.length - 1]!;

// ========== 标准系列回归（行为零变化） ==========

describe('getNextChapter 跨 Level 顺延（标准系列）', () => {
  it('T1 末章的下一章属于 T2（跨 Level 顺延成立，是 P1F-02 的触发前提）', () => {
    const next = getNextChapter(lastT1Chapter.id);
    expect(next).toBeDefined();
    expect(findLevelByChapterId(next!.id)?.id).toBe(t2.id);
  });

  it('全体系最后一章无下一章（返回 undefined）', () => {
    const all = getAllChapters();
    expect(getNextChapter(all[all.length - 1]!.id)).toBeUndefined();
  });
});

describe('isLevelUnlockedByCompleted（标准系列回归）', () => {
  it('T1 恒解锁（含零进度）', () => {
    expect(isLevelUnlockedByCompleted(t1.id, [])).toBe(true);
  });

  it('跨 Level 未解锁场景：仅完成 T1 末章（T1 未全完成）时，末章的"下一章"（T2）判定为锁定', () => {
    const next = getNextChapter(lastT1Chapter.id)!;
    const nextLevel = findLevelByChapterId(next.id)!;
    expect(isLevelUnlockedByCompleted(nextLevel.id, [lastT1Chapter.id])).toBe(false);
  });

  it('T1 全部章节完成后 T2 解锁（下一章按钮恢复可点击）', () => {
    const completed = t1.chapters.map((c) => c.id);
    expect(isLevelUnlockedByCompleted(t2.id, completed)).toBe(true);
  });

  it('前一 Level 缺任意一章均不解锁', () => {
    for (const missing of t1.chapters) {
      const completed = t1.chapters.filter((c) => c.id !== missing.id).map((c) => c.id);
      expect(isLevelUnlockedByCompleted(t2.id, completed)).toBe(false);
    }
  });

  it('未知 Level id 判定为锁定（防御）', () => {
    expect(isLevelUnlockedByCompleted('t99', [])).toBe(false);
  });

  it('正常顺序学习流不变式：按扁平顺序完成到任意章节时，其下一章所属 Level 均已解锁', () => {
    const all = getAllChapters();
    const completed: string[] = [];
    for (const chapter of all) {
      completed.push(chapter.id);
      const next = getNextChapter(chapter.id);
      if (!next) continue;
      const nextLevel = findLevelByChapterId(next.id)!;
      expect(isLevelUnlockedByCompleted(nextLevel.id, completed)).toBe(true);
    }
  });
});

// ========== 变体系列新增用例 ==========

describe('变体章节查找（heads-up）', () => {
  it('findChapterById 能命中变体章节', () => {
    const chapter = findChapterById('t1hu-probability');
    expect(chapter).toBeDefined();
    expect(chapter!.id).toBe('t1hu-probability');
  });

  it('findLevelByChapterId 能返回变体 Level', () => {
    const level = findLevelByChapterId('t1hu-probability');
    expect(level).toBeDefined();
    expect(level!.id).toBe('t1hu');
  });
});

describe('变体 nextChapter 顺延不跨变体（heads-up）', () => {
  it('t1hu 末章的下一章属于 t2hu（同一变体序列内顺延）', () => {
    const next = getNextChapter(lastT1huChapter.id);
    expect(next).toBeDefined();
    expect(findLevelByChapterId(next!.id)?.id).toBe(t2hu.id);
  });

  it('变体末章无下一章不跨变体（t9hu 末章返回 undefined，不会顺延到标准 t4）', () => {
    const lastHuLevel = headsUpLevels[headsUpLevels.length - 1]!;
    const lastHuChapter = lastHuLevel.chapters[lastHuLevel.chapters.length - 1]!;
    expect(getNextChapter(lastHuChapter.id)).toBeUndefined();
  });
});

describe('变体 isLevelUnlockedByCompleted（heads-up）', () => {
  it('t1hu 恒解锁（修复前返回 false 的缺陷）', () => {
    expect(isLevelUnlockedByCompleted(t1hu.id, [])).toBe(true);
  });

  it('t2hu 需 t1hu 全部章节完成（变体序列内解锁链独立）', () => {
    // 仅完成部分 t1hu 章节 → t2hu 不解锁
    expect(isLevelUnlockedByCompleted(t2hu.id, [lastT1huChapter.id])).toBe(false);
    // 完成 t1hu 全部章节 → t2hu 解锁
    const t1huCompleted = t1hu.chapters.map((c) => c.id);
    expect(isLevelUnlockedByCompleted(t2hu.id, t1huCompleted)).toBe(true);
  });

  it('变体 Level 缺任意一章均不解锁', () => {
    for (const missing of t1hu.chapters) {
      const completed = t1hu.chapters.filter((c) => c.id !== missing.id).map((c) => c.id);
      expect(isLevelUnlockedByCompleted(t2hu.id, completed)).toBe(false);
    }
  });

  it('变体正常顺序学习流不变式', () => {
    const allHuChapters = headsUpLevels.flatMap((l) => l.chapters);
    const completed: string[] = [];
    for (const chapter of allHuChapters) {
      completed.push(chapter.id);
      const next = getNextChapter(chapter.id);
      if (!next) continue;
      const nextLevel = findLevelByChapterId(next.id)!;
      expect(isLevelUnlockedByCompleted(nextLevel.id, completed)).toBe(true);
    }
  });
});

describe('变体 isLevelFullyCompleted', () => {
  it('t1hu 全部章节完成后判定为全完成', () => {
    const completed = t1hu.chapters.map((c) => c.id);
    expect(isLevelFullyCompleted(t1hu.id, completed)).toBe(true);
  });

  it('t1hu 缺一章时判定为未完成', () => {
    const completed = t1hu.chapters.slice(1).map((c) => c.id);
    expect(isLevelFullyCompleted(t1hu.id, completed)).toBe(false);
  });

  it('标准系列 isLevelFullyCompleted 仍正确', () => {
    const completed = t1.chapters.map((c) => c.id);
    expect(isLevelFullyCompleted(t1.id, completed)).toBe(true);
  });
});