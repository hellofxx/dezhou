import { describe, expect, it } from 'vitest';
import type { HubStage } from './hubStages';
import { buildHubNextAction } from './hubNextAction';

function stage(overrides: Partial<HubStage> = {}): HubStage {
  return {
    id: 'journey-stage-1',
    index: 1,
    level: 1,
    titleKey: 'dashboard.path.stage1',
    subtitleKey: 'dashboard.path.stage1Sub',
    lessonIds: ['l1-a'],
    theoryChapterIds: ['t1-a'],
    supplementalChapterIds: [],
    doneLessons: 0,
    totalLessons: 1,
    doneChapters: 0,
    totalChapters: 1,
    unlocked: true,
    current: true,
    complete: false,
    theoryKnown: true,
    theoryUnavailable: false,
    ...overrides,
  };
}

const BASE = {
  completedLessons: [] as string[],
  completedChapters: [] as string[],
  conceptScores: {} as Record<string, number | undefined>,
  dueReviewCounts: { theory: 0, generic: 0 },
  theoryReady: true,
  basicsCompleted: true,
};

describe('buildHubNextAction', () => {
  it('基础未完成优先', () => {
    const action = buildHubNextAction({ ...BASE, stages: [stage()], basicsCompleted: false });
    expect(action.kind).toBe('basics');
    expect(action.route).toBe('/academy/basics');
    expect(action.stageIndex).toBeUndefined();
  });

  it('理论 SRS > 通用 SRS > 弱项概念 > 实战', () => {
    const stages = [stage()];
    expect(
      buildHubNextAction({ ...BASE, stages, dueReviewCounts: { theory: 2, generic: 1 } }).route,
    ).toBe('/theory/review');
    expect(
      buildHubNextAction({ ...BASE, stages, dueReviewCounts: { theory: 0, generic: 1 } }).route,
    ).toBe('/');
    expect(
      buildHubNextAction({ ...BASE, stages, conceptScores: { 't1-a': 45 } }).route,
    ).toBe('/theory/chapter/t1-a');
    expect(buildHubNextAction({ ...BASE, stages }).route).toBe('/lesson/l1-a');
    // 复习类动作不属于任何主线阶段，不写锚点
    expect(
      buildHubNextAction({ ...BASE, stages, dueReviewCounts: { theory: 2, generic: 1 } }).stageIndex,
    ).toBeUndefined();
  });

  it('理论未就绪时跳过概念分支，直接实战', () => {
    const action = buildHubNextAction({
      ...BASE,
      stages: [stage()],
      conceptScores: { 't1-a': 10 },
      theoryReady: false,
    });
    expect(action.kind).toBe('practice');
  });

  it('实战完成但概念未读时回到概念', () => {
    const action = buildHubNextAction({
      ...BASE,
      stages: [stage({ doneLessons: 1, complete: true, current: false })],
      completedLessons: ['l1-a'],
    });
    expect(action.kind).toBe('concept');
    expect(action.route).toBe('/theory/chapter/t1-a');
    expect(action.stageIndex).toBe(1);
  });

  it('实战与概念都完成返回 done；空阶段返回 blocked', () => {
    expect(
      buildHubNextAction({
        ...BASE,
        stages: [stage({ doneLessons: 1, doneChapters: 1, complete: true, current: false })],
        completedLessons: ['l1-a'],
        completedChapters: ['t1-a'],
      }).kind,
    ).toBe('done');
    expect(buildHubNextAction({ ...BASE, stages: [] }).kind).toBe('blocked');
  });

  it('concept / practice 写入所属阶段 index；done / blocked 不写', () => {
    const stage2 = stage({
      id: 'journey-stage-2',
      index: 2,
      titleKey: 'dashboard.path.stage2',
      subtitleKey: 'dashboard.path.stage2Sub',
      lessonIds: ['l2-a'],
      theoryChapterIds: ['t2-a'],
    });

    expect(
      buildHubNextAction({ ...BASE, stages: [stage2], conceptScores: { 't2-a': 30 } }).stageIndex,
    ).toBe(2);
    expect(buildHubNextAction({ ...BASE, stages: [stage2] }).stageIndex).toBe(2);

    expect(
      buildHubNextAction({
        ...BASE,
        stages: [stage({ doneLessons: 1, doneChapters: 1, complete: true, current: false })],
        completedLessons: ['l1-a'],
        completedChapters: ['t1-a'],
      }).stageIndex,
    ).toBeUndefined();
    expect(buildHubNextAction({ ...BASE, stages: [] }).stageIndex).toBeUndefined();
  });
});