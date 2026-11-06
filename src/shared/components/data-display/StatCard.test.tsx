import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';

/**
 * StatCard 契约：
 * - 默认档（stack / md / default surface）保持原有 range-trainer / puzzle-trainer 外观
 * - accent 映射四层色彩 token（gold / green / sage / default）
 * - inline 布局：图标在左、数值在标签上（progress 单模块统计页）
 * - sm + raised：紧凑数值卡（hand-history 指标面板）
 * - 数值字体统一 font-numeric（禁 font-mono）
 */

const tokens = (el: Element | null): string[] => (el?.className ?? '').split(/\s+/).filter(Boolean);

/** 由标签文本反查到 CardContent（p-3 / p-4）与 Card 根 */
function cardOf(label: string) {
  const labelEl = screen.getByText(label);
  let content: HTMLElement | null = labelEl.parentElement;
  while (content && !content.classList.contains('p-3') && !content.classList.contains('p-4')) {
    content = content.parentElement;
  }
  return { labelEl, content, card: content?.parentElement ?? null };
}

/** a 在 b 之前（DOM 顺序） */
function isBefore(a: Element, b: Element): boolean {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

afterEach(() => cleanup());

describe('StatCard 默认档', () => {
  it('渲染图标 / 标签 / 数值，并保持原有默认类名', () => {
    render(
      <StatCard icon={<span data-probe-icon>icon</span>} label="正确率" value={72} suffix="%" />,
    );
    const { content, card } = cardOf('正确率');

    expect(screen.getByText('72%')).toBeTruthy();
    expect(document.querySelector('[data-probe-icon]')).not.toBeNull();

    expect(tokens(card)).toContain('bg-[var(--surface)]');
    expect(tokens(card)).toContain('border-[var(--walnut-border)]');
    expect(tokens(card)).toContain('rounded-[var(--radius)]');
    expect(tokens(card)).toContain('shadow-[var(--shadow-sm)]');

    expect(tokens(content)).toContain('p-3');
    expect(tokens(content)).toContain('flex-col');
    expect(tokens(content)).toContain('items-center');

    // 默认档 md：text-xl + 大写小标签
    const valueEl = screen.getByText('72%');
    expect(tokens(valueEl)).toContain('font-numeric');
    expect(tokens(valueEl)).toContain('text-xl');
    expect(tokens(valueEl)).toContain('text-[var(--ivory)]');
    expect(tokens(valueEl)).not.toContain('font-mono');

    const labelEl = screen.getByText('正确率');
    expect(tokens(labelEl)).toContain('uppercase');
    expect(tokens(labelEl)).toContain('tracking-wider');
  });

  it('stack 布局标签在数值之前（DOM 顺序不变）', () => {
    render(<StatCard label="平均用时" value="4.0s" />);

    expect(isBefore(screen.getByText('平均用时'), screen.getByText('4.0s'))).toBe(true);
  });

  it('valueFirst 兼容 hand-history：数值在标签之前', () => {
    render(<StatCard label="VPIP" value={28} suffix="%" size="sm" surface="raised" valueFirst />);

    expect(isBefore(screen.getByText('28%'), screen.getByText('VPIP'))).toBe(true);
  });

  it('accent 映射色彩 token', () => {
    const cases = [
      ['gold', 'text-[var(--brass-bright)]'],
      ['green', 'text-[var(--success)]'],
      ['sage', 'text-[var(--sage-text)]'],
      ['default', 'text-[var(--ivory)]'],
    ] as const;

    for (const [accent, expected] of cases) {
      render(<StatCard label={`label-${accent}`} value="1" accent={accent} />);
      const valueEl = screen.getByText('1', { selector: 'div.font-numeric' });
      expect(tokens(valueEl), accent).toContain(expected);
      cleanup();
    }
  });
});

describe('StatCard 变体档', () => {
  it('inline + lg + flat：图标在左、数值在标签上、扁平表面', () => {
    render(
      <StatCard
        icon={<span data-probe-icon>icon</span>}
        label="总训练次数"
        value="12"
        accent="gold"
        size="lg"
        layout="inline"
        surface="flat"
      />,
    );
    const { content, card } = cardOf('总训练次数');

    expect(tokens(card)).toContain('bg-[var(--surface)]');
    expect(tokens(card)).toContain('border-[var(--surface-raised)]');

    expect(tokens(content)).toContain('p-4');
    expect(tokens(content)).toContain('items-center');
    expect(tokens(content)).toContain('gap-3');

    const valueEl = screen.getByText('12');
    expect(tokens(valueEl)).toContain('text-xl');
    expect(tokens(valueEl)).toContain('font-bold');
    expect(tokens(valueEl)).toContain('font-numeric');
    expect(tokens(valueEl)).toContain('text-[var(--brass-bright)]');

    const labelEl = screen.getByText('总训练次数');
    expect(tokens(labelEl)).toContain('text-xs');

    // inline：数值在标签之前
    expect(isBefore(valueEl, labelEl)).toBe(true);

    // 图标容器可收缩，避免挤掉数值
    const iconWrap = document.querySelector('[data-probe-icon]')?.parentElement ?? null;
    expect(tokens(iconWrap)).toContain('shrink-0');
  });

  it('sm + raised：紧凑数值卡（胡桃木底 + 无阴影 + 圆角 xl）', () => {
    render(<StatCard label="VPIP" value={28} suffix="%" size="sm" surface="raised" accent="gold" />);
    const { content, card } = cardOf('VPIP');

    expect(tokens(card)).toContain('bg-[var(--walnut-raised)]/40');
    expect(tokens(card)).toContain('border-[var(--walnut-border)]');
    expect(tokens(card)).toContain('rounded-xl');
    expect(tokens(card)).not.toContain('rounded-lg');
    expect(tokens(card)).toContain('shadow-none');
    expect(tokens(card)).not.toContain('shadow-sm');

    expect(tokens(content)).toContain('p-3');

    const valueEl = screen.getByText('28%');
    expect(tokens(valueEl)).toContain('text-lg');
    expect(tokens(valueEl)).toContain('font-bold');
    expect(tokens(valueEl)).toContain('font-numeric');

    const labelEl = screen.getByText('VPIP');
    expect(tokens(labelEl)).toContain('text-[10px]');
    expect(tokens(labelEl)).toContain('text-[var(--ivory-muted)]');
  });

  it('无 icon 时只渲染标签与数值两个节点', () => {
    render(<StatCard label="无图标" value="1" />);
    const { content } = cardOf('无图标');

    expect(content?.children.length ?? 0).toBe(2);
    expect(content?.querySelector('[data-probe-icon]')).toBeNull();
  });

  it('xl + solid：结果卡大数值、实底、p-4，并支持 className 合并', () => {
    render(
      <StatCard
        label="正确率"
        value="72%"
        size="xl"
        surface="solid"
        className="custom-card"
        contentClassName="custom-content"
      />,
    );
    const { content, card } = cardOf('正确率');

    expect(tokens(card)).toContain('bg-[var(--walnut-raised)]');
    expect(tokens(card)).toContain('border-transparent');
    expect(tokens(card)).toContain('rounded-lg');
    expect(tokens(card)).toContain('shadow-none');
    expect(tokens(card)).toContain('custom-card');

    expect(tokens(content)).toContain('p-4');
    expect(tokens(content)).toContain('custom-content');

    const valueEl = screen.getByText('72%');
    expect(tokens(valueEl)).toContain('text-3xl');
    expect(tokens(valueEl)).toContain('font-bold');
  });

  it('label 支持 ReactNode（结果卡标签内嵌图标）', () => {
    render(
      <StatCard
        label={
          <span>
            <span data-probe-label-icon>icon</span>用时
          </span>
        }
        value="4.0s"
      />,
    );

    expect(document.querySelector('[data-probe-label-icon]')).not.toBeNull();
    expect(screen.getByText(/用时/)).toBeTruthy();
  });
});
