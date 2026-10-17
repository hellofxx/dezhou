/**
 * BlankLayout a11y 守卫：全屏训练壳层的键盘快捷键浮层必须
 * 具备 dialog 语义、可读标题，并能用 Escape 关闭。
 * 全局伴生组件（OnboardingGate / TiltWarning / MilestoneCelebrationHost）
 * 依赖 progress store 与引导流程，此处 mock 掉以聚焦布局壳本身。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BlankLayout from '@/layouts/BlankLayout';

vi.mock('@/features/progress/components/gate/OnboardingGate', () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/features/progress/components/gate/TiltWarning', () => ({
  default: () => null,
}));

vi.mock('@/features/progress/components/celebration/MilestoneCelebrationHost', () => ({
  default: () => null,
}));

const flushTimers = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

describe('BlankLayout a11y (shortcuts overlay)', () => {
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

  const renderLayout = async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<BlankLayout />}>
              <Route index element={<p>训练内容占位</p>} />
            </Route>
          </Routes>
        </MemoryRouter>,
      );
    });
  };

  it('opens the shortcuts overlay on "?" with dialog semantics', async () => {
    await renderLayout();
    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true }),
      );
    });
    await flushTimers();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('键盘快捷键');
  });

  it('closes the shortcuts overlay on Escape', async () => {
    await renderLayout();
    await act(async () => {
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true }),
      );
    });
    await flushTimers();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();

    await act(async () => {
      dialog?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
      );
    });
    await flushTimers();
    await flushTimers();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});
