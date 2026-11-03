import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ModuleStatsPage from './ModuleStatsPage';
import { useProgressStore } from '../../store';
import type { TrainingRecord } from '../../types';

/**
 * ModuleStatsPage 单模块统计页（jsdom）。
 *
 * 契约：统计口径按 module 过滤（会话数 / 加权正确率 / 加权平均用时），
 * 无数据时四个区块各自出空态；返回按钮回 /progress。
 * 覆盖 RangeStatsPage / GTOStatsPage 的复用目标页（见 stats/StatsPages.test.tsx）。
 */

const DAY = 24 * 60 * 60 * 1000;

function buildRecord(
  id: string,
  module: TrainingRecord['module'],
  createdAt: number,
  correct: number,
  total: number,
  details: TrainingRecord['result']['details'] = [],
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
      details,
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function renderPage(moduleName = 'range-trainer') {
  return render(
    <MemoryRouter initialEntries={['/progress/range']}>
      <ModuleStatsPage moduleName={moduleName} displayName="手牌范围训练" />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useProgressStore.setState({ records: [] });
});

afterEach(() => {
  cleanup();
  useProgressStore.setState({ records: [] });
});

describe('ModuleStatsPage 单模块统计', () => {
  it('按模块过滤记录并展示会话数 / 正确率 / 平均用时', () => {
    const now = Date.now();
    useProgressStore.setState({
      records: [
        buildRecord('r1', 'range-trainer', now, 8, 10),
        buildRecord('r2', 'range-trainer', now - DAY, 6, 10),
        // 其他模块记录不得计入本页统计
        buildRecord('p1', 'pot-odds', now, 1, 10),
      ],
    });

    const { container } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('手牌范围训练');
    expect(text).toContain('详细训练统计');
    expect(text).toContain('总训练次数');
    // 2 次会话（pot-odds 被过滤）
    expect(text).toContain('2');
    // 加权正确率 (8+6)/20 = 70.0%
    expect(text).toContain('70.0%');
    // 平均用时 4000ms → 4.0s
    expect(text).toContain('4.0s');
    expect(text).toContain('最近 10 次训练');
    expect(text).toContain('#1');
    expect(text).toContain('#2');
  });

  it('薄弱点分析只列答错过的题目并按错误数降序', () => {
    const now = Date.now();
    useProgressStore.setState({
      records: [
        buildRecord('r1', 'range-trainer', now, 1, 2, [
          { question: 'AA', isCorrect: false, timeTaken: 1000, userAnswer: 'fold', correctAnswer: 'raise' },
          { question: 'KK', isCorrect: true, timeTaken: 1000, userAnswer: 'raise', correctAnswer: 'raise' },
        ]),
        buildRecord('r2', 'range-trainer', now - DAY, 0, 1, [
          { question: 'AA', isCorrect: false, timeTaken: 1000, userAnswer: 'call', correctAnswer: 'raise' },
        ]),
      ],
    });

    const { container } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('薄弱点分析');
    expect(text).toContain('AA');
    // AA 共 2 次全错；KK 答对不出现在薄弱点
    expect(text).toContain('错误 2/2');
    expect(text).toContain('100% 错误率');
    expect(text).not.toContain('错误 0/1');
  });

  it('模块无记录时四个区块均展示空态', () => {
    const { container } = renderPage('gto-simulator');
    const text = container.textContent ?? '';

    expect(text).toContain('暂无训练数据');
    expect(text).toContain('暂无记录');
    expect(text).toContain('暂无数据');
    // 空态下统计卡为 0
    expect(text).toContain('0.0%');
  });

  it('返回按钮跳转 /progress', () => {
    const { getByLabelText } = renderPage();
    fireEvent.click(getByLabelText('返回'));
    const probe = document.querySelector('[data-probe]');
    expect(probe?.textContent).toBe('/progress');
  });
});
