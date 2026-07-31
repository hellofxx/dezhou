import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Position } from '@/shared/types/position';
import { useRangeTrainerStore } from './store';
import { INITIAL_QUIZ_STATE } from './storeQuizSlice';
import type { QuizQuestion } from './types';

/** 构造单题 running 状态（绕过随机题目生成，保证确定性） */
function setRunningState(question: QuizQuestion, overrides: Partial<typeof INITIAL_QUIZ_STATE> = {}) {
  useRangeTrainerStore.setState({
    quizState: {
      ...INITIAL_QUIZ_STATE,
      position: question.position,
      actionType: 'open',
      totalQuestions: 1,
      questions: [question],
      answers: [null],
      isCorrect: [false],
      timePerQuestion: [0],
      status: 'running',
      questionStartTime: Date.now(),
      ...overrides,
    },
  });
}

const foldQuestion: QuizQuestion = {
  hand: '72o',
  position: Position.UTG,
  correctAction: 'fold',
  context: 'UTG open',
};

describe('range-trainer quiz store（P1-A 修复回归）', () => {
  beforeEach(() => {
    useRangeTrainerStore.setState({
      quizState: { ...INITIAL_QUIZ_STATE, handWeights: {} },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── P1A-01：无题库组合不进入 running ───────────────────────
  describe('P1A-01 startQuiz 无题库组合', () => {
    it('无匹配 preset（UTG + 4bet）→ 返回 false 且状态停留 idle', () => {
      const ok = useRangeTrainerStore.getState().startQuiz(Position.UTG, '4bet', 10, 10);
      expect(ok).toBe(false);
      expect(useRangeTrainerStore.getState().quizState.status).toBe('idle');
      expect(useRangeTrainerStore.getState().quizState.questions).toHaveLength(0);
    });

    it('有效组合（UTG + open）→ 返回 true 并进入 running', () => {
      const ok = useRangeTrainerStore.getState().startQuiz(Position.UTG, 'open', 10, 10);
      expect(ok).toBe(true);
      const { quizState } = useRangeTrainerStore.getState();
      expect(quizState.status).toBe('running');
      expect(quizState.questions.length).toBeGreaterThan(0);
      // 末题为简单题 AA@BTN raise
      const last = quizState.questions[quizState.questions.length - 1]!;
      expect(last.hand).toBe('AA');
      expect(last.correctAction).toBe('raise');
    });
  });

  // ─── P1A-02：超时恒判错（即使正确答案为 fold）─────────────────
  describe('P1A-02 超时判错', () => {
    it("正确答案为 fold 时，answerQuestion('timeout') 仍判错并加权", () => {
      setRunningState(foldQuestion);
      useRangeTrainerStore.getState().answerQuestion('timeout');
      const { quizState } = useRangeTrainerStore.getState();
      expect(quizState.isCorrect[0]).toBe(false);
      expect(quizState.answers[0]).toBe('timeout');
      // 答错 → 间隔重复权重上调
      expect(quizState.handWeights['72o']).toBe(2);
    });

    it("主动选择 fold（正确答案 fold）仍判对，语义与超时区分", () => {
      setRunningState(foldQuestion);
      useRangeTrainerStore.getState().answerQuestion('fold');
      const { quizState } = useRangeTrainerStore.getState();
      expect(quizState.isCorrect[0]).toBe(true);
      expect(quizState.answers[0]).toBe('fold');
      expect(quizState.handWeights['72o']).toBe(1);
    });
  });

  // ─── P1A-09：resetQuiz 保留 handWeights ────────────────────
  describe('P1A-09 resetQuiz 保留间隔重复权重', () => {
    it('resetQuiz 后 handWeights 不被清空，其余字段回到初始', () => {
      setRunningState(foldQuestion, { handWeights: { '72o': 3, 'A5s': 2 } });
      useRangeTrainerStore.getState().resetQuiz();
      const { quizState } = useRangeTrainerStore.getState();
      expect(quizState.handWeights).toEqual({ '72o': 3, 'A5s': 2 });
      expect(quizState.status).toBe('idle');
      expect(quizState.questions).toHaveLength(0);
      expect(quizState.currentIndex).toBe(0);
    });
  });

  // ─── P1A-14：暂停前已耗时不丢失，恢复后续算 ──────────────────
  describe('P1A-14 暂停耗时续算', () => {
    it('答题耗时 = 暂停前已耗时 + 恢复后耗时', () => {
      const t0 = 1_000_000;
      const nowSpy = vi.spyOn(Date, 'now');

      nowSpy.mockReturnValue(t0);
      setRunningState(foldQuestion);

      // 5 秒后暂停：已耗时 5000ms 应累计入 pausedElapsed
      nowSpy.mockReturnValue(t0 + 5000);
      useRangeTrainerStore.getState().pauseQuiz();
      expect(useRangeTrainerStore.getState().quizState.pausedElapsed).toBe(5000);
      expect(useRangeTrainerStore.getState().quizState.status).toBe('paused');

      // 4 秒暂停期后恢复：段起点重置，pausedElapsed 保留
      nowSpy.mockReturnValue(t0 + 9000);
      useRangeTrainerStore.getState().resumeQuiz();
      expect(useRangeTrainerStore.getState().quizState.pausedElapsed).toBe(5000);
      expect(useRangeTrainerStore.getState().quizState.questionStartTime).toBe(t0 + 9000);

      // 恢复 1 秒后作答：总耗时 = 5000 + 1000 = 6000ms（暂停期 4 秒不计入）
      nowSpy.mockReturnValue(t0 + 10000);
      useRangeTrainerStore.getState().answerQuestion('fold');
      expect(useRangeTrainerStore.getState().quizState.timePerQuestion[0]).toBe(6000);
    });

    it('切题时 pausedElapsed 归零', () => {
      const t0 = 2_000_000;
      const nowSpy = vi.spyOn(Date, 'now');
      nowSpy.mockReturnValue(t0);
      setRunningState(foldQuestion, {
        questions: [foldQuestion, { ...foldQuestion, hand: '83o' }],
        answers: ['fold', null],
        isCorrect: [true, false],
        timePerQuestion: [1000, 0],
        totalQuestions: 2,
        pausedElapsed: 5000,
      });
      useRangeTrainerStore.getState().nextQuestion();
      expect(useRangeTrainerStore.getState().quizState.pausedElapsed).toBe(0);
      expect(useRangeTrainerStore.getState().quizState.currentIndex).toBe(1);
    });
  });
});
