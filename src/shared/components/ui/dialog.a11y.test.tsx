import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import axe from 'axe-core';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog';

// 组件级冒烟：Radix Dialog 通过 Portal 渲染到 document.body，
// 故以 document.body 为扫描上下文，并关闭页面级规则（单组件不代表整页）。
const componentAxeConfig = {
  rules: {
    region: { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
    'document-title': { enabled: false },
    'html-has-lang': { enabled: false },
    'html-lang-valid': { enabled: false },
    bypass: { enabled: false },
    'landmark-unique': { enabled: false },
  },
} as const;

describe('Dialog a11y (WCAG 2.1 AA smoke)', () => {
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

  it('has no axe violations when open with title + description', async () => {
    await act(async () => {
      root.render(
        <Dialog open onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>示例标题</DialogTitle>
            <DialogDescription>示例描述文本</DialogDescription>
            <p>对话框正文内容</p>
          </DialogContent>
        </Dialog>,
      );
    });

    const results = await axe.run(document.body, componentAxeConfig);
    expect(results.violations).toEqual([]);
  });

  it('close button exposes an accessible name via sr-only label', () => {
    act(() => {
      root.render(
        <Dialog open onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>示例标题</DialogTitle>
            <DialogDescription>示例描述文本</DialogDescription>
          </DialogContent>
        </Dialog>,
      );
    });

    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    const close = dialog?.querySelector('button');
    const name =
      close?.getAttribute('aria-label') || close?.textContent?.trim() || '';
    expect(name.length).toBeGreaterThan(0);
  });
});
