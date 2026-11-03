import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ADAPTIVE_CONFIG,
  getCurrentDifficulty,
  selectQuestionsByDifficulty,
  shouldRecommendReview,
  pickReviewTargetUnit,
  REVIEW_TOPICS_SEVERE,
  REVIEW_TOPICS_MILD,
  REVIEW_TOPIC_UNIT_ANCHORS,
  updateAbilityScore,
} from './adaptiveDifficulty';
import { getAllLessons } from './courseProgress';
import type { AdaptiveConfig, LessonUnit, PracticeQuestion, QuestionDifficulty } from '../types';

/**
 * 自适应难度契约：
 * - 复习推荐：suggestedTopics 为稳定课程 id（语言无关），zh/en 行为一致（BUG-ACA-007）
 * - 难度判定：正确率 ≥ upgradeThreshold 且平均用时 < timeBonus 升级；≤ downgradeThreshold 降级
 * - 题池筛选：目标难度优先，不足时按难度距离补充；不修改入参
 * - 能力评分：答对加分（快答额外加分）、答错减分，始终夹在 0-100
 */

const CJK_PATTERN = /[\u4e00-\u9fff]/;

function resultsOf(
  total: number,
  correct: number,
  timeTaken = 5,
): Array<{ isCorrect: boolean; timeTaken: number }> {
  return Array.from({ length: total }, (_, i) => ({
    isCorrect: i < correct,
    timeTaken,
  }));
}

describe('shouldRecommendReview：复习主题推荐', () => {
  it('作答不足 3 题 → 不推荐复习', () => {
    const r = shouldRecommendReview(resultsOf(2, 0), DEFAULT_ADAPTIVE_CONFIG);
    expect(r.shouldReview).toBe(false);
    expect(r.suggestedTopics).toEqual([]);
  });

  it('正确率高于降级阈值 → 不推荐复习', () => {
    const r = shouldRecommendReview(resultsOf(10, 9), DEFAULT_ADAPTIVE_CONFIG); // 90%
    expect(r.shouldReview).toBe(false);
    expect(r.suggestedTopics).toEqual([]);
  });

  it('正确率 < 40% → 重度降级：推荐规则与位置课程 id', () => {
    const r = shouldRecommendReview(resultsOf(10, 2), DEFAULT_ADAPTIVE_CONFIG); // 20%
    expect(r.shouldReview).toBe(true);
    expect(r.suggestedTopics).toEqual(['l1-basics', 'l1-position']);
  });

  it('40% ≤ 正确率 ≤ 降级阈值 → 轻度降级：推荐起手牌与加注尺寸课程 id', () => {
    const r = shouldRecommendReview(resultsOf(10, 4), DEFAULT_ADAPTIVE_CONFIG); // 40%
    expect(r.shouldReview).toBe(true);
    expect(r.suggestedTopics).toEqual(['l1-hand-selection', 'l2-raise-sizing']);
  });

  it('主题为稳定 id：不含自然语言字符（语言无关，zh/en 一致）', () => {
    for (const topic of [...REVIEW_TOPICS_SEVERE, ...REVIEW_TOPICS_MILD]) {
      expect(CJK_PATTERN.test(topic)).toBe(false);
    }
  });

  it('主题 id 在课程体系中真实存在且全部登记锚点表（无悬空引用）', () => {
    const lessonIds = new Set(getAllLessons().map((l) => l.id));
    for (const topic of [...REVIEW_TOPICS_SEVERE, ...REVIEW_TOPICS_MILD]) {
      expect(lessonIds.has(topic)).toBe(true);
      expect(REVIEW_TOPIC_UNIT_ANCHORS[topic]).toBeDefined();
    }
  });
});

