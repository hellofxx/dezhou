import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import QuickDrill from './QuickDrill';
import { useAcademyStore } from '../store';
import { DEFAULT_STREAK_STATE, useProgressStore } from '@/features/progress/store';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { loadAcademyLessonsForQuickDrill } from '../data/lessons/loaders';
import { getTodayString } from '@/shared/utils/spacedRepetition';
import { DEFAULT_ELO } from '@/shared/types/elo';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { EloRating } from '@/shared/types/elo';
import type { TrainingRecord } from '@/shared/types/training';

/** 设置标准变体 ELO（弱点维度 / 自适应难度的唯一输入） */
function setStandardElo(overrides: Partial<EloRating>) {
  const state = useProgressStore.getState();
  const elo: EloRating = { ...state.eloByVariant.standard, ...overrides };
  elo.overall = Math.round(
    (elo.preflop + elo.postflop + elo.math + elo.handReading + elo.mental) / 5,
  );
  useProgressStore.setState({ eloByVariant: { ...state.eloByVariant, standard: elo } });
}

function resetStandardElo() {
  const state = useProgressStore.getState();
  useProgressStore.setState({
    eloByVariant: {
      ...state.eloByVariant,
      standard: { ...DEFAULT_ELO, variant: 'standard' },
    },
  });
}

/**
 * 快速训练契约：
 * - quick=true：固定 5 题 / 自适应难度 / 展示 mode 与复习提示
 * - 普通模式：8 题 / 难度可手选
 * - 完成时 recordPracticeScore(quick-drill) + recordTrainingDay + quickDrillStreak
 * - 训练事件使用独立 quick-drill 模式，课程弱项推荐需匹配当前难度
 * - 每日题量达上限时由 SessionLimitGuard 拦截
 */

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <QuickDrill />
    </MemoryRouter>,
  );
}

function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll<HTMLButtonElement>('button.action-mini')];
}

function resetProgressStore() {
  useProgressStore.setState({
    streak: { ...DEFAULT_STREAK_STATE, milestones: { ...DEFAULT_STREAK_STATE.milestones } },
    emotion: { ...DEFAULT_EMOTION_STATE },
    reviewItems: [],
    records: [],
    quickDrillStreak: 0,
    lastQuickDrillDate: null,
    quickDrillBest: null,
  });
}

function makeWeaknessRecord(lessonId: string): TrainingRecord {
  const createdAt = Date.now();
  return {
    id: `puzzle-weakness-${lessonId}`,
    module: 'puzzle-trainer',
    mode: 'daily',
    createdAt,
    result: {
      sessionId: `puzzle-weakness-${lessonId}`,
      module: 'puzzle-trainer',
      totalQuestions: 3,
      correctAnswers: 0,
      accuracy: 0,
      averageTime: 1000,
      timestamp: createdAt,
      details: Array.from({ length: 3 }, (_, index) => ({
        question: `puzzle-q-${index}`,
        isCorrect: false,
        timeTaken: 1000,
        userAnswer: 'Fold',
        correctAnswer: 'Call',
        topic: 'puzzle-weakness',
        relatedLessonId: lessonId,
      })),
    },
  };
}

beforeAll(async () => {
  await loadAcademyLessonsForQuickDrill();
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
  resetProgressStore();
});

afterAll(() => {
  useAcademyStore.getState().resetProgress();
  resetProgressStore();
});

