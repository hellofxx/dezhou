import { describe, expect, it } from 'vitest';
import { aggregateStats, aggregateByModule, getRecentRecords } from './statsAggregator';
import type { TrainingRecord } from '../types';

const makeRecord = (overrides: Partial<TrainingRecord>): TrainingRecord => ({
  id: 'r1',
  module: 'range-trainer',
  mode: 'quiz',
  result: {
    sessionId: 's1',
    module: 'range-trainer',
    totalQuestions: 10,
    correctAnswers: 7,
    accuracy: 0.7,
    averageTime: 5,
    timestamp: Date.now(),
    details: [],
  },
  createdAt: Date.now(),
  ...overrides,
});

describe('aggregateStats', () => {
  it('空记录返回零值汇总', () => {
    const stats = aggregateStats([]);
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalQuestions).toBe(0);
    expect(stats.overallAccuracy).toBe(0);
    expect(stats.lastTrainingDate).toBeNull();
  });

  it('正确聚合多条记录', () => {
    const records = [
      makeRecord({ result: { sessionId: 's1', module: 'range-trainer', totalQuestions: 10, correctAnswers: 8, accuracy: 0.8, averageTime: 4, timestamp: 1000, details: [] }, createdAt: 1000 }),
      makeRecord({ result: { sessionId: 's2', module: 'pot-odds', totalQuestions: 20, correctAnswers: 10, accuracy: 0.5, averageTime: 6, timestamp: 2000, details: [] }, createdAt: 2000 }),
    ];
    const stats = aggregateStats(records);
    expect(stats.totalSessions).toBe(2);
    expect(stats.totalQuestions).toBe(30);
    // 加权正确率: (8+10)/30 = 0.6
    expect(stats.overallAccuracy).toBeCloseTo(0.6, 5);
    // 加权平均时间: (4*10 + 6*20)/30 = 160/30 ≈ 5.333
    expect(stats.averageTime).toBeCloseTo(5.333, 2);
    expect(stats.lastTrainingDate).toBe(2000);
  });
});

describe('aggregateByModule', () => {
  it('按模块分组统计', () => {
    const records = [
      makeRecord({ module: 'range-trainer', createdAt: 1000 }),
      makeRecord({ module: 'pot-odds', createdAt: 2000 }),
      makeRecord({ module: 'range-trainer', createdAt: 3000 }),
    ];
    const modules = aggregateByModule(records);
    expect(modules).toHaveLength(2);
    const range = modules.find((m) => m.module === 'range-trainer')!;
    expect(range.sessions).toBe(2);
    expect(range.lastPlayed).toBe(3000);
  });

  it('空记录返回空数组', () => {
    expect(aggregateByModule([])).toEqual([]);
  });
});

describe('getRecentRecords', () => {
  it('按时间倒序返回最近 N 条', () => {
    const records = [
      makeRecord({ id: 'a', createdAt: 100 }),
      makeRecord({ id: 'b', createdAt: 300 }),
      makeRecord({ id: 'c', createdAt: 200 }),
    ];
    const recent = getRecentRecords(records, 2);
    expect(recent).toHaveLength(2);
    expect(recent[0]!.id).toBe('b');
    expect(recent[1]!.id).toBe('c');
  });
});
