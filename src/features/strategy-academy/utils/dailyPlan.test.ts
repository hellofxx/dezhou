import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloDimension, EloRating } from '@/shared/types/elo';
import { generateDailyPlan } from './dailyPlan';
import { getAllLessonSummaries } from './academyMeta';
import { getLessonMeta } from '../data/lessonMeta';

/**
 * 每日计划（学院焦点版）契约（P0）：
 * - 焦点维度 = 标准变体 ELO 五维中最低的一维（focusArea: EloDimension）
 * - 新课按 lessonMeta 的 eloDimension 命中焦点维度（无匹配时按顺序回退）
 * - 复习取 SRS 队列前 2 条；练习只从已学且有 practice 的课程里选
 * - 兼容入参：仍传旧的 abilityAssessment 时改读 progress 标准变体 ELO
 */

function makeElo(overrides: Partial<EloRating>): EloRating {
  const elo: EloRating = { ...DEFAULT_ELO, ...overrides };
  elo.overall = Math.round((elo.preflop + elo.postflop + elo.math + elo.handReading + elo.mental) / 5);
  return elo;
}

/** 第一个「未完成且命中该 ELO 维度」的课程（与实现同口径，用于断言推荐顺序） */
function firstIncompleteOfDimension(completed: string[], dimension: EloDimension): string | undefined {
  return getAllLessonSummaries()
    .filter((lesson) => !completed.includes(lesson.id))
    .find((lesson) => getLessonMeta(lesson.id).eloDimension === dimension)?.id;
}

beforeEach(() => {
  const storageStub = createLocalStorageStub();
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });
});

describe('generateDailyPlan：ELO 焦点维度', () => {
  it('取五维最低者为 focusArea，并按 lessonMeta 推荐同维度未完成课程', () => {
    const elo = makeElo({ preflop: 320, postflop: 900, math: 900, handReading: 900, mental: 900 });
    const plan = generateDailyPlan([], elo, []);

    expect(plan.focusArea).toBe('preflop');
    expect(plan.newLesson).toBe(firstIncompleteOfDimension([], 'preflop'));
    expect(plan.newLesson).not.toBeNull();
  });

  it('弱点维度切换后推荐随之改变（math）', () => {
    const elo = makeElo({ preflop: 900, postflop: 900, math: 300, handReading: 900, mental: 900 });
    const plan = generateDailyPlan([], elo, []);

    expect(plan.focusArea).toBe('math');
    expect(plan.newLesson).toBe(firstIncompleteOfDimension([], 'math'));
  });

  it('五维齐平时按固定顺序取首维（preflop），行为稳定可测', () => {
    const plan = generateDailyPlan([], makeElo({}), []);
    expect(plan.focusArea).toBe('preflop');
  });

  it('同维度课程全部完成时回退到顺序上的下一门未完成课程', () => {
    const elo = makeElo({ mental: 300 });
    const mentalLessons = getAllLessonSummaries()
      .filter((lesson) => getLessonMeta(lesson.id).eloDimension === 'mental')
      .map((lesson) => lesson.id);
    expect(mentalLessons.length).toBeGreaterThan(0);

    const plan = generateDailyPlan(mentalLessons, elo, []);
    expect(plan.focusArea).toBe('mental');
    expect(mentalLessons).not.toContain(plan.newLesson);
    expect(plan.newLesson).not.toBeNull();
  });

  it('复习取队列前 2 条，练习只取已学且有 practice 的课程', () => {
    const elo = makeElo({ postflop: 300 });
    const learned = getAllLessonSummaries().filter((lesson) => lesson.hasPractice).slice(0, 4);
    expect(learned.length).toBeGreaterThan(0);
    const completed = learned.map((lesson) => lesson.id);

    const plan = generateDailyPlan(completed, elo, ['l1-basics', 'l1-bankroll', 'l2-squeeze']);
    expect(plan.reviewLessons).toEqual(['l1-basics', 'l1-bankroll']);
    expect(plan.practiceSpots.length).toBeGreaterThan(0);
    expect(plan.practiceSpots.every((id) => completed.includes(id))).toBe(true);
    expect(plan.estimatedTime).toMatch(/^\d/);
  });

});
