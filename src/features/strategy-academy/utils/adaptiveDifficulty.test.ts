import { describe, it, expect } from 'vitest';
import {
  DEFAULT_ADAPTIVE_CONFIG,
  shouldRecommendReview,
  pickReviewTargetUnit,
  REVIEW_TOPICS_SEVERE,
  REVIEW_TOPICS_MILD,
  REVIEW_TOPIC_UNIT_ANCHORS,
} from './adaptiveDifficulty';
import { getAllLessons } from './courseProgress';
import type { LessonUnit } from '../types';

/**
 * 自适应难度：复习推荐回归测试（BUG-ACA-007 修复）。
 *
 * 守卫契约：
 * - suggestedTopics 为稳定课程 id（语言无关，禁止自然语言字符串），zh/en 行为一致
 * - 主题 id 在课程体系中真实存在（无悬空引用）且全部登记锚点表
 * - pickReviewTargetUnit 纯 id 比对：命中当前课程 → 锚点小节；未命中 → 首节；空 units → undefined
 */

const CJK_PATTERN = /[\u4e00-\u9fff]/;

function resultsOf(
  total: number,
  correct: number,
): Array<{ isCorrect: boolean; timeTaken: number }> {
  return Array.from({ length: total }, (_, i) => ({
    isCorrect: i < correct,
    timeTaken: 5,
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
