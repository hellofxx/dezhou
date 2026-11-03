import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import ProgressReplay from './ProgressReplay';
import { registerAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import type { AcademyDataSource, AcademyLessonMeta } from '@/shared/types/academyDataSource';

/**
 * ProgressReplay 进步回放（jsdom）。
 *
 * 契约（依赖倒置后）：首/末次答题分数经 academyDataSourceRegistry 提供，
 * 按「绝对变化幅度」降序取前 5 门；课程标题走 academy.lessonTitle.<id>，
 * 数据源缺元数据时回退 lessonId；无数据展示空态。
 */

const META: Record<string, AcademyLessonMeta> = {
  'fake-lesson-a': { id: 'fake-lesson-a', title: '课程 A', level: 1 },
  'fake-lesson-b': { id: 'fake-lesson-b', title: '课程 B', level: 2 },
};

const EMPTY_SCORES: Record<string, number> = {};
const EMPTY_PROGRESS = { completedLessons: [] as const };

function installSource(first: Record<string, number>, last: Record<string, number>) {
  const source: AcademyDataSource = {
    findNextLesson: () => null,
    getLessonMeta: (lessonId) => META[lessonId],
    getAcademyProgressSnapshot: () => EMPTY_PROGRESS,
    getFirstAttemptScoresSnapshot: () => first,
    getLastAttemptScoresSnapshot: () => last,
    subscribe: () => () => {},
  };
  registerAcademyDataSource(source);
}

afterEach(cleanup);

describe('ProgressReplay 进步回放', () => {
  it('无课程分数数据时展示空态', () => {
    installSource(EMPTY_SCORES, EMPTY_SCORES);

    const { container } = render(<ProgressReplay />);

    expect(container.textContent).toContain('回放你的进步');
    expect(container.textContent).toContain('完成更多课程后将显示你的进步轨迹');
  });

  it('按绝对变化幅度降序展示课程首末得分与变化值', () => {
    installSource(
      { 'fake-lesson-a': 40, 'fake-lesson-b': 80 },
      { 'fake-lesson-a': 70, 'fake-lesson-b': 60 },
    );

    const { container } = render(<ProgressReplay />);
    const text = container.textContent ?? '';

    // 课程 A +30（|30|）、课程 B -20（|20|）→ A 在前
    expect(text).toContain('课程 A');
    expect(text).toContain('课程 B');
    expect(text).toContain('+30');
    expect(text).toContain('-20');
    const idxA = text.indexOf('课程 A');
    const idxB = text.indexOf('课程 B');
    expect(idxA).toBeLessThan(idxB);
  });

  it('最多展示前 5 门课程', () => {
    const first: Record<string, number> = {};
    const last: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      first[`fake-lesson-${i}`] = 50;
      last[`fake-lesson-${i}`] = 50 + i * 5;
    }
    installSource(first, last);

    const { container } = render(<ProgressReplay />);

    // 未在元数据中的课程回退展示 lessonId
    expect(container.textContent).toContain('fake-lesson-6');
    expect(container.textContent).not.toContain('fake-lesson-0');
    expect(container.textContent).not.toContain('fake-lesson-1');
  });

  it('缺少首次分数的课程不参与回放（不虚构进步幅度）', () => {
    installSource({ 'fake-lesson-a': 40 }, { 'fake-lesson-a': 70, 'fake-lesson-b': 60 });

    const { container } = render(<ProgressReplay />);
    const text = container.textContent ?? '';

    expect(text).toContain('课程 A');
    expect(text).not.toContain('课程 B');
  });

  it('首末分数相同时变化值为 0（稳定）', () => {
    installSource({ 'fake-lesson-a': 60 }, { 'fake-lesson-a': 60 });

    const { container } = render(<ProgressReplay />);

    expect(container.textContent).toContain('0');
    expect(container.textContent).toContain('课程 A');
  });
});
