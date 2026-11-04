import { describe, it, expect } from 'vitest';
import {
  PLACEMENT_BASICS_ROUTE,
  PLACEMENT_PREREQUISITE_KEYS,
  PLACEMENT_ZERO_BASED_MAX_CORRECT,
  createPlacementResult,
  evaluatePlacement,
  getCreditedLevelIds,
  getRecommendedLevelId,
  isPlacementQuestionWellFormed,
  isZeroBasedPlacement,
  orderPlacementOptions,
} from './placement';
import { PLACEMENT_QUESTION_COUNT, THEORY_PLACEMENT_QUESTIONS } from '../data/placementQuestions';

describe('定位测评分档阈值', () => {
  it('0–5 → T1，6–10 → T2，11–13 → T4，14–16 → T6', () => {
    for (let correct = 0; correct <= 5; correct += 1) {
      expect(getRecommendedLevelId(correct), `答对 ${correct}`).toBe('t1');
    }
    for (const correct of [6, 7, 8, 9, 10]) {
      expect(getRecommendedLevelId(correct), `答对 ${correct}`).toBe('t2');
    }
    for (const correct of [11, 12, 13]) {
      expect(getRecommendedLevelId(correct), `答对 ${correct}`).toBe('t4');
    }
    for (const correct of [14, 15, 16]) {
      expect(getRecommendedLevelId(correct), `答对 ${correct}`).toBe('t6');
    }
  });

  it('免修列表 = 推荐起点之前的全部标准 Level', () => {
    expect(getCreditedLevelIds('t1')).toEqual([]);
    expect(getCreditedLevelIds('t2')).toEqual(['t1']);
    expect(getCreditedLevelIds('t4')).toEqual(['t1', 't2', 't3']);
    expect(getCreditedLevelIds('t6')).toEqual(['t1', 't2', 't3', 't4', 't5']);
  });

  it('零基础分档只在 ≤5 时成立（其余分档不给先修清单）', () => {
    expect(PLACEMENT_ZERO_BASED_MAX_CORRECT).toBe(5);
    expect(isZeroBasedPlacement(0)).toBe(true);
    expect(isZeroBasedPlacement(5)).toBe(true);
    expect(isZeroBasedPlacement(6)).toBe(false);
    expect(isZeroBasedPlacement(16)).toBe(false);
  });

  it('先修清单三项 + 入门向导路由固定', () => {
    expect([...PLACEMENT_PREREQUISITE_KEYS]).toEqual(['rule', 'hand', 'position']);
    expect(PLACEMENT_BASICS_ROUTE).toBe('/academy/basics');
  });
});

describe('evaluatePlacement 判分', () => {
  it('得分四舍五入且不出界', () => {
    expect(evaluatePlacement(0, PLACEMENT_QUESTION_COUNT).score).toBe(0);
    expect(evaluatePlacement(11, 16).score).toBe(69);
    expect(evaluatePlacement(16, 16).score).toBe(100);
    expect(evaluatePlacement(99, 16).correct).toBe(16);
    expect(evaluatePlacement(-3, 16).correct).toBe(0);
    expect(evaluatePlacement(0, 0)).toMatchObject({ score: 0, correct: 0, total: 0 });
  });

  it('11 答对 → T4 且免修 T1–T3（零基础清单关闭）', () => {
    const evaluation = evaluatePlacement(11, 16);
    expect(evaluation).toMatchObject({
      recommendedLevelId: 't4',
      creditLevels: ['t1', 't2', 't3'],
      zeroBased: false,
    });
  });

  it('4 答对 → T1 且零基础清单打开、无免修', () => {
    const evaluation = evaluatePlacement(4, 16);
    expect(evaluation).toMatchObject({
      recommendedLevelId: 't1',
      creditLevels: [],
      zeroBased: true,
    });
  });
});

describe('createPlacementResult 载荷', () => {
  it('只含 placement 字段（无 completedChapters / ELO 字段）', () => {
    const result = createPlacementResult(evaluatePlacement(14, 16), 1700000000000);
    expect(Object.keys(result).toSorted()).toEqual(
      ['completedAt', 'correct', 'creditLevels', 'recommendedLevelId', 'score', 'total'].toSorted(),
    );
    expect(result.recommendedLevelId).toBe('t6');
    expect(result.completedAt).toBe(1700000000000);
  });

  it('creditLevels 为独立副本（调用方改动不回流判定结果）', () => {
    const evaluation = evaluatePlacement(6, 16);
    const result = createPlacementResult(evaluation, 1);
    result.creditLevels.push('t9');
    expect(evaluation.creditLevels).toEqual(['t1']);
  });
});

describe('选项排序出口', () => {
  it('数值选项集按数值升序展示', () => {
    const options = ['33%', '75%', '50%', '66%'];
    const ordered = orderPlacementOptions('pl-t5-mdf', options, 2);
    expect(ordered.map((o) => o.text)).toEqual(['33%', '50%', '66%', '75%']);
    expect(ordered.filter((o) => o.isCorrect).map((o) => o.text)).toEqual(['50%']);
  });

  it('文字选项集按 id 种子洗牌：同 id 顺序稳定、异 id 分布互异', () => {
    const options = ['甲', '乙', '丙', '丁'];
    const a = orderPlacementOptions('pl-t3-position', options, 1);
    const b = orderPlacementOptions('pl-t3-position', options, 1);
    expect(a.map((o) => o.text)).toEqual(b.map((o) => o.text));
    expect(a.map((o) => o.text).toSorted()).toEqual(options.toSorted());
    expect(a.find((o) => o.isCorrect)?.text).toBe('乙');
    // 不同题 id 的正确项展示位置不应全部相同（答案位置偏差治理）
    const ids = ['pl-t1-variance', 'pl-t2-implied', 'pl-t3-gap', 'pl-t4-blockers', 'pl-t6-spr'];
    const positions = new Set(
      ids.map((id) => orderPlacementOptions(id, options, 1).findIndex((o) => o.isCorrect)),
    );
    expect(positions.size).toBeGreaterThan(1);
  });
});

describe('题库结构', () => {
  it('16 题且 correctIndex 均在 0–3', () => {
    expect(PLACEMENT_QUESTION_COUNT).toBe(16);
    expect(THEORY_PLACEMENT_QUESTIONS).toHaveLength(16);
    for (const question of THEORY_PLACEMENT_QUESTIONS) {
      expect(isPlacementQuestionWellFormed(question), question.id).toBe(true);
    }
  });

  it('题 id 唯一且覆盖 T1–T6 概念', () => {
    const ids = THEORY_PLACEMENT_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    const levels = new Set(THEORY_PLACEMENT_QUESTIONS.map((q) => q.conceptLevel));
    expect([...levels].toSorted((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
