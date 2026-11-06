import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StatPair } from './StatPair';

/**
 * StatPair 契约：
 * - 渲染 <dl>，每项 <div><dt>label</dt><dd>value</dd></div>（两院首屏 hero 指标列）
 * - 容器类名由消费方传入（academy-hero-stats / theory-hero-stats）
 * - 数值用 font-numeric，标签用 10px ivory-muted
 */

const tokens = (el: Element | null): string[] => (el?.className ?? '').split(/\s+/).filter(Boolean);

afterEach(() => cleanup());

describe('StatPair', () => {
  it('渲染 dl + 逐项 dt/dd 结构', () => {
    render(
      <StatPair
        className="academy-hero-stats"
        items={[
          { value: 2, label: '已完成 2 级' },
          { value: '10/36', label: '36 课时' },
          { value: 3, label: '3 级认证' },
        ]}
      />,
    );

    const list = screen.getByText('已完成 2 级').closest('dl');
    expect(list).not.toBeNull();
    expect(tokens(list)).toContain('academy-hero-stats');
    expect(list?.querySelectorAll('dt')).toHaveLength(3);
    expect(list?.querySelectorAll('dd')).toHaveLength(3);

    // 每项 td/dd 成对且顺序一致
    const rows = [...(list?.children ?? [])];
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.firstElementChild?.tagName)).toEqual(['DT', 'DT', 'DT']);
    expect(rows.map((row) => row.children[1]?.tagName)).toEqual(['DD', 'DD', 'DD']);
    expect(rows.map((row) => row.querySelector('dd')?.textContent)).toEqual(['2', '10/36', '3']);
  });

  it('数值与标签的排版 token 固定', () => {
    render(<StatPair items={[{ value: 88, label: '平均分' }]} />);

    const label = screen.getByText('平均分');
    const value = screen.getByText('88');
    expect(label.tagName).toBe('DT');
    expect(value.tagName).toBe('DD');

    expect(tokens(label)).toContain('text-[10px]');
    expect(tokens(label)).toContain('text-[var(--ivory-muted)]');
    expect(tokens(value)).toContain('font-numeric');
    expect(tokens(value)).toContain('text-sm');
    expect(tokens(value)).toContain('text-[var(--brass-bright)]');
  });

  it('支持 ReactNode 数值与自定义容器类名', () => {
    render(
      <StatPair
        className="theory-hero-stats"
        items={[{ value: <strong data-probe>100%</strong>, label: '完成度' }]}
      />,
    );

    const list = screen.getByText('完成度').closest('dl');
    expect(tokens(list)).toContain('theory-hero-stats');
    expect(document.querySelector('[data-probe]')?.textContent).toBe('100%');
  });
});
