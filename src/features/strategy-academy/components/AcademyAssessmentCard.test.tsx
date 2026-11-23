/**
 * AcademyAssessmentCard 契约：
 * - 评估区标题与 section 语义标签走 `nav.assessment`
 * - Level 可用时给出检查点 / 认证 / 定位测评三条入口，路径带当前 Level
 * - Level 不可用（非标准变体）时降级为仅定位测评
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AcademyAssessmentCard from './AcademyAssessmentCard';

afterEach(cleanup);

function renderCard(level: number | null) {
  return render(
    <MemoryRouter>
      <AcademyAssessmentCard level={level} />
    </MemoryRouter>,
  );
}

describe('AcademyAssessmentCard', () => {
  it('渲染评估区标题与三条入口，检查点/认证指向当前 Level', () => {
    renderCard(3);

    expect(screen.getByRole('region', { name: '评估' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '评估' })).toBeTruthy();

    expect(
      screen.getByRole('link', { name: '级别检查点' }).getAttribute('href'),
    ).toBe('/academy/checkpoint/3');
    expect(
      screen.getByRole('link', { name: '级别认证' }).getAttribute('href'),
    ).toBe('/academy/certification/3');
    expect(
      screen.getByRole('link', { name: '定位测评' }).getAttribute('href'),
    ).toBe('/academy/placement');
  });

  it('Level 不可用时只保留定位测评入口', () => {
    renderCard(null);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: '定位测评' }).getAttribute('href'),
    ).toBe('/academy/placement');
    expect(screen.queryByRole('link', { name: '级别检查点' })).toBeNull();
    expect(screen.queryByRole('link', { name: '级别认证' })).toBeNull();
  });
});