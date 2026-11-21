import { describe, expect, it } from 'vitest';
import type { AcademyLearningStage } from '@/shared/types/academyDataSource';
import { computeStageStates, findNextLesson } from './journeyProgress';

/**
 * 学习旅程图推导（unit）。
 *
 * 契约：
 * - 无前置阶段的阶段一律解锁；有前置而未完成则锁定；
 * - 比率 = 完成课时 / 总课时（空阶段为 0）；
 * - current 是首个已解锁且未完成阶段，全图至多一个；
 * - 下一课跳过已完成课时与锁定阶段，全部完成返回 null。
 */

function stage(
  id: string,
  lessonIds: string[],
  prerequisiteStageIds: string[] = [],
): AcademyLearningStage {
  return {
    id,
    level: 1,
    title: id,
    description: '',
    icon: 'x',
    unlockRequirement: '',
    prerequisiteStageIds,
    lessonIds,
  };
}

const S1 = stage('s1', ['a1', 'a2']);
const S2 = stage('s2', ['b1', 'b2'], ['s1']);
const S3 = stage('s3', ['c1'], ['s2']);

describe('computeStageStates', () => {
  it('无前置阶段直接解锁，有前置未完成则锁定', () => {
    const states = computeStageStates([S1, S2], []);

    expect(states[0]?.unlocked).toBe(true);
    expect(states[1]?.unlocked).toBe(false);
  });

  it('前置阶段全部完成后解锁后继阶段', () => {
    const states = computeStageStates([S1, S2, S3], ['a1', 'a2', 'b1', 'b2']);

    expect(states.map((s) => s.unlocked)).toEqual([true, true, true]);
  });

  it('前置阶段只完成部分课时时仍锁定', () => {
    const states = computeStageStates([S1, S2], ['a1']);

    expect(states[1]?.unlocked).toBe(false);
  });

  it('比率按完成课时数计算，空阶段为 0', () => {
    const states = computeStageStates([S1, stage('empty', [])], ['a1']);

    expect(states[0]).toMatchObject({ done: 1, total: 2, ratio: 0.5 });
    expect(states[1]).toMatchObject({ done: 0, total: 0, ratio: 0 });
  });

  it('空阶段不算完成，不会凭空解锁后继阶段', () => {
    const states = computeStageStates([stage('empty', []), S2], []);

    expect(states[0]).toMatchObject({ unlocked: true, current: true });
    expect(states[1]?.unlocked).toBe(false);
  });

  it('current 是首个已解锁且未完成的阶段，全图至多一个', () => {
    const states = computeStageStates([S1, S2], ['a1', 'a2', 'b1']);

    expect(states.map((s) => s.current)).toEqual([false, true]);

    const done = computeStageStates([S1], ['a1', 'a2']);
    expect(done[0]?.current).toBe(false);
  });
});

describe('findNextLesson', () => {
  it('跳过已完成课时，返回同阶段下一课', () => {
    const next = findNextLesson([S1, S2], ['a1']);

    expect(next?.stage.id).toBe('s1');
    expect(next?.lessonId).toBe('a2');
  });

  it('整段完成后推进到下一阶段首课', () => {
    const next = findNextLesson([S1, S2], ['a1', 'a2']);

    expect(next?.stage.id).toBe('s2');
    expect(next?.lessonId).toBe('b1');
  });

  it('跳过锁定阶段', () => {
    // 首段前置缺失（跨变体未注册的 stage id）→ 锁定；下一课必须落到其后的已解锁阶段
    const lockedFirst = stage('ghost-child', ['x1'], ['ghost']);
    const next = findNextLesson([lockedFirst, S1], []);

    expect(next?.stage.id).toBe('s1');
    expect(next?.lessonId).toBe('a1');
  });

  it('全部课时完成时返回 null', () => {
    expect(findNextLesson([S1, S2, S3], ['a1', 'a2', 'b1', 'b2', 'c1'])).toBeNull();
  });

  it('空阶段列表返回 null', () => {
    expect(findNextLesson([], ['a1'])).toBeNull();
  });
});
