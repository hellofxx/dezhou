/**
 * FirstDrillStep 组件测试（jsdom，P2A-02 回归）：
 * 首次微训练完成动作（进入庆祝页之前）调用 recordTrainingDay 恰好一次。
 * 对照 CelebrationStep.test.tsx：庆祝页重挂载不再记训练日。
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 TheoryQuiz 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import FirstDrillStep from './FirstDrillStep';
import { useProgressStore } from '@/features/progress/store';

// QuizCard 外层是 AnimatePresence mode="wait"，切题时旧卡需走完退场才渲染新卡；
// jsdom 无真实动画帧，跳过动画 + 手动推 rAF 帧驱动退场/入场完成
MotionGlobalConfig.skipAnimations = true;

const originalActions = {
  recordTrainingDay: useProgressStore.getState().recordTrainingDay,
  completeOnboardingStep: useProgressStore.getState().completeOnboardingStep,
};

function findButton(container: HTMLElement, text: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(text),
  );
  if (!btn) {
    const all = Array.from(container.querySelectorAll('button'))
      .map((b) => JSON.stringify(b.textContent))
      .join(', ');
    throw new Error(`未找到按钮：${text}；现有按钮：[${all}]`);
  }
  return btn;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** 推 rAF 帧，让 AnimatePresence 的退场/入场在 jsdom 中完成 */
async function pumpFrames(n = 5) {
  await act(async () => {
    for (let i = 0; i < n; i++) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
  });
}

describe('FirstDrillStep 首胜记训练日（P2A-02）', () => {
  let container: HTMLDivElement;
  let root: Root;
  const recordTrainingDay = vi.fn();
  const completeOnboardingStep = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    recordTrainingDay.mockClear();
    completeOnboardingStep.mockClear();
    useProgressStore.setState({ recordTrainingDay, completeOnboardingStep });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ ...originalActions });
  });

  it('全对完成微训练：recordTrainingDay 恰好一次，且在 completeOnboardingStep(3) 前', async () => {
    act(() => {
      root.render(<FirstDrillStep />);
    });

    // 题序：AA raise → 72o fold → KK raise → AA raise（末题）
    const answers = ['Raise', 'Fold', 'Raise'];
    for (const label of answers) {
      click(findButton(container, label));
      click(findButton(container, '下一题'));
      await pumpFrames();
    }
    click(findButton(container, 'Raise')); // 末题答对
    expect(recordTrainingDay).not.toHaveBeenCalled(); // 未点完成前不记
    click(findButton(container, '完成训练'));

    expect(recordTrainingDay).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep).toHaveBeenCalledWith(3);
    // 首胜记录发生在进入庆祝页之前
    expect(recordTrainingDay.mock.invocationCallOrder[0]!).toBeLessThan(
      completeOnboardingStep.mock.invocationCallOrder[0]!,
    );
  });

  it('末题答错走补救：显示 rescueHint，补救题作答后完成仍只记一次', async () => {
    act(() => {
      root.render(<FirstDrillStep />);
    });

    click(findButton(container, 'Raise')); // AA 对
    click(findButton(container, '下一题'));
    await pumpFrames();
    click(findButton(container, 'Fold')); // 72o 对
    click(findButton(container, '下一题'));
    await pumpFrames();
    click(findButton(container, 'Raise')); // KK 对
    click(findButton(container, '下一题'));
    await pumpFrames();
    click(findButton(container, 'Fold')); // 末题 AA 答错 → 追加补救题

    // P2A-03：末题答错时补救提示可见
    expect(container.textContent).toContain('别灰心，再来一道简单题练练手');
    expect(container.textContent).toContain('第 4 / 5 题');

    click(findButton(container, '下一题')); // 进入补救题（第 5 / 5 题）
    await pumpFrames();
    expect(container.textContent).toContain('第 5 / 5 题');
    click(findButton(container, 'Raise')); // 补救题答对
    click(findButton(container, '完成训练'));

    expect(recordTrainingDay).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep).toHaveBeenCalledWith(3);
  });
});
