import { describe, it, expect, beforeAll } from 'vitest';
import { generateCrossModuleDailyPlan } from './dailyTrainingPlan';
import type { DailyRecommendation, ReviewRecommendation, TheoryReviewRecommendation } from './dailyTrainingPlan';
import { createReviewItem, toLocalDateString } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import { registerTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { TheoryChapterMeta, TheoryDataSource } from '@/shared/types/theoryDataSource';
import { registerAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import type { AcademyDataSource } from '@/shared/types/academyDataSource';

/**
 * 理论学院卡片（theory-review / theory-chapter）接入每日训练计划的守卫。
 *
 * 结论先行：
 * - 到期理论复习项必须从通用 review 卡剔除，独立成 theory-review 卡（路由 /theory/review），
 *   否则同一批理论题会被两张卡重复推荐，且通用卡把理论题带到 /academy 死路。
 * - 下一章卡（theory-chapter）只在「今日无理论复习」时出现，元数据全部来自
 *   theoryDataSourceRegistry（progress 禁止 import theory-academy）。
 * - 注册表是模块级单例且有「注册前订阅 → 注册后补发」语义，故本文件按声明顺序推进：
 *   第一组断言冷启动（未注册）行为，之后的组才注册夹具。
 */

const CHAPTER: TheoryChapterMeta = {
  chapterId: 'fixture-chapter-a',
  levelId: 't1',
  title: '组合学与起手牌计数',
  titleKey: 'theory.chapterTitle.fixture-chapter-a',
  route: '/theory/chapter/fixture-chapter-a',
  estimatedMinutes: 12,
};

function theorySource(overrides: Partial<TheoryDataSource> = {}): TheoryDataSource {
  return {
    findNextChapter: () => CHAPTER,
    ...overrides,
  };
}

/** 到期理论复习项（标准载荷：metadata.source = 'theory'） */
function theoryItem(id: string): ReviewItem {
  const item = createReviewItem(`theory:${id}`, `theory.quiz.${id}.question`, 'theory', {
    source: 'theory',
    route: '/theory/chapter/fixture-chapter-a',
  });
  item.nextReviewDate = toLocalDateString();
  return item;
}

/** 到期非理论复习项（策略学院课程） */
function genericItem(id: string): ReviewItem {
  const item = createReviewItem(`strategy:${id}`, `Lesson ${id}`, 'strategy', {
    source: 'strategy',
  });
  item.nextReviewDate = toLocalDateString();
  return item;
}

const byType = (plan: DailyRecommendation[], type: string) =>
  plan.filter((rec) => rec.type === type);

const findReview = (plan: DailyRecommendation[]): ReviewRecommendation | undefined =>
  plan.find((rec): rec is ReviewRecommendation => rec.type === 'review');

const findTheoryReview = (plan: DailyRecommendation[]): TheoryReviewRecommendation | undefined =>
  plan.find((rec): rec is TheoryReviewRecommendation => rec.type === 'theory-review');

describe('理论卡 · 数据源未注册（冷启动首帧）', () => {
  it('不产生 theory-chapter 卡，且不影响既有推荐', () => {
    const plan = generateCrossModuleDailyPlan([], [], [genericItem('a')], 0);
    expect(byType(plan, 'theory-chapter')).toHaveLength(0);
    expect(byType(plan, 'review')).toHaveLength(1);
  });
});

describe('理论卡 · 数据源注册后', () => {
  beforeAll(() => {
    registerTheoryDataSource(theorySource());
  });

  it('theory-chapter 使用注册表的 titleKey / route / 时长，progress 不解析路由', () => {
    const plan = generateCrossModuleDailyPlan([], [], [], 0);
    const chapter = byType(plan, 'theory-chapter')[0];
    expect(chapter).toBeDefined();
    expect(chapter?.route).toBe('/theory/chapter/fixture-chapter-a');
    expect(chapter?.title).toBe('theory.chapterTitle.fixture-chapter-a');
    expect(chapter?.titleParams).toEqual({ title: '组合学与起手牌计数' });
    expect(chapter?.estimatedTime).toBe('12 min');
    expect(chapter?.reason).toBe('theoryChapter');
    expect(chapter?.priority).toBe('high'); // 空计划首槽
  });

  it('目录层缺 duration 时回落 10 分钟并使用无时长文案', () => {
    registerTheoryDataSource(theorySource({ findNextChapter: () => ({ ...CHAPTER, estimatedMinutes: 0 }) }));
    const plan = generateCrossModuleDailyPlan([], [], [], 0);
    const chapter = byType(plan, 'theory-chapter')[0];
    expect(chapter?.description).toBe('dashboard.dataPlan.descTheoryChapterNoTime');
    expect(chapter?.estimatedTime).toBe('10 min');
    // 恢复默认夹具，避免用例间串味
    registerTheoryDataSource(theorySource());
  });

  it('到期理论复习项独立成卡：路由 /theory/review、reason=theoryReview、估算时长按条数累计', () => {
    const plan = generateCrossModuleDailyPlan([], [], ['q1', 'q2', 'q3'].map(theoryItem), 0);
    const theoryReview = findTheoryReview(plan);
    expect(theoryReview?.route).toBe('/theory/review');
    expect(theoryReview?.reason).toBe('theoryReview');
    expect(theoryReview?.estimatedTime).toBe('9 min');
    expect(theoryReview?.priority).toBe('high');
    // 有理论复习 → 不再并行推下一章（同模块不并列双卡）
    expect(byType(plan, 'theory-chapter')).toHaveLength(0);
  });

  it('通用复习卡剔除理论项，两卡数量互不重复', () => {
    const items = [theoryItem('t1'), theoryItem('t2'), genericItem('g1'), genericItem('g2')];
    const plan = generateCrossModuleDailyPlan([], [], items, 0);

    const generic = findReview(plan);
    expect(generic?.titleParams).toEqual({ count: 2 });
    expect(generic?.route).toBe('/academy');
    expect(generic?.itemLabels).toEqual(['Lesson g1', 'Lesson g2']);

    const theory = findTheoryReview(plan);
    expect(theory?.titleParams).toEqual({ count: 2 });

    // 无重复卡：每个 id 唯一，且理论项不出现在通用卡片预览里
    const ids = plan.map((rec) => rec.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(generic?.itemLabels.some((label) => label.startsWith('theory.quiz.'))).toBe(false);
  });

  it('到期项全为理论时，通用复习卡整体不出现', () => {
    const plan = generateCrossModuleDailyPlan([], [], [theoryItem('q1'), theoryItem('q2')], 0);
    expect(byType(plan, 'review')).toHaveLength(0);
    expect(byType(plan, 'theory-review')).toHaveLength(1);
  });

  it('只有 category=theory 的老数据（无 metadata.source）仍归理论卡', () => {
    const legacy = createReviewItem('legacy-theory', 'theory.quiz.legacy.question', 'theory');
    legacy.nextReviewDate = toLocalDateString();
    const plan = generateCrossModuleDailyPlan([], [], [legacy], 0);
    expect(byType(plan, 'review')).toHaveLength(0);
    expect(byType(plan, 'theory-review')).toHaveLength(1);
  });
});

describe('理论卡 · 5 卡上限', () => {
  beforeAll(() => {
    // 学院课程源仅在「上限」组注册，避免污染前面的用例
    const academySource: AcademyDataSource = {
      findNextLesson: () => ({ id: 'fixture-lesson', title: '基础课', level: 1 }),
      getLessonMeta: () => undefined,
      getAcademyProgressSnapshot: () => ({ completedLessons: [] }),
      getFirstAttemptScoresSnapshot: () => ({}),
      getLastAttemptScoresSnapshot: () => ({}),
      subscribe: () => () => {},
    };
    registerAcademyDataSource(academySource);
    registerTheoryDataSource(theorySource());
  });

  it('理论卡加入后总卡数仍不超过 5，且高优先级理论复习优先保留', () => {
    const plan = generateCrossModuleDailyPlan([], [], ['q1', 'q2'].map(theoryItem), 9);
    expect(plan.length).toBeLessThanOrEqual(5);
    expect(byType(plan, 'theory-review')).toHaveLength(1);
    // 排序后高优先级在前
    expect(plan[0]?.priority).toBe('high');
  });
});
