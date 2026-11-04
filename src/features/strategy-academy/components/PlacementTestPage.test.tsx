import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlacementTestPage from './PlacementTestPage';
import { useAcademyStore } from '../store';
import { PLACEMENT_QUESTIONS, type PlacementQuestion } from '../data/placementQuestions';
import { orderResolvedOptions } from '../utils/quizShuffle';
import { loadAcademyCourseFiles } from '@/i18n/academyCourse';

/**
 * 定位测评组件契约（P1）：
 * - 说明 → 逐题作答 → 结果 → 重测
 * - 完成时写 placement（creditLevels），绝不写 completedLessons / lessonAttempts
 * - 重测不降级（store 并集）
 * - 结果页必须说明"只放宽解锁，不计完成"与 L5+ 不参与免修
 */

beforeAll(async () => {
  await loadAcademyCourseFiles(['placement'], 'zh');
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/academy/placement']}>
      <PlacementTestPage />
    </MemoryRouter>,
  );
}

function optionButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'));
}

function advanceButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: /下一题|查看结果/ });
}

/** 与组件同源的选项重排结果（判分以展示顺序为准） */
function displayed(question: PlacementQuestion): { options: string[]; correctIndex: number } {
  const ordered = orderResolvedOptions(
    question.id,
    question.options,
    question.correctIndex,
    (text) => text,
  );
  return { options: ordered.options, correctIndex: ordered.correctIndex };
}

function answerAll(pick: (ordered: { options: string[]; correctIndex: number }) => number) {
  for (const question of PLACEMENT_QUESTIONS) {
    const ordered = displayed(question);
    const buttons = optionButtons();
    expect(buttons, `第 ${question.id} 题选项数量`).toHaveLength(question.options.length);
    expect(buttons.map((button) => button.textContent?.trim())).toEqual(ordered.options);
    fireEvent.click(buttons[pick(ordered)]!);
    fireEvent.click(advanceButton());
  }
}

describe('PlacementTestPage：流程', () => {
  it('说明页展示口径与开始入口，开始后进入第 1 题', () => {
    renderPage();
    expect(screen.getByText('定位测评')).toBeTruthy();
    expect(screen.getByText('16 道概念题，帮你找到合适的起点')).toBeTruthy();
    expect(screen.getByText(/结果只放宽解锁，不计完成/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '开始测评' }));
    expect(screen.getByText('第 1 / 16 题')).toBeTruthy();
    expect(optionButtons()).toHaveLength(PLACEMENT_QUESTIONS[0]!.options.length);
  });

  it('未选择选项时不能前进；答错展示解析', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '开始测评' }));
    expect(advanceButton().disabled).toBe(true);

    const first = PLACEMENT_QUESTIONS[0]!;
    const ordered = displayed(first);
    const wrongIndex = (ordered.correctIndex + 1) % ordered.options.length;
    fireEvent.click(optionButtons()[wrongIndex]!);

    expect(screen.getByText('答错了')).toBeTruthy();
    expect(screen.getByText('解析')).toBeTruthy();
    expect(document.body.textContent).toContain(first.explanation);
    expect(advanceButton().disabled).toBe(false);
  });

  it('全对 16 题：推荐 L4B、免修 L1-L4A，且只写 placement 不写完成态', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '开始测评' }));
    answerAll((ordered) => ordered.correctIndex);

    expect(screen.getByText('测评结果')).toBeTruthy();
    expect(screen.getByText('答对 16 / 16 题')).toBeTruthy();
    expect(screen.getByText('推荐起点')).toBeTruthy();
    expect(screen.getByText('进阶思维 · GTO与博弈论')).toBeTruthy();
    expect(screen.getByText('只放宽解锁，不计完成')).toBeTruthy();
    expect(screen.getByText(/L5 及以上不参与免修/)).toBeTruthy();
    // 免修范围 = L1 / L2 / L3 / L4A 四个条目
    expect(screen.getByText('基础入门')).toBeTruthy();
    expect(screen.getByText('翻前策略')).toBeTruthy();
    expect(screen.getByText('翻后策略')).toBeTruthy();
    expect(screen.getByText('进阶思维 · 范围与EV')).toBeTruthy();

    const state = useAcademyStore.getState();
    expect(state.placement).toMatchObject({
      recommendedLevelId: 'l4b',
      creditLevels: ['l1', 'l2', 'l3', 'l4a'],
      correct: 16,
      total: 16,
    });
    // 只放宽解锁：完成态与课时尝试零写入
    expect(state.progress.completedLessons).toEqual([]);
    expect(state.lessonAttempts).toEqual({});
    expect(state.progress.quizScores).toEqual({});
  });

  it('重测不降级：先全对再全错，推荐起点仍为 L4B 且免修范围不缩水', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '开始测评' }));
    answerAll((ordered) => ordered.correctIndex);
    expect(useAcademyStore.getState().placement?.recommendedLevelId).toBe('l4b');

    fireEvent.click(screen.getByRole('button', { name: '重新测评' }));
    expect(screen.getByText('第 1 / 16 题')).toBeTruthy();

    answerAll((ordered) => (ordered.correctIndex + 1) % ordered.options.length);
    expect(screen.getByText('答对 0 / 16 题')).toBeTruthy();
    expect(screen.getByText('进阶思维 · GTO与博弈论')).toBeTruthy();

    const state = useAcademyStore.getState();
    expect(state.placement).toMatchObject({
      recommendedLevelId: 'l4b',
      creditLevels: ['l1', 'l2', 'l3', 'l4a'],
      correct: 0,
      total: 16,
    });
    expect(state.progress.completedLessons).toEqual([]);
  });

  it('零分（全错）首测：推荐 L1、无免修', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: '开始测评' }));
    answerAll((ordered) => (ordered.correctIndex + 1) % ordered.options.length);

    expect(screen.getByText('无免修，从基础入门开始')).toBeTruthy();
    const state = useAcademyStore.getState();
    expect(state.placement).toMatchObject({
      recommendedLevelId: 'l1',
      creditLevels: [],
      correct: 0,
    });
    expect(state.progress.completedLessons).toEqual([]);
  });
});
