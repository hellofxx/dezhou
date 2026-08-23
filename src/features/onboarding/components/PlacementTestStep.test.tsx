/**
 * PlacementTestStep 组件冒烟（jsdom）：
 * ① 选项经排序出口渲染：渲染文本序列与 orderPlacementOptions 计算一致
 *    （答案位置偏差治理接入回归，防退化为题库原序直出）
 * ② 全对完成 5 题 → completeOnboardingStep(2, { placementTestScore, initialAbility })
 *    payload 正确（满分 100 / 各定级维度 70 / GTO 中性 50）
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 FirstDrillStep 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18next from 'i18next';
import PlacementTestStep from './PlacementTestStep';
import { placementQuestions } from '../data/placementQuestions';
import { orderPlacementOptions } from '../utils/optionOrder';
import { useProgressStore } from '@/features/progress/store';

const originalActions = {
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

/** 当前题渲染的选项按钮（排除「下一题 / 完成测试」动作按钮） */
function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button')).filter(
    (b) => !b.textContent?.includes('下一题') && !b.textContent?.includes('完成测试'),
  );
}

describe('PlacementTestStep 定级测试', () => {
  let container: HTMLDivElement;
  let root: Root;
  const completeOnboardingStep = vi.fn();

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    completeOnboardingStep.mockClear();
    useProgressStore.setState({ completeOnboardingStep });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    useProgressStore.setState({ ...originalActions });
  });

  it('① 选项经排序出口渲染：渲染文本序列与 orderPlacementOptions 计算一致', () => {
    act(() => {
      root.render(<PlacementTestStep />);
    });
    const q1 = placementQuestions[0]!;
    const expected = orderPlacementOptions(q1, (o) => i18next.t(o.text)).map((o) =>
      i18next.t(o.text),
    );
    const rendered = optionButtons(container).map((b) => b.textContent);
    expect(rendered).toEqual(expected);
  });

  it('② 全对完成 5 题：payload 携带满分 placementTestScore 与 70 区间 initialAbility', () => {
    act(() => {
      root.render(<PlacementTestStep />);
    });
    const lastQuestion = placementQuestions[placementQuestions.length - 1]!;
    for (const q of placementQuestions) {
      const correct = q.options.find((o) => o.isCorrect)!;
      click(findButton(container, i18next.t(correct.text)));
      click(
        findButton(container, q === lastQuestion ? '完成测试' : '下一题'),
      );
    }
    expect(completeOnboardingStep).toHaveBeenCalledTimes(1);
    expect(completeOnboardingStep).toHaveBeenCalledWith(2, {
      placementTestScore: 100,
      initialAbility: {
        rangeKnowledge: 70,
        oddsCalculation: 70,
        positionalPlay: 70,
        gtoUnderstanding: 50,
      },
    });
  });
});
