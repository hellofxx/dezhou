import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { LevelLadder, findActiveLevelId } from './LevelLadder';
import { useAcademyStore } from '../store';
import { DAY_MS } from '@/shared/utils/toLocalDateKey';
import type { LevelSummary, LevelCertification } from '../types';

/**
 * 课程阶梯契约：
 * - 活跃等级 = 首个已解锁且仍有未完成课程的条目（Hero 与阶梯共用派生）
 * - 活跃等级默认展开；点击已展开等级头跳转首个未完成课程，收起态点击仅展开
 * - 未解锁等级禁用并展示解锁条件
 * - 全部完成的等级展开后：标准变体给认证入口；有效期内显示有效期；过期给续期；冷却给提示
 */

function makeLevel(
  id: string,
  level: number,
  lessonIds: string[],
  overrides: Partial<LevelSummary> = {},
): LevelSummary {
  return {
    id,
    level: level as LevelSummary['level'],
    title: `${id} 标题`,
    description: `${id} 描述`,
    icon: '🌱',
    unlockRequirement: `${id} 解锁条件`,
    lessons: lessonIds.map((lessonId, index) => ({
      id: lessonId,
      level: level as LevelSummary['level'],
      order: index + 1,
      title: `${lessonId} 名称`,
      subtitle: '',
      duration: '5 min',
    })),
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

// 使用非真实 Level id，避免 resolver 命中 academy.levelTitle.* 译文（断言回退标题）
const levels: LevelSummary[] = [
  makeLevel('test-l1', 1, ['l1-a', 'l1-b']),
  makeLevel('test-l2', 2, ['l2-a', 'l2-b']),
  makeLevel('test-l3', 3, ['l3-a']),
];

function renderLadder(
  componentLevels: LevelSummary[],
  completedLessons: string[],
  isUnlocked: (levelId: string) => boolean,
) {
  return render(
    <MemoryRouter>
      <LevelLadder
        levels={componentLevels}
        completedLessons={completedLessons}
        isUnlocked={isUnlocked}
      />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function seedCertification(level: number, cert: Partial<LevelCertification>) {
  const state = useAcademyStore.getState();
  useAcademyStore.setState({
    certifications: {
      ...state.certifications,
      [level]: {
        level,
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

const unlockedFirstTwo = (levelId: string) => levelId === 'test-l1' || levelId === 'test-l2';

afterEach(() => {
  cleanup();
  const store = useAcademyStore.getState();
  store.resetProgress();
  store.switchVariant('standard');
});

describe('findActiveLevelId：活跃等级派生', () => {
  it('返回首个已解锁且仍有未完成课程的等级', () => {
    expect(findActiveLevelId(levels, [], unlockedFirstTwo)).toBe('test-l1');
    expect(findActiveLevelId(levels, ['l1-a', 'l1-b'], unlockedFirstTwo)).toBe('test-l2');
  });

  it('未解锁等级跳过；全部完成返回 null', () => {
    expect(findActiveLevelId(levels, ['l1-a', 'l1-b'], (id) => id === 'test-l1')).toBeNull();
    expect(
      findActiveLevelId(levels, ['l1-a', 'l1-b', 'l2-a', 'l2-b'], unlockedFirstTwo),
    ).toBeNull();
  });
});

describe('LevelLadder：展开与跳转', () => {
  it('活跃等级默认展开并展示课时 chips 与「你在这里」', () => {
    renderLadder(levels, [], unlockedFirstTwo);
    expect(screen.getByText('你在这里')).toBeTruthy();
    const l1Head = screen.getByText('test-l1 标题').closest('button')!;
    expect(l1Head.getAttribute('aria-expanded')).toBe('true');
    // 已展开等级头再次点击 → 进入首个未完成课程
    fireEvent.click(l1Head);
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-a');
  });

  it('收起等级点击仅展开，不跳转', () => {
    renderLadder(levels, [], unlockedFirstTwo);
    const l2Head = screen.getByText('test-l2 标题').closest('button')!;
    expect(l2Head.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(l2Head);
    expect(l2Head.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByTestId('location').textContent).toBe('/');
  });

  it('课时 chip 点击跳转对应课程，并标注已完成/下一课状态', () => {
    renderLadder(levels, ['l1-a'], unlockedFirstTwo);
    const doneChip = screen.getByRole('button', { name: /已完成 · l1-a 名称/ });
    const nextChip = screen.getByRole('button', { name: /下一课 · l1-b 名称/ });
    fireEvent.click(doneChip);
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-a');
    fireEvent.click(nextChip);
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-b');
  });

  it('未解锁等级禁用并展示解锁条件', () => {
    renderLadder(levels, [], (levelId) => levelId === 'test-l1');
    const l3Head = screen.getByText('test-l3 标题').closest('button')!;
    expect(l3Head.disabled).toBe(true);
    expect(screen.getByText('test-l3 解锁条件')).toBeTruthy();
  });

  it('全部完成的等级展开后提供认证入口', () => {
    renderLadder(levels, ['l1-a', 'l1-b'], unlockedFirstTwo);
    // 活跃等级为 l2（展开），点击 l1 头展开已完成的等级
    const l1Head = screen.getByText('test-l1 标题').closest('button')!;
    fireEvent.click(l1Head);
    expect(screen.getByText('全部完成')).toBeTruthy();
    fireEvent.click(screen.getByText('参加认证测验'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/certification/1');
  });
});

describe('LevelLadder：认证状态呈现', () => {
  it('非标准变体：不提供认证入口', () => {
    useAcademyStore.getState().switchVariant('short-deck');
    renderLadder(levels, ['l1-a', 'l1-b'], unlockedFirstTwo);
    fireEvent.click(screen.getByText('test-l1 标题').closest('button')!);
    expect(screen.queryByText('参加认证测验')).toBeNull();
  });

  it('认证有效：展示有效期，不再提供重考入口', () => {
    const now = Date.now();
    seedCertification(1, { certifiedAt: now, validUntil: now + 10 * DAY_MS });
    const { container } = renderLadder(levels, ['l1-a', 'l1-b'], unlockedFirstTwo);
    fireEvent.click(screen.getByText('test-l1 标题').closest('button')!);
    expect(container.textContent).toContain('认证有效至');
    expect(screen.queryByText('参加认证测验')).toBeNull();
  });

  it('认证过期：显示续期入口并跳转认证页', () => {
    const now = Date.now();
    seedCertification(1, { certifiedAt: now - 40 * DAY_MS, validUntil: now - DAY_MS });
    const { container } = renderLadder(levels, ['l1-a', 'l1-b'], unlockedFirstTwo);
    fireEvent.click(screen.getByText('test-l1 标题').closest('button')!);
    expect(container.textContent).toContain('认证已过期 · 续期 Level 1');
    fireEvent.click(screen.getByText('认证已过期 · 续期 Level 1'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/certification/1');
  });

  it('冷却中：显示冷却提示且无认证入口', () => {
    seedCertification(1, {
      lastAttemptAt: Date.now(),
      certifiedAt: undefined,
      validUntil: undefined,
    });
    const { container } = renderLadder(levels, ['l1-a', 'l1-b'], unlockedFirstTwo);
    fireEvent.click(screen.getByText('test-l1 标题').closest('button')!);
    expect(container.textContent).toContain('认证冷却中');
    expect(screen.queryByText('参加认证测验')).toBeNull();
  });
});
