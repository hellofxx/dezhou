/**
 * AcademyTakeawayCard 契约（jsdom）：
 * - DOM 与两院原 LessonTakeawayBlock 逐字一致（.lesson-takeaway + 标题 p + brass 圆点 ul/li）
 * - 标题缺省走 academy.content.takeaway（要点总结）；自定义 title 覆盖
 * - items 按换行拆分并滤空；空 items 整卡不渲染
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { AcademyTakeawayCard } from './AcademyTakeawayCard';

afterEach(cleanup);

describe('AcademyTakeawayCard', () => {
  it('渲染「要点总结」标题与 brass 圆点列表（DOM 契约）', () => {
    const { container } = render(
      <AcademyTakeawayCard items={['EV 只看未来分支', '底池赔率决定跟注门槛']} />,
    );

    expect(screen.getByText('要点总结')).toBeTruthy();
    const card = container.querySelector('.lesson-takeaway');
    expect(card).not.toBeNull();

    const heading = screen.getByText('要点总结');
    expect(heading.tagName).toBe('P');
    expect(heading.className).toBe('text-sm font-semibold text-[var(--ivory)] mb-2');

    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(2);
    expect(items[0]?.className).toBe(
      'text-sm text-[var(--ivory-dim)] leading-[1.7] flex items-start gap-2',
    );
    const dot = items[0]?.querySelector('span[aria-hidden="true"]');
    expect(dot?.className).toBe('mt-[9px] w-1.5 h-1.5 shrink-0 rounded-full bg-[var(--brass)]');
    expect(items[0]?.textContent).toBe('EV 只看未来分支');
    expect(container.querySelector('ul')?.className).toBe('space-y-1.5');
  });

  it('items 含换行时按换行拆分并过滤空行', () => {
    const { container } = render(
      <AcademyTakeawayCard items={['第一条\n\n第二条\n  \n第三条']} />,
    );
    const items = Array.from(container.querySelectorAll('li')).map((li) => li.textContent);
    expect(items).toEqual(['第一条', '第二条', '第三条']);
  });

  it('空 items（或全空白）整卡不渲染', () => {
    const { container } = render(<AcademyTakeawayCard items={[]} />);
    expect(container.innerHTML).toBe('');

    const blank = render(<AcademyTakeawayCard items={['', '  \n ']} />);
    expect(blank.container.innerHTML).toBe('');
  });

  it('自定义 title 覆盖缺省文案', () => {
    render(<AcademyTakeawayCard items={['要点一']} title="本章收尾" />);
    expect(screen.getByText('本章收尾')).toBeTruthy();
    expect(screen.queryByText('要点总结')).toBeNull();
  });
});