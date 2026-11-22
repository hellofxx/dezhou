import { describe, expect, it } from 'vitest';
import { buildLearningStages, toLearningStage } from './learningStages';
import { getLessonMeta } from '../data/lessonMeta';
import type { LessonSummary, LevelSummary } from '../types';

/**
 * 学习段快照投影（unit / Node）：
 * 覆盖 id 兜底、prerequisiteLevelIds 缺省、lessonIds 顺序保序与快照形状。
 */

function lesson(id: string, order: number): LessonSummary {
  return {
    id,
    level: 1,
    order,
    title: `课程 ${id}`,
    subtitle: '',
    duration: '10 分钟',
  };
}

function level(overrides: Partial<LevelSummary> & Pick<LevelSummary, 'level'>): LevelSummary {
  return {
    title: '基础入门',
    description: '从零开始',
    icon: 'flag',
    unlockRequirement: '完成新手引导',
    lessons: [lesson('l1-a', 1), lesson('l1-b', 2)],
    ...overrides,
  };
}

describe('toLearningStage', () => {
  it('id 存在时直取', () => {
    const stage = toLearningStage(level({ id: 'l4a', level: 4 }));
    expect(stage.id).toBe('l4a');
    expect(stage.level).toBe(4);
  });

  it('id 缺省时兜底为 l<level>', () => {
    const stage = toLearningStage(level({ level: 3 }));
    expect(stage.id).toBe('l3');
  });

  it('prerequisiteLevelIds 缺省时为空数组（非 undefined）', () => {
    const stage = toLearningStage(level({ level: 2 }));
    expect(stage.prerequisiteStageIds).toEqual([]);
  });

  it('prerequisiteLevelIds 存在时保序透传', () => {
    const stage = toLearningStage(level({ id: 'l4b', level: 4, prerequisiteLevelIds: ['l4a', 'l3'] }));
    expect(stage.prerequisiteStageIds).toEqual(['l4a', 'l3']);
  });

  it('lessonIds 保序展平，其余字段直取', () => {
    const stage = toLearningStage(
      level({
        level: 1,
        title: '标题',
        description: '描述',
        icon: 'flag',
        unlockRequirement: '解锁要求',
        lessons: [lesson('l1-c', 3), lesson('l1-a', 1)],
      }),
    );
    expect(stage.lessonIds).toEqual(['l1-c', 'l1-a']);
    expect(stage.title).toBe('标题');
    expect(stage.description).toBe('描述');
    expect(stage.icon).toBe('flag');
    expect(stage.unlockRequirement).toBe('解锁要求');
  });

  it('theoryChapterIds 由课时锚点去重生成', () => {
    const lessonIds = ['l1-basics', 'drill-hand-ranking'];
    const expected = [
      ...new Set(lessonIds.flatMap((id) => getLessonMeta(id).theoryAnchors)),
    ];
    const stage = toLearningStage(
      level({ level: 1, lessons: lessonIds.map((id, index) => lesson(id, index + 1)) }),
    );

    expect(stage.theoryChapterIds).toEqual(expected);
    expect(new Set(stage.theoryChapterIds).size).toBe(stage.theoryChapterIds.length);
  });

  it('无 lessonMeta 的课时（未知 id）回退空数组', () => {
    const stage = toLearningStage(level({ level: 1, lessons: [lesson('unknown-lesson', 1)] }));
    expect(stage.theoryChapterIds).toEqual([]);
  });
});

describe('buildLearningStages', () => {
  it('保持入参 Level 顺序并输出快照形状', () => {
    const snapshot = buildLearningStages([
      level({ id: 'l4a', level: 4 }),
      level({ level: 1 }),
      level({ id: 'l4b', level: 4, prerequisiteLevelIds: ['l4a'] }),
    ]);
    expect(Object.keys(snapshot)).toEqual(['stages']);
    expect(snapshot.stages.map((stage) => stage.id)).toEqual(['l4a', 'l1', 'l4b']);
    expect(snapshot.stages[2]?.prerequisiteStageIds).toEqual(['l4a']);
  });

  it('空目录返回空 stages', () => {
    const snapshot = buildLearningStages([]);
    expect(snapshot.stages).toEqual([]);
  });
});
