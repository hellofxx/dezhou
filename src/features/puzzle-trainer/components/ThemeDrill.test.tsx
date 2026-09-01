/**
 * ThemeDrill 主题切换重挂载回归测试（BUG-PZL-003）。
 *
 * 场景：同一路由 /puzzle/theme/:themeId 内 themeId 原地变化（如从主题页跳转另一个主题）。
 * 旧实现 usePuzzleEngine 仅用挂载初值建题，themeId 变化时引擎与会话状态（finalResult /
 * submittedRef）均不重建 → 新主题沿用旧题目集，且旧会话的提交标记会吞掉新会话结果。
 * 现修复：ThemeDrill 外层只校验 themeId，会话子组件以 key={theme} 挂载，themeId 变化即整棵子树重挂载。
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { PuzzleQuestion, PuzzleTheme } from '../types';

let themeId = 'preflop-rfi';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ themeId }),
  useNavigate: () => () => undefined,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'zh' } }),
}));

vi.mock('@/features/progress/store', () => ({
  useProgressStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      recordAnswer: () => undefined,
      recordTrainingDay: () => undefined,
      shouldDownshiftDifficulty: () => false,
    }),
}));

vi.mock('@/shared/stores/trainingEvents', () => ({
  trainingEvents: { emit: () => undefined },
}));

vi.mock('@/shared/components/gate/SessionLimitGuard', () => ({
  default: () => null,
  useSessionLimitReached: () => false,
}));

// 桩：渲染当前题 id + 「作答」「下一题」按钮（真实 PuzzleCard 的反馈卡与推进按钮都在内部）
vi.mock('./PuzzleCard', () => ({
  PuzzleCard: ({
    question,
    onSelectOption,
    onNext,
  }: {
    question: PuzzleQuestion;
    onSelectOption: (id: string) => void;
    onNext: () => void;
  }) => (
    <div>
      <span data-testid="question-id">{question.id}</span>
      <button
        data-testid="answer"
        onClick={() => onSelectOption(question.options.find((o) => o.isCorrect)?.id ?? '')}
      >
        answer
      </button>
      <button data-testid="next" onClick={onNext}>
        next
      </button>
    </div>
  ),
}));

vi.mock('./PuzzleResult', () => ({
  PuzzleResult: () => <div data-testid="result" />,
}));

import ThemeDrill from './ThemeDrill';
import { usePuzzleStore } from '../store';
import { getPuzzlesByTheme } from '../data/puzzleBank';

function firstQuestionId(theme: PuzzleTheme): string {
  return getPuzzlesByTheme(theme)[0]?.id ?? '';
}

describe('ThemeDrill themeId 原地切换重建引擎（BUG-PZL-003）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    usePuzzleStore.getState().reset();
    themeId = 'preflop-rfi';
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  const render = () =>
    act(() => {
      root.render(<ThemeDrill />);
    });

  const click = (testId: string) =>
    act(() => {
      container.querySelector<HTMLButtonElement>(`[data-testid="${testId}"]`)?.click();
    });

  const questionIdInDom = () =>
    container.querySelector<HTMLElement>('[data-testid="question-id"]')?.textContent ?? '';

  // 顶部栏进度 "N/总数" 是页面上第一个 .font-numeric 节点（实时分数区的计数节点在其后）
  const progressInDom = () =>
    container.querySelector<HTMLElement>('.font-numeric')?.textContent ?? '';

  it('默认渲染首主题为该主题首题', () => {
    render();
    expect(questionIdInDom()).toBe(firstQuestionId('preflop-rfi'));
    expect(progressInDom()).toMatch(/^1\//);
  });

  it('themeId 原地变化后引擎重建为新主题首题，进度计数回到 1', () => {
    render();
    // 答掉首题并推进，使 currentIndex 前进（旧实现下切主题后仍停留在旧主题第 2 题）
    click('answer');
    click('next');
    expect(progressInDom()).toMatch(/^2\//);

    themeId = 'c-bet';
    render();

    expect(questionIdInDom()).toBe(firstQuestionId('c-bet'));
    expect(progressInDom()).toMatch(/^1\//);
  });
});
