/**
 * TheoryQuiz 答错回顾门回归（Fix 3 反馈闭环）：
 * 答错解析内出现「回顾本章」quiet 按钮且点击触发 onReview；
 * 答对不渲染；未注入 onReview 时答错也不渲染（可选契约）。
 * 渲染模式对齐 TheoryQuiz.test.tsx（react-dom/client + act，不引入 testing-library）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { TheoryQuiz } from './TheoryQuiz';
import { useTheoryStore } from '../store';
import type { TheoryChapter } from '../types';

MotionGlobalConfig.skipAnimations = true;

const CHAPTER_ID = 't1-review-chapter';

const QUESTION = {
  id: 't1-review-q1',
  question: '底池赔率的定义是什么？',
  options: ['跟注额 ÷ (底池 + 跟注额)', '底池 ÷ 跟注额', '跟注额 ÷ 底池'],
  correctIndex: 0,
  explanation: '底池赔率 = 跟注额 ÷ (底池 + 跟注额)。',
};

function makeChapter(): TheoryChapter {
  return {
    id: CHAPTER_ID,
    level: 1,
    order: 1,
    title: '回顾门测试章',
    subtitle: '答错回顾回归',
    duration: '1 min',
    eloDimension: 'math',
    content: [],
    quiz: [QUESTION],
    variant: 'standard',
  };
}

let container: HTMLDivElement;
let root: Root;

function reviewButton(): HTMLButtonElement | undefined {
  const label = i18n.t('theory.quiz.reviewChapter');
  return Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(label),
  );
}

function clickOption(optionText: string) {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(optionText),
  );
  expect(btn, `选项按钮 ${optionText} 存在`).toBeDefined();
  act(() => {
    btn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  // 清空本章尝试记录：首次作答口径（回顾门与首次/练习无关，但保持环境干净）
  const progress = useTheoryStore.getState().progress;
  act(() => {
    useTheoryStore.setState({ progress: { ...progress, chapterAttempts: {} } });
  });
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('TheoryQuiz 答错回顾门', () => {
  it('答错：解析内出现「回顾本章」，点击触发 onReview', () => {
    let reviewed = 0;
    act(() => {
      root.render(
        <TheoryQuiz chapter={makeChapter()} onComplete={() => {}} onReview={() => { reviewed += 1; }} />,
      );
    });
    expect(reviewButton()).toBeUndefined();

    clickOption(QUESTION.options[1]!);
    const btn = reviewButton();
    expect(btn, '答错后必须渲染回顾按钮').toBeDefined();
    act(() => {
      btn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(reviewed).toBe(1);
  });

  it('答对：不渲染回顾按钮', () => {
    act(() => {
      root.render(
        <TheoryQuiz chapter={makeChapter()} onComplete={() => {}} onReview={() => {}} />,
      );
    });
    clickOption(QUESTION.options[QUESTION.correctIndex]!);
    expect(container.textContent).toContain(i18n.t('theory.quiz.correct'));
    expect(reviewButton()).toBeUndefined();
  });

  it('未注入 onReview：答错也不渲染回顾按钮（可选 prop 契约）', () => {
    act(() => {
      root.render(<TheoryQuiz chapter={makeChapter()} onComplete={() => {}} />);
    });
    clickOption(QUESTION.options[1]!);
    expect(container.textContent).toContain(i18n.t('theory.quiz.incorrect'));
    expect(reviewButton()).toBeUndefined();
  });
});