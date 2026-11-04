import { beforeAll, describe, expect, it } from 'vitest';
import {
  buildCertificationExam,
  CERTIFICATION_MAX_QUESTIONS,
  getCertificationDrawKey,
  getCertificationPoolSize,
  getCertificationQuestionCount,
} from './certificationExam';
import { loadAcademyLessonsForLevel } from '../data/lessons/loaders';
import type { Lesson, QuizQuestion } from '../types';

/**
 * 认证题池与抽题契约（T2）：
 * - 题池 = 该 Level 已应用题库后的全部题目（L4 合并 4A+4B，L7 含本土课）
 * - 抽题键 `cert-level-<n>` + 会话种子：同种子稳定，换种子换题
 * - 题量 = min(题池, 20)，不再走 store 旧公式
 */

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

describe('certificationExam：题池与题量口径', () => {
  const lessons = [makeLesson('a', 10), makeLesson('b', 15)]; // 题池 25

  it('抽题键固定为 cert-level-<n>', () => {
    expect(getCertificationDrawKey(4)).toBe('cert-level-4');
  });

  it('题池按传入课程的实际题目数统计（合并后的 L4/L7 口径）', () => {
    expect(getCertificationPoolSize(1, lessons)).toBe(25);
    expect(getCertificationPoolSize(1, [makeLesson('only', 7)])).toBe(7);
  });

  it('题量 = min(题池, 20)', () => {
    expect(getCertificationQuestionCount(1, lessons)).toBe(20);
    expect(getCertificationQuestionCount(1, [makeLesson('small', 5)])).toBe(5);
    expect(buildCertificationExam(lessons, 1, 42)).toHaveLength(20);
    expect(buildCertificationExam([makeLesson('small', 5)], 1, 42)).toHaveLength(5);
  });

  it('题池为空时不抽题', () => {
    expect(buildCertificationExam([], 1, 42)).toEqual([]);
    expect(getCertificationPoolSize(1, [makeLesson('empty', 0)])).toBe(0);
  });

  it('未传课程时回退目录层 quizCount 汇总（首页/卡片预览用）', () => {
    expect(getCertificationPoolSize(1)).toBeGreaterThan(0);
  });

  it('题量上限常量为 20', () => {
    expect(CERTIFICATION_MAX_QUESTIONS).toBe(20);
  });
});

describe('certificationExam：种子化抽题', () => {
  const lessons = [makeLesson('a', 10), makeLesson('b', 10), makeLesson('c', 10)];

  it('同一 level + 同一种子输出完全一致（考试过程中稳定）', () => {
    const first = buildCertificationExam(lessons, 1, 12345);
    const second = buildCertificationExam(lessons, 1, 12345);
    expect(first.map((q) => q.id)).toEqual(second.map((q) => q.id));
    expect(first.map((q) => q.options)).toEqual(second.map((q) => q.options));
    expect(first.map((q) => q.correctIndex)).toEqual(second.map((q) => q.correctIndex));
  });

  it('换种子重新抽题（重试/再次进入换题）', () => {
    const first = buildCertificationExam(lessons, 1, 12345);
    const second = buildCertificationExam(lessons, 1, 99999);
    expect(first.map((q) => q.id).join(',')).not.toBe(second.map((q) => q.id).join(','));
  });

  it('不同 level 的同一种子题序不同（键参与种子）', () => {
    const level1 = buildCertificationExam(lessons, 1, 2024);
    const level2 = buildCertificationExam(lessons, 2, 2024);
    expect(level1.map((q) => q.id).join(',')).not.toBe(level2.map((q) => q.id).join(','));
  });

  it('抽取结果全部来自题池且不重复', () => {
    const exam = buildCertificationExam(lessons, 1, 777);
    const poolIds = new Set(lessons.flatMap((lesson) => lesson.quiz.map((q) => q.id)));
    const examIds = exam.map((q) => q.id);
    expect(new Set(examIds).size).toBe(examIds.length);
    for (const id of examIds) expect(poolIds.has(id)).toBe(true);
  });
});

describe('certificationExam：选项重排与正确答案重映射', () => {
  it('数值选项集升序展示且 correctIndex 同步重映射', () => {
    const lesson: Lesson = {
      ...makeLesson('numeric', 0),
      quiz: [
        {
          id: 'numeric-q1',
          question: '需要的权益是多少？',
          options: ['30%', '10%', '20%'],
          correctIndex: 0,
          explanation: 'test',
        },
      ],
    };
    const [question] = buildCertificationExam([lesson], 1, 42);
    expect(question?.options).toEqual(['10%', '20%', '30%']);
    expect(question?.correctIndex).toBe(2);
  });

  it('文字选项集重排后 correctIndex 指向同一正确文本', () => {
    const lesson: Lesson = {
      ...makeLesson('text', 0),
      quiz: [
        {
          id: 'text-q1',
          question: '最佳行动？',
          options: ['弃牌', '跟注', '加注'],
          correctIndex: 1,
          explanation: 'test',
        },
      ],
    };
    const [question] = buildCertificationExam([lesson], 1, 42);
    expect(question?.correctIndex).toBeGreaterThanOrEqual(0);
    expect(question?.correctIndex).toBeLessThan(3);
    expect(question?.options[question!.correctIndex]).toBe('跟注');
  });
});

describe('certificationExam：真实 Level 题池合并', () => {
  let level4: Lesson[] = [];
  let level7: Lesson[] = [];

  beforeAll(async () => {
    level4 = await loadAcademyLessonsForLevel(4);
    level7 = await loadAcademyLessonsForLevel(7);
  });

  it('L4 题池合并 4A + 4B 两个条目', () => {
    // 4A 课程文件 → l4-range-* / l4-ev-*；4B 课程文件 → l4-gto-* / l4-mdf-*
    expect(level4.some((lesson) => lesson.id.startsWith('l4-range-'))).toBe(true);
    expect(level4.some((lesson) => lesson.id.startsWith('l4-gto-'))).toBe(true);
    const pool = getCertificationPoolSize(4, level4);
    expect(pool).toBeGreaterThan(0);
    expect(buildCertificationExam(level4, 4, 42)).toHaveLength(Math.min(pool, 20));
  });

  it('L7 题池含本土课题目', () => {
    expect(level7.some((lesson) => lesson.id.startsWith('local-'))).toBe(true);
    const pool = getCertificationPoolSize(7, level7);
    expect(pool).toBeGreaterThan(0);
    expect(buildCertificationExam(level7, 7, 42)).toHaveLength(Math.min(pool, 20));
  });
});
