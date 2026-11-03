import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DrawsReference } from './DrawsReference';
import { COMMON_DRAWS, DEFAULT_ODDS_STATE } from '../constants';
import { usePotOddsStore } from '../store';

/**
 * DrawsReference 用户可见契约（L2 / jsdom）：
 * 常见听牌表必须全量渲染（i18n key 已解析），点击条目把该听牌的 outs 写入计算器状态，
 * 且当前 outs 对应的条目呈选中态（调参时能看出参照的是哪一行）。
 */
beforeEach(() => {
  usePotOddsStore.setState({ oddsState: { ...DEFAULT_ODDS_STATE } });
});

afterEach(cleanup);

describe('DrawsReference', () => {
  it('渲染全部常见听牌的本地化名称与说明，不泄漏原始 i18n key', () => {
    const { container } = render(<DrawsReference />);
    const text = container.textContent ?? '';

    expect(screen.getByText('常见听牌参考')).toBeTruthy();
    expect(screen.getByText('点击可快速填入 Outs 到计算器')).toBeTruthy();
    expect(container.querySelectorAll('button')).toHaveLength(COMMON_DRAWS.length);
    for (const draw of COMMON_DRAWS) {
      expect(text, `原始 i18n key 泄漏到界面：${draw.name}`).not.toContain(draw.name);
    }
    expect(text).toContain('顺子听牌（两头）');
    expect(text).toContain('同花听牌');
    expect(text).toContain('同花+顺子组合听牌');
    expect(text).toContain('后门同花听牌');
  });

  it('点击听牌把该条目的 outs 写入计算器状态', () => {
    render(<DrawsReference />);
    const flushButton = screen.getByText('同花听牌').closest('button');
    expect(flushButton).not.toBeNull();

    fireEvent.click(flushButton!);
    expect(usePotOddsStore.getState().oddsState.outs).toBe(9);

    fireEvent.click(screen.getByText('同花+顺子组合听牌').closest('button')!);
    expect(usePotOddsStore.getState().oddsState.outs).toBe(15);
  });

  it('小数 outs（后门同花 1.5）同样可写入', () => {
    render(<DrawsReference />);
    fireEvent.click(screen.getByText('后门同花听牌').closest('button')!);
    expect(usePotOddsStore.getState().oddsState.outs).toBe(1.5);
  });

  it('当前 outs 对应的条目呈选中态，其余条目不是', () => {
    usePotOddsStore.setState({ oddsState: { ...DEFAULT_ODDS_STATE, outs: 9 } });
    render(<DrawsReference />);

    const selected = screen.getByText('同花听牌').closest('button')!;
    const other = screen.getByText('顺子听牌（两头）').closest('button')!;

    expect(selected.classList.contains('border-[var(--brass)]/30')).toBe(true);
    expect(other.classList.contains('border-[var(--brass)]/30')).toBe(false);
  });
});
