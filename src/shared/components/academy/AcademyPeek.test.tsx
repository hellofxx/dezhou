/**
 * AcademyPeek 契约（jsdom）：
 * - 折叠头走 ui/Button quiet（非裸 button），aria-expanded / aria-controls 关联展开区
 * - 点击展开/收起 children；defaultOpen 初始展开；label 由消费者注入
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AcademyPeek } from './AcademyPeek';

afterEach(cleanup);

describe('AcademyPeek', () => {
  it('缺省折叠：children 不渲染，aria-expanded=false', () => {
    render(
      <AcademyPeek label="查看原文">
        <p>课程原文段落</p>
      </AcademyPeek>,
    );

    const toggle = screen.getByRole('button', { name: /查看原文/ });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('课程原文段落')).toBeNull();
  });

  it('点击展开 children 并关联 aria-controls，再点收起', () => {
    render(
      <AcademyPeek label="查看原文">
        <p>课程原文段落</p>
      </AcademyPeek>,
    );

    const toggle = screen.getByRole('button', { name: /查看原文/ });
    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const panel = screen.getByText('课程原文段落').closest('div[id]');
    expect(panel).not.toBeNull();
    expect(toggle.getAttribute('aria-controls')).toBe(panel?.id);
    expect(panel?.className).toContain('max-h-80');
    expect(panel?.className).toContain('overflow-y-auto');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('课程原文段落')).toBeNull();
  });

  it('defaultOpen 初始展开', () => {
    render(
      <AcademyPeek label="查看原文" defaultOpen>
        <p>课程原文段落</p>
      </AcademyPeek>,
    );
    expect(screen.getByRole('button', { name: /查看原文/ }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('课程原文段落')).toBeTruthy();
  });

  it('折叠头复用 ui/Button quiet 变体（dogfooding，非裸 button）', () => {
    render(
      <AcademyPeek label="查看原文">
        <p>课程原文段落</p>
      </AcademyPeek>,
    );
    const toggle = screen.getByRole('button', { name: /查看原文/ });
    // ui/Button quiet 变体的结构类（bg-transparent + ivory-dim），焦点环走 FOCUS_RING 单源
    expect(toggle.className).toContain('bg-transparent');
    expect(toggle.className).toContain('text-[var(--ivory-dim)]');
    expect(toggle.className).toContain('focus-visible:ring-2');
    expect(toggle.querySelector('svg')).not.toBeNull();
  });
});