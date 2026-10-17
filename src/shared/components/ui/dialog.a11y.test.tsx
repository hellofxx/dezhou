import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';
import { configureA11yDocument, expectNoA11yViolations } from '@/shared/test/a11y';

/** 让 Radix 的 setTimeout(0) 收尾（焦点归还 / 卸载清理）在 act 内跑完 */
const flushTimers = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

/**
 * 在 dialog 上派发 Escape（bubbles + cancelable）→ Radix DismissableLayer 挂在
 * document 的捕获监听接管关闭；随后排空两轮宏任务，让卸载清理与焦点归还跑完。
 */
const pressEscape = async (dialog: HTMLElement | null) => {
  await act(async () => {
    dialog?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }),
    );
  });
  await flushTimers();
  await flushTimers();
};

/** 受控包装：trigger → open → Escape 关闭，用于验证焦点归还链路 */
function ControlledDialog({ onOpenChangeSpy }: { onOpenChangeSpy?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChangeSpy?.(next);
      }}
    >
      <DialogTrigger asChild>
        <button type="button">打开示例对话框</button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>示例标题</DialogTitle>
        <DialogDescription>示例描述文本</DialogDescription>
        <p>对话框正文内容</p>
      </DialogContent>
    </Dialog>
  );
}

describe('Dialog a11y (WCAG 2.1 AA smoke)', () => {
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

  // Radix Dialog 经 Portal 渲染到 document.body，故以 document.body 为扫描上下文；
  // harness 的 <main><h1> 让 region / landmark-one-main 对页面内容仍然生效。
  const renderHarness = (spy?: (open: boolean) => void) =>
    root.render(
      <main>
        <h1>Test</h1>
        <ControlledDialog onOpenChangeSpy={spy} />
      </main>,
    );

  const openDialog = async (spy?: (open: boolean) => void) => {
    await act(async () => {
      renderHarness(spy);
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

  it('has no axe violations when open with title + description', async () => {
    await openDialog();

    await expectNoA11yViolations(document.body, {
      disableRules: [
        {
          id: 'bypass',
          reason: 'skip link 是整页跳转概念，组件级 harness 不含页头，规则不适用',
        },
      ],
    });
  });

  it('renders the dealer-slip content surface above the overlay', async () => {
    const { dialog } = await openDialog();

    expect(dialog.classList.contains('dialog-content')).toBe(true);
    expect(dialog.classList.contains('dealer-slip')).toBe(true);
    expect(dialog.classList.contains('z-[100]')).toBe(true);
  });

  it('close button exposes the localized accessible name 关闭', async () => {
    const { dialog } = await openDialog();

    const close = dialog.querySelector('button[aria-label]');
    expect(close).toBeTruthy();
    expect(close?.getAttribute('aria-label')).toBe('关闭');
  });

  it('closes on Escape (keydown bubbles to the Radix dismissable layer)', async () => {
    const spy = vi.fn();
    const { dialog } = await openDialog(spy);

    await pressEscape(dialog);

    expect(spy).toHaveBeenCalledWith(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('moves focus into the dialog on open and restores it to the trigger on close', async () => {
    const { trigger, dialog } = await openDialog();

    expect(dialog.contains(document.activeElement)).toBe(true);

    await pressEscape(dialog);

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