describe('pickReviewTargetUnit：按 id 比对的小节定位', () => {
  const units: LessonUnit[] = [
    { id: 'u1', title: '第一节', sections: [] },
    { id: 'u2', title: '第二节', sections: [] },
    { id: 'u3', title: '第三节', sections: [] },
  ];

  it('当前课程命中主题 → 返回锚点小节', () => {
    const target = pickReviewTargetUnit('l1-position', units, ['l1-position']);
    expect(target?.id).toBe('u1');
  });

  it('主题指向其他课程 → 回退当前课程首节', () => {
    const target = pickReviewTargetUnit('l3-cbet', units, ['l1-basics', 'l1-position']);
    expect(target?.id).toBe('u1');
  });

  it('空 units → undefined（调用方跳过跳转）', () => {
    expect(pickReviewTargetUnit('l1-position', [], ['l1-position'])).toBeUndefined();
  });

  it('语言无关：纯 id 比对，同输入重复调用结果一致', () => {
    const a = pickReviewTargetUnit('l1-position', units, [...REVIEW_TOPICS_SEVERE]);
    const b = pickReviewTargetUnit('l1-position', units, [...REVIEW_TOPICS_SEVERE]);
    expect(a).toEqual(b);
    expect(a?.id).toBe('u1');
  });
});

describe('getCurrentDifficulty：难度升降', () => {
  const disabled: AdaptiveConfig = { ...DEFAULT_ADAPTIVE_CONFIG, enabled: false };

  it('配置关闭或没有作答记录时保持当前难度', () => {
    expect(getCurrentDifficulty(resultsOf(10, 10, 1), disabled, 'intermediate')).toBe('intermediate');
    expect(getCurrentDifficulty([], DEFAULT_ADAPTIVE_CONFIG, 'advanced')).toBe('advanced');
  });

  it('正确率 ≥ 85% 且平均用时 < 10s → 升级一档', () => {
    // 9/10 = 90%，平均 5s
    expect(getCurrentDifficulty(resultsOf(10, 9, 5), DEFAULT_ADAPTIVE_CONFIG, 'beginner')).toBe(
      'intermediate',
    );
  });

  it('阈值边界：正确率恰好 85% 且用时 9.9s 仍升级', () => {
    // recentWindow 扩到 20，使窗口内恰好 17/20 = 85%
    const config: AdaptiveConfig = { ...DEFAULT_ADAPTIVE_CONFIG, recentWindow: 20 };
    const results = resultsOf(20, 17, 9.9);
    expect(getCurrentDifficulty(results, config, 'intermediate')).toBe('advanced');
  });

  it('advanced 已是最高档时不越界', () => {
    expect(getCurrentDifficulty(resultsOf(10, 10, 1), DEFAULT_ADAPTIVE_CONFIG, 'advanced')).toBe(
      'advanced',
    );
  });

  it('正确率 85% 但平均用时 ≥ 10s → 不升级（维持当前档）', () => {
    expect(getCurrentDifficulty(resultsOf(20, 17, 10), DEFAULT_ADAPTIVE_CONFIG, 'beginner')).toBe(
      'beginner',
    );
  });

  it('正确率 ≤ 60% → 降级一档', () => {
    expect(getCurrentDifficulty(resultsOf(10, 6, 5), DEFAULT_ADAPTIVE_CONFIG, 'advanced')).toBe(
      'intermediate',
    );
    expect(getCurrentDifficulty(resultsOf(10, 5, 5), DEFAULT_ADAPTIVE_CONFIG, 'intermediate')).toBe(
      'beginner',
    );
  });

  it('beginner 已是最低档时不越界', () => {
    expect(getCurrentDifficulty(resultsOf(10, 0, 5), DEFAULT_ADAPTIVE_CONFIG, 'beginner')).toBe(
      'beginner',
    );
  });

  it('60% - 85% 区间保持当前难度', () => {
    expect(getCurrentDifficulty(resultsOf(10, 7, 5), DEFAULT_ADAPTIVE_CONFIG, 'intermediate')).toBe(
      'intermediate',
    );
  });

  it('只评估最近 recentWindow 条记录（早期差成绩不拖累当前判断）', () => {
    const config: AdaptiveConfig = { ...DEFAULT_ADAPTIVE_CONFIG, recentWindow: 5 };
    const early = resultsOf(5, 0, 5).map((r) => ({ ...r, timeTaken: 20 }));
    const recent = resultsOf(5, 5, 1);
    expect(getCurrentDifficulty([...early, ...recent], config, 'beginner')).toBe('intermediate');
  });
});

