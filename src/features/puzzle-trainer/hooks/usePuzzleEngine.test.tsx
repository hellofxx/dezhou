/**
 * usePuzzleEngine 状态编排测试（纯引擎逻辑已由 puzzleEngineCore.test.ts 覆盖）。
 *
 * 覆盖 hook 层独有分支：
 *  - 首题作答前不计页面加载时长（PZL-07 冻结）；
 *  - next() 未作答不前进 / 作答后前进 / 末题结束；
 *  - Rush 命数、连对奖励与奖励反馈（lastBonus / clearBonus）；
 *  - Rush 墙钟倒计时到点的 completed / failed 分流（P1D-04）；
 *  - 主题 → 相关课程 ID 映射覆盖全部 10 个主题（反馈闭环）；
 *  - reset 重建初始状态。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { usePuzzleEngine, type UsePuzzleEngineReturn } from './usePuzzleEngine';
import type { PuzzleTheme, UsePuzzleEngineOptions } from '../types';
import { getPuzzlesByTheme } from '../data/puzzleBank';
import { getRushQuestions, RUSH_INITIAL_LIVES } from '../data/rushQuestions';

const FIXED_NOW = new Date(2026, 7, 22, 10, 0, 0, 0);
const RUSH_TEST_DURATION = 60_000;

let api: UsePuzzleEngineReturn | null = null;

function Harness({ options }: { options: UsePuzzleEngineOptions }) {
  api = usePuzzleEngine(options);
  return null;
}

const engine = (): UsePuzzleEngineReturn => {
  if (!api) throw new Error('engine harness not mounted');
  return api;
};

const correctOptionId = (): string => {
  const question = engine().currentQuestion;
  const correct = question?.options.find((o) => o.isCorrect);
  if (!correct) throw new Error('no correct option');
  return correct.id;
};

const wrongOptionId = (): string => {
  const question = engine().currentQuestion;
  const wrong = question?.options.find((o) => !o.isCorrect);
  if (!wrong) throw new Error('no wrong option');
  return wrong.id;
};

describe('usePuzzleEngine 会话编排', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    api = null;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  // 同 key 复用实例（引擎不重建），换 key 即重挂载（重新建初始状态）
  const render = (options: UsePuzzleEngineOptions, key?: string) =>
    act(() => {
      root.render(<Harness key={key} options={options} />);
    });

  const answer = (optionId: string) =>
    act(() => {
      engine().answer(optionId);
    });

  const next = () =>
    act(() => {
      engine().next();
    });

  const advance = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  it('theme 模式初始状态：playing、lives 0、无倒计时、题量按 questionCount 截断', () => {
    render({ mode: 'theme', theme: 'c-bet', questionCount: 2 });
    const { state } = engine();
    expect(state.status).toBe('playing');
    expect(state.currentIndex).toBe(0);
    expect(state.lives).toBe(0);
    expect(state.timeRemaining).toBe(0);
    expect(state.questions).toHaveLength(2);
    expect(state.questions.map((q) => q.id)).toEqual(
      getPuzzlesByTheme('c-bet').slice(0, 2).map((q) => q.id)
    );
  });

  it('daily 模式加载日期种子题库（8 题，无命数）', () => {
    render({ mode: 'daily' });
    expect(engine().state.questions).toHaveLength(8);
    expect(engine().state.lives).toBe(0);
    expect(engine().state.status).toBe('playing');
  });

  it('PZL-07：首题作答前停留的页面加载时长不计入单题用时', () => {
    render({ mode: 'theme', theme: 'c-bet', questionCount: 1 }, 'load-time');
    advance(5000); // 用户阅读场景的时间不计入
    answer(correctOptionId());
    expect(engine().currentAnswer?.timeTaken).toBe(0);

    // 第二题起按题切换时间计算
    render({ mode: 'theme', theme: 'c-bet', questionCount: 2 }, 'per-question');
    answer(correctOptionId());
    next();
    advance(2000);
    answer(correctOptionId());
    expect(engine().currentAnswer?.timeTaken).toBe(2000);
  });

  it('next() 在当前题未作答时不前进', () => {
    render({ mode: 'theme', theme: 'c-bet', questionCount: 2 });
    next();
    expect(engine().state.currentIndex).toBe(0);
    expect(engine().state.status).toBe('playing');
  });

  it('作答后 next() 前进并清空当前题选中态；末题 next() 结束会话', () => {
    render({ mode: 'theme', theme: 'c-bet', questionCount: 2 });
    answer(correctOptionId());
    expect(engine().isCurrentAnswered).toBe(true);
    next();

    expect(engine().state.currentIndex).toBe(1);
    expect(engine().isCurrentAnswered).toBe(false);
    expect(engine().currentAnswer).toBeNull();

    answer(correctOptionId());
    next();
    expect(engine().state.status).toBe('completed');
    expect(engine().state.endTime).not.toBeNull();
    expect(engine().currentQuestion).toBeNull();
  });

  it('buildResult 汇总题量 / 正确率 / 分数 / 主题', () => {
    render({ mode: 'theme', theme: 'c-bet', questionCount: 2 });
    answer(correctOptionId());
    next();
    answer(wrongOptionId());
    next();

    const result = engine().buildResult();
    expect(result.mode).toBe('theme');
    expect(result.theme).toBe('c-bet');
    expect(result.status).toBe('completed');
    expect(result.totalQuestions).toBe(2);
    expect(result.correctCount).toBe(1);
    expect(result.accuracy).toBeCloseTo(0.5, 5);
    expect(result.score).toBe(100);
  });

  it('feedback 闭环：10 个主题全部映射到相关课程 ID', () => {
    const expected: Record<PuzzleTheme, string> = {
      'preflop-rfi': 'l1-hand-selection',
      'big-blind-defense': 'l2-bb-defense',
      'three-bet': 'l2-3bet-basics',
      'c-bet': 'l3-cbet',
      'flush-draw': 'l3-draws',
      'river-value': 'l3-bet-sizing',
      bluff: 'l3-bluffing',
      'short-stack': 'l2-short-stack',
      icm: 'l6-icm',
      multiway: 'l3-multistreet',
    };

    for (const [theme, lessonId] of Object.entries(expected) as [PuzzleTheme, string][]) {
      render({ mode: 'theme', theme, questionCount: 1 }, theme);
      answer(correctOptionId());
      expect(engine().currentAnswer?.relatedLessonId).toBe(lessonId);
    }
  });

  it('rush 模式初始状态：3 条命 + 时长倒计时 + 30 题池（难度递增）', () => {
    render({ mode: 'rush', duration: RUSH_TEST_DURATION });
    const { state } = engine();
    expect(state.lives).toBe(RUSH_INITIAL_LIVES);
    expect(state.timeRemaining).toBe(RUSH_TEST_DURATION);
    expect(state.questions.map((q) => q.id)).toEqual(
      getRushQuestions(30, FIXED_NOW).map((q) => q.id)
    );
  });

  it('rush 答错扣 1 命并清空连对；答对累计连对', () => {
    render({ mode: 'rush', duration: RUSH_TEST_DURATION });
    answer(correctOptionId());
    expect(engine().state.streak).toBe(1);
    next();
    answer(wrongOptionId());
    expect(engine().state.lives).toBe(RUSH_INITIAL_LIVES - 1);
    expect(engine().state.streak).toBe(0);
    expect(engine().state.wrongCount).toBe(1);
  });

  it('rush 连对 5 题奖励 +10 秒并给出奖励反馈，clearBonus 清空', () => {
    render({ mode: 'rush', duration: RUSH_TEST_DURATION });
    for (let i = 0; i < 5; i += 1) {
      answer(correctOptionId());
      next();
    }
    expect(engine().state.bonusAwarded).toBe(10_000);
    expect(engine().state.timeRemaining).toBe(RUSH_TEST_DURATION + 10_000);
    expect(engine().lastBonus).toBe(10_000);

    act(() => engine().clearBonus());
    expect(engine().lastBonus).toBe(0);
  });

  it('rush 命耗尽后 next() 判 failed（末题同口径）', () => {
    render({ mode: 'rush', duration: RUSH_TEST_DURATION });
    for (let i = 0; i < RUSH_INITIAL_LIVES; i += 1) {
      answer(wrongOptionId());
      next();
    }
    expect(engine().state.lives).toBe(0);
    expect(engine().state.status).toBe('failed');
    expect(engine().state.endTime).not.toBeNull();
  });

  it('rush 时间到判 completed（仍有命）', () => {
    render({ mode: 'rush', duration: RUSH_TEST_DURATION });
    advance(RUSH_TEST_DURATION + 250);
    expect(engine().state.timeRemaining).toBe(0);
    expect(engine().state.status).toBe('completed');
  });

  it('P1D-04：归零瞬间命已耗尽（停留在答错反馈）判 failed 而非 completed', () => {
    render({ mode: 'rush', duration: RUSH_TEST_DURATION });
    for (let i = 0; i < RUSH_INITIAL_LIVES; i += 1) {
      answer(wrongOptionId());
      if (i < RUSH_INITIAL_LIVES - 1) next();
    }
    expect(engine().state.lives).toBe(0);
    expect(engine().state.status).toBe('playing');

    advance(RUSH_TEST_DURATION + 250);
    expect(engine().state.status).toBe('failed');
  });

  it('reset 重建初始状态并清空奖励反馈', () => {
    render({ mode: 'rush', duration: RUSH_TEST_DURATION });
    for (let i = 0; i < 5; i += 1) {
      answer(correctOptionId());
      next();
    }
    act(() => engine().reset());
    const { state } = engine();
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual([]);
    expect(state.bonusAwarded).toBe(0);
    expect(state.timeRemaining).toBe(RUSH_TEST_DURATION);
    expect(state.status).toBe('playing');
    expect(engine().lastBonus).toBe(0);
  });
});
