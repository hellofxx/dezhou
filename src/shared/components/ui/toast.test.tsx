/**
 * toast（shared/ui，sonner 封装）契约：
 * - 对外暴露 sonner 的 toast 入口（success / error / info / warning）
 * - Toaster 渲染 aria-live 通知区，命中右下角与 z-index 50（与移动端底栏同层，DESIGN.md §6.4）
 * - 触发 toast 后文案可见，关闭按钮使用 i18n 文案（common.ui.close）
 *
 * 注：sonner 通过 store 通知订阅者，toast() 之后需要一次微任务刷新才会出现
 * 通知列表，因此这里用 `await act(async () => {})` 冲刷（不使用真实计时器等待）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { waitFor } from '@testing-library/react';
import { createRoot, type Root } from 'react-dom/client';
import { Toaster, toast } from './toast';

describe('toast / Toaster', () => {
  let root: Root | null = null;
  let container: HTMLDivElement | null = null;

  const mountToaster = async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root?.render(<Toaster />);
    });
  };

  /** 冲刷 sonner store 的通知（订阅者刷新在微任务内完成，不用固定 sleep） */
  const flushToast = async () => {
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
  };

  afterEach(async () => {
    await act(async () => {
      toast.dismiss();
    });
    act(() => root?.unmount());
    container?.remove();
    root = null;
    container = null;
  });

  it('导出四类 toast 入口', () => {
    expect(typeof toast.success).toBe('function');
    expect(typeof toast.error).toBe('function');
    expect(typeof toast.info).toBe('function');
    expect(typeof toast.warning).toBe('function');
  });

  it('Toaster 渲染 polite 通知区（无消息时不产出列表）', async () => {
    await mountToaster();

    const region = document.querySelector('section[aria-live="polite"]');
    expect(region).toBeTruthy();
    expect(region?.getAttribute('aria-label')).toContain('Notifications');
    expect(document.querySelector('[data-sonner-toaster]')).toBeNull();
  });

  it('触发 toast 后消息出现在右下角通知列表，且层级与移动端底栏同层', async () => {
    await mountToaster();

    await act(async () => {
      toast.success('进度已保存');
    });
    await flushToast();

    const list = await waitFor(() => {
      const element = document.querySelector('[data-sonner-toaster]');
      expect(element).toBeTruthy();
      return element as HTMLElement;
    });
    expect(list?.getAttribute('data-y-position')).toBe('bottom');
    expect(list?.getAttribute('data-x-position')).toBe('right');
    expect(list?.style.zIndex).toBe('50');
    expect(document.querySelector('[data-sonner-toast]')?.textContent).toContain('进度已保存');
  });

  it('关闭按钮使用 i18n 文案（common.ui.close）', async () => {
    await mountToaster();

    await act(async () => {
      toast.error('保存失败');
    });
    await flushToast();

    const closeButton = await waitFor(() => {
      const element = document.querySelector('[data-close-button]');
      expect(element).toBeTruthy();
      return element as HTMLElement;
    });
    expect(closeButton.getAttribute('aria-label')).toBe('关闭');
  });
});