function makeQuestion(id: string, difficulty?: QuestionDifficulty): PracticeQuestion {
  return {
    id,
    difficulty,
    scenario: {
      heroHand: ['As', 'Ks'],
      heroPosition: 'BTN',
      previousActions: [],
      street: 'preflop',
      potSize: 5,
      effectiveStack: 100,
    },
    options: [{ action: 'Call', isCorrect: true, explanation: '' }],
  };
}

describe('selectQuestionsByDifficulty：题池筛选', () => {
  it('目标难度足够时只返回目标难度题目', () => {
    const pool = [
      makeQuestion('b1', 'beginner'),
      makeQuestion('b2', 'beginner'),
      makeQuestion('i1', 'intermediate'),
      makeQuestion('a1', 'advanced'),
    ];
    const result = selectQuestionsByDifficulty(pool, 'beginner', 2);
    expect(result).toHaveLength(2);
    expect(result.every((q) => q.difficulty === 'beginner')).toBe(true);
  });

  it('目标难度不足时按难度距离补充（近者优先）', () => {
    const pool = [
      makeQuestion('b1', 'beginner'),
      makeQuestion('i1', 'intermediate'),
      makeQuestion('i2', 'intermediate'),
      makeQuestion('a1', 'advanced'),
    ];
    const result = selectQuestionsByDifficulty(pool, 'advanced', 3);
    expect(result).toHaveLength(3);
    expect(result[0]!.id).toBe('a1');
    // 剩余按距离排序：intermediate(1) 先于 beginner(2)
    expect(result.slice(1).map((q) => q.id).sort()).toEqual(['i1', 'i2']);
  });

  it('缺省 difficulty 视为 beginner', () => {
    const pool = [makeQuestion('x'), makeQuestion('i', 'intermediate')];
    const result = selectQuestionsByDifficulty(pool, 'beginner', 1);
    expect(result.map((q) => q.id)).toEqual(['x']);
  });

  it('count 超过题池时返回全部，且不修改入参顺序', () => {
    const pool = [
      makeQuestion('b1', 'beginner'),
      makeQuestion('i1', 'intermediate'),
      makeQuestion('a1', 'advanced'),
    ];
    const snapshot = pool.map((q) => q.id);
    const result = selectQuestionsByDifficulty(pool, 'advanced', 99);
    expect(result).toHaveLength(3);
    expect(pool.map((q) => q.id)).toEqual(snapshot);
  });
});

describe('updateAbilityScore：能力评分', () => {
  it('答对时按难度加分（beginner +3 / intermediate +4.5 / advanced +6）', () => {
    expect(updateAbilityScore(50, true, 20, 'beginner')).toBe(53);
    expect(updateAbilityScore(50, true, 20, 'intermediate')).toBe(55);
    expect(updateAbilityScore(50, true, 20, 'advanced')).toBe(56);
  });

  it('答对且用时 < 10s 额外加分（倍率随难度）', () => {
    expect(updateAbilityScore(50, true, 9.9, 'beginner')).toBe(55);
    expect(updateAbilityScore(50, true, 0, 'intermediate')).toBe(58);
    expect(updateAbilityScore(50, true, 0, 'advanced')).toBe(60);
  });

  it('用时恰好 10s 不触发快答加成', () => {
    expect(updateAbilityScore(50, true, 10, 'beginner')).toBe(53);
  });

  it('答错时按难度减分（beginner -2 / intermediate -3 / advanced -4）', () => {
    expect(updateAbilityScore(50, false, 1, 'beginner')).toBe(48);
    expect(updateAbilityScore(50, false, 1, 'intermediate')).toBe(47);
    expect(updateAbilityScore(50, false, 1, 'advanced')).toBe(46);
  });

  it('结果下限夹在 0', () => {
    expect(updateAbilityScore(0, false, 1, 'advanced')).toBe(0);
  });

  it('结果上限夹在 100', () => {
    expect(updateAbilityScore(99, true, 0, 'advanced')).toBe(100);
    expect(updateAbilityScore(100, true, 0, 'advanced')).toBe(100);
  });
});
