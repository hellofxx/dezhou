import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import AchievementBadges from './AchievementBadges';
import type { TrainingRecord } from '../../types';

/**
 * AchievementBadges 徽章带（jsdom）。
 *
 * 契约：八个徽章的判定全部由 records 派生（连续天数 / 各模块加权正确率 /
 * 单次满分样本量 / 平均答题时间），未解锁展示 requirement + 进度条，解锁展示日期。
 * 覆盖零数据边界（首次训练前不得误判解锁）。
 *
 * 注意：streak7 的 description 与 requirement 文案同为「连续训练 7 天」，
 * 故解锁与否一律用「进度条数量 + 解锁日期」判定，不做文案存在性断言。
 */

const DAY = 24 * 60 * 60 * 1000;

function buildRecord(
  id: string,
  module: TrainingRecord['module'],
  createdAt: number,
  correct: number,
  total: number,
  averageTime = 6000,
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
      averageTime,
      timestamp: createdAt,
      details: [],
    },
  };
}

/** 未解锁徽章各带一条进度条（内联 width 百分比），数量 = 锁定徽章数 */
function progressWidths(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll<HTMLElement>('div[style]'))
    .map((el) => el.style.width)
    .filter((w) => w !== '');
}

afterEach(cleanup);

describe('AchievementBadges 徽章带', () => {
  it('零记录：八个徽章全部未解锁，展示 requirement 而不展示解锁日期', () => {
    const { container } = render(<AchievementBadges records={[]} />);
    const text = container.textContent ?? '';

    expect(text).toContain('成就');
    for (const name of ['初出茅庐', '一周之约', '百炼成钢', '神射手', 'GTO大师', '完美主义', '全能选手', '速度之王']) {
      expect(text).toContain(name);
    }
    // 未解锁态展示 requirement
    for (const requirement of [
      '完成 1 次训练',
      '完成 100 次训练',
      '任意模块正确率 90%',
      'GTO 正确率 80%',
      '单次 20 题全对',
      '各模块至少 10 次',
      '平均用时 < 5 秒',
    ]) {
      expect(text).toContain(requirement);
    }
    // 八个徽章全部带进度条，且无任何解锁日期（yyyy/m/d）
    expect(progressWidths(container)).toHaveLength(8);
    expect(text).not.toMatch(/\d{4}\/\d{1,2}\/\d{1,2}/);
  });

  it('单次 10 题满分且平均 3 秒：解锁首次训练 / 神射手 / 速度之王，完美主义仍锁定', () => {
    const createdAt = new Date(2026, 0, 5, 10, 0, 0).getTime();
    const { container } = render(
      <AchievementBadges records={[buildRecord('r1', 'range-trainer', createdAt, 10, 10, 3000)]} />,
    );
    const text = container.textContent ?? '';

    // 解锁的三个徽章：不再展示 requirement，改为展示日期 2026/1/5
    expect(text).not.toContain('完成 1 次训练');
    expect(text).not.toContain('任意模块正确率 90%');
    expect(text).not.toContain('平均用时 < 5 秒');
    expect(text).toContain('2026/1/5');

    // 未解锁：20 题样本量要求未达成，三大模块训练量也不足
    expect(text).toContain('单次 20 题全对');
    expect(text).toContain('各模块至少 10 次');
    expect(progressWidths(container)).toHaveLength(5);
  });

  it('断档的累计训练天数不计入连续，7 天徽章保持锁定', () => {
    const start = new Date(2026, 2, 1, 9, 0, 0).getTime();
    // 连续 4 天 + 断档 + 再连续 3 天 → maxStreak = 4，未达成 7 天
    const records = [
      ...[0, 1, 2, 3].map((d) => buildRecord(`a${d}`, 'range-trainer', start + d * DAY, 5, 10)),
      ...[10, 11, 12].map((d) => buildRecord(`b${d}`, 'range-trainer', start + d * DAY, 5, 10)),
    ];
    const { container } = render(<AchievementBadges records={records} />);

    // 仅首次训练解锁 → 7 个徽章带进度条；且不出现第 7 天日期
    expect(progressWidths(container)).toHaveLength(7);
    expect(container.textContent).toContain('2026/3/1');
    expect(container.textContent).not.toContain('2026/3/7');
  });

  it('连续 7 天训练解锁一周之约并记录第 7 天日期', () => {
    const start = new Date(2026, 2, 1, 9, 0, 0).getTime();
    const consecutive = [0, 1, 2, 3, 4, 5, 6].map((d) =>
      buildRecord(`c${d}`, 'range-trainer', start + d * DAY, 5, 10),
    );

    const { container } = render(<AchievementBadges records={consecutive} />);

    // 首次训练 + 连续 7 天各解锁一个 → 6 个徽章仍锁定
    expect(progressWidths(container)).toHaveLength(6);
    expect(container.textContent).toContain('2026/3/7');
  });

  it('GTO 正确率 70% 时进度条展示 70% 且徽章保持锁定', () => {
    const { container } = render(
      <AchievementBadges records={[buildRecord('g1', 'gto-simulator', Date.now(), 7, 10)]} />,
    );

    expect(container.textContent).toContain('GTO 正确率 80%');
    expect(progressWidths(container)).toContain('70%');
  });

  it('三大模块各 10 次训练后全能选手解锁', () => {
    const now = Date.now();
    const records: TrainingRecord[] = [];
    for (const module of ['range-trainer', 'pot-odds', 'gto-simulator'] as const) {
      for (let i = 0; i < 10; i++) {
        records.push(buildRecord(`${module}-${i}`, module, now - i * DAY, 5, 10));
      }
    }

    const { container } = render(<AchievementBadges records={records} />);

    expect(container.textContent).not.toContain('各模块至少 10 次');
  });
});
