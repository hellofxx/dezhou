import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { useProgress } from './useProgress';
import { useProgressStore, DEFAULT_STREAK_STATE } from '../store';
import type { TrainingRecord } from '../types';
import type { TrainingResult } from '@/shared/types/common';

/**
 * useProgress 消费 hook（jsdom）。
 *
 * 契约：
 * - summary 的 streak 一律以 store.streak 为准（records 派生值不感知冻结卡续接），
 *   longestStreak 取两者较大值，避免 Dashboard / 统计页 / 分享卡三处数字漂移；
 * - recordSession 生成带时间戳与随机后缀 id 的记录并写入 store；
 * - recentRecords 取最近 10 条（createdAt 降序），moduleStats 按模块聚合。
 */

const DAY = 24 * 60 * 60 * 1000;

function buildRecord(id: string, createdAt: number, module: TrainingRecord['module']): TrainingRecord {
  return {
    id,
    module,
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module,
      totalQuestions: 10,
      correctAnswers: 5,
      accuracy: 0.5,
      averageTime: 5000,
      timestamp: createdAt,
      details: [],
    },
  };
}

const RESULT: TrainingResult = {
  sessionId: 'session-x',
  module: 'pot-odds',
  totalQuestions: 20,
  correctAnswers: 15,
  accuracy: 0.75,
  averageTime: 3200,
  timestamp: Date.now(),
  details: [],
};

function Probe() {
  const { summary, moduleStats, recentRecords, recordSession, records } = useProgress();
  return (
    <div>
      <span data-testid="streak">{summary.currentStreak}</span>
      <span data-testid="longest">{summary.longestStreak}</span>
      <span data-testid="sessions">{summary.totalSessions}</span>
      <span data-testid="accuracy">{summary.overallAccuracy.toFixed(3)}</span>
      <span data-testid="modules">{moduleStats.map((m) => `${m.module}:${m.sessions}`).join(',')}</span>
      <span data-testid="recent">{recentRecords.map((r) => r.id).join(',')}</span>
      <span data-testid="record-count">{records.length}</span>
      <button onClick={() => recordSession(RESULT, 'pot-odds')}>record</button>
      <button onClick={() => recordSession(RESULT, 'gto-simulator', 'scenario')}>record-scenario</button>
    </div>
  );
}

function seedStore(records: TrainingRecord[], currentStreak = 0, longestStreak = 0) {
  useProgressStore.setState({
    records,
    streak: { ...DEFAULT_STREAK_STATE, currentStreak, longestStreak },
  });
}

beforeEach(() => seedStore([]));

afterEach(() => {
  cleanup();
  seedStore([]);
});

describe('useProgress 消费 hook', () => {
  it('streak 以 store 为准（records 派生值不覆盖），longest 取两者较大值', () => {
    // 记录为 10 天前的连续 3 天：records 派生 currentStreak = 0、longestStreak = 3
    const base = Date.now() - 10 * DAY;
    seedStore(
      [
        buildRecord('d1', base, 'range-trainer'),
        buildRecord('d2', base + DAY, 'range-trainer'),
        buildRecord('d3', base + 2 * DAY, 'range-trainer'),
      ],
      6,
      2,
    );

    const { getByTestId } = render(<Probe />);

    // 当前连续天数用 store（含冻结卡/Earn Back 语义），不用 records 派生的 0
    expect(getByTestId('streak').textContent).toBe('6');
    // 最长连续取两者最大值：records 派生 3 > store 2
    expect(getByTestId('longest').textContent).toBe('3');
    expect(getByTestId('sessions').textContent).toBe('3');
    expect(getByTestId('accuracy').textContent).toBe('0.500');
  });

  it('recordSession 追加记录并刷新 summary / moduleStats / recentRecords', () => {
    const { getByTestId, getByText } = render(<Probe />);
    expect(getByTestId('record-count').textContent).toBe('0');

    fireEvent.click(getByText('record'));

    expect(getByTestId('record-count').textContent).toBe('1');
    expect(getByTestId('sessions').textContent).toBe('1');
    expect(getByTestId('accuracy').textContent).toBe('0.750');
    expect(getByTestId('modules').textContent).toBe('pot-odds:1');

    const added = useProgressStore.getState().records[0]!;
    expect(added.module).toBe('pot-odds');
    expect(added.mode).toBe('quiz');
    expect(added.result).toBe(RESULT);
    expect(added.id).toMatch(/^\d+-[a-z0-9]+$/);
  });

  it('recordSession 支持自定义 mode', () => {
    const { getByText } = render(<Probe />);

    fireEvent.click(getByText('record-scenario'));

    expect(useProgressStore.getState().records[0]!.mode).toBe('scenario');
  });

  it('recentRecords 仅保留最近 10 条且按时间降序', () => {
    const now = Date.now();
    const records = Array.from({ length: 12 }, (_, i) =>
      buildRecord(`r${i}`, now - (11 - i) * 1000, 'range-trainer'),
    );
    seedStore(records);

    const { getByTestId } = render(<Probe />);

    expect(getByTestId('recent').textContent).toBe(
      ['r11', 'r10', 'r9', 'r8', 'r7', 'r6', 'r5', 'r4', 'r3', 'r2'].join(','),
    );
  });

  it('moduleStats 按模块聚合会话数', () => {
    const now = Date.now();
    seedStore([
      buildRecord('a', now, 'range-trainer'),
      buildRecord('b', now - 1, 'range-trainer'),
      buildRecord('c', now - 2, 'pot-odds'),
    ]);

    const { getByTestId } = render(<Probe />);

    expect(getByTestId('modules').textContent).toBe('range-trainer:2,pot-odds:1');
  });
});
