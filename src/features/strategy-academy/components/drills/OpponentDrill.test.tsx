import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import OpponentDrill from './OpponentDrill';
import {
  OPPONENT_DRILL_QUESTIONS,
  getOpponentProfile,
} from '../../data/opponentProfiles';

/**
 * OpponentDrill 契约：
 * - 先展示统计面板，两阶段作答：类型判断 → 策略选择
 * - 两问全对才计为答对（scoreOpponentAnswer）；策略选项经 orderResolvedOptions 重排
 * - 退出回调 onExit；全部答完后结果页（DrillResultView + note 计分口径）「完成训练」回调 onComplete(total = 8)
 */

function typeButton(profileId: string): HTMLButtonElement {
  const profile = getOpponentProfile(profileId);
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find((candidate) =>
    candidate.getAttribute('aria-label')?.includes(profile.name),
  );
  if (!button) throw new Error(`未找到对手类型按钮：${profileId}`);
  return button;
}

function strategyButton(text: string): HTMLButtonElement {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (candidate) => candidate.getAttribute('aria-label') === text,
  );
  if (!button) throw new Error(`未找到策略按钮：${text}`);
  return button;
}

/** 结果页统计卡数值（DrillResultView 的 data-testid + font-numeric 数值节点） */
function statValue(testId: string): string {
  const card = screen.getByTestId(testId);
  return card.querySelector('.font-numeric')?.textContent ?? '';
}

afterEach(() => cleanup());

describe('OpponentDrill', () => {
  it('首题两阶段作答：类型 + 策略全对计为答对，可进入下一题并退出', () => {
    const onExit = vi.fn();
    const { container } = render(<OpponentDrill onComplete={() => {}} onExit={onExit} />);
    const first = OPPONENT_DRILL_QUESTIONS[0]!;

    expect(screen.getByText('对手画像识别')).toBeTruthy();
    expect(screen.getByText('第 1 / 8 题')).toBeTruthy();
    expect(container.textContent).toContain('VPIP');
    expect(container.textContent).toContain('42%');
    // 第 2 问只在选完类型后出现
    expect(screen.queryByText('第 2 问：最佳应对策略是？')).toBeNull();

    fireEvent.click(typeButton(first.correctType));
    expect(screen.getByText('第 2 问：最佳应对策略是？')).toBeTruthy();

    fireEvent.click(strategyButton(first.strategyOptions[first.correctStrategyIndex]!));
    expect(screen.getByText('类型判断')).toBeTruthy();
    expect(screen.getByText('策略选择')).toBeTruthy();
    expect(screen.getByText(first.explanation)).toBeTruthy();

    fireEvent.click(screen.getByText('下一题'));
    expect(screen.getByText('第 2 / 8 题')).toBeTruthy();

    fireEvent.click(screen.getByText('退出'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('全部答完后结果页结算 onComplete', () => {
    const onComplete = vi.fn();
    render(<OpponentDrill onComplete={onComplete} onExit={() => {}} />);

    for (let index = 0; index < OPPONENT_DRILL_QUESTIONS.length; index += 1) {
      const question = OPPONENT_DRILL_QUESTIONS[index]!;
      fireEvent.click(typeButton(question.typeOptions[0]!));
      fireEvent.click(strategyButton(question.strategyOptions[0]!));
      fireEvent.click(
        screen.getByText(
          index === OPPONENT_DRILL_QUESTIONS.length - 1 ? '查看结果' : '下一题',
        ),
      );
    }

    // note 槽承载「两问全对才计为答对」的口径说明
    expect(screen.getByText('两问全对才计为答对')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('训练完成！');
    expect(statValue('drill-result-correct')).toMatch(
      new RegExp(`/${OPPONENT_DRILL_QUESTIONS.length}$`),
    );
    fireEvent.click(screen.getByText('完成训练'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0]![0]).toMatchObject({
      total: OPPONENT_DRILL_QUESTIONS.length,
    });
  });
});
