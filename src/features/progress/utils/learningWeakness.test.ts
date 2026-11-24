import { describe, expect, it } from 'vitest';
import type { TrainingRecord } from '../types';
import type { QuestionResult } from '@/shared/types/common';
import { getLearningWeakness } from './learningWeakness';

const NOW = Date.UTC(2026, 10, 24, 12);

function detail(topic?: string, relatedLessonId?: string, isCorrect = false): QuestionResult {
  return {
    question: `${topic ?? 'legacy'}-q`,
    isCorrect,
    timeTaken: 1000,
    userAnswer: 'a',
    correctAnswer: 'b',
    ...(topic ? { topic } : {}),
    ...(relatedLessonId ? { relatedLessonId } : {}),
  };
}

function record(id: string, details: QuestionResult[], createdAt = NOW - 1000): TrainingRecord {
  return {
    id,
    module: 'puzzle-trainer',
    mode: 'daily',
    createdAt,
    result: {
      sessionId: id,
      module: 'puzzle-trainer',
      totalQuestions: details.length,
      correctAnswers: details.filter((item) => item?.isCorrect).length,
      accuracy: details.length > 0 ? details.filter((item) => item?.isCorrect).length / details.length : 0,
      averageTime: 1000,
      timestamp: createdAt,
      details,
    },
  };
}

describe('getLearningWeakness', () => {
  it('近 30 天同主题样本聚合后返回关联课程', () => {
    const result = getLearningWeakness([
      record('a', [detail('flush-draw', 'l3-draws'), detail('flush-draw', 'l3-draws', true)]),
      record('b', [detail('flush-draw', 'l3-draws')], NOW - 2000),
    ], NOW);

    expect(result.topics).toEqual([{
      topic: 'flush-draw',
      relatedLessonIds: ['l3-draws'],
      total: 3,
      correct: 1,
      accuracy: 1 / 3,
      lastPlayedAt: NOW - 1000,
    }]);
    expect(result.lessonIds).toEqual(['l3-draws']);
  });

  it('少于 3 次或正确率达到 70% 不列为弱项', () => {
    const result = getLearningWeakness([
      record('small', [detail('bluff', 'l3-bluffing'), detail('bluff', 'l3-bluffing')]),
      record('boundary', [
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet', true),
        detail('c-bet', 'l3-cbet'),
      ]),
    ], NOW);

    expect(result).toEqual({ topics: [], lessonIds: [] });
  });

  it('忽略 30 天前的记录与无主题元数据的旧记录', () => {
    const result = getLearningWeakness([
      record('old', [detail('icm', 'l6-icm')], NOW - 31 * 24 * 60 * 60 * 1000),
      record('legacy', [detail(undefined, 'l3-draws'), detail(undefined, 'l3-draws'), detail(undefined, 'l3-draws')]),
    ], NOW);

    expect(result).toEqual({ topics: [], lessonIds: [] });
  });

  it('按正确率、样本量、最近时间排序并只保留前 3 个弱项', () => {
    const result = getLearningWeakness([
      record('a', [detail('a', 'la'), detail('a', 'la'), detail('a', 'la', true)]),
      record('b', [detail('b', 'lb'), detail('b', 'lb'), detail('b', 'lb')]),
      record('c', [detail('c', 'lc'), detail('c', 'lc')]),
      record('d', [detail('d', 'ld'), detail('d', 'ld'), detail('d', 'ld'), detail('d', 'ld')], NOW - 3000),
    ], NOW);

    expect(result.topics.map((topic) => topic.topic)).toEqual(['d', 'b', 'a']);
    expect(result.lessonIds).toEqual(['ld', 'lb', 'la']);
  });

  it('正确率与样本量相同时按最近训练时间排序', () => {
    const result = getLearningWeakness([
      record('old', [detail('old', 'lo'), detail('old', 'lo'), detail('old', 'lo')], NOW - 5000),
      record('new', [detail('new', 'ln'), detail('new', 'ln'), detail('new', 'ln')], NOW - 1000),
    ], NOW);

    expect(result.topics.map((topic) => topic.topic)).toEqual(['new', 'old']);
  });

  it('同一弱项对应多个课程时去重输出', () => {
    const result = getLearningWeakness([
      record('a', [detail('multiway', 'l3-multistreet'), detail('multiway', 'l3-bet-sizing')]),
      record('b', [detail('multiway', 'l3-multistreet')]),
    ], NOW);

    expect(result.lessonIds).toEqual(['l3-multistreet', 'l3-bet-sizing']);
  });

  it('导入的损坏单题元数据被忽略，不抛出异常', () => {
    const malformed = [
      null,
      { ...detail('valid', 'l3-draws'), topic: 123, relatedLessonId: false },
    ] as unknown as QuestionResult[];
    const result = getLearningWeakness([
      record('broken', malformed),
      record('valid', [detail('valid', 'l3-draws'), detail('valid', 'l3-draws'), detail('valid', 'l3-draws')]),
    ], NOW);

    expect(result.topics.map((topic) => topic.topic)).toEqual(['valid']);
    expect(result.lessonIds).toEqual(['l3-draws']);
  });

  it('空记录返回空快照', () => {
    expect(getLearningWeakness([], NOW)).toEqual({ topics: [], lessonIds: [] });
  });
});
