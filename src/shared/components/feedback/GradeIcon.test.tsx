/**
 * GradeIcon 契约（五级反馈图标唯一出口）：
 * - 图标与文字色只认 GRADE_DISPLAY_CONFIG，不复制图标名或色值
 * - 图标退出可访问性树（等级文案由相邻元素承担）
 * - 尺寸 / 描边 / className 透传稳定
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { GradeIcon } from './GradeIcon';
import {
  GRADE_DISPLAY_CONFIG,
  type DecisionGrade,
} from '@/shared/types/decisionFeedback';

const GRADES = Object.keys(GRADE_DISPLAY_CONFIG) as DecisionGrade[];

describe('GradeIcon', () => {
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

  const render = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  const svg = () => container.querySelector('svg');

  it('五级 grade 均从配置派生图标类与文字色（禁止旁路硬编码）', () => {
    expect(GRADES).toHaveLength(5);
    for (const grade of GRADES) {
      render(<GradeIcon grade={grade} />);
      const element = svg();
      expect(element, `grade=${grade} 未渲染 svg`).not.toBeNull();
      const className = element!.getAttribute('class') ?? '';
      const config = GRADE_DISPLAY_CONFIG[grade];
      expect(className).toContain(`lucide-${config.iconId}`);
      expect(className).toContain(config.textColor);
    }
  });

  it('图标退出可访问性树：aria-hidden 且无 role / aria-label', () => {
    render(<GradeIcon grade="blunder" />);
    const element = svg();
    expect(element!.getAttribute('aria-hidden')).toBe('true');
    expect(element!.getAttribute('role')).toBeNull();
    expect(element!.getAttribute('aria-label')).toBeNull();
  });

  it('默认 20px、可覆盖尺寸，描边固定 1.75', () => {
    render(<GradeIcon grade="best" />);
    expect(svg()!.getAttribute('width')).toBe('20');
    expect(svg()!.getAttribute('height')).toBe('20');
    expect(svg()!.getAttribute('stroke-width')).toBe('1.75');

    render(<GradeIcon grade="best" size={32} />);
    expect(svg()!.getAttribute('width')).toBe('32');
    expect(svg()!.getAttribute('height')).toBe('32');
  });

  it('className 透传并保留 shrink-0', () => {
    render(<GradeIcon grade="correct" className="probe-class" />);
    const className = svg()!.getAttribute('class') ?? '';
    expect(className).toContain('shrink-0');
    expect(className).toContain('probe-class');
  });
});