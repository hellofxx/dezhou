import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import Leaderboard from './Leaderboard';
import { useProgressStore } from '../../store';
import type { TrainingRecord } from '../../types';

/**
 * Leaderboard 排行榜（jsdom）。
 *
 * 契约：
 * - 三个维度标签页（总分 / 正确率 / 训练量）切换排序口径；
 * - 用户条目由 progress store 汇总派生（score = 会话数*30 + 正确率*1000），
 *   并始终插入到同一榜单里参与排序。
 */

function buildRecord(id: string, correct: number, total: number): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt: Date.now(),
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions: total,
      correctAnswers: correct,
      accuracy: total > 0 ? correct / total : 0,
      averageTime: 4000,
      timestamp: Date.now(),
      details: [],
    },
  };
}

/** 榜单行（含 gap-x-3 的 flex 行），返回该行最后一格（数值列）文本 */
function rowValue(container: HTMLElement, name: string): string | null {
  const row = Array.from(container.querySelectorAll<HTMLElement>('div'))
    .filter((el) => el.className.includes('gap-x-3'))
    .find((el) => (el.textContent ?? '').includes(name));
  if (!row) return null;
  return row.lastElementChild?.textContent?.trim() ?? null;
}

beforeEach(() => {
  useProgressStore.setState({ records: [buildRecord('r1', 5, 10), buildRecord('r2', 5, 10)] });
});

afterEach(() => {
  cleanup();
  useProgressStore.setState({ records: [] });
});

describe('Leaderboard 排行榜', () => {
  it('渲染标题、三个维度标签与含用户条目的完整榜单', () => {
    const { container, getByText } = render(<Leaderboard />);
    const text = container.textContent ?? '';

    expect(text).toContain('排行榜');
    for (const tab of ['总分', '正确率', '训练量']) {
      expect(getByText(tab)).toBeTruthy();
    }
    // 19 位对照玩家 + 用户条目
    expect(text).toContain('Phil Ivey');
    expect(text).toContain('David Peters');
    expect(text).toContain('你');
  });

  it('总分口径：用户分数 = 会话数*30 + 正确率*1000', () => {
    const { container } = render(<Leaderboard />);

    // 2 次会话全部 50% → 2*30 + 500 = 560
    expect(rowValue(container, '你')).toBe('560');
    // 榜首为分数最高的对照玩家
    expect(rowValue(container, 'Phil Ivey')).toBe('9850');
  });

  it('切到正确率口径展示百分比并重排', () => {
    const { container, getByText } = render(<Leaderboard />);

    fireEvent.click(getByText('正确率'));

    expect(rowValue(container, '你')).toBe('50.0%');
    expect(rowValue(container, 'Phil Ivey')).toBe('94.0%');
  });

  it('切到训练量口径展示会话数', () => {
    const { container, getByText } = render(<Leaderboard />);

    fireEvent.click(getByText('训练量'));

    expect(rowValue(container, '你')).toBe('2');
    expect(rowValue(container, 'Phil Ivey')).toBe('312');
  });

  it('空记录时用户条目仍渲染为 0 分 / 0% / 0 次', () => {
    useProgressStore.setState({ records: [] });
    const { container } = render(<Leaderboard />);

    expect(rowValue(container, '你')).toBe('0');

    fireEvent.click(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === '正确率')!);
    expect(rowValue(container, '你')).toBe('0.0%');
  });
});
