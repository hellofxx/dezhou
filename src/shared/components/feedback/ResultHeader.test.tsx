/**
 * ResultHeader 契约（共享结果页标题区）：
 * - `headingLevel` 决定文档层级：默认 h1（整页结果），嵌入页传 h2
 * - `subtitle` 可选，缺省不渲染副标题行
 * - `tone` 只驱动前导图形：neutral 不渲染，success / warning / danger 各一枚装饰图形（aria-hidden）
 * - `ring` 槽存在时渲染居中容器，缺省不占位
 * - `className` 透传到根节点
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ResultHeader } from './ResultHeader';

afterEach(() => cleanup());

describe('ResultHeader 标题层级', () => {
  it('默认渲染 h1 标题', () => {
    render(<ResultHeader title="训练完成" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('训练完成');
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('headingLevel="h2" 时降为 h2（内嵌页结果）', () => {
    render(<ResultHeader title="训练完成" headingLevel="h2" />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toBe('训练完成');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('标题使用显示字体与正文色 token', () => {
    render(<ResultHeader title="训练完成" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.className).toContain('font-display');
    expect(heading.className).toContain('text-[var(--ivory)]');
  });
});

describe('ResultHeader 副标题与 ring 槽', () => {
  it('无 subtitle 时不渲染副标题行', () => {
    const { container } = render(<ResultHeader title="训练完成" />);

    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('subtitle 原样渲染在标题下方', () => {
    render(<ResultHeader title="训练完成" subtitle="命中率 88%" />);

    const subtitle = screen.getByText('命中率 88%');
    expect(subtitle.tagName).toBe('P');
    expect(subtitle.className).toContain('text-[var(--ivory-muted)]');
  });

  it('ring 槽渲染居中容器', () => {
    render(<ResultHeader title="训练完成" ring={<div data-testid="accuracy-ring">88%</div>} />);

    expect(screen.getByTestId('accuracy-ring').parentElement?.className).toContain('justify-center');
  });

  it('不传 ring 时不占位', () => {
    const { container } = render(<ResultHeader title="训练完成" />);

    expect(container.querySelector('[data-testid="accuracy-ring"]')).toBeNull();
    expect(container.querySelectorAll('svg')).toHaveLength(0);
  });
});

describe('ResultHeader tone 前导图形', () => {
  it('neutral（默认）不渲染装饰图形', () => {
    const { container } = render(<ResultHeader title="训练完成" />);

    expect(container.querySelector('svg')).toBeNull();
  });

  it.each(['success', 'warning', 'danger'] as const)('tone=%s 渲染 aria-hidden 装饰图形', (tone) => {
    const { container } = render(<ResultHeader title="训练完成" tone={tone} />);

    const icon = container.querySelector('svg');
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute('aria-hidden')).toBe('true');
  });

  it('success 图形走黄铜亮阶，danger 图形走危险文字阶', () => {
    const { container: success } = render(<ResultHeader title="训练完成" tone="success" />);
    expect(success.querySelector('svg')?.getAttribute('class')).toContain('text-[var(--brass-bright)]');
    cleanup();

    const { container: danger } = render(<ResultHeader title="训练完成" tone="danger" />);
    expect(danger.querySelector('svg')?.getAttribute('class')).toContain('text-[var(--danger-text)]');
  });
});

describe('ResultHeader className 透传', () => {
  it('自定义 class 合入根节点', () => {
    const { container } = render(<ResultHeader title="训练完成" className="max-w-md" />);

    expect(container.firstElementChild?.className).toContain('max-w-md');
  });
});
