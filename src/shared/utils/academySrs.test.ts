import { describe, expect, it } from 'vitest';
import { academyReviewItemId, buildQuestionReviewItems } from './academySrs';

const questions = [{ id: 'q1' }, { id: 'q2' }];
const keyForQuestion = (id: string) => `quiz.${id}.question`;
const keyForExplanation = (id: string) => `quiz.${id}.explanation`;

describe('buildQuestionReviewItems', () => {
  it('为已知错题构造题级复习项，存 i18n key 与回链', () => {
    const items = buildQuestionReviewItems({
      source: 'theory',
      category: 'theory',
      route: '/theory/chapter/t1',
      questions,
      wrongQuestionIds: ['q1'],
      idPrefix: 'theory:',
      keyForQuestion,
      keyForExplanation,
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'theory:q1',
      label: 'quiz.q1.question',
      category: 'theory',
      metadata: {
        source: 'theory',
        route: '/theory/chapter/t1',
        front: 'quiz.q1.question',
        back: 'quiz.q1.explanation',
      },
    });
  });

  it('未知题与重复错题跳过', () => {
    const items = buildQuestionReviewItems({
      source: 'strategy',
      category: 'strategy',
      route: '/academy/lesson/l1',
      questions,
      wrongQuestionIds: ['q1', 'q1', 'missing'],
      idPrefix: 'strategy:',
      keyForQuestion,
      keyForExplanation,
    });

    expect(items.map((item) => item.id)).toEqual(['strategy:q1']);
  });

  it('空错题返回空数组', () => {
    const items = buildQuestionReviewItems({
      source: 'strategy',
      category: 'strategy',
      route: '/academy/lesson/l1',
      questions,
      wrongQuestionIds: [],
      idPrefix: 'strategy:',
      keyForQuestion,
      keyForExplanation,
    });
    expect(items).toEqual([]);
  });

  it('id 前缀隔离', () => {
    expect(academyReviewItemId('strategy:', 'q1')).toBe('strategy:q1');
    expect(academyReviewItemId('theory:', 'q1')).toBe('theory:q1');
  });
});
