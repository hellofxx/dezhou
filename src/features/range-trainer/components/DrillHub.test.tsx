import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DrillHub from './DrillHub';
import { useProgressStore } from '@/features/progress/store';
import type { TrainingRecord } from '@/features/progress/types';

/**
 * DrillHub 训练枢纽（jsdom）。
 *
 * 契约：
 * - 四张训练台分别链接到二级站（/drill/range、/drill/odds、/gto-simulator、/drill/puzzle）；
 * - `?mode=` 命中对应卡（data-active + aria-current），未知值不高亮；
 * - 「今日弱项」按题量加权找最弱模块，题量不足时降级为空态文案；
 * - 弱项入口只链到 /progress?tab=overview（不嵌入跨模块组件）。
 */

const DRILL_ROUTES = ['/drill/range', '/drill/odds', '/gto-simulator', '/drill/puzzle'];

function buildRecord(
  id: string,
  correct: number,
  total: number,
  module: TrainingRecord['module'],
): TrainingRecord {
  return {
    id,
    module,
    mode: 'quiz',
    createdAt: Date.now(),
    result: {
      sessionId: id,
      module,
      totalQuestions: total,
      correctAnswers: correct,
      accuracy: total > 0 ? correct / total : 0,
      averageTime: 4000,
      timestamp: Date.now(),
      details: [],
    },
  };
}

function renderHub(entry = '/drill') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <DrillHub />
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

describe('DrillHub 训练枢纽', () => {
  it('渲染四张训练台并链接到冻结路由', () => {
    const { container } = renderHub();
    const hrefs = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));

    for (const route of DRILL_ROUTES) {
      expect(hrefs).toContain(route);
    }
    expect(container.textContent ?? '').toContain('训练场');
  });

  it('?mode=odds 时只高亮赔率卡，其他卡不高亮', () => {
    const { container } = renderHub('/drill?mode=odds');
    const active = Array.from(container.querySelectorAll('[data-active="true"]'));

    expect(active).toHaveLength(1);
    expect(active[0]?.getAttribute('href')).toBe('/drill/odds');
    expect(active[0]?.getAttribute('aria-current')).toBe('true');
  });

  it('未知 mode 不高亮任何卡', () => {
    const { container } = renderHub('/drill?mode=unknown');

    expect(container.querySelectorAll('[data-active="true"]')).toHaveLength(0);
  });

  it('题量充足时给出最弱模块，并链到弱项分析', () => {
    useProgressStore.setState({
      records: [
        buildRecord('a', 9, 10, 'range-trainer'),
        buildRecord('b', 4, 10, 'pot-odds'),
        // 题量不足 10，不参与弱项判定
        buildRecord('c', 0, 3, 'puzzle-trainer'),
      ],
    });

    const { container } = renderHub();
    const text = container.textContent ?? '';

    expect(text).toContain('赔率计算器');
    expect(text).toContain('40%');
    expect(container.querySelector('a[href="/progress?tab=overview"]')).toBeTruthy();
  });

  it('无记录时展示弱项空态', () => {
    const { container } = renderHub();

    expect(container.textContent ?? '').toContain('完成几轮训练后');
  });
});
