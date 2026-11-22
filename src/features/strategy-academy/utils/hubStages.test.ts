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
  { chapterId: 't1-a', levelId: 't1', tier: 'basic' },
  { chapterId: 't1-extra', levelId: 't1', tier: 'basic' },
  { chapterId: 't2-a', levelId: 't2', tier: 'basic' },
  { chapterId: 't3-extra', levelId: 't3', tier: 'basic' },
  { chapterId: 't4-a', levelId: 't4', tier: 'intermediate' },
  { chapterId: 't4-extra', levelId: 't4', tier: 'intermediate' },
  { chapterId: 't5-a', levelId: 't5', tier: 'advanced' },
  { chapterId: 't5-extra', levelId: 't5', tier: 'advanced' },
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
    expect(stages[1]?.basicsChapterIds).toContain('t3-extra');
    expect(stages[0]?.basicsChapterIds).toContain('t1-extra');
    expect(stages[2]?.supplementalChapterIds).toContain('t4-extra');
    expect(stages[3]?.supplementalChapterIds).toContain('t5-extra');
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
    expect(stages[0]?.basicsChapterIds).toEqual([]);
    expect(stages[0]?.supplementalChapterIds).toEqual([]);
    expect(stages[0]?.lessonIds).toEqual(['l3sd-intro']);
  });

  it('首个学习段承接更早理论段的基础章（变体从 L3 起时不丢 T1 基础）', () => {
    const stages = buildHubStages({
      stages: [stage('l3', 3, ['l3sd-intro'], ['t3sd-rankings'])],
      completedLessons: [],
      completedChapters: [],
      catalog: [
        { chapterId: 't1sd-outs', levelId: 't1', tier: 'basic' },
        { chapterId: 't1sd-extra', levelId: 't1', tier: 'intermediate' },
      ],
      variant: 'short-deck',
      basicsCompleted: true,
      theoryKnown: true,
    });

    expect(stages[0]?.basicsChapterIds).toContain('t1sd-outs');
    expect(stages[0]?.supplementalChapterIds).not.toContain('t1sd-extra');
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