import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { LessonIntroCard } from './LessonIntroCard';
import type { LessonUnit } from '../types';

/**
 * LessonIntroCard（先行组织者卡）学习目标渲染测试。
 *
 * 组件测试环境的 setupTests.components.ts 只预加载 ALL_MODULES（含 academy.json），
 * 不含 academy-course/ 子包，因此 `academy.lessonObjectives.*` 必然 miss，
 * 渲染回落到 resolveLessonObjectives 的 defaultValue（数据层中文原文）——
 * 正好用于断言「有 objectives 时按序渲染出条目」。
 * 标签 `academy.lessonUnit.objectivesTitle` 来自 core 的 academy.json，命中中文译文。
 */

const units: LessonUnit[] = [
  { id: 'u1', title: '小节一', sections: [] },
  { id: 'u2', title: '小节二', sections: [] },
];

const OBJECTIVES = [
  '用 MDF = pot ÷ (pot + bet) 计算任意下注尺度下你必须继续的最低频率',
  '区分 MDF、Alpha 与跟注所需胜率三个公式的分母与各自用途',
];

describe('LessonIntroCard 学习目标区块', () => {
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

  function render(objectives?: string[]) {
    act(() => {
      root.render(
        <LessonIntroCard
          lessonId="l4-mdf"
          units={units}
          duration="8 min"
          objectives={objectives}
        />,
      );
    });
  }

  it('有 objectives 时渲染标签与逐条目标', () => {
    render(OBJECTIVES);

    const block = container.querySelector('[data-testid="lesson-objectives"]');
    expect(block).not.toBeNull();
    expect(block?.textContent).toContain('本节学习目标');

    const items = block?.querySelectorAll('li');
    expect(items?.length).toBe(2);
    expect(items?.[0]?.textContent).toContain(OBJECTIVES[0]);
    expect(items?.[1]?.textContent).toContain(OBJECTIVES[1]);
  });

  it('objectives 缺省时整块不渲染（不留空列表与空标题）', () => {
    render(undefined);

    expect(container.querySelector('[data-testid="lesson-objectives"]')).toBeNull();
    expect(container.textContent).not.toContain('本节学习目标');
    expect(container.querySelectorAll('li').length).toBe(0);
  });

  it('objectives 为空数组时同样不渲染容器', () => {
    render([]);

    expect(container.querySelector('[data-testid="lesson-objectives"]')).toBeNull();
    expect(container.textContent).not.toContain('本节学习目标');
  });

  it('不传 objectives 时既有的时长与小节数仍正常渲染', () => {
    render(OBJECTIVES);

    expect(container.textContent).toContain('预计时长 8 min');
    expect(container.textContent).toContain('共 2 个小节');
    expect(container.querySelectorAll('li').length).toBe(2);
  });
});
