import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LevelCard } from './LevelCard';
import { useAcademyStore } from '../store';
import { DAY_MS } from '@/shared/utils/toLocalDateKey';
import type { LevelInfo, LevelCertification } from '../types';

/**
 * LevelCard 契约：
 * - 未解锁：禁用卡片 + 展示解锁条件
 * - 已解锁：按条目自身口径展示完成进度（l4a/l4b 各自独立）
 * - 全部完成且标准变体：提供认证入口（修复认证死路由）
 * - 认证有效：展示有效期，不再出现重考入口；过期：显示续期；冷却：显示冷却提示
 * - 非标准变体：不出现认证入口（变体认证 de-scope）
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

const level: LevelInfo = {
  id: 'card-l1',
  level: 1,
  title: '卡片等级',
  description: '卡片描述',
  icon: '🌱',
  unlockRequirement: '完成前置',
  lessons: [
    { id: 'card-a', level: 1, order: 1, title: '甲', subtitle: '', duration: '5 min', content: [], quiz: [] },
    { id: 'card-b', level: 1, order: 2, title: '乙', subtitle: '', duration: '5 min', content: [], quiz: [] },
    { id: 'card-c', level: 1, order: 3, title: '丙', subtitle: '', duration: '5 min', content: [], quiz: [] },
  ],
};

function renderCard(unlocked: boolean, completedLessons: string[] = []) {
  return render(
    <MemoryRouter>
      <LevelCard level={level} unlocked={unlocked} completedLessons={completedLessons} index={0} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function seedCertification(cert: Partial<LevelCertification>) {
  const state = useAcademyStore.getState();
  useAcademyStore.setState({
    certifications: {
      ...state.certifications,
      1: {
        level: 1,
        requiredAccuracy: 70,
        cooldownPeriod: 24,
        lastAttemptAt: Date.now(),
        questionCount: 20,
        timeLimit: 0,
        attempts: 1,
        bestScore: 85,
        variant: 'standard',
        ...cert,
      },
    },
  });
}

const allDone = ['card-a', 'card-b', 'card-c'];

afterEach(() => {
  cleanup();
  const store = useAcademyStore.getState();
  store.resetProgress();
  store.switchVariant('standard');
});

describe('LevelCard', () => {
  it('未解锁：卡片禁用并展示解锁条件', () => {
    const { container } = renderCard(false);
    const card = container.querySelector('button')!;
    expect(card.disabled).toBe(true);
    expect(container.textContent).toContain('卡片等级');
    expect(container.textContent).toContain('完成前置');
    expect(screen.queryByText('参加 Level 1 认证测验')).toBeNull();
  });

  it('已解锁：展示条目自身进度，点击直达首个未完成课程', () => {
    const { container } = renderCard(true, ['card-a']);
    expect(container.textContent).toContain('1/3 课时完成');
    expect(container.textContent).toContain('33%');

    fireEvent.click(container.querySelector('button')!);
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/card-b');
  });

  it('全部完成：展示认证入口并跳转认证页（不触发卡片跳转）', () => {
    const { container } = renderCard(true, allDone);
    expect(container.textContent).toContain('3/3 课时完成');
    expect(container.textContent).toContain('100%');

    fireEvent.click(screen.getByRole('button', { name: '参加 Level 1 认证测验' }));
    expect(screen.getByTestId('location').textContent).toBe('/academy/certification/1');
  });

  it('认证有效：展示有效期，不再提供重考入口', () => {
    const now = Date.now();
    seedCertification({ certifiedAt: now, validUntil: now + 12 * DAY_MS });
    const { container } = renderCard(true, allDone);
    expect(container.textContent).toContain('认证有效至');
    expect(screen.queryByRole('button', { name: '参加 Level 1 认证测验' })).toBeNull();
  });

  it('认证过期：显示续期入口并跳转认证页', () => {
    const now = Date.now();
    seedCertification({ certifiedAt: now - 40 * DAY_MS, validUntil: now - DAY_MS });
    const { container } = renderCard(true, allDone);
    expect(container.textContent).toContain('认证已过期 · 续期 Level 1');

    fireEvent.click(screen.getByRole('button', { name: '认证已过期 · 续期 Level 1' }));
    expect(screen.getByTestId('location').textContent).toBe('/academy/certification/1');
  });

  it('冷却中：显示冷却提示且无认证入口', () => {
    seedCertification({ lastAttemptAt: Date.now(), certifiedAt: undefined, validUntil: undefined });
    const { container } = renderCard(true, allDone);
    expect(container.textContent).toContain('认证冷却中');
    expect(screen.queryByRole('button', { name: '参加 Level 1 认证测验' })).toBeNull();
  });

  it('非标准变体：不显示认证入口', () => {
    useAcademyStore.getState().switchVariant('heads-up');
    const { container } = renderCard(true, allDone);
    expect(container.textContent).toContain('3/3 课时完成');
    expect(screen.queryByRole('button', { name: '参加 Level 1 认证测验' })).toBeNull();
    expect(container.textContent).not.toContain('认证');
  });
});
