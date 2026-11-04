import { describe, expect, it } from 'vitest';
import type { TFunction } from 'i18next';
import zhPlacement from '@/i18n/locales/zh/academy-course/placement.json';
import enPlacement from '@/i18n/locales/en/academy-course/placement.json';
import { PLACEMENT_QUESTIONS, PLACEMENT_TOPICS } from '../data/placementQuestions';
import { PLACEMENT_CREDIT_LEVELS } from './p2State';
import { orderResolvedOptions } from './quizShuffle';
import {
  PLACEMENT_LEVELS,
  PLACEMENT_MAX_CREDIT_LEVEL,
  PLACEMENT_TOTAL_QUESTIONS,
  buildPlacementOutcome,
  countCorrect,
  creditLevelsForLevel,
  mergePlacementOutcome,
  placementExplanationKey,
  placementOptionKey,
  placementQuestionKey,
  placementTopicKey,
  resolvePlacementQuestion,
  scoreToRecommendedLevel,
} from './placement';

/**
 * 定位测评分档 / 免修范围 / 重测并集 / 文案 key 契约。
 *
 * 硬口径：只放宽解锁（creditLevels），不写 completedLessons；最高免修 L4B，L5+ 永不参与。
 */

/** 透传 t：返回 defaultValue（数据层中文 / 英文译文占位） */
const passThroughT = ((key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key) as unknown as TFunction;

/** 按点路径读取 locale JSON（academy. 前缀由文件根对象承担，读取前剥离） */
function readPath(source: unknown, key: string): unknown {
  const path = key.replace(/^academy\./, '');
  return path.split('.').reduce<unknown>((node, segment) => {
    if (typeof node !== 'object' || node === null) return undefined;
    return (node as Record<string, unknown>)[segment];
  }, source);
}

/** 选项在展示顺序下的原始索引置换（用于跨语言一致性断言） */
function displayOrder(id: string, texts: readonly string[], correctIndex: number): number[] {
  const tagged = texts.map((text, index) => ({ index, text }));
  const ordered = orderResolvedOptions(id, tagged, correctIndex, (item) => item.text);
  return ordered.options.map((item) => item.index);
}

describe('placement 分档边界', () => {
  it('0 / 4 / 5 / 8 / 9 / 11 / 12 / 14 / 15 / 16 逐档命中', () => {
    const cases: [number, string][] = [
      [0, 'l1'],
      [4, 'l1'],
      [5, 'l2'],
      [8, 'l2'],
      [9, 'l3'],
      [11, 'l3'],
      [12, 'l4a'],
      [14, 'l4a'],
      [15, 'l4b'],
      [16, 'l4b'],
    ];
    for (const [correct, expected] of cases) {
      expect(scoreToRecommendedLevel(correct), `${correct} 分应推荐 ${expected}`).toBe(expected);
    }
  });

  it('越界钳制到两端档位（不允许抛错或越档）', () => {
    expect(scoreToRecommendedLevel(-3)).toBe('l1');
    expect(scoreToRecommendedLevel(99)).toBe('l4b');
    expect(scoreToRecommendedLevel(Number.NaN)).toBe('l1');
  });
});

describe('creditLevels（只放宽解锁，不计完成）', () => {
  it('推荐起点之前的全部 Level 条目', () => {
    expect(creditLevelsForLevel('l1')).toEqual([]);
    expect(creditLevelsForLevel('l2')).toEqual(['l1']);
    expect(creditLevelsForLevel('l3')).toEqual(['l1', 'l2']);
    expect(creditLevelsForLevel('l4a')).toEqual(['l1', 'l2', 'l3']);
    expect(creditLevelsForLevel('l4b')).toEqual(['l1', 'l2', 'l3', 'l4a']);
  });

  it('L5+ 不在免修序列内，未知 id 视为无免修', () => {
    expect(creditLevelsForLevel('l5')).toEqual([]);
    expect(creditLevelsForLevel('l8')).toEqual([]);
    expect(creditLevelsForLevel('unknown')).toEqual([]);
  });

  it('随分数单调增长，且始终是 PLACEMENT_LEVELS 的前缀（永不包含 L5+）', () => {
    let previous = 0;
    for (let correct = 0; correct <= PLACEMENT_TOTAL_QUESTIONS; correct += 1) {
      const outcome = buildPlacementOutcome(correct);
      expect(outcome.creditLevels).toEqual(PLACEMENT_LEVELS.slice(0, outcome.creditLevels.length));
      expect(outcome.creditLevels.length).toBeGreaterThanOrEqual(previous);
      previous = outcome.creditLevels.length;
      expect(outcome.creditLevels).not.toContain('l5');
      expect(PLACEMENT_LEVELS).toContain(outcome.recommendedLevelId);
    }
  });

  it('免修序列与 p2State 的门禁常量同源，最高免修条目为 L4B', () => {
    expect(PLACEMENT_LEVELS).toEqual(PLACEMENT_CREDIT_LEVELS);
    expect(PLACEMENT_MAX_CREDIT_LEVEL).toBe('l4b');
    expect(creditLevelsForLevel(PLACEMENT_MAX_CREDIT_LEVEL)).toEqual(['l1', 'l2', 'l3', 'l4a']);
  });
});

describe('L4A / L4B 映射', () => {
  it('12-14 分推荐 L4A 且只免修 L1-L3', () => {
    for (const correct of [12, 13, 14]) {
      const outcome = buildPlacementOutcome(correct);
      expect(outcome.recommendedLevelId).toBe('l4a');
      expect(outcome.creditLevels).toEqual(['l1', 'l2', 'l3']);
      expect(outcome.correct).toBe(correct);
      expect(outcome.total).toBe(PLACEMENT_TOTAL_QUESTIONS);
    }
  });

  it('15-16 分推荐 L4B 且免修含 L4A', () => {
    for (const correct of [15, 16]) {
      const outcome = buildPlacementOutcome(correct);
      expect(outcome.recommendedLevelId).toBe('l4b');
      expect(outcome.creditLevels).toEqual(['l1', 'l2', 'l3', 'l4a']);
    }
  });
});

describe('重测并集不降级', () => {
  const highScore = buildPlacementOutcome(16);
  const existing = { ...highScore, takenAt: 1 };

  it('先高后低：起点保持 L4B，免修范围不缩水，仅更新最近成绩', () => {
    const merged = mergePlacementOutcome(existing, buildPlacementOutcome(2), 2);
    expect(merged.recommendedLevelId).toBe('l4b');
    expect(merged.creditLevels).toEqual(['l1', 'l2', 'l3', 'l4a']);
    expect(merged.correct).toBe(2);
    expect(merged.total).toBe(PLACEMENT_TOTAL_QUESTIONS);
    expect(merged.takenAt).toBe(2);
  });

  it('先低后高：升档并取并集', () => {
    const merged = mergePlacementOutcome(
      { ...buildPlacementOutcome(3), takenAt: 1 },
      buildPlacementOutcome(13),
      2,
    );
    expect(merged.recommendedLevelId).toBe('l4a');
    expect(merged.creditLevels).toEqual(['l1', 'l2', 'l3']);
  });

  it('无既有结果时直接写入（首次测评）', () => {
    const merged = mergePlacementOutcome(null, buildPlacementOutcome(0), 5);
    expect(merged.recommendedLevelId).toBe('l1');
    expect(merged.creditLevels).toEqual([]);
    expect(merged.takenAt).toBe(5);
  });
});

describe('题库与判分', () => {
  it('题量 16、id 唯一、每题至少 2 个互不相同的选项且仅一个在界内正确项', () => {
    expect(PLACEMENT_QUESTIONS).toHaveLength(PLACEMENT_TOTAL_QUESTIONS);
    const ids = PLACEMENT_QUESTIONS.map((question) => question.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const question of PLACEMENT_QUESTIONS) {
      expect(question.options.length).toBeGreaterThanOrEqual(2);
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.correctIndex).toBeGreaterThanOrEqual(0);
      expect(question.correctIndex).toBeLessThan(question.options.length);
      expect(question.explanation.length).toBeGreaterThan(0);
    }
  });

  it('覆盖 8 个主题，每个主题 2 题', () => {
    for (const topic of PLACEMENT_TOPICS) {
      const count = PLACEMENT_QUESTIONS.filter((question) => question.topic === topic).length;
      expect(count, `主题 ${topic} 题量`).toBe(2);
    }
  });

  it('解析后 correctIndex 指向同一选项文本，判分以重排后对象为准', () => {
    for (const question of PLACEMENT_QUESTIONS) {
      const resolved = resolvePlacementQuestion(passThroughT, question);
      expect(resolved.options).toHaveLength(question.options.length);
      expect(resolved.options[resolved.correctIndex]).toBe(
        question.options[question.correctIndex],
      );
      expect(countCorrect([resolved], [resolved.correctIndex])).toBe(1);
      const wrongIndex = (resolved.correctIndex + 1) % resolved.options.length;
      expect(countCorrect([resolved], [wrongIndex])).toBe(0);
    }
  });

  it('全对计 16 分、全错计 0 分（答案索引按展示顺序）', () => {
    const resolved = PLACEMENT_QUESTIONS.map((question) =>
      resolvePlacementQuestion(passThroughT, question),
    );
    expect(countCorrect(resolved, resolved.map((question) => question.correctIndex))).toBe(
      PLACEMENT_TOTAL_QUESTIONS,
    );
    expect(
      countCorrect(
        resolved,
        resolved.map((question) => (question.correctIndex + 1) % question.options.length),
      ),
    ).toBe(0);
  });
});

