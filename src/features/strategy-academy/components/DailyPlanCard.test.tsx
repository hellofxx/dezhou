import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { DailyPlanCard } from './DailyPlanCard';
import { useAcademyStore } from '../store';
import type { DailyPlan } from '../types';

/**
 * 今日计划卡契约：
 * - 挂载时惰性生成计划；无内容计划整卡不渲染
 * - 复习 / 新课 / 定向练习三项按计划内容渲染并可跳转
 * - 刷新按钮走 force 刷新（绕过同日新鲜度守卫）
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function makePlan(overrides: Partial<DailyPlan> = {}): DailyPlan {
  return {
    reviewLessons: [],
    newLesson: null,
    practiceSpots: [],
    estimatedTime: '5-10',
    focusArea: null,
    generatedAt: Date.now(),
    ...overrides,
  };
}

function renderCard() {
  return render(
    <MemoryRouter>
      <DailyPlanCard />
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

describe('DailyPlanCard', () => {
  it('挂载时惰性生成计划并渲染三项内容与焦点 / 时长', async () => {
    useAcademyStore.setState({
      progress: {
        completedLessons: ['l1-basics'],
        quizScores: {},
        currentLesson: null,
        startedAt: Date.now(),
        completedUnits: {},
      },
    });
    const { container } = renderCard();

    await waitFor(() => expect(useAcademyStore.getState().dailyPlan).not.toBeNull());
    expect(screen.getByText('今日计划')).toBeTruthy();
    expect(container.textContent).toContain('约');

    // 计划至少包含「新课」或「练习」之一（依据当前能力与完成度生成）
    const plan = useAcademyStore.getState().dailyPlan!;
    expect(plan.reviewLessons.length + (plan.newLesson ? 1 : 0) + plan.practiceSpots.length)
      .toBeGreaterThan(0);
  });

  it('无内容计划整卡不渲染', () => {
    useAcademyStore.setState({ dailyPlan: makePlan() });
    const { container } = renderCard();
    expect(container.textContent).not.toContain('今日计划');
    expect(container.querySelector('section')).toBeNull();
  });

  it('渲染复习 / 新课 / 定向练习并支持跳转', async () => {
    useAcademyStore.setState({
      dailyPlan: makePlan({
        reviewLessons: ['l1-basics'],
        newLesson: 'l1-position',
        practiceSpots: ['drill-outs', 'drill-pot-odds'],
        focusArea: 'rangeKnowledge',
      }),
    });
    const { container } = renderCard();

    expect(container.textContent).toContain('复习：德州扑克规则与牌型');
    expect(container.textContent).toContain('今日重点 · 范围知识');
    expect(container.textContent).toContain('约 5-10 分钟');
    expect(container.textContent).toContain('学习新课：位置的力量');
    expect(container.textContent).toContain('定向练习（2 组）');

    fireEvent.click(screen.getByText(/学习新课/));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-position');

    fireEvent.click(screen.getByText(/定向练习/));
    expect(screen.getByTestId('location').textContent).toBe('/academy/quick-drill');
  });

  it('刷新按钮强制重新生成计划（同日守卫不吞手动刷新）', async () => {
    renderCard();
    await waitFor(() => expect(useAcademyStore.getState().dailyPlan).not.toBeNull());
    const first = useAcademyStore.getState().dailyPlan;

    fireEvent.click(screen.getByRole('button', { name: '刷新计划' }));
    const second = useAcademyStore.getState().dailyPlan;
    expect(second).not.toBe(first);
  });
});
