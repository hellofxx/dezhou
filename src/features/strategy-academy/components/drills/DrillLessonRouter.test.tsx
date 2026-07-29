// DrillLessonRouter 组件冒烟测试（jsdom）：验证 tsx 测试路由可用
// 仅覆盖同步分支：未知 drillComponent 的兜底提示与懒加载 Suspense fallback

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DrillLessonRouter } from './DrillLessonRouter';
import type { Lesson } from '../../types';

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'test-drill-lesson',
    level: 1,
    order: 1,
    title: '测试 Drill 课程',
    subtitle: '冒烟测试用',
    duration: '5 min',
    content: [],
    quiz: [],
    type: 'drill',
    ...overrides,
  };
}

describe('DrillLessonRouter 冒烟测试', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('未知 drillComponent 时渲染兜底提示', () => {
    act(() => {
      root.render(
        <DrillLessonRouter lesson={makeLesson()} onComplete={() => {}} onExit={() => {}} />,
      );
    });

    expect(container.textContent).toContain('未知 Drill 组件');
    expect(container.textContent).toContain('(undefined)');
  });

  it('已知 drillComponent 时先渲染 Suspense fallback', () => {
    act(() => {
      root.render(
        <DrillLessonRouter
          lesson={makeLesson({ drillComponent: 'HandRankingDrill' })}
          onComplete={() => {}}
          onExit={() => {}}
        />,
      );
    });

    // 懒加载组件尚未 resolve，首帧应为加载占位
    expect(container.textContent).toContain('加载训练内容');
  });
});
