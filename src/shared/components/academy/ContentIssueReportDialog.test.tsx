/**
 * ContentIssueReportDialog 契约（jsdom）：
 * - 触发按钮可访问名用 labels.trigger；inline 变体额外渲染 labels.reportIssue 文案
 * - 弹层纯展示：报告文本由 reportText 传入，note / includeContext 受控回调
 * - 复制按钮回调 onCopy（剪贴板与 toast 由调用方负责）
 * - 有 mailtoHref 时渲染邮件通道，缺省回落 success 说明
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  ContentIssueReportDialog,
  type ContentIssueReportDialogProps,
} from './ContentIssueReportDialog';

const labels = {
  title: '报告内容问题',
  subtitle: '错了就报上来',
  placeholder: '说明问题所在段落',
  includeContext: '附带上下文',
  copy: '复制报告',
  mailto: '用邮件发送',
  success: '粘贴到任意渠道即可提交',
  copied: '已复制',
  failure: '复制失败',
  trigger: '报告内容问题',
  reportIssue: '报告问题',
};

const REPORT_TEXT = 'App version: 1.0.0\nLocale: zh\nChapter: t1-outs';

function mount(overrides: Partial<ContentIssueReportDialogProps> = {}) {
  const onOpenChange = vi.fn();
  const onNoteChange = vi.fn();
  const onIncludeContextChange = vi.fn();
  const onCopy = vi.fn().mockResolvedValue(undefined);
  const result = render(
    <ContentIssueReportDialog
      open={false}
      onOpenChange={onOpenChange}
      reportText={REPORT_TEXT}
      note=""
      onNoteChange={onNoteChange}
      includeContext
      onIncludeContextChange={onIncludeContextChange}
      labels={labels}
      onCopy={onCopy}
      {...overrides}
    />
  );
  return { ...result, onOpenChange, onNoteChange, onIncludeContextChange, onCopy };
}

afterEach(cleanup);

describe('ContentIssueReportDialog（触发）', () => {
  it('inline 变体渲染图标 + 文案，可访问名用 labels.trigger', () => {
    mount();

    const trigger = screen.getByRole('button', { name: labels.trigger });
    expect(trigger.textContent).toBe(labels.reportIssue);
  });

  it('icon 变体只渲染图标（可访问名仍完整）', () => {
    mount({ variant: 'icon' });

    const trigger = screen.getByRole('button', { name: labels.trigger });
    expect(trigger.textContent).toBe('');
  });

  it('点击触发按钮回调 onOpenChange(true)，不自行改状态', () => {
    const { onOpenChange } = mount();

    fireEvent.click(screen.getByRole('button', { name: labels.trigger }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('className 透传到触发按钮', () => {
    mount({ className: 'text-xs' });

    expect(screen.getByRole('button', { name: labels.trigger }).className).toContain('text-xs');
  });
});

describe('ContentIssueReportDialog（弹层）', () => {
  it('打开时展示标题、说明与报告全文', () => {
    mount({ open: true });

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(labels.title)).toBeTruthy();
    expect(screen.getByText(labels.subtitle)).toBeTruthy();
    expect(screen.getByText(/Chapter: t1-outs/)).toBeTruthy();
  });

  it('备注输入与上下文勾选走受控回调', () => {
    const { onNoteChange, onIncludeContextChange } = mount({ open: true, note: '已填' });

    fireEvent.change(screen.getByPlaceholderText(labels.placeholder), {
      target: { value: 'outs 数写错了' },
    });
    expect(onNoteChange).toHaveBeenCalledWith('outs 数写错了');

    const checkbox = screen.getByRole('checkbox', { name: labels.includeContext });
    fireEvent.click(checkbox);
    expect(onIncludeContextChange).toHaveBeenCalledWith(false);
  });

  it('复制按钮回调 onCopy', () => {
    const { onCopy } = mount({ open: true });

    fireEvent.click(screen.getByRole('button', { name: labels.copy }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('无邮件通道时回落 success 说明', () => {
    mount({ open: true });

    expect(screen.getByText(labels.success)).toBeTruthy();
    expect(screen.queryByRole('link', { name: labels.mailto })).toBeNull();
  });

  it('有邮件通道时渲染 mailto 链接', () => {
    mount({ open: true, mailtoHref: 'mailto:ops@example.com?subject=x&body=y' });

    const link = screen.getByRole('link', { name: labels.mailto });
    expect(link.getAttribute('href')).toBe('mailto:ops@example.com?subject=x&body=y');
    expect(screen.queryByText(labels.success)).toBeNull();
  });
});
