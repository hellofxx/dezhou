import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import type { HeroStats } from '../utils/handStats';
import { HandStatsPanel } from './HandStatsPanel';

/**
 * 统计面板冒烟（jsdom）。
 * 覆盖：七项核心指标渲染、按位置表格与位置过滤顺序、VPIP 偏离建议（偏低 / 偏高 / 正常 / 无标准区间）、
 * 无位置数据时不渲染图表与表格。
 * 未覆盖（L4）：Recharts 在真实浏览器中的尺寸与视觉（jsdom 下容器宽高为 0）。
 */

function stats(overrides: Partial<HeroStats> = {}): HeroStats {
  return {
    totalHands: 120,
    vpip: 28,
    pfr: 22,
    threeBetPercent: 35,
    afq: 60,
    cbetFrequency: 55,
    wtsd: 30,
    wsd: 52,
    byPosition: {
      UTG: { hands: 20, vpip: 10, pfr: 8 },
      BTN: { hands: 30, vpip: 48, pfr: 40 },
      SB: { hands: 15, vpip: 35, pfr: 20 },
      MP: { hands: 5, vpip: 25, pfr: 18 },
    },
    ...overrides,
  };
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  cleanup();
});

describe('HandStatsPanel 核心指标', () => {
  it('渲染 VPIP / PFR / 3-bet / AFq 与次级指标，并标注样本手数', () => {
    render(<HandStatsPanel stats={stats()} />);

    const text = document.body.textContent ?? '';
    expect(text).toContain('28%');
    expect(text).toContain('22%');
    expect(text).toContain('35%');
    expect(text).toContain('60%');
    expect(text).toContain('55%');
    expect(text).toContain('30%');
    expect(text).toContain('52%');
    expect(
      screen.getByText(i18n.t('handHistory.stats.basedOn', { count: 120 })),
    ).not.toBeNull();
  });

  it('按位置表格只列出标准位置顺序内的位置（UTG → BTN → SB），并带手数', () => {
    render(<HandStatsPanel stats={stats()} />);

    const table = screen.getByRole('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    // MP 不在 6-max 标准位置序列内，被图表/表格过滤掉
    expect(rows).toHaveLength(3);
    expect(rows.map(row => row.querySelector('td')?.textContent)).toEqual(['UTG', 'BTN', 'SB']);
    const btnCells = Array.from(rows[1]!.querySelectorAll('td')).map(td => td.textContent);
    expect(btnCells).toEqual(['BTN', '30', '48%', '40%']);
    expect(screen.getByText(i18n.t('handHistory.stats.byPositionTitle'))).not.toBeNull();
  });
});

describe('HandStatsPanel 位置建议', () => {
  it('VPIP 低于 / 高于标准区间时给出对应建议，区间内与无标准区间的位置不提示', () => {
    render(<HandStatsPanel stats={stats()} />);

    const low = i18n.t('handHistory.stats.positionFeedback', {
      position: 'UTG',
      vpip: 10,
      feedback: i18n.t('handHistory.stats.vpipLow', { range: '15-19' }),
    });
    const high = i18n.t('handHistory.stats.positionFeedback', {
      position: 'BTN',
      vpip: 48,
      feedback: i18n.t('handHistory.stats.vpipHigh', { range: '35-45' }),
    });
    expect(screen.getByText(low)).not.toBeNull();
    expect(screen.getByText(high)).not.toBeNull();
    expect(screen.getByText(i18n.t('handHistory.stats.suggestion'))).not.toBeNull();

    const text = document.body.textContent ?? '';
    // SB 的 35% 落在 30-40 标准区间内，不应出现建议
    expect(text).not.toContain('你的 SB VPIP');
    // MP 无标准区间（getPositionFeedback 返回 null）
    expect(text).not.toContain('你的 MP VPIP');
  });

  it('无位置数据时不渲染图表区与建议区', () => {
    render(<HandStatsPanel stats={stats({ byPosition: {} })} />);

    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByText(i18n.t('handHistory.stats.byPositionTitle'))).toBeNull();
    expect(screen.queryByText(i18n.t('handHistory.stats.suggestion'))).toBeNull();
    expect(document.body.textContent).toContain('28%');
  });
});
