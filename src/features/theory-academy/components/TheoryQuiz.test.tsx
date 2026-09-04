/**
 * TheoryQuiz 组件测试（jsdom，P1F-03 回归 + 阶段 4 SRS 接入）：
 * 1. 空题库防御 effect 在 StrictMode 双跑下 onComplete 仅触发一次
 *    （completedRef 一次性守卫，避免 completeChapter 双调、训练事件双 emit）。
 * 2. onComplete 第四参数 wrongQuestionIds 精确上报答错的稳定题 id（供上层写 SRS 队列）。
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 StreakTracker 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import { TheoryQuiz } from './TheoryQuiz';
import type { TheoryChapter } from '../types';

// jsdom 无真实动画帧，跳过动画保证渲染确定
MotionGlobalConfig.skipAnimations = true;

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
    variant: 'standard',
  };
}

/** 按选项文本点击选项按钮（选项经 quizOrder 重排，故只能按文本定位，不能按索引） */
function clickOption(container: HTMLElement, optionText: string) {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(optionText),
  );
  if (!btn) {
    const all = Array.from(container.querySelectorAll('button'))
      .map((b) => JSON.stringify(b.textContent))
      .join(', ');
    throw new Error(`未找到选项按钮：${optionText}；现有按钮：[${all}]`);
  }
  act(() => {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** 点击「查看结果」（最后一题作答后的提交按钮，zh 文案 theory.quiz.viewResult） */
function clickViewResult(container: HTMLElement) {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes('查看结果'),
  );
  if (!btn) throw new Error('未找到「查看结果」按钮');
  act(() => {
    btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const SINGLE_QUESTION = [
  {
    id: 't1-test-q1',
    question: '底池赔率的定义是什么？',
    options: ['跟注额 ÷ (底池 + 跟注额)', '底池 ÷ 跟注额', '跟注额 ÷ 底池'],
    correctIndex: 0,
    explanation: '底池赔率 = 跟注额 ÷ (底池 + 跟注额)。',
  },
];

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

  it('StrictMode 下空题库 onComplete 仅触发一次（100, 0, 0, 无错题）', () => {
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
    expect(onComplete).toHaveBeenCalledWith(100, 0, 0, []);
  });

  it('非空题库不触发自动完成，正常渲染首题', () => {
    const onComplete = vi.fn();
    act(() => {
      root.render(
        <StrictMode>
          <TheoryQuiz chapter={makeChapter(SINGLE_QUESTION)} onComplete={onComplete} />
        </StrictMode>,
      );
    });

    expect(onComplete).not.toHaveBeenCalled();
    expect(container.textContent).toContain('底池赔率的定义是什么？');
  });
});

describe('TheoryQuiz 错题 id 上报（SRS 接入）', () => {
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

  it('答错时上抛该题稳定 id，判分口径不变（0 分 / 0 对 / 1 题）', () => {
    const onComplete = vi.fn();
    const q = SINGLE_QUESTION[0]!;
    act(() => {
      root.render(
        <StrictMode>
          <TheoryQuiz chapter={makeChapter(SINGLE_QUESTION)} onComplete={onComplete} />
        </StrictMode>,
      );
    });

    const wrongText = q.options.find((_, i) => i !== q.correctIndex)!;
    clickOption(container, wrongText);
    clickViewResult(container);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(0, 0, 1, [q.id]);
  });

  it('答对时上抛空错题列表，判分口径不变（100 分 / 1 对 / 1 题）', () => {
    const onComplete = vi.fn();
    const q = SINGLE_QUESTION[0]!;
    act(() => {
      root.render(
        <StrictMode>
          <TheoryQuiz chapter={makeChapter(SINGLE_QUESTION)} onComplete={onComplete} />
        </StrictMode>,
      );
    });

    clickOption(container, q.options[q.correctIndex]!);
    clickViewResult(container);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(100, 1, 1, []);
  });
});
