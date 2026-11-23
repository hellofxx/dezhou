/**
 * CourseCoverageCard 契约：
 * - 标题走 `academy.courseCoverage.title`
 * - 正常态渲染三条覆盖数据（mapped / supplemental / practice，变量注入）
 * - unavailable（短牌等无概念映射）时只给占位说明，不渲染零值统计
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import CourseCoverageCard from './hub/CourseCoverageCard';

afterEach(cleanup);

describe('CourseCoverageCard', () => {
  it('渲染标题与三条覆盖数据', () => {
    render(
      <CourseCoverageCard
        mappedChapters={4}
        supplementalChapters={2}
        anchoredLessons={9}
        totalLessons={12}
        unavailable={false}
      />,
    );

    expect(screen.getByRole('heading', { name: '理论 · 实战覆盖' })).toBeTruthy();
    expect(screen.getByText('章已关联实战')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('章补充阅读')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByText('课有理论锚点')).toBeTruthy();
    expect(screen.getByText('9/12')).toBeTruthy();
  });

  it('unavailable 时只渲染占位说明', () => {
    render(
      <CourseCoverageCard
        mappedChapters={0}
        supplementalChapters={0}
        anchoredLessons={0}
        totalLessons={8}
        unavailable
      />,
    );

    expect(screen.getByText('概念关联待补充')).toBeTruthy();
    expect(screen.queryByText('章已关联实战')).toBeNull();
    expect(screen.queryByText('9/12')).toBeNull();
  });
});