import { describe, it, expect } from 'vitest';
import { buildCertificationExam, CERTIFICATION_MAX_QUESTIONS } from './certificationExam';
import type { Lesson, QuizQuestion } from '../types';

function makeLesson(id: string, quizCount: number): Lesson {
  const quiz: QuizQuestion[] = Array.from({ length: quizCount }, (_, i) => ({
    id: `${id}-q${i}`,
    question: `Question ${i} for ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctIndex: i % 4,
    explanation: 'test',
  }));
  return {
    id,
    level: 1,
    order: 1,
    title: id,
    subtitle: '',
    duration: '',
    content: [],
    quiz,
  };
}

describe('P1E-09: buildCertificationExam — 种子化认证考试构建', () => {
  const lessons = [makeLesson('a', 10), makeLesson('b', 15)]; // 共 25 题

  it('输出最多 20 题', () => {
    const exam = buildCertificationExam(lessons, 42);
    expect(exam.length).toBeLessThanOrEqual(CERTIFICATION_MAX_QUESTIONS);
    expect(exam.length).toBe(20);
  });

  it('同一 seed 输出完全一致', () => {
    const exam1 = buildCertificationExam(lessons, 12345);
    const exam2 = buildCertificationExam(lessons, 12345);
    expect(exam1.map((q) => q.id)).toEqual(exam2.map((q) => q.id));
    expect(exam1.map((q) => q.correctIndex)).toEqual(exam2.map((q) => q.correctIndex));
  });

  it('不同 seed 输出不同题序', () => {
    const exam1 = buildCertificationExam(lessons, 12345);
    const exam2 = buildCertificationExam(lessons, 99999);
    // 高概率不同（25! 排列，碰撞概率极小）
    const ids1 = exam1.map((q) => q.id).join(',');
    const ids2 = exam2.map((q) => q.id).join(',');
    expect(ids1).not.toBe(ids2);
  });

  it('correctIndex 经过重映射（选项重排）', () => {
    const exam = buildCertificationExam(lessons, 42);
    for (const q of exam) {
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(q.options.length);
    }
  });

  it('题池不足 20 题时返回全部', () => {
    const smallLessons = [makeLesson('s', 5)];
    const exam = buildCertificationExam(smallLessons, 42);
    expect(exam.length).toBe(5);
  });

  it('空课程列表返回空', () => {
    expect(buildCertificationExam([], 0)).toEqual([]);
  });
});
