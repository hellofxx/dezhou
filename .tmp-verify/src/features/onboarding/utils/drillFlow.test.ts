/**
 * drillFlow 纯状态机回归测试（P2A-03/04/05）：
 * - P2A-03：原题库末题答错 → rescueHint 正确显示（旧条件因 append 同批 flush 恒 false）
 * - P2A-04：补救题仅追加一次，补救题再答错不再 append（不出现"第 5 题/共 6 题"）
 * - P2A-05：显式 rescueUsed 状态机，advanceDrill 无死分支（末题答对/补救作答均可收尾）
 */
import { describe, it, expect } from 'vitest';
import {
  DRILL_QUESTIONS,
  RESCUE_QUESTION,
  createDrillState,
  answerCurrentQuestion,
  advanceDrill,
  shouldShowRescueHint,
  isOnRescueQuestion,
  isOnFinalQuestion,
  type DrillState,
} from './drillFlow';
import type { RangeAction } from '@/shared/types/poker';

/** 按正确答案作答前 n 题并推进到第 n 题（0-based currentIdx = n） */
function playCorrectUntil(state: DrillState, n: number): DrillState {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = answerCurrentQuestion(s, s.questions[i]!.correctAction);
    const r = advanceDrill(s);
    if (r.done) throw new Error('提前完成，测试前提被破坏');
    s = r.state;
  }
  return s;
}

/** 对当前题给出一个错误动作 */
function wrongActionFor(s: DrillState): RangeAction {
  return s.questions[s.currentIdx]!.correctAction === 'raise' ? 'fold' : 'raise';
}

describe('drillFlow 基础流程', () => {
  it('全部题目携带稳定且唯一的 id（QuizCard hand+id 复合动画 key 唯一性防回归）', () => {
    const all = [...DRILL_QUESTIONS, RESCUE_QUESTION];
    for (const q of all) {
      expect(q.id).toBeTruthy();
    }
    expect(new Set(all.map((q) => q.id)).size).toBe(all.length);
  });

  it('初始状态：4 题原题库、rescueUsed=false、无反馈', () => {
    const s = createDrillState();
    expect(s.questions).toHaveLength(4);
    expect(s.questions).toEqual(DRILL_QUESTIONS);
    expect(s.rescueUsed).toBe(false);
    expect(s.feedback).toBeNull();
  });

  it('全对流程：不追加补救题，末题答对 advance → done', () => {
    let s = playCorrectUntil(createDrillState(), 3);
    expect(isOnFinalQuestion(s)).toBe(true);
    s = answerCurrentQuestion(s, s.questions[3]!.correctAction);
    expect(s.questions).toHaveLength(4);
    expect(s.rescueUsed).toBe(false);
    expect(shouldShowRescueHint(s)).toBe(false);
    expect(advanceDrill(s)).toEqual({ done: true });
  });

  it('中间题答错不追加补救题', () => {
    let s = createDrillState();
    s = answerCurrentQuestion(s, wrongActionFor(s)); // 第 1 题答错
    expect(s.questions).toHaveLength(4);
    expect(s.rescueUsed).toBe(false);
    expect(shouldShowRescueHint(s)).toBe(false);
    const r = advanceDrill(s);
    expect(r.done).toBe(false); // 答错也正常推进
  });

  it('已作答后重复提交被忽略；未作答不可前进', () => {
    let s = createDrillState();
    expect(advanceDrill(s)).toEqual({ done: false, state: s }); // 未作答
    s = answerCurrentQuestion(s, 'raise');
    const again = answerCurrentQuestion(s, 'fold');
    expect(again).toBe(s); // 重复提交忽略
  });
});

describe('补救机制（P2A-03/04/05）', () => {
  it('P2A-03：末题答错 → rescueHint 显示，且题目追加为 5 题', () => {
    let s = playCorrectUntil(createDrillState(), 3);
    s = answerCurrentQuestion(s, wrongActionFor(s)); // 末题答错
    expect(s.questions).toHaveLength(5);
    expect(s.questions[4]).toEqual(RESCUE_QUESTION);
    expect(s.rescueUsed).toBe(true);
    expect(shouldShowRescueHint(s)).toBe(true); // 旧实现此处恒 false（死文案）
  });

  it('推进到补救题后 hint 不再显示，按钮语义为最后一题', () => {
    let s = playCorrectUntil(createDrillState(), 3);
    s = answerCurrentQuestion(s, wrongActionFor(s));
    const r = advanceDrill(s);
    expect(r.done).toBe(false);
    s = (r as { done: false; state: DrillState }).state;
    expect(isOnRescueQuestion(s)).toBe(true);
    expect(isOnFinalQuestion(s)).toBe(true); // 显示"完成"
    expect(shouldShowRescueHint(s)).toBe(false);
  });

  it('P2A-04：补救题再答错不再追加（仍 5 题，题号不出现 5/6），advance → done', () => {
    let s = playCorrectUntil(createDrillState(), 3);
    s = answerCurrentQuestion(s, wrongActionFor(s)); // 末题答错 → 追加补救
    s = (advanceDrill(s) as { done: false; state: DrillState }).state;
    s = answerCurrentQuestion(s, wrongActionFor(s)); // 补救题也答错
    expect(s.questions).toHaveLength(5); // 不再 append（rescueUsed + 原题库末题双守卫）
    expect(s.rescueUsed).toBe(true);
    expect(shouldShowRescueHint(s)).toBe(false);
    expect(advanceDrill(s)).toEqual({ done: true }); // 补救仅一次，以此收尾
  });

  it('补救题答对 → done', () => {
    let s = playCorrectUntil(createDrillState(), 3);
    s = answerCurrentQuestion(s, wrongActionFor(s));
    s = (advanceDrill(s) as { done: false; state: DrillState }).state;
    s = answerCurrentQuestion(s, RESCUE_QUESTION.correctAction);
    expect(s.feedback?.isCorrect).toBe(true);
    expect(advanceDrill(s)).toEqual({ done: true });
  });

  it('P2A-05：rescueUsed 状态机全程单调（false → true 后不复位）', () => {
    let s = playCorrectUntil(createDrillState(), 3);
    expect(s.rescueUsed).toBe(false);
    s = answerCurrentQuestion(s, wrongActionFor(s));
    expect(s.rescueUsed).toBe(true);
    s = (advanceDrill(s) as { done: false; state: DrillState }).state;
    expect(s.rescueUsed).toBe(true); // 推进不复位（旧实现 setLastAnswerCorrect(null) 推断态被清）
    s = answerCurrentQuestion(s, wrongActionFor(s));
    expect(s.rescueUsed).toBe(true);
  });
});
