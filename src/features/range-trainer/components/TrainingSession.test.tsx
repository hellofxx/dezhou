/**
 * TrainingSession 组件测试（jsdom）：
 * - RNG-005：反馈显示期间点击暂停 → 自动跳题定时器被清除，暂停遮罩下不切题。
 *   修复前：handlePause 只暂停 store 与计时器，feedbackTimerRef 仍在跑，
 *   1 秒后在暂停遮罩下静默切题（反馈丢失、计时器重启）。
 * - 计时超时分支（P1A-02）：限时耗尽记录 'timeout' 并同步 ELO / SRS / Emotion
 * - 反馈态空格推进下一题、答错「再做一题」立即推进并清除自动跳题定时器
 * - 最后一题结束触发 onComplete（结果分支）
 * - 连续答错降级提示条与「切换训练」、Esc 暂停 / 恢复
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 TheoryQuiz 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import { Position } from '@/shared/types/position';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloRating, PokerVariant } from '@/shared/types/elo';
import type { TrainingResult } from '@/shared/types/common';
import { useProgressStore, DEFAULT_STREAK_STATE } from '@/features/progress/store';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { TrainingSession } from './TrainingSession';
import { useRangeTrainerStore, INITIAL_QUIZ_STATE } from '../store';
import { PRESET_RANGES, ADVANCED_PRESET_RANGES } from '../constants';

// jsdom 无真实动画帧，跳过 framer-motion 动画
MotionGlobalConfig.skipAnimations = true;

function findButtonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(text),
  );
  if (!btn) {
    throw new Error(`未找到按钮：${text}`);
  }
  return btn;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function pressKey(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  });
}

const elo = (variant: PokerVariant): EloRating => ({ ...DEFAULT_ELO, variant });

function resetRangeStore() {
  useRangeTrainerStore.setState({
    gameVariant: 'standard',
    playerCount: 6,
    presets: [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES],
    quizState: { ...INITIAL_QUIZ_STATE, handWeights: {} },
  });
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: elo('standard'),
      'short-deck': elo('short-deck'),
      'heads-up': elo('heads-up'),
    },
    emotion: { ...DEFAULT_EMOTION_STATE },
    streak: { ...DEFAULT_STREAK_STATE },
    reviewItems: [],
  });
}

const quizState = () => useRangeTrainerStore.getState().quizState;
const progress = () => useProgressStore.getState();

describe('TrainingSession 会话流程', () => {
  let container: HTMLDivElement;
  let root: Root;

  function startSession(timeLimit: number, totalQuestions: number) {
    act(() => {
      useRangeTrainerStore.getState().startQuiz(Position.UTG, 'open', timeLimit, totalQuestions);
    });
  }

  function renderSession(over: { timeLimit?: number; onComplete?: (r: TrainingResult) => void; onExit?: () => void } = {}) {
    const { timeLimit = 10, onComplete = () => {}, onExit = () => {} } = over;
    act(() => {
      root.render(
        <MemoryRouter>
          <TrainingSession
            position="UTG"
            actionType="open"
            timeLimit={timeLimit}
            totalQuestions={20}
            onComplete={onComplete}
            onExit={onExit}
          />
        </MemoryRouter>,
      );
    });
  }

  function answerCorrect() {
    const correct = quizState().questions[0]!.correctAction;
    click(findButtonByText(container, correct === 'fold' ? 'Fold' : correct === 'call' ? 'Call' : 'Raise'));
  }

  function answerWrong() {
    const correct = quizState().questions[0]!.correctAction;
    click(findButtonByText(container, correct === 'fold' ? 'Call' : 'Fold'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    resetRangeStore();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
    resetRangeStore();
  });

  it('RNG-005：反馈期间暂停后，自动跳题定时器被清除，暂停遮罩下不切题', () => {
    startSession(10, 10);
    renderSession();

    // 答对触发反馈与 1.5 秒自动跳题定时器
    answerCorrect();
    expect(quizState().answers[0]).not.toBeNull();
    expect(quizState().status).toBe('running');

    // 点击暂停按钮（顶部 lucide-pause 图标按钮）
    const pauseIcon = container.querySelector('button svg.lucide-pause');
    expect(pauseIcon).not.toBeNull();
    click(pauseIcon!.closest('button')!);
    expect(quizState().status).toBe('paused');

    // 推进 1.6 秒（覆盖自动推进 1.5s + 余量）；暂停时定时器必须已清除
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(quizState().currentIndex).toBe(0);
    expect(quizState().status).toBe('paused');
  });

  it('限时耗尽：记录 timeout 答案、判错并同步 ELO / SRS / Emotion', () => {
    startSession(2, 5);
    renderSession({ timeLimit: 2 });

    act(() => {
      vi.advanceTimersByTime(2100);
    });

    expect(quizState().answers[0]).toBe('timeout');
    expect(quizState().isCorrect[0]).toBe(false);
    expect(quizState().timePerQuestion[0]).toBeGreaterThanOrEqual(2000);
    // 三同步：ELO（preflop）/ SRS 复习项 / Emotion 每日题量
    expect(progress().eloByVariant.standard.gamesPlayed).toBe(1);
    expect(progress().reviewItems).toHaveLength(1);
    expect(progress().emotion.dailyQuestionsAnswered).toBe(1);
    // 超时反馈（wrong 级别）已渲染
    expect(container.textContent).toContain('错误');

    // 超时按答错处理：反馈常驻，不自动跳题
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(quizState().currentIndex).toBe(0);
  });

  it('反馈态按空格立即进入下一题', () => {
    startSession(10, 10);
    renderSession();

    answerCorrect();
    pressKey(' ');

    expect(quizState().currentIndex).toBe(1);
  });

  it('答错不自动跳题，等待「再做一题」手动推进', () => {
    startSession(10, 10);
    renderSession();

    answerWrong();
    expect(quizState().isCorrect[0]).toBe(false);

    // 答错后反馈常驻：3 秒内不自动切题
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(quizState().currentIndex).toBe(0);

    click(findButtonByText(container, '再做一题'));
    expect(quizState().currentIndex).toBe(1);
  });

  it('答对 1.5 秒后自动进入下一题', () => {
    startSession(10, 10);
    renderSession();

    answerCorrect();
    expect(quizState().isCorrect[0]).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(quizState().currentIndex).toBe(1);
  });

  it('最后一题答完触发 onComplete，回调携带本次会话统计', () => {
    const onComplete = vi.fn();
    // totalQuestions=1 → 会话只有「最后一题简单」的 AA（答案恒为 raise）
    startSession(10, 1);
    renderSession({ onComplete });

    answerCorrect();
    click(findButtonByText(container, '下一题'));

    expect(quizState().status).toBe('completed');
    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0]![0] as TrainingResult;
    expect(result.module).toBe('range-trainer');
    expect(result.totalQuestions).toBe(1);
    expect(result.correctAnswers).toBe(1);
    expect(result.lastQuestionCorrect).toBe(true);
  });

  it('连续答错 ≥3 次展示降级提示，点击「切换训练」回调 onExit', () => {
    useProgressStore.setState({
      emotion: { ...DEFAULT_EMOTION_STATE, consecutiveWrongCount: 3 },
    });
    const onExit = vi.fn();
    startSession(10, 10);
    renderSession({ onExit });

    expect(container.textContent).toContain('检测到连续答错');

    click(findButtonByText(container, '切换训练'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('反馈态暂停后点「继续训练」：恢复运行并重启反馈跳题定时器', () => {
    startSession(10, 10);
    renderSession();

    answerCorrect();
    click(container.querySelector<HTMLElement>('button svg.lucide-pause')!.closest('button')!);
    expect(quizState().status).toBe('paused');

    click(findButtonByText(container, '继续训练'));
    expect(quizState().status).toBe('running');

    // 恢复时若仍在自动推进反馈中，重新排 1.5 秒自动跳题（RNG-005）
    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(quizState().currentIndex).toBe(1);
  });

  it('Esc 暂停显示遮罩，再次 Esc 恢复运行', () => {
    startSession(10, 10);
    renderSession();

    pressKey('Escape');
    expect(quizState().status).toBe('paused');
    expect(container.textContent).toContain('已暂停');

    pressKey('Escape');
    expect(quizState().status).toBe('running');
    expect(container.textContent).not.toContain('已暂停');
  });

  describe('移动端反馈 Sheet', () => {
    const originalMatchMedia = window.matchMedia;

    beforeEach(() => {
      window.matchMedia = ((query: string) => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;
    });

    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('答错后 Sheet 常驻；关闭可重开；手动推进后进入下一题', () => {
      startSession(10, 10);
      renderSession();

      answerWrong();

      // 反馈出现后自动打开 Sheet
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();

      // 3 秒内不自动跳题，Sheet 也不消失
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(quizState().currentIndex).toBe(0);
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();

      // 关闭后保留「查看反馈」入口，可重新打开
      click(document.querySelector<HTMLElement>('[role="dialog"] button[aria-label="关闭"]')!);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
      click(findButtonByText(container, '查看反馈'));
      expect(document.querySelector('[role="dialog"]')).not.toBeNull();

      // 手动推进（Sheet 内的「再做一题」按钮）
      const nextButton = Array.from(
        document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'),
      ).find((b) => b.textContent?.includes('再做一题'));
      expect(nextButton).toBeTruthy();
      click(nextButton!);
      expect(quizState().currentIndex).toBe(1);
    });
  });
});
