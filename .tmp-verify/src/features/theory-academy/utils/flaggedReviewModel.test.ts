import { describe, expect, it } from 'vitest';
import {
  buildFlaggedReviewEntries,
  chapterIdFromQuestionId,
  resolveFlaggedQuestionText,
} from './flaggedReviewModel';
import { theoryQuizQuestionKey } from './contentKeys';
import { theoryReviewItemId } from './theorySrs';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import type { TheoryChapter } from '../types';

/**
 * 疑难标记 → 复习清单条目（纯函数）守卫。
 * 锁定四件事：id 反解契约、脏 id 静默跳过（存档残留已删题不得白屏）、
 * 与 SRS 队列的只读联结（不重复入队，仅暴露状态）、稳定排序。
 */

/** 取真实题库中首个含 ≥2 题的章节（题 id 与章节 id 均为真实值，防契约漂移） */
const realChapter = ALL_VARIANT_THEORY_LEVELS.flatMap((l) => l.chapters).find(
  (c) => c.quiz.length >= 2,
)!;
const [q1, q2] = realChapter.quiz;

/** 任意一个真实复习项（id 走 theorySrs 的命名空间），用于只读联结断言 */
function queuedItem(questionId: string, overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    ...createReviewItem(theoryReviewItemId(questionId), theoryQuizQuestionKey(questionId), 'theory'),
    ...overrides,
  };
}

describe('chapterIdFromQuestionId（题 id → 章节 id 反解）', () => {
  it('剥掉 -q<n> 题号后缀', () => {
    expect(chapterIdFromQuestionId('t1-combinatorics-q3')).toBe('t1-combinatorics');
    expect(chapterIdFromQuestionId('t2hu-ev-q10')).toBe('t2hu-ev');
  });

  it('无题号后缀时原样返回（交由章节查找 + 成员校验兜住）', () => {
    expect(chapterIdFromQuestionId('t1-outs')).toBe('t1-outs');
    expect(chapterIdFromQuestionId('')).toBe('');
  });

  it('全量真实题 id 均满足反解契约（题库命名漂移时本测试先变红）', () => {
    const chapters: TheoryChapter[] = ALL_VARIANT_THEORY_LEVELS.flatMap((l) => l.chapters);
    const violations = chapters.flatMap((c) =>
      c.quiz.filter((q) => chapterIdFromQuestionId(q.id) !== c.id).map((q) => q.id),
    );
    expect(violations).toEqual([]);
  });
});

describe('buildFlaggedReviewEntries（条目派生）', () => {
  it('真实题 id 派生出完整的章节 / key / 路由信息', () => {
    const entries = buildFlaggedReviewEntries([q1!.id], []);
    expect(entries).toHaveLength(1);
    const entry = entries[0]!;
    expect(entry.questionId).toBe(q1!.id);
    expect(entry.chapter.id).toBe(realChapter.id);
    expect(entry.level.chapters.some((c) => c.id === realChapter.id)).toBe(true);
    expect(entry.variant).toBe(realChapter.variant);
    expect(entry.questionKey).toBe(theoryQuizQuestionKey(q1!.id));
    expect(entry.route).toBe(`/theory/chapter/${realChapter.id}`);
    expect(entry.srsItemId).toBe(theoryReviewItemId(q1!.id));
    expect(entry.inSrsQueue).toBe(false);
    expect(entry.lastReviewedAt).toBeUndefined();
    expect(entry.nextReviewDate).toBeUndefined();
  });

  it('脏 id 静默跳过：未知章节 / 章节存在但题不存在 / 空串 / 无后缀', () => {
    const dirty = [
      'ghost-chapter-q1',
      `${realChapter.id}-q999`,
      'no-suffix-at-all',
      '',
      realChapter.id,
    ];
    expect(buildFlaggedReviewEntries(dirty, [])).toEqual([]);
    // 混合场景：只保留可解析项，不抛错
    const mixed = buildFlaggedReviewEntries(['ghost-chapter-q1', q1!.id], []);
    expect(mixed.map((e) => e.questionId)).toEqual([q1!.id]);
  });

  it('重复 id 去重（存档异常时不产生重复条目）', () => {
    const entries = buildFlaggedReviewEntries([q1!.id, q1!.id, q2!.id], []);
    expect(entries.map((e) => e.questionId).toSorted()).toEqual([q1!.id, q2!.id].toSorted());
  });

  it('排序与入参顺序无关（Level → 章节 order → 题号），输出确定性', () => {
    const forward = buildFlaggedReviewEntries([q1!.id, q2!.id], []).map((e) => e.questionId);
    const reversed = buildFlaggedReviewEntries([q2!.id, q1!.id], []).map((e) => e.questionId);
    expect(reversed).toEqual(forward);
  });

  it('只读联结 SRS 队列：命中 theory:<questionId> 时暴露复习状态，未命中不受影响', () => {
    const stamped = queuedItem(q1!.id, { lastReviewedAt: 1_700_000_000_000, nextReviewDate: '2099-01-01' });
    const entries = buildFlaggedReviewEntries([q1!.id, q2!.id], [stamped]);
    const [first, second] = entries;
    expect(first?.inSrsQueue).toBe(true);
    expect(first?.lastReviewedAt).toBe(1_700_000_000_000);
    expect(first?.nextReviewDate).toBe('2099-01-01');
    expect(second?.inSrsQueue).toBe(false);
  });

  it('派生过程不修改入参数组（不可变约束）', () => {
    const flagged = [q2!.id, q1!.id];
    const items = [queuedItem(q1!.id)];
    buildFlaggedReviewEntries(flagged, items);
    expect(flagged).toEqual([q2!.id, q1!.id]);
    expect(items[0]!.id).toBe(theoryReviewItemId(q1!.id));
  });
});

describe('resolveFlaggedQuestionText（语言中立载荷）', () => {
  it('以 questionKey 为查找键并带数据层原文兜底', () => {
    const entry = buildFlaggedReviewEntries([q1!.id], [])[0]!;
    const calls: [string, { defaultValue: string }?][] = [];
    const fakeT = ((key: string, opts?: { defaultValue: string }) => {
      calls.push([key, opts]);
      return 'RESOLVED';
    }) as unknown as Parameters<typeof resolveFlaggedQuestionText>[0];

    expect(resolveFlaggedQuestionText(fakeT, entry)).toBe('RESOLVED');
    expect(calls[0]![0]).toBe(theoryQuizQuestionKey(q1!.id));
    expect(calls[0]![1]?.defaultValue).toBe(q1!.question);
  });
});
