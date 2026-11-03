/**
 * GTOFeedback 五级 / 二元反馈渲染测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - feedback 缺省时的旧二元显示（最优 / 次优 / 严重错误 + 接近最优提示）
 *  - 提供 feedback 时切到五级显示：grade 标题、EV 损失、正确动作、决策分析折叠区
 *  - wrong / blunder 底部「再做一题」回调
 *  - Exploit 模式：对手画像、剥削建议频率对比
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useProgressStore } from '@/features/progress/store';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { GTOFeedback } from './GTOFeedback';

afterEach(() => cleanup());

beforeEach(() => {
  useProgressStore.setState({ mentorStyle: 'strict-math' });
});

function renderFeedback(props: Partial<ComponentProps<typeof GTOFeedback>>) {
  const base: ComponentProps<typeof GTOFeedback> = {
    isOptimal: false,
    evLoss: 0,
    explanation: 'explanation-body',
    gtoStrategy: null,
    ...props,
  };
  return render(
    <MemoryRouter>
      <GTOFeedback {...base} />
    </MemoryRouter>,
  );
}

function feedbackOf(partial: Partial<DecisionFeedback>): DecisionFeedback {
  return {
    grade: 'wrong',
    evLoss: 3,
    correctAction: 'fold',
    explanation: '因为对手范围很强',
    ...partial,
  };
}

/** 按完整文本内容查元素（用于多段拼接文案） */
function byFullText(container: HTMLElement, text: string): HTMLElement | undefined {
  return Array.from(container.querySelectorAll<HTMLElement>('div')).find(
    (node) => node.textContent === text,
  );
}

describe('GTOFeedback 旧二元显示（无 feedback）', () => {
  it('最优决策展示最优标签、手牌与 EV 损失', () => {
    renderFeedback({ isOptimal: true, evLoss: 0, handNotation: 'AA' });

    expect(screen.getByText('最优决策')).toBeTruthy();
    expect(screen.getByText('AA')).toBeTruthy();
    expect(screen.getByText('0.00 BB')).toBeTruthy();
    expect(screen.getByText('explanation-body')).toBeTruthy();
  });

  it('非最优按 EV 损失区分「次优决策」与「严重错误」', () => {
    renderFeedback({ isOptimal: false, evLoss: 1 });
    expect(screen.getByText('次优决策')).toBeTruthy();
    cleanup();

    renderFeedback({ isOptimal: false, evLoss: 4 });
    expect(screen.getByText('严重错误')).toBeTruthy();
  });

  it('EV 损失 < 0.3 BB 时提示接近最优', () => {
    renderFeedback({ isOptimal: false, evLoss: 0.2 });

    expect(screen.getByText('✓ 接近最优（EV 损失 < 0.3 BB）')).toBeTruthy();
  });

  it('提供 userEV / optimalEV 时渲染三栏 EV 对比', () => {
    renderFeedback({ isOptimal: false, evLoss: 3, userEV: -1.5, optimalEV: 2, heroEquity: 0.65 });

    expect(screen.getByText('-1.50 BB')).toBeTruthy();
    expect(screen.getByText('+2.00 BB')).toBeTruthy();
    expect(screen.getByText('65%')).toBeTruthy();
    expect(screen.getByText('你的 EV')).toBeTruthy();
    expect(screen.getByText('最优 EV')).toBeTruthy();
  });
});

