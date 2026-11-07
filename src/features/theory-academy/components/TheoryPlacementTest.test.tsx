/**
 * TheoryPlacementTest 组件测试（jsdom）：
 * 1. 走完 16 题后只写 placement（推荐起点 + 免修列表），**绝不写 completedChapters**；
 * 2. 不触碰 ELO / 情绪计数（测评不进能力分）；
 * 3. 低分档位展示零基础先修清单与入门向导链接（/academy/basics）；
 * 4. 重测取并集（低分不收回已获得的免修）。
 * 不引入 testing-library，沿用仓库既有 react-dom/client + act 模式。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import { TheoryPlacementTest } from './TheoryPlacementTest';
import { useTheoryStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
import { THEORY_PLACEMENT_QUESTIONS, placementOptionKey } from '../data/placementQuestions';
import { orderPlacementOptions } from '../utils/placement';

const t = i18n.t.bind(i18n);

/** 每题按出口函数重排后的展示选项（与组件同一条管线） */
function displayedOptions(questionId: string, correctIndex: number) {
  const texts = [0, 1, 2, 3].map((index) => t(placementOptionKey(questionId, index)));
  return orderPlacementOptions(questionId, texts, correctIndex);
}

function findButton(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((candidate) =>
    (candidate.textContent ?? '').includes(text),
  );
  if (!button) {
    const all = Array.from(container.querySelectorAll('button')).map((b) => b.textContent);
    throw new Error(`未找到按钮「${text}」；现有：${JSON.stringify(all)}`);
  }
  return button;
}

function click(container: HTMLElement, text: string) {
  const button = findButton(container, text);
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function answerAll(container: HTMLElement, correctCount: number) {
  THEORY_PLACEMENT_QUESTIONS.forEach((question, index) => {
    const options = displayedOptions(question.id, question.correctIndex);
    const target =
      index < correctCount
        ? options.find((option) => option.isCorrect)!
        : options.find((option) => !option.isCorrect)!;
    click(container, target.text);
    const isLast = index === THEORY_PLACEMENT_QUESTIONS.length - 1;
    click(container, isLast ? t('theory.placement.finish') : t('theory.placement.next'));
  });
}

/** 从 intro 进入测评并作答 */
function runPlacement(container: HTMLElement, correctCount: number) {
  click(container, t('theory.placement.start'));
  answerAll(container, correctCount);
}

function render() {
  return (
    <MemoryRouter>
      <TheoryPlacementTest />
    </MemoryRouter>
  );
}

describe('TheoryPlacementTest 结果落库', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => useTheoryStore.getState().resetProgress());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    act(() => useTheoryStore.getState().resetProgress());
  });

  it('11 题答对 → 推荐 T4，免修 T1–T3，且不写 completedChapters', () => {
    const eloBefore = useProgressStore.getState().eloByVariant.standard.gamesPlayed;
    const answeredBefore = useProgressStore.getState().emotion.dailyQuestionsAnswered;

    act(() => {
      root.render(render());
    });
    runPlacement(container, 11);

    const progress = useTheoryStore.getState().progress;
    expect(progress.placement?.recommendedLevelId).toBe('t4');
    expect(progress.placement?.creditLevels).toEqual(['t1', 't2', 't3']);
    expect(progress.placement?.correct).toBe(11);
    expect(progress.completedChapters).toEqual([]);
    // 测评不进 ELO / 情绪计数
    expect(useProgressStore.getState().eloByVariant.standard.gamesPlayed).toBe(eloBefore);
    expect(useProgressStore.getState().emotion.dailyQuestionsAnswered).toBe(answeredBefore);
    expect(container.textContent).toContain(t('theory.placement.resultTitle'));
  });

  it('全错 → 推荐 T1、无免修，并给出零基础先修清单与入门向导链接', () => {
    act(() => {
      root.render(render());
    });
    runPlacement(container, 0);

    const progress = useTheoryStore.getState().progress;
    expect(progress.placement?.recommendedLevelId).toBe('t1');
    expect(progress.placement?.creditLevels).toEqual([]);
    expect(progress.completedChapters).toEqual([]);

    expect(container.textContent).toContain(t('theory.placement.zeroBasedTitle'));
    expect(container.textContent).toContain(t('theory.placement.prereq.title'));
    expect(container.textContent).toContain(t('theory.placement.prereq.rule'));
    const basicsLink = Array.from(container.querySelectorAll('a')).find((anchor) =>
      (anchor.textContent ?? '').includes(t('theory.placement.basicsCta')),
    );
    expect(basicsLink?.getAttribute('href')).toBe('/academy/basics');
  });

  it('重测取并集：先免修 T1–T3，后一次低分不收回已获得的免修', () => {
    act(() => {
      root.render(render());
    });
    runPlacement(container, 11);
    // 结果卡「重新测评」直接进入第二轮作答（不再经过 intro）
    click(container, t('theory.placement.retake'));
    answerAll(container, 0);

    const placement = useTheoryStore.getState().progress.placement;
    expect(placement?.recommendedLevelId).toBe('t1');
    expect(placement?.creditLevels).toEqual(['t1', 't2', 't3']);
    expect(useTheoryStore.getState().progress.completedChapters).toEqual([]);
  });
});

describe('定位测评主 CTA 收口（V1 金属件）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => useTheoryStore.getState().resetProgress());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    act(() => useTheoryStore.getState().resetProgress());
  });

  it('「开始定位测评」与「下一题」走 Button variant="default"（btn-brass），不再是平铺黄铜底', () => {
    act(() => {
      root.render(render());
    });

    const start = findButton(container, t('theory.placement.start'));
    expect(start.tagName).toBe('BUTTON');
    expect(start.className).toContain('btn-brass');
    expect(start.className).toContain('min-h-11');
    expect(start.className).not.toContain('bg-[var(--brass-fill)]');

    click(container, t('theory.placement.start'));
    const question = THEORY_PLACEMENT_QUESTIONS[0]!;
    const options = displayedOptions(question.id, question.correctIndex);
    click(container, options.find((option) => option.isCorrect)!.text);

    const next = findButton(container, t('theory.placement.next'));
    expect(next.className).toContain('btn-brass');
    expect(next.className).not.toContain('bg-[var(--brass-fill)]');
  });
});
