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
import { TRAINING_OVERLAY_EVENT } from '@/shared/constants/app';

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

const pressShortcutKey = async () => {
  await act(async () => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: '?', bubbles: true, cancelable: true }),
    );
  });
  await flushTimers();
};

const pressEscapeOnDialog = async () => {
  const dialog = document.querySelector('[role="dialog"]');
  await act(async () => {
    dialog?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
  });
  await flushTimers();
  await flushTimers();
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

    await pressShortcutKey();

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('键盘快捷键');
  });

  it('closes the shortcuts overlay on Escape', async () => {
    await renderLayout();
    await pressShortcutKey();

    expect(document.querySelector('[role="dialog"]')).toBeTruthy();

    await pressEscapeOnDialog();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

/**
 * 训练浮层事件（TRAINING_OVERLAY_EVENT）：浮层开合必须被外部（训练页计时）感知，
 * 且首次挂载不得派发（避免训练页刚进入就误判为「浮层打开」）。
 */
describe('BlankLayout training overlay event', () => {
  let container: HTMLDivElement;
  let root: Root;
  let events: boolean[];
  let listener: (event: Event) => void;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    events = [];
    listener = (event: Event) => {
      events.push((event as CustomEvent<{ open: boolean }>).detail.open);
    };
    window.addEventListener(TRAINING_OVERLAY_EVENT, listener);
  });

  afterEach(() => {
    window.removeEventListener(TRAINING_OVERLAY_EVENT, listener);
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

  it('首次挂载不派发，按 ? 开合依次派发 open=true / open=false', async () => {
    await renderLayout();
    expect(events).toEqual([]);

    await pressShortcutKey();
    expect(events).toEqual([true]);

    await pressShortcutKey();
    expect(events).toEqual([true, false]);
  });

  it('右上角键盘按钮打开与 Dialog 关闭（Escape）同样派发事件', async () => {
    await renderLayout();

    const openButton = Array.from(document.querySelectorAll('button')).find(
      (button) => button.getAttribute('aria-label') === '键盘快捷键',
    );
    expect(openButton).toBeTruthy();
    await act(async () => {
      openButton?.click();
    });
    await flushTimers();
    expect(events).toEqual([true]);
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();

    await pressEscapeOnDialog();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(events).toEqual([true, false]);
  });
});