describe('GTOFeedback 五级显示（提供 feedback）', () => {
  it('best 级别展示 grade 标题且不展示"正确动作"列', () => {
    renderFeedback({
      isOptimal: true,
      evLoss: 0,
      feedback: feedbackOf({ grade: 'best', evLoss: 0, correctAction: 'SHOULD-NOT-RENDER' }),
    });

    expect(screen.getByText('最优决策！')).toBeTruthy();
    expect(screen.getByText('0.00 BB')).toBeTruthy();
    expect(screen.queryByText('SHOULD-NOT-RENDER')).toBeNull();
  });

  it('wrong 级别展示正确动作、决策分析（默认展开）与相关课程入口', () => {
    renderFeedback({
      feedback: feedbackOf({ grade: 'wrong', evLoss: 3, relatedLessonId: 'l3-cbet' }),
      userAction: { action: 'call', amount: 2.5 },
    });

    expect(screen.getByText('决策错误')).toBeTruthy();
    expect(screen.getByText('3.00 BB')).toBeTruthy();
    // 正确动作列 + 对比视图的 GTO 最优列各出现一次
    expect(screen.getAllByText('fold')).toHaveLength(2);
    // DecisionAnalysis：wrong/blunder 默认展开
    expect(screen.getByText('收起分析')).toBeTruthy();
    expect(screen.getByText('你的决策')).toBeTruthy();
    expect(screen.getByText('call 2.5BB')).toBeTruthy();
    expect(screen.getByText('GTO 最优')).toBeTruthy();
    expect(screen.getByText('因为对手范围很强')).toBeTruthy();
    // relatedLessonId → 相关课程 chip 可点击
    expect(screen.getByRole('button', { name: '相关课程' })).toBeTruthy();
  });

  it('wrong / blunder 且提供 onTryAgain 时渲染「再做一题」并回调', () => {
    const onTryAgain = vi.fn();
    renderFeedback({
      feedback: feedbackOf({ grade: 'blunder', evLoss: 8 }),
      onTryAgain,
    });

    fireEvent.click(screen.getByRole('button', { name: '再做一题' }));

    expect(onTryAgain).toHaveBeenCalledTimes(1);
  });

  it('inaccuracy 级别的决策分析默认折叠，可点击展开', () => {
    renderFeedback({
      feedback: feedbackOf({ grade: 'inaccuracy', evLoss: 1 }),
      userAction: { action: 'call' },
    });

    expect(screen.getByText('查看分析')).toBeTruthy();
    expect(screen.queryByText('你的决策')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '查看分析' }));

    expect(screen.getByText('收起分析')).toBeTruthy();
    expect(screen.getByText('你的决策')).toBeTruthy();
  });
});

describe('GTOFeedback 频率条与 Exploit 建议', () => {
  it('渲染 GTO 频率条、百分比与建议加注大小', () => {
    const { container } = renderFeedback({
      gtoStrategy: { fold: 0.1, call: 0.3, raise: 0.6, raiseAmount: 3 },
    });

    expect(screen.getByText('GTO 频率分布')).toBeTruthy();
    expect(screen.getByText('Raise 60%')).toBeTruthy();
    expect(screen.getByText('Call 30%')).toBeTruthy();
    expect(screen.getByText('Fold 10%')).toBeTruthy();
    expect(screen.getByText('建议加注大小: 3 BB')).toBeTruthy();
    // 频率条宽度按频率设置
    const bars = Array.from(container.querySelectorAll<HTMLElement>('div[style*="width"]'));
    expect(bars.map((bar) => bar.style.width)).toEqual(['60%', '30%', '10%']);
  });

  it('Exploit 模式展示对手画像与 GTO → 剥削频率对比', () => {
    const { container } = renderFeedback({
      gtoStrategy: { fold: 0.2, call: 0.4, raise: 0.4 },
      exploitMode: true,
      exploitStrategy: { fold: 0.1, call: 0.4, raise: 0.5 },
      selectedOpponent: 'nit',
    });

    expect(screen.getByText(/对手:/)).toBeTruthy();
    expect(screen.getByText(/Nit \(超紧\)/)).toBeTruthy();
    expect(screen.getByText('VPIP 10%')).toBeTruthy();
    expect(screen.getByText('剥削建议（vs NIT）')).toBeTruthy();
    expect(byFullText(container, 'GTO: R40/C40/F20 → 剥削: R50/C40/F10')).toBeTruthy();
    // GTO 与剥削两段频率条各自的百分比行
    expect(screen.getByText('Raise 50%')).toBeTruthy();
  });

  it('未启用 Exploit 或缺少对手时只展示 GTO 频率条', () => {
    renderFeedback({ gtoStrategy: { fold: 0.2, call: 0.4, raise: 0.4 } });

    expect(screen.getByText('GTO 频率分布')).toBeTruthy();
    expect(screen.queryByText(/对手:/)).toBeNull();
    expect(screen.queryByText(/剥削建议/)).toBeNull();
  });
});
