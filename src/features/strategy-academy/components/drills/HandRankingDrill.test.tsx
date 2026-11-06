import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import HandRankingDrill from './HandRankingDrill';
import { HAND_RANKING_QUESTIONS } from './handRankingQuestions';

/**
 * HandRankingDrill 契约：
 * - 首题渲染牌面（两手牌）与题干，选项经 t() 解析后按 id 种子洗牌
 * - 答对 / 答错反馈与解析；进度头当前正确率按模板插值（{{correct}}/{{answered}}）
 * - 逐题推进到结果页；退出回调 onExit；结果页「完成训练」回调 onComplete(total = 题库长度)
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

describe('HandRankingDrill', () => {
  it('渲染首题，答对后展示解析并可进入下一题', () => {
    const onExit = vi.fn();
    render(<HandRankingDrill onComplete={() => {}} onExit={onExit} />);

    expect(screen.getByText('牌力排名闪电战')).toBeTruthy();
    expect(screen.getByText('第 1 / 10 题')).toBeTruthy();
    expect(screen.getByText('以下两手牌，哪手更大？')).toBeTruthy();
    expect(screen.getAllByText('左手牌').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('右手牌').length).toBeGreaterThanOrEqual(1);

    // q1：右手牌（皇家同花顺）更大
    fireEvent.click(optionButton('右手牌'));
    expect(screen.getByText('回答正确！')).toBeTruthy();

    fireEvent.click(screen.getByText('下一题'));
    expect(screen.getByText('第 2 / 10 题')).toBeTruthy();
    // 进度头当前正确率：1 题全对（历史缺陷是传 { rate } 渲染出裸占位符）
    expect(screen.getByText('当前正确率 1/1')).toBeTruthy();
    expect(screen.queryByText(/\{\{/)).toBeNull();

    fireEvent.click(screen.getByText('退出'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('答错时展示正确答案，全部答完后结算 onComplete', () => {
    const onComplete = vi.fn();
    render(<HandRankingDrill onComplete={onComplete} onExit={() => {}} />);

    // q1 选错（左手牌）
    fireEvent.click(optionButton('左手牌'));
    expect(screen.getByText('回答错误')).toBeTruthy();
    expect(screen.getByText(/正确答案：右手牌/)).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));

    // 其余题目直接选第一个选项推进
    for (let i = 1; i < HAND_RANKING_QUESTIONS.length; i += 1) {
      const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')].filter(
        (button) => button.className.includes('rounded-lg border'),
      );
      fireEvent.click(buttons[0]!);
      fireEvent.click(screen.getByText(i === HAND_RANKING_QUESTIONS.length - 1 ? '查看结果' : '下一题'));
    }

    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成！');
    expect(statValue('drill-result-correct')).toMatch(
      new RegExp(`/${HAND_RANKING_QUESTIONS.length}$`),
    );
    fireEvent.click(screen.getByText('完成训练'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      total: HAND_RANKING_QUESTIONS.length,
    });
  });
});
