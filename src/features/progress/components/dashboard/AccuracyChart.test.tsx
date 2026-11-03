import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { DailyStats } from '../../types';
import AccuracyChart from './AccuracyChart';

/**
 * AccuracyChart 正确率趋势图（jsdom，recharts 轻量替身）。
 *
 * 契约：
 * - 空态（无数据 / 全部日期 0 题）展示 zh 空态文案，不挂载图表；
 * - 有数据态把 DailyStats 映射为 { date: MM-DD, accuracy: 百分比整数 | null, sessions }；
 * - questions === 0 的日期映射为 null（断点），不画成 0%。
 *
 * recharts 的 ResponsiveContainer 依赖真实布局（ResizeObserver / 尺寸测量），
 * jsdom 下会渲染为空，故此处整体 mock 为可读取 props 的轻量替身，断言数据映射契约本身。
 */

interface ChartPoint {
  date: string;
  accuracy: number | null;
  sessions: number;
}

/** 捕获 AreaChart 收到的 data（recharts 替身不渲染真实折线） */
const chartProps = vi.hoisted(() => ({ data: [] as ChartPoint[] }));

vi.mock('recharts', () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    ResponsiveContainer: Passthrough,
    AreaChart: ({ data, children }: { data?: ChartPoint[]; children?: ReactNode }) => {
      chartProps.data = data ?? [];
      // 用 <svg> 承载 children：<defs>/<linearGradient>/<stop> 只有落在 SVG 命名空间才合法
      return <svg data-testid="area-chart">{children}</svg>;
    },
    Area: () => null,
    XAxis: () => null,
    // 真实 recharts 在 jsdom 不渲染刻度/悬浮层，故直接调用格式化回调断言其契约
    YAxis: ({ tickFormatter }: { tickFormatter?: (v: number) => string }) =>
      tickFormatter ? <span data-testid="y-tick">{tickFormatter(50)}</span> : null,
    CartesianGrid: () => null,
    Tooltip: ({ formatter }: { formatter?: (v: number | null) => [string, string] }) =>
      formatter ? (
        <span data-testid="tooltip-format">{`${formatter(42)[0]}|${formatter(null)[0]}`}</span>
      ) : null,
  };
});

function buildDaily(date: string, questions: number, accuracy: number): DailyStats {
  return { date, sessions: 1, questions, accuracy, totalTime: 60_000 };
}

afterEach(() => {
  cleanup();
  chartProps.data = [];
});

describe('AccuracyChart 空态', () => {
  it('无任何日统计时展示标题与空态引导，不挂载图表', () => {
    const { container, queryByTestId } = render(<AccuracyChart dailyStats={[]} />);

    const text = container.textContent ?? '';
    expect(text).toContain('正确率趋势');
    expect(text).toContain('暂无训练数据');
    expect(text).toContain('完成训练后这里会显示你最近 14 天的正确率变化');
    expect(queryByTestId('area-chart')).toBeNull();
  });

  it('所有日期均为 0 题时仍判定为空态（不画成 0% 折线）', () => {
    const stats = [buildDaily('2026-03-01', 0, 0), buildDaily('2026-03-02', 0, 0)];

    const { container, queryByTestId } = render(<AccuracyChart dailyStats={stats} />);

    expect(container.textContent).toContain('暂无训练数据');
    expect(queryByTestId('area-chart')).toBeNull();
  });
});

describe('AccuracyChart 有数据态', () => {
  it('映射 date 为 MM-DD、accuracy 为整数百分比并保留 sessions', () => {
    const stats = [buildDaily('2026-03-05', 10, 0.666), buildDaily('2026-03-06', 8, 0.5)];

    const { queryByTestId } = render(<AccuracyChart dailyStats={stats} />);

    expect(queryByTestId('area-chart')).not.toBeNull();
    expect(chartProps.data).toEqual([
      { date: '03-05', accuracy: 67, sessions: 1 },
      { date: '03-06', accuracy: 50, sessions: 1 },
    ]);
  });

  it('坐标轴与提示框使用百分比格式，空值显示 N/A', () => {
    const { getByTestId } = render(
      <AccuracyChart dailyStats={[buildDaily('2026-03-05', 10, 0.5)]} />,
    );

    expect(getByTestId('y-tick').textContent).toBe('50%');
    expect(getByTestId('tooltip-format').textContent).toBe('42%|N/A');
  });

  it('0 题日期映射为 null 断点，其余日期正常出点', () => {
    const stats = [buildDaily('2026-03-05', 0, 0), buildDaily('2026-03-06', 4, 0.75)];

    const { container } = render(<AccuracyChart dailyStats={stats} />);

    // 存在有效数据点 → 走图表分支而非空态
    expect(container.textContent).not.toContain('暂无训练数据');
    expect(chartProps.data).toEqual([
      { date: '03-05', accuracy: null, sessions: 1 },
      { date: '03-06', accuracy: 75, sessions: 1 },
    ]);
  });
});
