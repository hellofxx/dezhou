/**
 * GradeBadge 组件冒烟测试（jsdom）：
 * 验证 5 个评级等级渲染对应的 .grade-* CSS 类与 emoji 图标。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GradeBadge } from './GradeBadge';
import { GRADE_DISPLAY_CONFIG } from '@/shared/types/decisionFeedback';
import type { DecisionGrade } from '@/shared/types/decisionFeedback';

describe('GradeBadge 冒烟测试', () => {
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

  const grades: DecisionGrade[] = ['best', 'correct', 'inaccuracy', 'wrong', 'blunder'];

  it('渲染 5 个评级等级并应用对应 .grade-* CSS 类', () => {
    for (const grade of grades) {
      act(() => {
        root.render(<GradeBadge grade={grade} />);
      });
      const badge = container.querySelector(`.grade-${grade}`);
      expect(badge, `grade-${grade} class 应存在`).not.toBeNull();
      // emoji 图标渲染
      expect(container.textContent).toContain(GRADE_DISPLAY_CONFIG[grade].icon);
    }
  });

  it('默认尺寸为 md（text-sm 文字）', () => {
    act(() => {
      root.render(<GradeBadge grade="best" />);
    });
    const badge = container.querySelector('.grade-best');
    expect(badge).not.toBeNull();
    const label = badge?.querySelector('span.text-sm');
    expect(label, 'md 尺寸应使用 text-sm').not.toBeNull();
  });

  it('size=lg 应用 text-lg 文字尺寸', () => {
    act(() => {
      root.render(<GradeBadge grade="correct" size="lg" />);
    });
    const badge = container.querySelector('.grade-correct');
    const label = badge?.querySelector('span.text-lg');
    expect(label, 'lg 尺寸应使用 text-lg').not.toBeNull();
  });
});
