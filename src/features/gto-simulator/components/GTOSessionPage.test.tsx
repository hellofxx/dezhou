/**
 * GTOSessionPage（训练会话页）测试（L2 · jsdom）
 *
 * 覆盖契约：三条早退分支（空态 / 完成态 / 题量上限）、单步与多步场景渲染、
 * 答题后的五级反馈与 ELO/SRS/Emotion 记录（仅首决策节点）、完成会话的 trainingEvents
 * 发布与结果页跳转、连续答错降级提示、移动端反馈 Sheet。
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloRating } from '@/shared/types/elo';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { useProgressStore, DEFAULT_STREAK_STATE } from '@/features/progress/store';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingRecord } from '@/shared/types/training';
import { getTodayString } from '@/shared/utils/spacedRepetition';
import { useGTOSimulatorStore } from '../store';
import type { Scenario, DecisionNode, HandStrategy } from '../types';
import GTOSessionPage from './GTOSessionPage';

const store = () => useGTOSimulatorStore.getState();
const progress = () => useProgressStore.getState();

const HERO_AA: [Card, Card] = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Diamonds, rank: Rank.Ace },
];

const PREFLOP_FOLDS = [
  { position: Position.UTG, action: ActionType.Fold },
  { position: Position.HJ, action: ActionType.Fold },
  { position: Position.CO, action: ActionType.Fold },
];

function makeNode(id: string, gtoStrategy: HandStrategy, description = `desc-${id}`): DecisionNode {
  return {
    id,
    street: 'preflop',
    description,
    potSize: 1.5,
    heroHand: HERO_AA,
    gtoStrategy,
    previousActions: PREFLOP_FOLDS,
  };
}

function makeScenario(id: string, nodes: DecisionNode[]): Scenario {
  return {
    id,
    name: `scenario-${id}`,
    description: 'test',
    gameType: 'cash',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    effectiveStack: 100,
    position: Position.BTN,
    playerCount: 6,
    street: 'preflop',
    potSize: 1.5,
    previousActions: PREFLOP_FOLDS,
    heroHand: HERO_AA,
    difficulty: 'intermediate',
    decisionNodes: nodes,
  };
}

const FOLD_STRATEGY: HandStrategy = { fold: 1, call: 0, raise: 0 };
const RAISE_STRATEGY: HandStrategy = { fold: 0, call: 0, raise: 1, raiseAmount: 2.5 };

const FOLD_OPTIMAL = makeNode('fold-optimal', FOLD_STRATEGY, 'fold-optimal-desc');
const SECOND_NODE = makeNode('fold-second', FOLD_STRATEGY, 'fold-second-desc');
const RAISE_OPTIMAL = makeNode('raise-optimal', RAISE_STRATEGY, 'raise-optimal-desc');

const variantElo = (variant: 'standard' | 'short-deck' | 'heads-up'): EloRating => ({ ...DEFAULT_ELO, variant });

function resetProgress(): void {
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: variantElo('standard'),
      'short-deck': variantElo('short-deck'),
      'heads-up': variantElo('heads-up'),
    },
    emotion: { ...DEFAULT_EMOTION_STATE },
    streak: { ...DEFAULT_STREAK_STATE },
    reviewItems: [],
    mentorStyle: 'strict-math',
  });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/gto-simulator/session/active']}>
      <GTOSessionPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function findButton(container: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(text),
  );
}

let emitted: TrainingRecord[] = [];
let unsubscribe: () => void = () => {};

beforeEach(() => {
  store().resetSession();
  resetProgress();
  emitted = [];
  unsubscribe = trainingEvents.subscribe((record) => emitted.push(record));
});

afterEach(() => {
  unsubscribe();
  cleanup();
});

describe('GTOSessionPage 早退分支', () => {
  it('无活跃会话时提示并返回首页', () => {
    renderPage();

    expect(screen.getByText('没有活跃的训练会话')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '返回主页' }));
    expect(screen.getByTestId('location').textContent).toBe('/gto-simulator');
  });

  it('会话已完成时提示训练完成', () => {
    store().startSession([makeScenario('done', [FOLD_OPTIMAL])]);
    useGTOSimulatorStore.setState({ session: { ...store().session!, isComplete: true } });

    renderPage();

    expect(screen.getByText('训练完成！')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Fold' })).toBeNull();
  });

  it('达到每日题量上限时渲染止损守卫而非答题区', () => {
    store().startSession([makeScenario('limit', [FOLD_OPTIMAL])]);
    useProgressStore.setState({
      emotion: {
        ...DEFAULT_EMOTION_STATE,
        dailyQuestionLimit: 3,
        dailyQuestionsAnswered: 3,
        dailyQuestionsDate: getTodayString(),
      },
    });

    renderPage();

    expect(screen.getByText('今日已达题量上限')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Fold' })).toBeNull();
  });
});

describe('GTOSessionPage 单步场景', () => {
  beforeEach(() => {
    store().startSession([makeScenario('single', [FOLD_OPTIMAL])]);
  });

  it('渲染进度、街名、手牌与行动历史', () => {
    const { container } = renderPage();

    expect(container.textContent).toContain('场景 1 / 1');
    expect(screen.getByText('100%')).toBeTruthy();
    // 场景头部街名 + 决策树节点街名各一处
    expect(screen.getAllByText('翻前').length).toBeGreaterThan(1);
    expect(screen.getByText('AA')).toBeTruthy();
    // 单节点也走多步决策树：展示节点描述与等待决策提示
    expect(screen.getByText('fold-optimal-desc')).toBeTruthy();
    expect(screen.getByText(/等待决策/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Fold' })).toBeTruthy();
  });

  it('答题后展示五级反馈、记录 ELO/SRS/Emotion，按钮文案为训练结果', () => {
    const before = progress().eloByVariant.standard;
    const { container } = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));

    expect(screen.getByText('最优决策！')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Fold' })).toBeNull();
    expect(findButton(container, '训练结果')).toBeTruthy();

    expect(store().session!.decisions).toHaveLength(1);
    expect(progress().reviewItems).toHaveLength(1);
    expect(progress().emotion.dailyQuestionsAnswered).toBe(1);
    expect(progress().eloByVariant.standard.gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(progress().eloByVariant.standard.postflop).not.toBe(before.postflop);
  });

  it('非最优决策展示错误反馈与「再做一题」入口（仍可继续）', () => {
    store().startSession([makeScenario('suboptimal', [RAISE_OPTIMAL])]);
    const { container } = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));

    expect(screen.getByText('决策错误')).toBeTruthy();
    expect(findButton(container, '再做一题')).toBeTruthy();
  });

  it('点击继续完成会话：发布 trainingEvents、记录连续训练并跳转结果页', () => {
    const { container } = renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));
    fireEvent.click(findButton(container, '训练结果')!);

    expect(store().session!.isComplete).toBe(true);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]!.module).toBe('gto-simulator');
    expect(emitted[0]!.mode).toBe('scenario');
    expect(emitted[0]!.result.totalQuestions).toBe(1);
    expect(emitted[0]!.result.correctAnswers).toBe(1);
    expect(progress().streak.currentStreak).toBe(1);
    expect(progress().streak.lastTrainingDate).toBe(getTodayString());
    expect(screen.getByTestId('location').textContent).toBe(
      `/gto-simulator/result/${store().lastResult!.sessionId}`,
    );
  });
});

describe('GTOSessionPage 多步场景', () => {
  it('首节点继续后切到下一节点，仅首节点记录 ELO/SRS/Emotion', () => {
    store().startSession([makeScenario('multi', [FOLD_OPTIMAL, SECOND_NODE])]);
    const { container } = renderPage();

    expect(screen.getByText('fold-optimal-desc')).toBeTruthy();

    // 继续按钮仅在反馈态出现：先答题再看「下一步 →」
    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));
    fireEvent.click(findButton(container, '下一步')!);

    expect(store().currentNodeIndex).toBe(1);
    expect(screen.getByText('fold-second-desc')).toBeTruthy();
    expect(screen.queryByText('最优决策！')).toBeNull();
    expect(screen.getByRole('button', { name: 'Fold' })).toBeTruthy();

    // 第二个节点（非首节点）答题：不再重复记录 ELO/SRS/Emotion
    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));

    expect(store().session!.decisions).toHaveLength(2);
    expect(progress().reviewItems).toHaveLength(1);
    expect(progress().emotion.dailyQuestionsAnswered).toBe(1);
    expect(progress().eloByVariant.standard.gamesPlayed).toBe(1);
  });

  it('连续答错 3 次时展示降级提示', () => {
    store().startSession([makeScenario('downshift', [FOLD_OPTIMAL])]);
    useProgressStore.setState({
      emotion: { ...DEFAULT_EMOTION_STATE, consecutiveWrongCount: 3 },
    });

    renderPage();

    expect(screen.getByText(/建议返回场景设置选择更简单的难度/)).toBeTruthy();
  });
});


describe('GTOSessionPage 移动端反馈 Sheet', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('移动端作答后反馈渲染进底部 dialog Sheet', () => {
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

    store().startSession([makeScenario('mobile', [FOLD_OPTIMAL])]);
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Fold' }));

    const dialog = screen.getByRole('dialog');
    expect(dialog.textContent).toContain('最优决策！');
    expect(dialog.textContent).toContain('训练结果');
  });
});