describe('渲染层 i18n key（zh/en 双语）', () => {
  it('每题 question / options / explanation 在双语均存在，且 zh 与数据层原文逐字一致', () => {
    for (const question of PLACEMENT_QUESTIONS) {
      expect(readPath(zhPlacement, placementQuestionKey(question.id))).toBe(question.question);
      expect(readPath(zhPlacement, placementExplanationKey(question.id))).toBe(
        question.explanation,
      );
      expect(readPath(enPlacement, placementQuestionKey(question.id))).toBeTypeOf('string');
      expect(
        String(readPath(enPlacement, placementExplanationKey(question.id))).length,
      ).toBeGreaterThan(0);
      question.options.forEach((option, index) => {
        expect(readPath(zhPlacement, placementOptionKey(question.id, index))).toBe(option);
        expect(readPath(enPlacement, placementOptionKey(question.id, index))).toBeTypeOf('string');
      });
    }
  });

  it('每个考核主题的展示名双语齐备', () => {
    for (const topic of PLACEMENT_TOPICS) {
      expect(readPath(zhPlacement, placementTopicKey(topic))).toBeTypeOf('string');
      expect(readPath(enPlacement, placementTopicKey(topic))).toBeTypeOf('string');
    }
  });

  it('选项顺序不随语言变化（zh/en 同一置换）', () => {
    for (const question of PLACEMENT_QUESTIONS) {
      const zhTexts = question.options.map((option, index) => {
        const value = readPath(zhPlacement, placementOptionKey(question.id, index));
        return typeof value === 'string' ? value : option;
      });
      const enTexts = question.options.map((_, index) => {
        const value = readPath(enPlacement, placementOptionKey(question.id, index));
        return typeof value === 'string' ? value : '';
      });
      expect(displayOrder(question.id, zhTexts, question.correctIndex)).toEqual(
        displayOrder(question.id, enTexts, question.correctIndex),
      );
    }
  });
});
