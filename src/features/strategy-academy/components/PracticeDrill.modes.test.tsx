import { afterEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PracticeDrillComponent } from './PracticeDrill';
import { useAcademyStore } from '../store';
import { REVIEW_TOPICS_SEVERE } from '../utils/adaptiveDifficulty';
import type { PracticeDrill, PracticeQuestion, PracticeResult } from '../types';

/**
 * 实战练习的模式与自适应契约（用户可见分支）：
 * - 压力模式：题目循环到 20 题、15 秒限时圆环、结果页额外统计（超时 / 最长连对 / 压力得分）
 * - 超时：系统代选仅用于展示、判分恒为错，结果不计对
 * - 自适应：每 5 题评估一次 —— 连对升级给出提示，连错降级并在建议复习时展示常驻提示条
 * - 答错且题目声明 relatedLessonId 时「去复习」跳转对应课程
 * - 结果页 / 进度头走 feature-local 模板（DrillResultView / DrillProgressHeader）
 */

const RELATED_LESSON_PROBE = 'related-lesson-probe';

function makeQuestion(id: string, overrides: Partial<PracticeQuestion> = {}): PracticeQuestion {
  return {
    id,
    scenario: {
      heroHand: ['As', 'Ks'],
      heroPosition: 'BTN',
      previousActions: [{ player: 'CO', action: 'Raise 2.5BB' }],
      street: 'preflop',
      potSize: 5.5,
      effectiveStack: 100,
    },
    options: [
      { action: 'Call', isCorrect: true, explanation: '跟注保持范围优势。' },
      { action: 'Fold', isCorrect: false, explanation: '弃牌过于保守。' },
    ],
    ...overrides,
  };
}

function makeDrill(count: number, overrides: Partial<PracticeQuestion> = {}): PracticeDrill {
  return {
    id: 'modes-fixture',
    questions: Array.from({ length: count }, (_, i) => makeQuestion(`mq${i + 1}`, overrides)),
  };
}

function renderDrill(
  drill: PracticeDrill,
  props: { mode?: 'normal' | 'pressure'; onReviewRequest?: (topics: string[]) => void } = {},
) {
  const onComplete = vi.fn<(result: PracticeResult) => void>();
  render(
    <MemoryRouter initialEntries={['/academy/lesson/fixture']}>
      <Routes>
        <Route
          path="/academy/lesson/fixture"
          element={
            <PracticeDrillComponent
              drill={drill}
              lessonId="fixture-lesson"
              mode={props.mode}
              onComplete={onComplete}
              onReviewRequest={props.onReviewRequest}
            />
          }
        />
        <Route path="/academy/lesson/:lessonId" element={<div>{RELATED_LESSON_PROBE}</div>} />
      </Routes>
    </MemoryRouter>,
  );
  return onComplete;
}

/** 结果页统计卡数值：data-testid 定位卡片，取 font-numeric 数值节点（不再依赖标签反查） */
function statValue(testId: string): string {
  const card = screen.getByTestId(testId);
  return card.querySelector('.font-numeric')?.textContent ?? '';
}

/** 推进按钮：末题为「查看成绩」，其余为「下一题」（占位提示 toast 也含“下一题”字样，故按 button 角色定位） */
function clickNext() {
  const button =
    screen.queryByRole('button', { name: /^查看成绩/ }) ??
    screen.getByRole('button', { name: /^下一题/ });
  fireEvent.click(button);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  useAcademyStore.getState().resetProgress();
});

