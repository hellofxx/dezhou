/**
 * TheoryQuiz 组件测试（jsdom）：
 * 1. 空题库防御 effect 在 StrictMode 双跑下 onComplete 仅触发一次（P1F-03）。
 * 2. onComplete 第四参数 wrongQuestionIds 精确上报答错的稳定题 id（供上层写 SRS 队列）。
 * 3. 首次 vs 练习口径：首次作答每题写 progress.updateElo + recordAnswer；
 *    已测过的章（chapterAttempts.attempts ≥ 1）重考为练习态，两者均不得再动。
 * 4. 抽题口径：按 Level 抽题（T4 抽 6 题）并在状态条显示本次抽题数。
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐仓库既有测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MotionGlobalConfig } from 'framer-motion';
import { TheoryQuiz } from './TheoryQuiz';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import type { TheoryChapter, TheoryChapterAttempt } from '../types';

// jsdom 无真实动画帧，跳过动画保证渲染确定
MotionGlobalConfig.skipAnimations = true;

const CHAPTER_ID = 't1-test-chapter';

function makeChapter(
  quiz: TheoryChapter['quiz'],
  overrides: Partial<TheoryChapter> = {},
): TheoryChapter {
  return {
    id: CHAPTER_ID,
    level: 1,
    order: 1,
    title: '测试章节',
    subtitle: '空题库防御回归',
    duration: '1 min',
    eloDimension: 'math',
    content: [],
    quiz,
    variant: 'standard',
    ...overrides,
  };
}

function makeAttempts(count: number): TheoryChapterAttempt {
  return {
    attempts: count,
    firstScore: 60,
    firstCorrect: 3,
    firstTotal: 5,
    bestScore: 80,
    lastScore: 80,
    lastAt: 1,
  };
}

/** 写入 / 清空本章的持久化尝试记录（决定首次 vs 练习） */
function seedChapterAttempts(count: number | null) {
  const progress = useTheoryStore.getState().progress;
  act(() => {
    useTheoryStore.setState({
      progress: {
        ...progress,
        chapterAttempts: count === null ? {} : { [CHAPTER_ID]: makeAttempts(count) },
      },
    });
  });
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

/** ELO / 情绪计数的可观测快照（updateElo 与 recordAnswer 的唯一写入面） */
function progressSnapshot() {
  const state = useProgressStore.getState();
  return {
    gamesPlayed: state.eloByVariant.standard.gamesPlayed,
    answered: state.emotion.dailyQuestionsAnswered,
  };
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

const TWELVE_QUESTIONS = Array.from({ length: 12 }, (_, i) => ({
  id: `t4-test-q${i + 1}`,
  question: `范围题 ${i + 1}`,
  options: ['甲', '乙', '丙', '丁'],
  correctIndex: 0,
  explanation: '解析。',
}));

describe('TheoryQuiz 空题库防御（P1F-03）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    seedChapterAttempts(null);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('StrictMode 下空题库 onComplete 仅触发一次（100, 0, 0, 无错题）', () => {
    const onComplete = (score: number, correct: number, total: number, wrong: string[]) => {
      calls.push([score, correct, total, wrong.length]);
    };
    const calls: number[][] = [];
    act(() => {
      root.render(
        <StrictMode>
          <TheoryQuiz chapter={makeChapter([])} onComplete={onComplete} />
        </StrictMode>,
      );
    });

    // StrictMode 会双跑 effect（mount → cleanup → remount），completedRef 守卫保证只回调一次
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual([100, 0, 0, 0]);
  });

  it('非空题库不触发自动完成，正常渲染首题', () => {
    const calls: number[][] = [];
    const onComplete = (score: number, correct: number, total: number) => {
      calls.push([score, correct, total]);
    };
    act(() => {
      root.render(
        <StrictMode>
          <TheoryQuiz chapter={makeChapter(SINGLE_QUESTION)} onComplete={onComplete} />
        </StrictMode>,
      );
    });

    expect(calls).toHaveLength(0);
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
    seedChapterAttempts(null);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('答错时上抛该题稳定 id，判分口径不变（0 分 / 0 对 / 1 题）', () => {
    const onComplete = (score: number, correct: number, total: number, wrong: string[]) => {
      result = { score, correct, total, wrong };
    };
    let result: { score: number; correct: number; total: number; wrong: string[] } | null = null;
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

    expect(result).toEqual({ score: 0, correct: 0, total: 1, wrong: [q.id] });
  });

  it('答对时上抛空错题列表，判分口径不变（100 分 / 1 对 / 1 题）', () => {
    const onComplete = (score: number, correct: number, total: number, wrong: string[]) => {
      result = { score, correct, total, wrong };
    };
    let result: { score: number; correct: number; total: number; wrong: string[] } | null = null;
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

    expect(result).toEqual({ score: 100, correct: 1, total: 1, wrong: [] });
  });
});

describe('TheoryQuiz 首次 vs 练习口径', () => {
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
    seedChapterAttempts(null);
  });

  it('首次作答：每题写 ELO 与 recordAnswer（状态条显示首次作答）', () => {
    seedChapterAttempts(null);
    const before = progressSnapshot();
    const q = SINGLE_QUESTION[0]!;
    act(() => {
      root.render(<TheoryQuiz chapter={makeChapter(SINGLE_QUESTION)} onComplete={() => {}} />);
    });
    expect(container.textContent).toContain('首次作答');

    clickOption(container, q.options[q.correctIndex]!);
    const after = progressSnapshot();

    expect(after.gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(after.answered).toBe(before.answered + 1);
  });

  it('已测过的章重考为练习态：不动 ELO / recordAnswer，并展示练习横幅', () => {
    seedChapterAttempts(1);
    const before = progressSnapshot();
    const q = SINGLE_QUESTION[0]!;
    act(() => {
      root.render(<TheoryQuiz chapter={makeChapter(SINGLE_QUESTION)} onComplete={() => {}} />);
    });
    expect(container.textContent).toContain('练习模式');
    // 状态条展示已完成尝试数（1 次），而不是本次序号
    expect(container.textContent).toContain('已测 1 次');

    clickOption(container, q.options[q.correctIndex]!);
    const after = progressSnapshot();

    expect(after.gamesPlayed).toBe(before.gamesPlayed);
    expect(after.answered).toBe(before.answered);
  });
});

describe('TheoryQuiz 抽题口径', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    seedChapterAttempts(null);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    seedChapterAttempts(null);
  });

  it('T4 章节从 12 题题池抽 6 题，并在状态条标注抽题数', () => {
    act(() => {
      root.render(
        <TheoryQuiz
          chapter={makeChapter(
            TWELVE_QUESTIONS.map((q) => ({ ...q })),
            { id: 't4-test-chapter', level: 4, eloDimension: 'postflop' },
          )}
          onComplete={() => {}}
        />,
      );
    });

    expect(container.textContent).toContain('本次抽取 6 题');
    expect(container.textContent).toContain('第 1 / 6 题');
  });
});
