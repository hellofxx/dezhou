/**
 * AcademyMasteryCard 契约（jsdom）：
 * - 四档固定顺序 mastered → passing → needsReview → untested，计数走 font-numeric
 * - total 行独立渲染
 * - weakest CTA 回调路由，可访问名同时带上最弱项名称
 * - footer 注入区渲染 / 缺省不渲染
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import type { MasterySummary } from '@/shared/types/academy';
import { AcademyMasteryCard, type AcademyMasteryLabels } from './AcademyMasteryCard';

MotionGlobalConfig.skipAnimations = true;

const labels: AcademyMasteryLabels = {
  mastered: '已掌握',
  passing: '通过',
  needsReview: '待复习',
  untested: '未测',
  total: '合计',
};

const summary: MasterySummary = {
  mastered: 3,
  passing: 2,
  needsReview: 1,
  untested: 4,
  total: 10,
  weakestId: 'c9',
};

afterEach(cleanup);

describe('AcademyMasteryCard', () => {
  it('按固定顺序渲染四档计数与标签', () => {
    const { container } = render(<AcademyMasteryCard title="掌握度" summary={summary} labels={labels} />);

    const rows = Array.from(container.querySelectorAll('[data-mastery-state]'));
    expect(rows.map((row) => row.getAttribute('data-mastery-state'))).toEqual([
      'mastered',
      'passing',
      'needsReview',
      'untested',
    ]);
    expect(rows.map((row) => row.querySelector('.font-numeric')?.textContent)).toEqual([
      '3',
      '2',
      '1',
      '4',
    ]);
    expect(rows[0]!.textContent).toContain('已掌握');
    expect(rows[2]!.textContent).toContain('待复习');
  });

  it('独立渲染合计行', () => {
    render(<AcademyMasteryCard title="掌握度" summary={summary} labels={labels} />);

    const totalRow = screen.getByText('合计').parentElement;
    expect(totalRow?.querySelector('.font-numeric')?.textContent).toBe('10');
  });

  it('weakest CTA 回调路由，并在可访问名里带上最弱项名称', () => {
    const onNavigate = vi.fn();
    render(
      <AcademyMasteryCard
        title="掌握度"
        summary={summary}
        labels={labels}
        weakest={{
          label: '组合数学',
          route: '/theory/chapter/t1-combinatorics',
          ctaLabel: '复习最弱一章',
          onNavigate,
        }}
      />
    );

    const cta = screen.getByRole('button', { name: '复习最弱一章 · 组合数学' });
    expect(cta.textContent).toContain('复习最弱一章');
    // Button 基类声明 [&_svg]:size-4，此处必须显式压回原 14px 图标，避免结构批次视觉漂移
    expect(cta.classList.contains('[&_svg]:size-3.5')).toBe(true);
    expect(cta.classList.contains('[&_svg]:size-4')).toBe(false);
    fireEvent.click(cta);
    expect(onNavigate).toHaveBeenCalledWith('/theory/chapter/t1-combinatorics');
  });

  it('footer 注入区渲染，缺省时不渲染', () => {
    const { unmount } = render(
      <AcademyMasteryCard
        title="掌握度"
        summary={summary}
        labels={labels}
        footer={<a href="/theory/checkpoint/t1">T1 · 检查点自查</a>}
      />
    );
    expect(screen.getByRole('link', { name: 'T1 · 检查点自查' })).toBeTruthy();
    unmount();

    render(<AcademyMasteryCard title="掌握度" summary={summary} labels={labels} />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('section 可访问名缺省回落到标题，可用 ariaLabel 覆盖', () => {
    const { unmount } = render(
      <AcademyMasteryCard title="掌握度" summary={summary} labels={labels} />
    );
    expect(screen.getByRole('region', { name: '掌握度' })).toBeTruthy();
    unmount();

    render(
      <AcademyMasteryCard title="掌握度" ariaLabel="课时掌握度" summary={summary} labels={labels} />
    );
    expect(screen.getByRole('region', { name: '课时掌握度' })).toBeTruthy();
  });
});
