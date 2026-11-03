import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import AchievementWall from './AchievementWall';
import { useProgressStore } from '../../store';
import { ACHIEVEMENTS } from '../../data/achievements';

/**
 * AchievementWall 成就墙 Dialog（jsdom）。
 *
 * 契约：
 * - 关闭态不渲染内容；开启态展示「已解锁数/总数」与四类标签页；
 * - 默认停在「学习」分类，切页展示对应分类成就；
 * - 未解锁显示锁形图标，解锁显示原图标 + 解锁日期。
 *
 * Radix Dialog 内容渲染在 portal（document.body），断言用 baseElement。
 */

const TOTAL = ACHIEVEMENTS.length;

function seedStore(overrides: { unlocked?: string[]; dates?: Record<string, number> } = {}) {
  useProgressStore.setState({
    unlockedAchievements: overrides.unlocked ?? [],
    achievementUnlockDates: overrides.dates ?? {},
  });
}

beforeEach(() => seedStore());

afterEach(() => {
  cleanup();
  seedStore();
});

describe('AchievementWall 成就墙', () => {
  it('关闭态不渲染成就墙内容', () => {
    const { baseElement } = render(<AchievementWall open={false} onOpenChange={() => {}} />);
    expect(baseElement.textContent ?? '').not.toContain('成就墙');
  });

  it('开启态展示进度与四类标签页，默认停在「学习」分类', () => {
    const { baseElement, getByText } = render(
      <AchievementWall open onOpenChange={() => {}} />,
    );
    const text = baseElement.textContent ?? '';

    expect(text).toContain('成就墙');
    expect(text).toContain(`0/${TOTAL} 已解锁`);
    for (const tab of ['学习', '连续', '技能', '里程碑']) {
      expect(getByText(tab)).toBeTruthy();
    }
    // 学习分类首项（初出茅庐）可见；连续分类项不可见
    expect(text).toContain('初出茅庐');
    expect(text).not.toContain('三日坚持');
    // 全部未解锁 → 只剩锁形图标
    expect(text).toContain('🔒');
  });

  it('切换到「连续」分类展示连续类成就', async () => {
    const { baseElement, getByText } = render(
      <AchievementWall open onOpenChange={() => {}} />,
    );

    fireEvent.click(getByText('连续'));

    // AnimatePresence mode="wait" 需等退出动画结束后才挂载新分类
    await waitFor(
      () => {
        expect(baseElement.textContent).toContain('三日坚持');
      },
      { timeout: 3000 },
    );
    const text = baseElement.textContent ?? '';
    expect(text).toContain('一周之约');
    expect(text).not.toContain('初出茅庐');
  });

  it('已解锁成就展示原图标与解锁日期，并计入进度', () => {
    const unlockDate = new Date(2026, 0, 5, 8, 0, 0).getTime();
    seedStore({ unlocked: ['first-training'], dates: { 'first-training': unlockDate } });

    const { baseElement } = render(<AchievementWall open onOpenChange={() => {}} />);
    const text = baseElement.textContent ?? '';

    expect(text).toContain(`1/${TOTAL} 已解锁`);
    expect(text).toContain('🌱');
    expect(text).toContain('2026/01/05');
  });
});