describe('PracticeDrill：压力模式', () => {
  it('题目循环到 20 题，全部答对后展示压力统计（超时 / 最长连对 / 压力得分）', () => {
    const onComplete = renderDrill(makeDrill(1), { mode: 'pressure' });

    // 压力标记 + 20 题计数（题库仅 1 题，循环填充）+ 15 秒限时圆环初始读数
    expect(screen.getByText('1 / 20')).toBeTruthy();
    expect(screen.getByText('压力模式')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    // 压力模式进度头走危险色（不进 DOM 断言色值，只验证进度语义存在）
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');

    for (let i = 0; i < 20; i += 1) {
      fireEvent.click(screen.getByText('Call'));
      clickNext();
    }

    expect(onComplete).toHaveBeenCalledTimes(1);
    // 结果页标题为 h3（内嵌结果视图不出 h1）
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('压力模式完成！');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
    expect(statValue('drill-result-correct')).toBe('20/20');
    expect(statValue('drill-result-timeouts')).toBe('0');
    expect(statValue('drill-result-streak')).toBe('20');
    // 压力得分 = 正确率 100 − 超时 0×5 + 最长连对 20×2
    expect(statValue('drill-result-pressure-score')).toBe('140');
    // 压力模式固定 20 题 × 2 次交互，全量套件并发时需要更长预算
  }, 20000);
});

describe('PracticeDrill：超时判分', () => {
  it('倒计时归零时代选最保守动作并恒判错，结果不计对', () => {
    vi.useFakeTimers();
    const onComplete = renderDrill(makeDrill(1, { timeLimit: 2 }));

    // 限时圆环初始读数（场景卡内其他数字含快捷键标记与筹码数值，按圆环样式定位）
    expect(screen.getByText('2', { selector: '.tabular-nums' })).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // 代选 Fold（最保守动作）仅用于展示，本题计为答错
    expect(screen.getByText(/系统代选 Fold/)).toBeTruthy();
    expect(screen.getByText(/正确答案：Call/)).toBeTruthy();
    expect(screen.getByText('⏰ 时间到！')).toBeTruthy();
    // 超时路径不渲染「正确」标签（不因代选项恰好正确而计对）
    expect(screen.queryByText('正确')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    fireEvent.click(screen.getByText('查看成绩'));

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]![0];
    expect(result.correctAnswers).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.answers).toEqual([{ questionId: 'mq1', isCorrect: false, timeTaken: 2 }]);
  });
});

describe('PracticeDrill：自适应难度', () => {
  it('连续答对 5 题触发升级提示，结果页展示难度变化阶梯图', () => {
    renderDrill(makeDrill(5));

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByText('Call'));
      if (i < 4) clickNext();
    }

    // 第 5 题作答后（正确率 100% 且用时低于 timeBonus）升级并提示
    expect(screen.getByText(/接下来的题目会更有挑战性/)).toBeTruthy();

    clickNext();
    expect(screen.getByText('难度变化：')).toBeTruthy();
  });

  it('先升级后连错降级并建议复习：常驻提示条回传建议主题', async () => {
    const onReviewRequest = vi.fn<(topics: string[]) => void>();
    renderDrill(makeDrill(10), { onReviewRequest });

    for (let i = 0; i < 10; i += 1) {
      fireEvent.click(screen.getByText(i < 5 ? 'Call' : 'Fold'));
      // 第 10 题停在作答状态（结果页不渲染复习提示条）
      if (i < 9) clickNext();
    }

    expect(screen.getByText('检测到连续答错，建议先复习相关理论再继续')).toBeTruthy();
    fireEvent.click(screen.getByText('返回复习'));

    expect(onReviewRequest).toHaveBeenCalledTimes(1);
    expect(onReviewRequest).toHaveBeenCalledWith([...REVIEW_TOPICS_SEVERE]);
    await waitFor(() => expect(screen.queryByText('返回复习')).toBeNull());
  });
});

describe('PracticeDrill：答错后的复习跳转', () => {
  it('题目声明 relatedLessonId 时渲染「去复习相关课程」并跳转到该课程', async () => {
    renderDrill(makeDrill(1, { relatedLessonId: 'l1-basics' }));

    fireEvent.click(screen.getByText('Fold'));
    fireEvent.click(screen.getByText('去复习相关课程 →'));

    await waitFor(() => expect(screen.getByText(RELATED_LESSON_PROBE)).toBeTruthy());
  });
});
