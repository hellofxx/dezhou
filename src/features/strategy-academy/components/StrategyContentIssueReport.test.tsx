/**
 * 策略内容纠错薄包装测试：
 * 1. 报告文本只含必要复现上下文（App 版本 / 语言 / 时间戳恒定，课时 / 段落 / 题目按勾选附带）；
 * 2. mailto 通道做 URL 编码（换行与空格不得破坏链接）；
 * 3. 交互：打开弹层 → 输入说明 → 复制到剪贴板（无后端，纯前端通道）；
 * 4. 未配置 VITE_STRATEGY_REPORT_EMAIL 时只保留剪贴板通道（无 mailto 链接）。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from '@/i18n/config';
import { APP_VERSION } from '@/shared/constants/app';
import {
  StrategyContentIssueReport,
  buildStrategyIssueMailto,
  buildStrategyIssueReport,
} from './StrategyContentIssueReport';

const TIMESTAMP = Date.parse('2026-01-02T03:04:05.000Z');

const BASE_INPUT = {
  appVersion: APP_VERSION,
  locale: 'zh',
  lessonId: 'l3-draws',
  questionId: 'l3-draws-q2',
  sectionIndex: 3,
  note: '  第二个例子的补牌数算错了  ',
  timestamp: TIMESTAMP,
  includeContext: true,
};

describe('buildStrategyIssueReport', () => {
  it('带上下文：含版本 / 语言 / 课时 / 段落 / 题目 / ISO 时间戳 / 说明', () => {
    const report = buildStrategyIssueReport(BASE_INPUT);
    expect(report).toContain('[Strategy Academy content issue]');
    expect(report).toContain(`App version: ${APP_VERSION}`);
    expect(report).toContain('Locale: zh');
    expect(report).toContain('Lesson: l3-draws');
    expect(report).toContain('Section: 3');
    expect(report).toContain('Question: l3-draws-q2');
    expect(report).toContain('Timestamp: 2026-01-02T03:04:05.000Z');
    // 说明做 trim，避免粘贴时首尾空白噪声
    expect(report).toContain('Note:\n第二个例子的补牌数算错了');
    expect(report).not.toContain('  第二个例子');
  });

  it('关闭上下文：只留版本 / 语言 / 时间戳 / 说明', () => {
    const report = buildStrategyIssueReport({ ...BASE_INPUT, includeContext: false });
    expect(report).toContain(`App version: ${APP_VERSION}`);
    expect(report).toContain('Locale: zh');
    expect(report).not.toContain('Lesson:');
    expect(report).not.toContain('Section:');
    expect(report).not.toContain('Question:');
  });

  it('缺省段落与题目时不渲染空行', () => {
    const report = buildStrategyIssueReport({
      ...BASE_INPUT,
      questionId: undefined,
      sectionIndex: undefined,
    });
    expect(report).toContain('Lesson: l3-draws');
    expect(report).not.toContain('Section:');
    expect(report).not.toContain('Question:');
  });
});

describe('buildStrategyIssueMailto', () => {
  it('subject 与 body 均编码（链接中无裸空格与换行）', () => {
    const report = buildStrategyIssueReport(BASE_INPUT);
    const url = buildStrategyIssueMailto('strategy@example.com', report, 'l3-draws');
    expect(url.startsWith('mailto:strategy@example.com?subject=')).toBe(true);
    expect(url).not.toMatch(/[\s\n]/);
    expect(url).toContain('&body=');
  });

  it('编码可逆（解码后逐字等于原文）', () => {
    const report = buildStrategyIssueReport(BASE_INPUT);
    const url = buildStrategyIssueMailto('strategy@example.com', report);
    const body = decodeURIComponent(url.slice(url.indexOf('&body=') + '&body='.length));
    expect(body).toBe(report);
    const subject = decodeURIComponent(
      url.slice(url.indexOf('subject=') + 'subject='.length, url.indexOf('&body=')),
    );
    expect(subject).toBe('[Strategy Academy] content issue');
  });
});

describe('StrategyContentIssueReport 组件', () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    });
  });

  afterEach(cleanup);

  it('打开弹层并复制报告到剪贴板（含课时与段落定位）', async () => {
    render(<StrategyContentIssueReport lessonId="l1-basics" sectionIndex={2} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.t('academy.report.title') }));
    const textarea = screen.getByPlaceholderText(i18n.t('academy.report.placeholder'));
    fireEvent.change(textarea, { target: { value: '这里的 outs 数写错了' } });

    fireEvent.click(screen.getByRole('button', { name: i18n.t('academy.report.copy') }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = writeText.mock.calls[0]![0] as string;
    expect(copied).toContain('Lesson: l1-basics');
    expect(copied).toContain('Section: 2');
    expect(copied).toContain('这里的 outs 数写错了');
    expect(copied).toContain(`App version: ${APP_VERSION}`);
  });

  it('未配置举报邮箱时只提供剪贴板通道（无 mailto 链接）', () => {
    render(<StrategyContentIssueReport lessonId="l1-basics" />);

    fireEvent.click(screen.getByRole('button', { name: i18n.t('academy.report.title') }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.queryByRole('link', { name: i18n.t('academy.report.mailto') })).toBeNull();
  });

  it('icon 形态只渲染图标，可访问名仍完整', () => {
    render(<StrategyContentIssueReport lessonId="l1-basics" variant="icon" />);

    const trigger = screen.getByRole('button', { name: i18n.t('academy.report.title') });
    expect(trigger.textContent).toBe('');
  });
});
