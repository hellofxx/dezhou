/**
 * TheoryQuiz 组件测试（jsdom，P1F-03 回归）：
 * 空题库防御 effect 在 StrictMode 双跑下 onComplete 仅触发一次
 * （completedRef 一次性守卫，避免 completeChapter 双调、训练事件双 emit）。
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 StreakTracker 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TheoryQuiz } from './TheoryQuiz';
import type { TheoryChapter } from '../types';

function makeChapter(quiz: TheoryChapter['quiz']): TheoryChapter {
  return {
    id: 't1-test-chapter',
    level: 1,
    order: 1,
    title: '测试章节',
    subtitle: '空题库防御回归',
    duration: '1 min',
    eloDimension: 'math',
    content: [],
    quiz,
  };
}

describe('TheoryQuiz 空题库防御（P1F-03）', () => {
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

  it('StrictMode 下空题库 onComplete 仅触发一次（100, 0, 0）', () => {
    const onComplete = vi.fn();
    act(() => {
      root.render(
        <StrictMode>
          <TheoryQuiz chapter={makeChapter([])} onComplete={onComplete} />
        </StrictMode>,
      );
    });

    // StrictMode 会双跑 effect（mount → cleanup → remount），
    // completedRef 守卫保证 completeChapter 链路只被回调一次
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(100, 0, 0);
  });

  it('非空题库不触发自动完成，正常渲染首题', () => {
    const onComplete = vi.fn();
    const quiz = [
      {
        id: 't1-test-q1',
        question: '底池赔率的定义是什么？',
        options: ['跟注额 ÷ (底池 + 跟注额)', '底池 ÷ 跟注额', '跟注额 ÷ 底池'],
        correctIndex: 0,
        explanation: '底池赔率 = 跟注额 ÷ (底池 + 跟注额)。',
      },
    ];
    act(() => {
      root.render(
        <StrictMode>
          <TheoryQuiz chapter={makeChapter(quiz)} onComplete={onComplete} />
        </StrictMode>,
      );
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(container.textContent).toContain('底池赔率的定义是什么？');
  });
});
