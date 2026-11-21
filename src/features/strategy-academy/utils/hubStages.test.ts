import { describe, expect, it } from 'vitest';
import type { AcademyLearningStage } from '@/shared/types/academyDataSource';
import type { TheoryChapterIndexEntry } from '@/shared/types/theoryDataSource';
import { buildHubStages, summarizeHubProgress } from './hubStages';

function stage(
  id: string,
  level: number,
  lessonIds: string[],
  theoryChapterIds: string[],
): AcademyLearningStage {
  return {
    id,
    level,
    title: id,
    description: '',
    icon: '',
    unlockRequirement: '',
    prerequisiteStageIds: [],
    lessonIds,
    theoryChapterIds,
  };
}

const STAGES = [
  stage('l1', 1, ['a'], ['t1-a']),
  stage('l2', 2, ['b'], ['t2-a']),
  stage('l4', 4, ['c'], ['t4-a']),
  stage('l5', 5, ['d'], ['t5-a']),
];

const CATALOG: TheoryChapterIndexEntry[] = [
  { chapterId: 't1-a', levelId: 't1' },
  { chapterId: 't1-extra', levelId: 't1' },
  { chapterId: 't2-a', levelId: 't2' },
  { chapterId: 't3-extra', levelId: 't3' },
  { chapterId: 't4-a', levelId: 't4' },
  { chapterId: 't5-a', levelId: 't5' },
];

describe('buildHubStages', () => {
  it('归并四段、合并理论锚点并计算双泳道计数', () => {
    const stages = buildHubStages({
      stages: STAGES,
      completedLessons: ['a'],
      completedChapters: ['t1-a'],
      catalog: CATALOG,
      variant: 'standard',
      basicsCompleted: true,
      theoryKnown: true,
    });

    expect(stages).toHaveLength(4);
    expect(stages.map((item) => item.index)).toEqual([1, 2, 3, 4]);
    expect(stages[0]).toMatchObject({ doneLessons: 1, totalLessons: 1, doneChapters: 1, totalChapters: 1 });
    expect(stages[0]?.complete).toBe(true);
    expect(stages[1]?.supplementalChapterIds).toContain('t3-extra');
    expect(stages[0]?.supplementalChapterIds).toContain('t1-extra');
  });

  it('基础入门未完成时全段锁定，但仍保留数据', () => {
    const stages = buildHubStages({
      stages: STAGES,
      completedLessons: ['a'],
      completedChapters: ['t1-a'],
      catalog: CATALOG,
      variant: 'standard',
      basicsCompleted: false,
      theoryKnown: true,
    });

    expect(stages.every((item) => !item.unlocked && !item.current)).toBe(true);
    expect(stages[0]?.totalLessons).toBe(1);
  });

  it('短牌无理论锚点时不伪造补充阅读，标记为待补充', () => {
    const stages = buildHubStages({
      stages: [stage('l3', 3, ['l3sd-intro'], [])],
      completedLessons: [],
      completedChapters: [],
      catalog: [{ chapterId: 't1sd-combinatorics', levelId: 't1' }],
      variant: 'short-deck',
      basicsCompleted: true,
      theoryKnown: true,
    });

    expect(stages[0]?.theoryUnavailable).toBe(true);
    expect(stages[0]?.supplementalChapterIds).toEqual([]);
    expect(stages[0]?.lessonIds).toEqual(['l3sd-intro']);
  });

  it('汇总总进度', () => {
    const stages = buildHubStages({
      stages: STAGES,
      completedLessons: ['a', 'b'],
      completedChapters: ['t1-a'],
      catalog: CATALOG,
      variant: 'standard',
      basicsCompleted: true,
      theoryKnown: true,
    });

    expect(summarizeHubProgress(stages)).toEqual({
      doneLessons: 2,
      totalLessons: 4,
      doneChapters: 1,
      totalChapters: 4,
    });
  });
});