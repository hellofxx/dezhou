/**
 * ContentIssueReport 测试：
 * 1. 报告文本只含必要的复现上下文（App 版本 / 语言 / 时间戳恒定，章节与题目按勾选附带）；
 * 2. mailto 通道做 URL 编码（换行与空格不得破坏链接）；
 * 3. 组件交互：打开弹层 → 输入说明 → 复制到剪贴板（无后端，纯前端通道）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import { ContentIssueReport, buildContentIssueMailto, buildContentIssueReport } from './ContentIssueReport';
import { APP_VERSION } from '@/shared/constants/app';

MotionGlobalConfig.skipAnimations = true;

const TIMESTAMP = Date.parse('2026-01-02T03:04:05.000Z');

const BASE_INPUT = {
  appVersion: APP_VERSION,
  locale: 'zh',
  chapterId: 't1-combinatorics',
  questionId: 't1-combinatorics-q2',
  sectionIndex: 3,
  note: '  第三个例子的数字算错了  ',
  timestamp: TIMESTAMP,
  includeContext: true,
};

describe('buildContentIssueReport', () => {
  it('带上下文：含版本 / 语言 / 章节 / 段落 / 题目 / ISO 时间戳 / 说明', () => {
    const report = buildContentIssueReport(BASE_INPUT);
    expect(report).toContain('[Theory Academy content issue]');
    expect(report).toContain(`App version: ${APP_VERSION}`);
    expect(report).toContain('Locale: zh');
    expect(report).toContain('Chapter: t1-combinatorics');
    expect(report).toContain('Section: 3');
    expect(report).toContain('Question: t1-combinatorics-q2');
    expect(report).toContain('Timestamp: 2026-01-02T03:04:05.000Z');
    // 说明做 trim，避免粘贴时首尾空白噪声
    expect(report).toContain('Note:\n第三个例子的数字算错了');
    expect(report).not.toContain('  第三个例子');
  });

  it('关闭上下文：只留版本 / 语言 / 时间戳 / 说明', () => {
    const report = buildContentIssueReport({ ...BASE_INPUT, includeContext: false });
    expect(report).toContain(`App version: ${APP_VERSION}`);
    expect(report).toContain('Locale: zh');
    expect(report).not.toContain('Chapter:');
    expect(report).not.toContain('Section:');
    expect(report).not.toContain('Question:');
  });

  it('缺省段落与题目时不渲染空行', () => {
    const report = buildContentIssueReport({
      ...BASE_INPUT,
      questionId: undefined,
      sectionIndex: undefined,
    });
    expect(report).toContain('Chapter: t1-combinatorics');
    expect(report).not.toContain('Section:');
    expect(report).not.toContain('Question:');
  });
});

describe('buildContentIssueMailto', () => {
  it('subject 与 body 均编码（链接中无裸空格与换行）', () => {
    const report = buildContentIssueReport(BASE_INPUT);
    const url = buildContentIssueMailto('theory@example.com', report, 't1-combinatorics');
    expect(url.startsWith('mailto:theory@example.com?subject=')).toBe(true);
    expect(url).not.toMatch(/[\s\n]/);
    expect(url).toContain('&body=');
  });

  it('编码可逆（解码后逐字等于原文）', () => {
    const report = buildContentIssueReport(BASE_INPUT);
    const url = buildContentIssueMailto('theory@example.com', report);
    const body = decodeURIComponent(url.slice(url.indexOf('&body=') + '&body='.length));
    expect(body).toBe(report);
    const subject = decodeURIComponent(
      url.slice(url.indexOf('subject=') + 'subject='.length, url.indexOf('&body=')),
    );
    expect(subject).toBe('[Theory Academy] content issue');
  });
});

describe('ContentIssueReport 组件', () => {
  let container: HTMLDivElement;
  let root: Root;
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function findButton(text: string): HTMLButtonElement {
    const button = Array.from(document.querySelectorAll('button')).find((candidate) =>
      (candidate.textContent ?? '').includes(text),
    );
    if (!button) {
      throw new Error(
        `未找到按钮「${text}」；现有：${JSON.stringify(
          Array.from(document.querySelectorAll('button')).map((b) => b.textContent),
        )}`,
      );
    }
    return button;
  }

  it('打开弹层并复制报告到剪贴板（含章节定位与说明）', async () => {
    act(() => {
      root.render(<ContentIssueReport chapterId="t1-outs" sectionIndex={2} />);
    });
    // 入口按钮（inline 形态用 theory.contentMeta.reportIssue 文案）
    await act(async () => {
      findButton('报告问题').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const textarea = document.querySelector('textarea');
    expect(textarea).not.toBeNull();
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      )?.set;
      setter?.call(textarea, '这里的 outs 数写错了');
      textarea!.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      findButton('复制报告').dispatchEvent(new MouseEvent('click', { bubbles: true }));
      await Promise.resolve();
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied).toContain('Chapter: t1-outs');
    expect(copied).toContain('Section: 2');
    expect(copied).toContain('这里的 outs 数写错了');
    expect(copied).toContain(`App version: ${APP_VERSION}`);
  });
});
