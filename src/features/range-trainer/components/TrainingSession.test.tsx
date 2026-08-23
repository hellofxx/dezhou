/**
 * TrainingSession 组件回归测试（jsdom，RNG-005）：
 * 反馈显示期间点击暂停 → 自动跳题定时器被清除，暂停遮罩下不切题。
 * 修复前：handlePause 只暂停 store 与计时器，feedbackTimerRef 仍在跑，
 * 1 秒后在暂停遮罩下静默切题（反馈丢失、计时器重启）。
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 TheoryQuiz 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import { Position } from '@/shared/types/position';
import { TrainingSession } from './TrainingSession';
import { useRangeTrainerStore, INITIAL_QUIZ_STATE } from '../store';
import { PRESET_RANGES } from '../constants';

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

function resetRangeStore() {
  useRangeTrainerStore.setState({
    gameVariant: 'standard',
    playerCount: 6,
    presets: PRESET_RANGES,
    quizState: { ...INITIAL_QUIZ_STATE, handWeights: {} },
  });
}

describe('TrainingSession 暂停冻结反馈跳题（RNG-005）', () => {
  let container: HTMLDivElement;
  let root: Root;

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

  it('反馈期间暂停：自动跳题定时器被清除，暂停遮罩下不切题', () => {
    // 前置：进入 10 题训练会话
    act(() => {
      useRangeTrainerStore.getState().startQuiz(Position.UTG, 'open', 10, 10);
    });

    act(() => {
      root.render(
        <MemoryRouter>
          <TrainingSession
            position="UTG"
            actionType="open"
            timeLimit={10}
            totalQuestions={10}
            onComplete={() => { }}
            onExit={() => { }}
          />
        </MemoryRouter>,
      );
    });

    // 答题（Raise）触发反馈与 1 秒自动跳题定时器
    click(findButtonByText(container, 'Raise'));
    expect(useRangeTrainerStore.getState().quizState.answers[0]).not.toBeNull();
    expect(useRangeTrainerStore.getState().quizState.status).toBe('running');

    // 点击暂停按钮（顶部 lucide-pause 图标按钮）
    const pauseIcon = container.querySelector('button svg.lucide-pause');
    expect(pauseIcon).not.toBeNull();
    click(pauseIcon!.closest('button')!);
    expect(useRangeTrainerStore.getState().quizState.status).toBe('paused');

    // 推进 1.2 秒（覆盖反馈定时器 1s + 余量）
    // 修复前：定时器触发 nextQuestion → currentIndex 推进到 1（暂停遮罩下静默切题）
    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(useRangeTrainerStore.getState().quizState.currentIndex).toBe(0);
    expect(useRangeTrainerStore.getState().quizState.status).toBe('paused');
  });
});
