import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import DailyChallenge from './DailyChallenge';
import { useProgressStore, DEFAULT_STREAK_STATE } from '../../store';
import type { TrainingRecord } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * DailyChallenge 今日任务卡（jsdom）。
 *
 * 契约（口径与文案承诺一致）：
 * - 每日挑战按日期种子轮换模块 / 题量 / 正确率目标；
 * - 完成判定为「今日该模块累计答题数达标且加权正确率高于目标」，
 *   答 1 题不得虚标已完成（回归锁）；
 * - 未完成时展示「开始挑战」并跳对应模块，每日谜题行跳 /puzzle/daily。
 *
 * 时间固定 2026-01-02：年内第 2 天 → types[2] = 'gto'，目标 25 题 / 正确率 > 85%。
 */

function buildRecord(
  id: string,
  module: TrainingRecord['module'],
  total: number,
  correct: number,
  createdAt = Date.now(),
): TrainingRecord {
  return {
    id,
    module,
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module,
      totalQuestions: total,
      correctAnswers: correct,
      accuracy: total > 0 ? correct / total : 0,
      averageTime: 4000,
      timestamp: createdAt,
      details: [],
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function seedStore(records: TrainingRecord[], currentStreak = 4) {
  useProgressStore.setState({
    records,
    streak: { ...DEFAULT_STREAK_STATE, currentStreak },
  });
}

function renderCard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <DailyChallenge />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 0, 2, 10, 0, 0));
  seedStore([]);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  seedStore([]);
});

describe('DailyChallenge 今日任务', () => {
  it('按日期种子渲染当日模块目标、奖励与连续天数', () => {
    const { container } = renderCard();
    const text = container.textContent ?? '';

    expect(text).toContain('今日任务');
    expect(text).toContain('完成 25 题 GTO 模拟训练，正确率 > 85%');
    expect(text).toContain('奖励: GTO 精英');
    expect(text).toContain('未完成');
    expect(text).toContain('开始挑战');
    expect(text).toContain('4');
    expect(text).toContain('连续训练天数');
    // 每日谜题入口
    expect(text).toContain('每日谜题');
  });

  it('答 1 题即达标属于虚标：题量不足时保持未完成（回归锁）', () => {
    seedStore([buildRecord('tiny', 'gto-simulator', 1, 1)]);

    const { container } = renderCard();

    expect(container.textContent).toContain('未完成');
    expect(container.textContent).toContain('开始挑战');
  });

  it('题量达标但正确率未超过目标时仍为未完成', () => {
    seedStore([buildRecord('low', 'gto-simulator', 25, 20)]);

    const { container } = renderCard();

    expect(container.textContent).toContain('未完成');
  });

  it('今日该模块累计题量与正确率达标后标记已完成并隐藏挑战按钮', () => {
    seedStore([
      buildRecord('a', 'gto-simulator', 15, 15),
      buildRecord('b', 'gto-simulator', 10, 9),
    ]);

    const { container } = renderCard();
    const text = container.textContent ?? '';

    expect(text).toContain('已完成');
    expect(text).not.toContain('开始挑战');
  });

  it('非当日或非目标模块的记录不计入完成判定', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    seedStore([
      buildRecord('old', 'gto-simulator', 25, 25, yesterday),
      buildRecord('other', 'pot-odds', 25, 25),
    ]);

    const { container } = renderCard();

    expect(container.textContent).toContain('未完成');
    expect(toLocalDateKey(yesterday)).toBe('2026-01-01');
  });

  it('点击「开始挑战」跳目标模块，点击每日谜题跳 /puzzle/daily', () => {
    const { container, getByText } = renderCard();

    fireEvent.click(getByText('开始挑战'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/gto-simulator');

    fireEvent.click(getByText('每日谜题'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/puzzle/daily');
  });
});
