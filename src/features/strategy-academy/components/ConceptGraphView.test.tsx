import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import ConceptGraphView from './ConceptGraphView';
import { useAcademyStore } from '../store';
import { getTotalLessonCount } from '../utils/academyMeta';
import { CONCEPT_NODES } from '../data/conceptNodes';

/**
 * 图谱页组合契约：
 * - 统计三卡（已学习 / 未学习 / 总课程）随进度变化
 * - 跨模块概念卡按数据渲染并跳转 relatedLessons[0]
 * - 返回学院按钮
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderView() {
  return render(
    <MemoryRouter>
      <ConceptGraphView />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

describe('ConceptGraphView', () => {
  it('展示统计卡与跨模块概念节点', () => {
    const total = getTotalLessonCount();
    const { container } = renderView();

    expect(screen.getByText('知识图谱')).toBeTruthy();
    expect(screen.getByText('已学习')).toBeTruthy();
    expect(screen.getByText('未学习')).toBeTruthy();
    expect(screen.getByText('总课程')).toBeTruthy();
    // 未学习数 = 总课程数（默认无完成记录）
    expect(screen.getAllByText(String(total)).length).toBeGreaterThanOrEqual(2);
    expect(container.textContent).toContain('0');

    expect(screen.getByText('核心概念关联')).toBeTruthy();
    expect(screen.getByText(CONCEPT_NODES[0]!.name)).toBeTruthy();
  });

  it('完成课程后已学习计数增加', () => {
    useAcademyStore.getState().completeLesson('l1-basics');
    useAcademyStore.getState().completeLesson('l1-position');
    const total = getTotalLessonCount();
    const { container } = renderView();

    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain(String(total - 2));
  });

  it('点击概念卡跳转首个关联课程', () => {
    renderView();
    const concept = CONCEPT_NODES[0]!;
    fireEvent.click(screen.getByText(concept.name));
    expect(screen.getByTestId('location').textContent).toBe(
      `/academy/lesson/${concept.relatedLessons[0]}`,
    );
  });

  it('返回学院按钮跳转 /academy', () => {
    renderView();
    fireEvent.click(screen.getByText('返回策略学院'));
    expect(screen.getByTestId('location').textContent).toBe('/academy');
  });
});
