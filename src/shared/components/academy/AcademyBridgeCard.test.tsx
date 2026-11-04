/**
 * AcademyBridgeCard 契约（jsdom）：
 * - 标题 / 副标题 / 条目全量渲染，section 可访问名缺省回落到标题
 * - 条目行与 CTA 均回调 onNavigate（共享层不持有路由）
 * - itemAriaLabel 可覆盖行按钮可访问名
 * - 行按钮是原生 <button type="button">：Enter / Space 由浏览器原生触发
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import type { AcademyBridgeItem } from '@/shared/types/academy';
import { AcademyBridgeCard } from './AcademyBridgeCard';

MotionGlobalConfig.skipAnimations = true;

const items: AcademyBridgeItem[] = [
  { id: 'l-preflop', label: '翻前开池', route: '/academy/lesson/l-preflop' },
  { id: 'l-cbet', label: '持续下注', route: '/academy/lesson/l-cbet' },
];

afterEach(cleanup);

describe('AcademyBridgeCard', () => {
  it('渲染标题、副标题与全部条目', () => {
    render(
      <AcademyBridgeCard
        title="去实践"
        subtitle="把这一步推导放进牌桌"
        items={items}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: '去实践' })).toBeTruthy();
    expect(screen.getByText('把这一步推导放进牌桌')).toBeTruthy();
    expect(screen.getByRole('button', { name: '翻前开池' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '持续下注' })).toBeTruthy();
  });

  it('点击条目回调该条目的路由', () => {
    const onNavigate = vi.fn();
    render(<AcademyBridgeCard title="去实践" items={items} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByRole('button', { name: '持续下注' }));
    expect(onNavigate).toHaveBeenCalledWith('/academy/lesson/l-cbet');
  });

  it('itemAriaLabel 覆盖行按钮可访问名', () => {
    render(
      <AcademyBridgeCard
        title="去实践"
        items={items}
        onNavigate={vi.fn()}
        itemAriaLabel={(item) => `打开课程：${item.label}`}
      />
    );

    expect(screen.getByRole('button', { name: '打开课程：翻前开池' })).toBeTruthy();
  });

  it('提供 CTA 时渲染主按钮并回调 CTA 路由', () => {
    const onNavigate = vi.fn();
    render(
      <AcademyBridgeCard
        title="去实践"
        items={items}
        cta={{ label: '进入学习路径', route: '/academy/tracks?track=leak' }}
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '进入学习路径' }));
    expect(onNavigate).toHaveBeenCalledWith('/academy/tracks?track=leak');
  });

  it('未提供 CTA 时不渲染主按钮', () => {
    render(<AcademyBridgeCard title="去实践" items={items} onNavigate={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(items.length);
  });

  it('section 可访问名缺省回落到标题，可用 ariaLabel 覆盖', () => {
    const { unmount } = render(
      <AcademyBridgeCard title="去实践" items={items} onNavigate={vi.fn()} />
    );
    expect(screen.getByRole('region', { name: '去实践' })).toBeTruthy();
    unmount();

    render(
      <AcademyBridgeCard title="去实践" ariaLabel="实践推荐" items={items} onNavigate={vi.fn()} />
    );
    expect(screen.getByRole('region', { name: '实践推荐' })).toBeTruthy();
  });

  it('所有可点行都是原生 button（键盘 Enter / Space 原生可达）', () => {
    render(
      <AcademyBridgeCard
        title="去实践"
        items={items}
        cta={{ label: '进入学习路径', route: '/academy/tracks' }}
        onNavigate={vi.fn()}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(items.length + 1);
    for (const button of buttons) {
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('tabindex')).toBeNull();
    }
  });
});
