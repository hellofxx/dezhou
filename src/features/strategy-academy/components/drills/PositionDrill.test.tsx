import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PositionDrill from './PositionDrill';
import { POSITION_QUESTIONS, SEAT_LAYOUT } from './positionQuestions';

/**
 * PositionDrill 契约：
 * - 6-max 牌桌 6 个座位按钮（aria-label = 座位 id）
 * - 点错显示正确答案，点对显示正确反馈；进度头当前正确率按模板插值
 * - 逐题推进到结果页；退出回调 onExit；结果页「完成训练」回调 onComplete(total = 8)
 */

/** 结果页统计卡数值（DrillResultView 的 data-testid + font-numeric 数值节点） */
function statValue(testId: string): string {
  const card = screen.getByTestId(testId);
  return card.querySelector('.font-numeric')?.textContent ?? '';
}

afterEach(() => cleanup());

describe('PositionDrill', () => {
  it('渲染 6 个座位与首题，点对 BTN 判定正确，点错展示正确答案', () => {
    const onExit = vi.fn();
    render(<PositionDrill onComplete={() => {}} onExit={onExit} />);

    expect(screen.getByText('位置认知训练')).toBeTruthy();
    expect(screen.getByText('第 1 / 8 题')).toBeTruthy();
    for (const seat of SEAT_LAYOUT) {
      expect(screen.getByRole('button', { name: seat.id })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole('button', { name: 'BTN' }));
    expect(screen.getByText('回答正确！')).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));
    // 进度头当前正确率：1 题全对（历史缺陷是传 { rate } 渲染出裸占位符）
    expect(screen.getByText('当前正确率 1/1')).toBeTruthy();
    expect(screen.queryByText(/\{\{/)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'HJ' }));
    expect(screen.getByText('回答错误')).toBeTruthy();
    expect(screen.getByText(/正确答案：UTG/)).toBeTruthy();

    fireEvent.click(screen.getByText('退出'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('全部答完后结果页结算 onComplete', () => {
    const onComplete = vi.fn();
    render(<PositionDrill onComplete={onComplete} onExit={() => {}} />);

    for (let index = 0; index < POSITION_QUESTIONS.length; index += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'BTN' }));
      fireEvent.click(
        screen.getByText(index === POSITION_QUESTIONS.length - 1 ? '查看结果' : '下一题'),
      );
    }

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成！');
    expect(statValue('drill-result-correct')).toMatch(
      new RegExp(`/${POSITION_QUESTIONS.length}$`),
    );
    fireEvent.click(screen.getByText('完成训练'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0]).toMatchObject({ total: POSITION_QUESTIONS.length });
  });
});
