import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PotOddsDrill from './PotOddsDrill';
import { POT_ODDS_QUESTIONS } from './potOddsQuestions';

/**
 * PotOddsDrill 契约：
 * - 首题展示底池 / 下注 / 跟注数值与图形化赔率条
 * - 答对 25% 判定正确；答错展示正确答案
 * - 进度条走 shared ProgressBar（role=progressbar + aria-valuenow），不再用内联 width 断言
 * - 全部答完后结果页「完成训练」回调 onComplete(total = 6)
 */

function optionButton(text: string): HTMLButtonElement {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) =>
      candidate.textContent?.trim() === text && candidate.className.includes('rounded-lg border'),
  );
  if (!button) throw new Error(`未找到选项按钮：${text}`);
  return button;
}

/** 结果页统计卡数值（DrillResultView 的 data-testid + font-numeric 数值节点） */
function statValue(testId: string): string {
  const card = screen.getByTestId(testId);
  return card.querySelector('.font-numeric')?.textContent ?? '';
}

/** 进度条当前值（ProgressBar 钳制后写入 aria-valuenow） */
function progressValue(): string | null {
  return screen.getByRole('progressbar').getAttribute('aria-valuenow');
}

afterEach(() => cleanup());

describe('PotOddsDrill', () => {
  it('首题展示底池信息，答对后进入下一题并支持退出', () => {
    const onExit = vi.fn();
    const { container } = render(<PotOddsDrill onComplete={() => {}} onExit={onExit} />);

    expect(screen.getByText('底池赔率直觉')).toBeTruthy();
    expect(screen.getByText('第 1 / 6 题')).toBeTruthy();
    expect(container.textContent).toContain('100 BB');
    expect(container.textContent).toContain('50 BB');
    // 进度条语义：首题尚未作答 → 0
    expect(progressValue()).toBe('0');

    fireEvent.click(optionButton('25%'));
    expect(screen.getByText('回答正确！')).toBeTruthy();
    expect(screen.getByText('+EV 跟注')).toBeTruthy();

    fireEvent.click(screen.getByText('下一题'));
    expect(screen.getByText('第 2 / 6 题')).toBeTruthy();
    // 已作答 1 / 6 → 17%
    expect(progressValue()).toBe('17');
    // 进度头当前正确率：1 题全对（历史缺陷是传 { rate } 渲染出裸占位符）
    expect(screen.getByText('当前正确率 1/1')).toBeTruthy();
    expect(screen.queryByText(/\{\{/)).toBeNull();

    fireEvent.click(screen.getByText('退出'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('答错时展示正确答案，全部答完后结算 onComplete', () => {
    const onComplete = vi.fn();
    render(<PotOddsDrill onComplete={onComplete} onExit={() => {}} />);

    fireEvent.click(optionButton('20%'));
    expect(screen.getByText('回答错误')).toBeTruthy();
    expect(screen.getByText(/正确答案：25%/)).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));

    for (let index = 1; index < POT_ODDS_QUESTIONS.length; index += 1) {
      const options = [...document.querySelectorAll<HTMLButtonElement>('button')].filter(
        (button) => button.className.includes('rounded-lg border'),
      );
      fireEvent.click(options[0]!);
      fireEvent.click(
        screen.getByText(index === POT_ODDS_QUESTIONS.length - 1 ? '查看结果' : '下一题'),
      );
    }

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成！');
    expect(statValue('drill-result-correct')).toMatch(
      new RegExp(`/${POT_ODDS_QUESTIONS.length}$`),
    );
    fireEvent.click(screen.getByText('完成训练'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0]).toMatchObject({ total: POT_ODDS_QUESTIONS.length });
  });
});
