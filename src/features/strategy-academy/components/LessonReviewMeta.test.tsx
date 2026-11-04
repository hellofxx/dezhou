/**
 * 课时「最近校对 + 纠错入口」脚注契约（jsdom）：
 * - 已登记课时的课时展示校对日期（文案走 academy.contentMeta.lastReviewed，带 date 变量）；
 * - 未登记课时（短牌 / 单挑变体、无效 id）整体不渲染，不留空壳；
 * - 纠错入口与共享弹层打通：报告带 lessonId 与 sectionIndex；
 * - 不做门禁：未解锁 Level 的课时同样显示脚注（纯内容元数据）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { LessonReviewMeta } from './LessonReviewMeta';
import { DEFAULT_LAST_REVIEWED } from '../data/contentOps';

afterEach(cleanup);

describe('LessonReviewMeta', () => {
  it('已登记课时展示校对日期与纠错入口', () => {
    render(<LessonReviewMeta lessonId="l1-basics" />);

    expect(screen.getByTestId('lesson-review-meta')).toBeTruthy();
    expect(
      screen.getByText(i18n.t('academy.contentMeta.lastReviewed', { date: DEFAULT_LAST_REVIEWED })),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: i18n.t('academy.report.title') }),
    ).toBeTruthy();
  });

  it('未登记课时的课时不渲染任何内容', () => {
    const { container } = render(<LessonReviewMeta lessonId="l3sd-intro" />);

    expect(screen.queryByTestId('lesson-review-meta')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('纠错报告携带课时与段落下标', () => {
    render(<LessonReviewMeta lessonId="l3-draws" sectionIndex={4} />);

    fireEvent.click(screen.getByRole('button', { name: i18n.t('academy.report.title') }));
    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByText(/Lesson: l3-draws/)).toBeTruthy();
    expect(screen.getByText(/Section: 4/)).toBeTruthy();
  });

  it('不参与门禁：未解锁 Level 的课时同样显示脚注', () => {
    render(<LessonReviewMeta lessonId="l8-population-analysis" />);

    expect(screen.getByTestId('lesson-review-meta')).toBeTruthy();
  });

  it('className 透传到容器', () => {
    render(<LessonReviewMeta lessonId="l1-basics" className="mt-4" />);

    expect(screen.getByTestId('lesson-review-meta').className).toContain('mt-4');
  });
});
