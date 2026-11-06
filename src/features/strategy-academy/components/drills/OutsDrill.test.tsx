import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import OutsDrill from './OutsDrill';
import { OUTS_QUESTIONS } from './outsQuestions';

/**
 * OutsDrill 契约：
 * - 首题渲染牌面（公共牌 + 底牌）与题干；选项经 t() 解析后按 id 哈希定向单调重排
 * - 答对 / 答错反馈 + 正确答案提示；进度头当前正确率按模板插值（{{correct}}/{{answered}}）
 * - 退出回调 onExit；全部答完后结果页「完成训练」回调 onComplete(total = 8)
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

afterEach(() => cleanup());

describe('OutsDrill', () => {
  it('首题同花听牌选 9 outs 判定正确，可进入下一题并退出', () => {
    const onExit = vi.fn();
    const { container } = render(<OutsDrill onComplete={() => {}} onExit={onExit} />);

    expect(screen.getByText('Outs 速算训练')).toBeTruthy();
    expect(screen.getByText('第 1 / 8 题')).toBeTruthy();
    expect(container.textContent).toContain('公共牌');

    fireEvent.click(optionButton('9 outs'));
    expect(screen.getByText('回答正确！')).toBeTruthy();

    fireEvent.click(screen.getByText('下一题'));
    expect(screen.getByText('第 2 / 8 题')).toBeTruthy();
    // 进度头当前正确率：1 题全对（历史缺陷是传 { rate } 渲染出裸占位符）
    expect(screen.getByText('当前正确率 1/1')).toBeTruthy();
    expect(screen.queryByText(/\{\{/)).toBeNull();

    fireEvent.click(screen.getByText('退出'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('答错时展示正确答案，全部答完后结算 onComplete', () => {
    const onComplete = vi.fn();
    render(<OutsDrill onComplete={onComplete} onExit={() => {}} />);

    fireEvent.click(optionButton('6 outs'));
    expect(screen.getByText('回答错误')).toBeTruthy();
    expect(screen.getByText(/正确答案：9 outs/)).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));

    for (let index = 1; index < OUTS_QUESTIONS.length; index += 1) {
      const options = [...document.querySelectorAll<HTMLButtonElement>('button')].filter(
        (button) => button.className.includes('rounded-lg border'),
      );
      fireEvent.click(options[0]!);
      fireEvent.click(
        screen.getByText(index === OUTS_QUESTIONS.length - 1 ? '查看结果' : '下一题'),
      );
    }

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成！');
    expect(statValue('drill-result-correct')).toMatch(new RegExp(`/${OUTS_QUESTIONS.length}$`));
    fireEvent.click(screen.getByText('完成训练'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0]).toMatchObject({ total: OUTS_QUESTIONS.length });
  });
});
