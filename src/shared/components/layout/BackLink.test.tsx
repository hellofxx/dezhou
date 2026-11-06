/**
 * BackLink 契约（共享返回入口）：
 * - `to` 渲染 react-router `Link`（`<a href>`），点击完成路由跳转
 * - `onClick` 渲染 `<button type="button">`，点击只触发回调
 * - `historyBack` 调用 `navigate(-1)`，回到浏览器历史上一页
 * - icon-only 必须有 `aria-label`，且不渲染可见文案
 * - 三变体（text / pill / button）均保留 min-h-11 触摸目标与黄铜 focus-visible 环
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BackLink } from './BackLink';

const TARGET_PROBE = 'back-target-probe';
const PREVIOUS_PROBE = 'back-previous-probe';

afterEach(cleanup);

/** BackLink 依赖 useNavigate，任何渲染都需 Router 上下文 */
function renderWithRouter(ui: ReactNode) {
  return render(<MemoryRouter initialEntries={['/current']}>{ui}</MemoryRouter>);
}

describe('BackLink 目标形态（Link / button / historyBack）', () => {
  it('to 渲染 Link（href）并完成路由跳转', () => {
    render(
      <MemoryRouter initialEntries={['/current']}>
        <Routes>
          <Route path="/current" element={<BackLink to="/academy" label="返回学院" />} />
          <Route path="/academy" element={<div>{TARGET_PROBE}</div>} />
        </Routes>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: '返回学院' });
    expect(link.getAttribute('href')).toBe('/academy');
    expect(screen.queryByRole('button')).toBeNull();

    fireEvent.click(link);
    expect(screen.getByText(TARGET_PROBE)).toBeTruthy();
  });

  it('onClick 渲染 button（type="button"），点击只触发回调', () => {
    const onClick = vi.fn();
    renderWithRouter(<BackLink onClick={onClick} label="返回学院" />);

    const button = screen.getByRole('button', { name: '返回学院' });
    expect(button.getAttribute('type')).toBe('button');
    expect(screen.queryByRole('link')).toBeNull();

    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('historyBack 调用 navigate(-1) 回到上一页', () => {
    render(
      <MemoryRouter initialEntries={['/previous', '/current']} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<div>{PREVIOUS_PROBE}</div>} />
          <Route path="/current" element={<BackLink historyBack label="返回" />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText(PREVIOUS_PROBE)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '返回' }));
    expect(screen.getByText(PREVIOUS_PROBE)).toBeTruthy();
  });

  it('onClick 路径不依赖 Router 上下文（训练子视图可在无 Router 场景渲染）', () => {
    const onClick = vi.fn();
    render(<BackLink onClick={onClick} label="返回小节" />);

    fireEvent.click(screen.getByRole('button', { name: '返回小节' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('无 to / onClick / historyBack 时不渲染空壳控件', () => {
    const { container } = renderWithRouter(<BackLink label="返回" />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('BackLink icon-only', () => {
  it('可访问名称取 label，且不渲染可见文案', () => {
    renderWithRouter(<BackLink onClick={vi.fn()} label="返回进度总览" iconOnly />);

    const button = screen.getByRole('button', { name: '返回进度总览' });
    expect(button.getAttribute('aria-label')).toBe('返回进度总览');
    expect(button.textContent).toBe('');
    expect(button.querySelector('svg')).not.toBeNull();
  });

  it('icon-only 为方形 44px 命中区', () => {
    renderWithRouter(<BackLink to="/progress" label="返回进度总览" iconOnly />);

    const link = screen.getByRole('link', { name: '返回进度总览' });
    expect(link.className).toContain('min-h-11');
    expect(link.className).toContain('min-w-11');
  });
});

describe('BackLink 变体与无障碍基线', () => {
  it('text（默认）为无底色的返回链接', () => {
    renderWithRouter(<BackLink onClick={vi.fn()} label="返回小节" />);

    const button = screen.getByRole('button', { name: '返回小节' });
    expect(button.className).toContain('text-xs');
    expect(button.className).toContain('inline-flex');
    expect(button.className).not.toContain('px-2');
  });

  it('pill 带 px-2 圆角命中区，size="md" 提升字号与左右内边距', () => {
    const { rerender } = renderWithRouter(
      <BackLink to="/theory" label="理论学院" variant="pill" />,
    );
    const pill = screen.getByRole('link', { name: '理论学院' });
    expect(pill.className).toContain('px-2');
    expect(pill.className).toContain('rounded');
    expect(pill.className).toContain('text-xs');

    rerender(
      <MemoryRouter initialEntries={['/current']}>
        <BackLink to="/theory" label="理论学院" variant="pill" size="md" />
      </MemoryRouter>,
    );
    const large = screen.getByRole('link', { name: '理论学院' });
    expect(large.className).toContain('px-3');
    expect(large.className).toContain('text-sm');
  });

  it('button 变体复用 shadcn Button（ghost + sm）', () => {
    renderWithRouter(<BackLink onClick={vi.fn()} label="退出" variant="button" />);

    const button = screen.getByRole('button', { name: '退出' });
    expect(button.className).toContain('h-9');
    expect(button.className).toContain('text-[var(--ivory-dim)]');
  });

  it('所有变体保留 44px 触摸目标与黄铜 focus-visible 环；图标不进可访问名称', () => {
    const variants = ['text', 'pill', 'button'] as const;

    for (const variant of variants) {
      const { unmount } = renderWithRouter(
        <BackLink onClick={vi.fn()} label={`返回-${variant}`} variant={variant} />,
      );
      const button = screen.getByRole('button', { name: `返回-${variant}` });

      expect(button.className, variant).toContain('min-h-11');
      expect(button.className, variant).toContain('focus-visible:ring-2');
      expect(button.className, variant).toContain('focus-visible:ring-[var(--brass)]/60');

      const icon = button.querySelector('svg');
      expect(icon?.getAttribute('aria-hidden'), variant).toBe('true');
      unmount();
    }
  });

  it('className 覆盖样式（调用方定位 / 字色定制）生效', () => {
    renderWithRouter(
      <BackLink
        historyBack
        label="返回"
        variant="pill"
        className="absolute top-4 left-4 text-[var(--ivory)]"
      />,
    );

    const button = screen.getByRole('button', { name: '返回' });
    expect(button.className).toContain('absolute');
    expect(button.className).toContain('top-4');
    expect(button.className).toContain('text-[var(--ivory)]');
    expect(button.className).toContain('min-h-11');
  });
});
