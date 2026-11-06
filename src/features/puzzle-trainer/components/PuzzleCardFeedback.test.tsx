import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PuzzleCardFeedback } from './PuzzleCardFeedback';

import type { PuzzleAnswerRecord, PuzzleQuestion } from '../types';
// 反馈面板新增 useNavigate（相关课程 chip 由调用方注入跳转）
const { navigateSpy } = vi.hoisted(() => ({ navigateSpy: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateSpy }));

/**
 * PRD §6.7.1「EV 标定诚实性」呈现层守卫：
 * - 未标定题：只显示正确/错误 + 解析，不显示五级徽章、EV 数值或 GTO 口径；
 * - 已标定题：保留五级徽章与 EV 数值。
 */
function buildQuestion(evBasis: PuzzleQuestion['evBasis']): PuzzleQuestion {
  return {
    id: 'test-q',
    theme: 'c-bet',
    scenario: '6-max，100BB。你 BTN 加注 2.5BB，BB 跟注。翻牌 K♠ 7♥ 2♣，底池 5.5BB。',
    hand: 'AKo',
    position: 'BTN',
    board: 'K♠ 7♥ 2♣',
    potSize: 5.5,
    stackSize: 97.5,
    options: [
      {
        id: 'a',
        text: 'C-bet 2BB',
        isCorrect: true,
        evLoss: 0,
        explanation: '顶对顶 kicker，c-bet 小尺度价值。',
      },
      {
        id: 'b',
        text: 'Check',
        isCorrect: false,
        evLoss: 3,
        explanation: 'Check 损失价值。',
      },
    ],
    correctExplanation: 'K-7-2 干燥牌面，AKo 顶对顶 kicker，c-bet 1/3 池价值。',
    difficulty: 1,
    evBasis,
  };
}

const wrongRecord: PuzzleAnswerRecord = {
  questionId: 'test-q',
  selectedOptionId: 'b',
  isCorrect: false,
  timeTaken: 1200,
  grade: 'wrong',
  evLoss: 3,
};

describe('PuzzleCardFeedback EV 呈现诚实性', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('未标定题：二态反馈 + 解析，不显示 EV 数值与 GTO 口径', () => {
    act(() => {
      root.render(
        <PuzzleCardFeedback
          question={buildQuestion('none')}
          record={wrongRecord}
          onNext={() => undefined}
          isLastQuestion={false}
        />
      );
    });
    const text = container.textContent ?? '';
    expect(text).toContain('回答错误');
    expect(text).toContain('本题未提供 EV 标定');
    expect(text).not.toContain('EV 3.0 BB');
    expect(text).not.toContain('GTO 最优');
    expect(text).toContain('推荐动作');
  });

  it('已标定题：保留五级徽章与 EV 数值', () => {
    act(() => {
      root.render(
        <PuzzleCardFeedback
          question={buildQuestion('solver')}
          record={wrongRecord}
          onNext={() => undefined}
          isLastQuestion={false}
        />
      );
    });
    const text = container.textContent ?? '';
    expect(text).toContain('决策错误');
    expect(text).toContain('EV 3.0 BB');
    expect(text).toContain('GTO 最优');
    expect(text).not.toContain('本题未提供 EV 标定');
  });

  it('相关课程 chip 经注入的 navigate 跳转到对应课时', () => {
    act(() => {
      root.render(
        <PuzzleCardFeedback
          question={buildQuestion('solver')}
          record={{ ...wrongRecord, relatedLessonId: 'l3-cbet' }}
          onNext={() => undefined}
          isLastQuestion={false}
        />
      );
    });

    const chips = Array.from(container.querySelectorAll('button')).filter(
      (b) => b.getAttribute('aria-label') === '相关课程',
    );
    expect(chips.length).toBeGreaterThan(0);

    act(() => {
      chips[0]!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(navigateSpy).toHaveBeenCalledWith('/academy/lesson/l3-cbet');
  });
});
