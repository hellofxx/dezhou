import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LessonContent } from './LessonContent';
import { useAcademyStore } from '../store';
import type { Lesson, LessonUnit } from '../types';

/**
 * 小节化课程渲染契约：
 * - 纯理论课：小节导航 + 内容 + 「完成学习」直接回调 onComplete
 * - 含实战课：顺序推进 CTA → 最后一节进入实战视图（PracticeDrill）
 * - 小节完成写入 store（markUnitCompleted 幂等），回访定位到最后完成小节
 * - initialView='practice' 直接进入实战（CourseView restart('practice') 复用）
 */

// jsdom 未实现 scrollIntoView；小节推进时组件会滚动到下一节锚点
const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  }
});

const units: LessonUnit[] = [
  { id: 'u1', title: '第一节', sections: [{ type: 'text', content: '第一节正文' }] },
  { id: 'u2', title: '第二节', sections: [{ type: 'text', content: '第二节正文' }] },
];

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'fixture-lesson',
    level: 1,
    order: 1,
    title: '测试课程',
    subtitle: '',
    duration: '5 min',
    content: [],
    quiz: [],
    units,
    ...overrides,
  };
}

const practice = {
  id: 'fixture-practice',
  questions: [
    {
      id: 'pq1',
      scenario: {
        heroHand: ['As', 'Ks'] as [string, string],
        heroPosition: 'BTN',
        previousActions: [],
        street: 'preflop' as const,
        potSize: 5,
        effectiveStack: 100,
      },
      options: [{ action: 'Call', isCorrect: true, explanation: '跟注。' }],
    },
  ],
};

function renderContent(lesson: Lesson, props: Partial<Parameters<typeof LessonContent>[0]> = {}) {
  return render(
    <MemoryRouter>
      <LessonContent lesson={lesson} onComplete={() => {}} {...props} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

describe('LessonContent：纯理论课', () => {
  it('渲染小节内容与理论态提示，点击完成学习回调 onComplete', () => {
    const onComplete = vi.fn();
    renderContent(makeLesson(), { onComplete });

    expect(screen.getByText('课程路线图')).toBeTruthy();
    expect(screen.getByText('第一节正文')).toBeTruthy();
    expect(screen.getByText('第二节正文')).toBeTruthy();
    expect(
      screen.getByText('本课仅有理论内容，阅读完成后点击「完成学习」'),
    ).toBeTruthy();

    fireEvent.click(screen.getByText('完成学习'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe('LessonContent：小节推进与实战', () => {
  it('推进小节写入 completedUnits，最后一节进入实战并回调完成', () => {
    const onComplete = vi.fn();
    const onPracticeComplete = vi.fn();
    const lesson = makeLesson({ practice });
    renderContent(lesson, { onComplete, onPracticeComplete });

    // 第一节：CTA 文案指向下一节
    expect(screen.getByText('进入下一节：第二节')).toBeTruthy();
    fireEvent.click(screen.getByText('进入下一节：第二节'));
    expect(useAcademyStore.getState().progress.completedUnits[lesson.id]).toEqual(['u1']);

    fireEvent.click(screen.getByText('进入实战练习'));
    expect(useAcademyStore.getState().progress.completedUnits[lesson.id]).toEqual(['u1', 'u2']);
    expect(screen.getByText('返回小节')).toBeTruthy();
    expect(screen.getByText('1 / 1')).toBeTruthy();

    fireEvent.click(screen.getByText('Call'));
    fireEvent.click(screen.getByText('查看成绩'));
    expect(onPracticeComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('返回小节按钮回到小节视图', () => {
    const lesson = makeLesson({ practice });
    renderContent(lesson, { initialView: 'practice' });

    expect(screen.getByText('1 / 1')).toBeTruthy();
    fireEvent.click(screen.getByText('返回小节'));
    expect(screen.getByText('课程路线图')).toBeTruthy();
  });

  it('回访定位到最后已完成小节（最后一个 unit 直接展示实战入口）', () => {
    useAcademyStore.getState().markUnitCompleted('fixture-lesson', 'u2');
    renderContent(makeLesson({ practice }));

    expect(screen.getByText('进入实战练习')).toBeTruthy();
    expect(screen.queryByText('进入下一节：第二节')).toBeNull();
  });
});
