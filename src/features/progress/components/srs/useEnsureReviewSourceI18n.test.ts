/**
 * collectReviewSourceModules 单测（Node 环境，纯函数）。
 *
 * 复习项 label / metadata.front|back 存 i18n key，而其翻译包按路由懒加载，首页分组不含
 * theory / rangeTrainer / potOdds / gto —— 本函数决定渲染时要按需补加载哪些包，
 * 漏一个来源即意味着该来源的复习项在冷启动首页显示 key 字面量。
 */
import { describe, it, expect } from 'vitest';
import {
  collectReviewSourceModules,
  collectStrategyLessonIds,
  collectTheoryQuestionIds,
} from './useEnsureReviewSourceI18n';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { ReviewItem, ReviewItemMetadata } from '@/shared/utils/spacedRepetition';

type Source = NonNullable<ReviewItemMetadata['source']>;

function itemWithSource(source: Source): ReviewItem {
  return createReviewItem(`k:${source}`, 'some.i18n.key', 'x', { source });
}

describe('collectReviewSourceModules', () => {
  it('理论复习项映射到 theory 翻译包（首页路由分组未含它，必须按需补加载）', () => {
    expect(collectReviewSourceModules([itemWithSource('theory')])).toEqual(['theory']);
  });

  it('range / odds / gto 三种来源各自映射到对应模块 key', () => {
    expect(collectReviewSourceModules([itemWithSource('range')])).toEqual(['rangeTrainer']);
    expect(collectReviewSourceModules([itemWithSource('odds')])).toEqual(['potOdds']);
    expect(collectReviewSourceModules([itemWithSource('gto')])).toEqual(['gto']);
  });

  it('strategy 来源不需补加载（academy 属 CORE_MODULES，启动即就绪）', () => {
    expect(collectReviewSourceModules([itemWithSource('strategy')])).toEqual([]);
  });

  it('多来源去重且顺序稳定（避免依赖数组反复触发加载）', () => {
    const items = [
      itemWithSource('theory'),
      itemWithSource('range'),
      itemWithSource('theory'),
    ];
    expect(collectReviewSourceModules(items)).toEqual(['rangeTrainer', 'theory']);
    expect(collectReviewSourceModules(items)).toEqual(collectReviewSourceModules(items));
  });

  it('无 metadata / 无 source 的老存量复习项被忽略且不抛错', () => {
    const legacy: ReviewItem = createReviewItem('legacy-id', '老知识点', 'strategy');
    expect(collectReviewSourceModules([legacy, itemWithSource('theory')])).toEqual(['theory']);
    expect(collectReviewSourceModules([])).toEqual([]);
  });
});

describe('collectStrategyLessonIds', () => {
  it('从策略题级复习项的 route 提取 lessonId 并去重', () => {
    const items = [
      createReviewItem('strategy:l1-basics-q1', 'academy.lessonQuiz.l1-basics-q1.question', 'strategy', {
        source: 'strategy',
        route: '/academy/lesson/l1-basics',
        front: 'academy.lessonQuiz.l1-basics-q1.question',
        back: 'academy.lessonQuiz.l1-basics-q1.explanation',
      }),
      createReviewItem('strategy:l1-basics-q2', 'academy.lessonQuiz.l1-basics-q2.question', 'strategy', {
        source: 'strategy',
        route: '/academy/lesson/l1-basics',
      }),
    ];
    expect(collectStrategyLessonIds(items)).toEqual(['l1-basics']);
  });

  it('无 route / 非策略题 key 不收集', () => {
    const noRoute = createReviewItem('strategy:q1', 'academy.lessonQuiz.q1.question', 'strategy', {
      source: 'strategy',
    });
    const theoryKey = createReviewItem('strategy:q2', 'theory.quiz.q2.question', 'strategy', {
      source: 'strategy',
      route: '/academy/lesson/l1-basics',
    });
    expect(collectStrategyLessonIds([noRoute, theoryKey])).toEqual([]);
  });
});

describe('collectTheoryQuestionIds', () => {
  it('从 label / metadata.front / metadata.back 提取题 id 并去重排序', () => {
    const items = [
      createReviewItem('theory:t1-outs-q2', 'theory.quiz.t1-outs-q2.question', 'theory', {
        source: 'theory',
        front: 'theory.quiz.t1-outs-q2.question',
        back: 'theory.quiz.t1-outs-q2.explanation',
      }),
      createReviewItem('theory:t1-combinatorics-q1', 'theory.quiz.t1-combinatorics-q1.question', 'theory'),
    ];
    expect(collectTheoryQuestionIds(items)).toEqual([
      't1-combinatorics-q1',
      't1-outs-q2',
    ]);
  });

  it('quiz UI 文案 key 与无 theory 载荷的复习项不会误判为题目', () => {
    const uiOnly = createReviewItem('x', 'theory.quiz.correct', 'theory', {
      source: 'theory',
      front: 'theory.quiz.next',
    });
    expect(collectTheoryQuestionIds([uiOnly])).toEqual([]);
  });
});
