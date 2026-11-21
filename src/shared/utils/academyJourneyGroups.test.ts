import { describe, expect, it } from 'vitest';
import type { AcademyLearningStage } from '@/shared/types/academyDataSource';
import { groupLearningStages, journeyGroupIndex } from './academyJourneyGroups';

function stage(
  id: string,
  level: number,
  lessonIds: string[],
  theoryChapterIds: string[] = [],
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

describe('学习旅程四段分组', () => {
  it('按 Level 序号归并为四段，课时保序合并', () => {
    const groups = groupLearningStages([
      stage('l1', 1, ['a']),
      stage('l2', 2, ['b']),
      stage('l3', 3, ['c']),
      stage('l4a', 4, ['d']),
      stage('l4b', 4, ['e']),
      stage('l5', 5, ['f']),
      stage('l8', 8, ['g']),
    ]);

    expect(groups).toHaveLength(4);
    expect(groups.map((group) => group.lessonIds)).toEqual([
      ['a'],
      ['b', 'c'],
      ['d', 'e'],
      ['f', 'g'],
    ]);
    expect(groups.map((group) => group.prerequisiteStageIds)).toEqual([
      [],
      ['journey-stage-1'],
      ['journey-stage-2'],
      ['journey-stage-3'],
    ]);
  });

  it('缺失的段位不生成空分组，同段先修保持串行', () => {
    const groups = groupLearningStages([
      stage('l2', 2, ['b']),
      stage('l5', 5, ['f']),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.prerequisiteStageIds).toEqual([]);
    expect(groups[1]?.prerequisiteStageIds).toEqual(['journey-stage-2']);
  });

  it('Level 序号映射到固定四段', () => {
    expect([1, 2, 3, 4, 5, 8].map(journeyGroupIndex)).toEqual([0, 1, 1, 2, 3, 3]);
  });

  it('理论锚点随四段合并并按出现顺序去重', () => {
    const groups = groupLearningStages([
      stage('l1', 1, ['a'], ['t1-a', 't1-b']),
      stage('l2', 2, ['b'], ['t2-a', 't1-b']),
      stage('l5', 5, ['c'], ['t5-a']),
    ]);

    expect(groups.map((group) => group.theoryChapterIds)).toEqual([
      ['t1-a', 't1-b'],
      ['t2-a', 't1-b'],
      ['t5-a'],
    ]);
  });
});
