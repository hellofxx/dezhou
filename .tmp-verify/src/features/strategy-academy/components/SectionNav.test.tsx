import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SectionNav } from './SectionNav';
import type { LessonUnit } from '../types';

function makeUnit(id: string, title: string, overrides: Partial<LessonUnit> = {}): LessonUnit {
  return { id, title, sections: [], ...overrides };
}

describe('SectionNav 组件', () => {
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

  it('渲染正确数量的胶囊', () => {
    const units = [makeUnit('u1', '第一节'), makeUnit('u2', '第二节'), makeUnit('u3', '第三节')];

    act(() => {
      root.render(
        <SectionNav units={units} activeId="u1" completedIds={[]} onNavigate={() => {}} />,
      );
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]!.textContent).toContain('1.');
    expect(buttons[1]!.textContent).toContain('2.');
    expect(buttons[2]!.textContent).toContain('3.');
  });

  it('active 高亮应用 brass-bright 类', () => {
    const units = [makeUnit('u1', '第一节'), makeUnit('u2', '第二节')];

    act(() => {
      root.render(
        <SectionNav units={units} activeId="u1" completedIds={[]} onNavigate={() => {}} />,
      );
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]!.className).toContain('bg-[var(--brass-bright)]');
    expect(buttons[1]!.className).not.toContain('bg-[var(--brass-bright)]');
  });

  it('completed 显示 ✓ 标记', () => {
    const units = [makeUnit('u1', '第一节'), makeUnit('u2', '第二节')];

    act(() => {
      root.render(
        <SectionNav units={units} activeId="u2" completedIds={['u1']} onNavigate={() => {}} />,
      );
    });

    const buttons = container.querySelectorAll('button');
    expect(buttons[0]!.textContent).toContain('✓');
    expect(buttons[0]!.className).toContain('text-[var(--poker-success)]');
    expect(buttons[1]!.textContent).not.toContain('✓');
  });

  it('点击回调触发 onNavigate', () => {
    const onNavigate = vi.fn();
    const units = [makeUnit('u1', '第一节'), makeUnit('u2', '第二节')];

    act(() => {
      root.render(
        <SectionNav units={units} activeId="u1" completedIds={[]} onNavigate={onNavigate} />,
      );
    });

    const buttons = container.querySelectorAll('button');
    act(() => {
      buttons[1]!.click();
    });

    expect(onNavigate).toHaveBeenCalledWith('u2');
  });
});