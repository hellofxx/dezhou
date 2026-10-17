/**
 * MobileFeedbackSheet a11y 守卫（jsdom + axe）：
 * 移动端底部 Sheet 的 dialog 语义（默认标题 common.ui.feedback / Escape 关闭 /
 * 焦点进入与归还）与 dealer-slip 材质，全部由 Radix Dialog 承载。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MobileFeedbackSheet } from './MobileFeedbackSheet';
import { configureA11yDocument, expectNoA11yViolations } from '@/shared/test/a11y';

const flushTimers = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

const pressEscape = async (dialog: HTMLElement | null) => {
  await act(async () => {
    dialog?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
  });
  await flushTimers();
  await flushTimers();
};

/** 受控包装：harness 提供 main/h1，Sheet 通过 Portal 渲染到 document.body */
function ControlledSheet({ onOpenChangeSpy }: { onOpenChangeSpy?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <main>
      <h1>Test</h1>
      <button type="button" onClick={() => setOpen(true)}>
        显示答题反馈
      </button>
      <MobileFeedbackSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChangeSpy?.(next);
        }}
      >
        <p>本轮 5 题全部正确</p>
      </MobileFeedbackSheet>
    </main>
  );
}

describe('MobileFeedbackSheet a11y (WCAG 2.1 AA smoke)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    configureA11yDocument();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const openSheet = async (spy?: (open: boolean) => void) => {
    await act(async () => {
      root.render(<ControlledSheet onOpenChangeSpy={spy} />);
    });
    const trigger = container.querySelector('button');
    expect(trigger).toBeTruthy();
    act(() => {
      trigger?.focus();
    });
    await act(async () => {
      trigger?.click();
    });
    await flushTimers();
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    return { trigger: trigger as HTMLButtonElement, dialog: dialog as HTMLElement };
  };

  it('exposes dialog semantics with the default 答题反馈 title', async () => {
    const { dialog } = await openSheet();

    // 标题 sr-only，但仍是 dialog 的可访问名称来源
    expect(dialog.textContent).toContain('答题反馈');
    const close = dialog.querySelector('button[aria-label]');
    expect(close?.getAttribute('aria-label')).toBe('关闭');
  });

  it('has no axe violations while open', async () => {
    await openSheet();

    await expectNoA11yViolations(document.body, {
      disableRules: [
        {
          id: 'bypass',
          reason: 'skip link 是整页跳转概念，组件级 harness 不含页头，规则不适用',
        },
      ],
    });
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    const spy = vi.fn();
    const { trigger, dialog } = await openSheet(spy);

    expect(dialog.contains(document.activeElement)).toBe(true);

    await pressEscape(dialog);

    expect(spy).toHaveBeenCalledWith(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
