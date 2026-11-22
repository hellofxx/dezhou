/**
 * AcademyStickyCta 契约（jsdom）：
 * - 单 DOM 节点容器（避免移动/桌面双渲染致 getByText 多匹配）
 * - children（ui/Button）透传；移动 fixed 定位类与桌面 md:static 还原类同时存在
 * - z-40 低于 MobileNav z-50；bottom 让位 h-14 + safe-area
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Button } from '@/shared/components/ui/button';
import { AcademyStickyCta } from './AcademyStickyCta';

afterEach(cleanup);

describe('AcademyStickyCta', () => {
  it('单节点容器透传 children，CTA 文本只出现一次', () => {
    const { container } = render(
      <AcademyStickyCta>
        <Button>开始本章小测</Button>
      </AcademyStickyCta>,
    );

    expect(container.children).toHaveLength(1);
    expect(screen.getAllByText('开始本章小测')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '开始本章小测' })).toBeTruthy();
  });

  it('移动 fixed 定位 + 桌面 md:static 还原类共存于同一节点', () => {
    const { container } = render(
      <AcademyStickyCta>
        <Button>开始本章小测</Button>
      </AcademyStickyCta>,
    );

    const shell = container.firstElementChild;
    expect(shell?.tagName).toBe('DIV');
    const className = shell?.className ?? '';
    expect(className).toContain('fixed');
    expect(className).toContain('inset-x-4');
    expect(className).toContain('bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)]');
    expect(className).toContain('z-40');
    expect(className).toContain('md:static');
    expect(className).toContain('md:inset-auto');
    expect(className).toContain('md:mt-6');
    expect(className).toContain('md:flex');
    expect(className).toContain('md:justify-end');
    // 移动 walnut 底 + 边框，桌面还原透明无边框
    expect(className).toContain('bg-[var(--walnut)]');
    expect(className).toContain('border-[var(--walnut-border)]');
    expect(className).toContain('md:bg-transparent');
    expect(className).toContain('md:border-0');
  });

  it('className 追加不覆盖基础定位类', () => {
    const { container } = render(
      <AcademyStickyCta className="pb-24 md:pb-0">
        <Button>开始本章小测</Button>
      </AcademyStickyCta>,
    );
    const className = container.firstElementChild?.className ?? '';
    expect(className).toContain('pb-24');
    expect(className).toContain('fixed');
  });
});