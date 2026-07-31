/**
 * 理论进度纯函数测试（P1F-02 回归）：
 * 「下一章」跨 Level 顺延时必须先校验目标 Level 解锁态，
 * 否则点击后被章节页门禁 Navigate 静默弹回 /theory。
 * ① getNextChapter 跨 Level 顺延行为 ② isLevelUnlockedByCompleted 解锁判定
 * ③ 跨 Level 未解锁场景（bug 复现路径） ④ 正常顺序学习流不会出现锁定提示。
 */
import { describe, it, expect } from 'vitest';
import { THEORY_LEVELS } from '../data/levels';
import {
  getAllChapters,
  getNextChapter,
  findLevelByChapterId,
  isLevelUnlockedByCompleted,
} from './theoryProgress';

const t1 = THEORY_LEVELS[0]!;
const t2 = THEORY_LEVELS[1]!;
const lastT1Chapter = t1.chapters[t1.chapters.length - 1]!;

describe('getNextChapter 跨 Level 顺延', () => {
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

describe('isLevelUnlockedByCompleted（P1F-02 下一章解锁校验）', () => {
  it('T1 恒解锁（含零进度）', () => {
    expect(isLevelUnlockedByCompleted(t1.id, [])).toBe(true);
  });

  it('跨 Level 未解锁场景：仅完成 T1 末章（T1 未全完成）时，末章的"下一章"（T2）判定为锁定', () => {
    // bug 复现路径：章节列表直达 T1 末章并完成 → getNextChapter 顺延到 T2 首章，
    // 旧实现直接渲染可点击按钮 → 点击被门禁静默弹回
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
    // 保证 P1F-02 的降级提示只在"跳章回访"等非顺序路径出现，不影响正常学习流
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