describe('QuickDrill：快速模式', () => {
  it('默认展示 5 题速训与课程弱项 + SRS，完成 5 题后写入训练记录', async () => {
    const { container } = renderAt('/quick?mode=mixed');

    expect(screen.getByText('5 题速训')).toBeTruthy();
    expect(container.textContent).toContain('课程弱项 + SRS');
    expect(container.textContent).toContain('混合');
    expect(screen.getByText('自适应难度')).toBeTruthy();
    expect(screen.getByText('基础')).toBeTruthy();
    expect(container.textContent).toContain('道题目');

    const received: TrainingRecord[] = [];
    const unsubscribe = trainingEvents.subscribe((record) => received.push(record));
    try {
      fireEvent.click(screen.getByText('开始速训'));
      expect(screen.getByText('1 / 5')).toBeTruthy();

      let guard = 0;
      while (guard < 5) {
        guard += 1;
        const options = optionButtons(container);
        expect(options.length).toBeGreaterThan(0);
        fireEvent.click(options[0]!);
        const next = screen.queryByText('下一题') ?? screen.queryByText('查看成绩');
        expect(next).not.toBeNull();
        fireEvent.click(next!);
      }
    } finally {
      unsubscribe();
    }

    await waitFor(() => expect(screen.getByRole('heading', { level: 2, name: '训练完成' })).toBeTruthy());
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('再来一轮')).toBeTruthy();
    expect(within(dialog).getByText('已计入连续训练 ✓')).toBeTruthy();
    expect(within(dialog).getByText('返回首页')).toBeTruthy();

    // 完成回调链路：练习记录 + 训练日 + quickDrillStreak
    const practiceResults = useAcademyStore.getState().practiceResults;
    expect(practiceResults).toHaveLength(1);
    expect(practiceResults[0]!.lessonId).toBe('quick-drill');
    expect(useProgressStore.getState().streak.currentStreak).toBe(1);
    expect(useProgressStore.getState().quickDrillStreak).toBe(1);
    expect(received.find((event) => event.module === 'strategy-academy')?.mode).toBe('quick-drill');

    fireEvent.click(within(screen.getByRole('dialog')).getByText('再来一轮'));
    expect(screen.getByText('开始速训')).toBeTruthy();
  });

  it('普通模式展示 5 分钟速训、难度选择与 8 题', () => {
    const { container } = renderAt('/quick?quick=false');

    expect(screen.getByText('5 分钟速训')).toBeTruthy();
    expect(screen.getByText('选择难度')).toBeTruthy();
    expect(screen.getByText('基础')).toBeTruthy();
    expect(screen.getByText('进阶')).toBeTruthy();
    expect(screen.getByText('高级')).toBeTruthy();
    // 8 题（题目不足时以实际题池为准，真实题库充足）
    expect(container.textContent).toContain('8');

    fireEvent.click(screen.getByText('开始速训'));
    expect(screen.getByText('1 / 8')).toBeTruthy();
  });
});

describe('QuickDrill：训练弱项回流', () => {
  it('展示当前难度有可用题目的扑克谜题弱项课程及原因', () => {
    useProgressStore.setState({ records: [makeWeaknessRecord('l1-basics')] });

    renderAt('/quick?mode=mixed');

    expect(screen.getByText('优先复习你在扑克谜题中暴露的弱项：德州扑克规则与牌型')).toBeTruthy();
  });

  it('弱项课程没有匹配当前难度的题目时不展示推荐原因', () => {
    useProgressStore.setState({ records: [makeWeaknessRecord('l4-gto-basics')] });

    const { container } = renderAt('/quick?mode=mixed');

    expect(container.textContent).not.toContain('优先复习你在扑克谜题中暴露的弱项');
  });

  it('速训 range 模式下非翻前维度的弱项课程不参与聚焦（回归：模式维度约束）', () => {
    // l1-basics 的 ELO 维度为 math，不应在 range（翻前）速训中顶到题首
    useProgressStore.setState({ records: [makeWeaknessRecord('l1-basics')] });

    const { container } = renderAt('/quick?mode=range');

    expect(container.textContent).not.toContain('优先复习你在扑克谜题中暴露的弱项');
  });
});

describe('QuickDrill：每日题量止损', () => {
  it('达到每日题量上限时渲染 SessionLimitGuard', () => {
    const state = useProgressStore.getState();
    useProgressStore.setState({
      emotion: {
        ...state.emotion,
        dailyQuestionLimit: 5,
        dailyQuestionsAnswered: 5,
        dailyQuestionsDate: getTodayString(),
      },
    });

    renderAt('/academy/quick-drill?quick=true');
    expect(screen.getByText('今日已达题量上限')).toBeTruthy();
    expect(screen.getByText('返回 Dashboard')).toBeTruthy();
  });
});

describe('QuickDrill：ELO 驱动的弱点与自适应难度（P0）', () => {
  // 先卸载再改 store：避免在组件已挂载时更新订阅状态（act 警告）
  afterEach(() => {
    cleanup();
    resetStandardElo();
  });

  it('默认 ELO（五维齐平）不显示弱点提示', () => {
    resetStandardElo();
    const { container } = renderAt('/quick?quick=false');
    expect(container.textContent).not.toContain('将优先从你的薄弱领域抽取题目');
  });

  it('存在低于五维均值的维度时显示弱点提示', () => {
    resetStandardElo();
    setStandardElo({ postflop: 300 });
    const { container } = renderAt('/quick?quick=false');
    expect(container.textContent).toContain('将优先从你的薄弱领域抽取题目');
  });

  it.each([
    ['基础', { preflop: 500, postflop: 500, math: 500, handReading: 500, mental: 500 }],
    ['进阶', { preflop: 900, postflop: 900, math: 900, handReading: 900, mental: 900 }],
    ['高级', { preflop: 1300, postflop: 1300, math: 1300, handReading: 1300, mental: 1300 }],
  ])('自适应难度按 ELO 综合分展示「%s」', (label, overrides) => {
    resetStandardElo();
    setStandardElo(overrides);
    renderAt('/academy/quick-drill?quick=true&mode=mixed');
    expect(screen.getByText(label)).toBeTruthy();
  });
});
