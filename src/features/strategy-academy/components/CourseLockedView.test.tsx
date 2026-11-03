import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { CourseLockedView } from './CourseLockedView';
import type { Lesson } from '../types';

/**
 * 课程锁定视图契约：
 * - Level 门禁：列出前置 Level 条目完成进度 + 首个未完成课程的「去完成」跳转
 * - 前置全部完成时显示「已完成」而非跳转按钮
 * - 无显式前置时回退到前一个 Level 的标题与首门未完成课程
 * - 课程级 prerequisite 缺失单独列出，点击直达对应课程
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'l2-raise-sizing',
    level: 2,
    order: 1,
    title: '加注大小',
    subtitle: '',
    duration: '6 min',
    content: [],
    quiz: [],
    ...overrides,
  };
}

function renderView(props: Partial<Parameters<typeof CourseLockedView>[0]> = {}) {
  return render(
    <MemoryRouter>
      <CourseLockedView
        lesson={makeLesson()}
        levelLocked
        prereqLevelIds={['l1']}
        missingPrereqLessonIds={[]}
        completedLessons={[]}
        {...props}
      />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => cleanup());

describe('CourseLockedView：Level 门禁', () => {
  it('列出前置 Level 进度，点击去完成直达首个未完成课程', () => {
    const { container } = renderView();
    expect(screen.getByText('该课程尚未解锁')).toBeTruthy();
    expect(screen.getByText('请先完成以下前置课程，再来学习本课程。')).toBeTruthy();
    expect(screen.getByText('基础入门')).toBeTruthy();
    expect(container.textContent).toContain('已完成 0/9 课时');
    expect(screen.getByText('去完成')).toBeTruthy();

    fireEvent.click(screen.getByText('去完成'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-basics');
  });

  it('部分完成时进度与首个未完成课程同步', () => {
    const { container } = renderView({ completedLessons: ['l1-basics'] });
    expect(container.textContent).toContain('已完成 1/9 课时');
    fireEvent.click(screen.getByText('去完成'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-position');
  });

  it('前置 Level 全部完成时展示已完成状态，无跳转按钮', () => {
    const { container } = renderView({
      completedLessons: [
        'l1-basics',
        'l1-position',
        'l1-hand-selection',
        'l1-bankroll',
        'l1-leaks',
        'drill-hand-ranking',
        'drill-position',
        'drill-outs',
        'drill-pot-odds',
      ],
    });
    expect(container.textContent).toContain('已完成 9/9 课时');
    expect(screen.getAllByText('已完成').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText('去完成')).toBeNull();
  });

  it('无显式前置时回退到前一个 Level 标题与首门未完成课程', () => {
    const lesson = makeLesson({ id: 'l4-range-thinking', level: 4 });
    const { container } = renderView({
      lesson,
      prereqLevelIds: [],
    });
    expect(container.textContent).toContain('请先完成该 Level 的所有课程');
    expect(container.textContent).toContain('翻后策略');
    fireEvent.click(screen.getByText('去完成'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l3-cbet');
  });
});

describe('CourseLockedView：课程级前置与返回', () => {
  it('课程级前置缺失单独列出，点击直达课程', () => {
    const { container } = renderView({
      levelLocked: false,
      missingPrereqLessonIds: ['l1-basics', 'l1-position'],
      completedLessons: [],
    });
    expect(container.textContent).toContain('请先完成以下前置课程：');
    expect(container.textContent).toContain('l1-basics');
    expect(container.textContent).toContain('l1-position');

    fireEvent.click(screen.getByText('l1-position'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-position');
  });

  it('返回学院按钮跳转 /academy', () => {
    renderView();
    fireEvent.click(screen.getByText('返回学院'));
    expect(screen.getByTestId('location').textContent).toBe('/academy');
  });
});
