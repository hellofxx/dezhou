import { describe, it, expect } from 'vitest';
import {
  CHECKPOINT_QUESTION_COUNT,
  buildCheckpointQuestions,
  getCheckpointAttemptNumber,
  getCheckpointSeed,
  getCheckpointSourceChapters,
  groupWrongByChapter,
  isCheckpointUnlocked,
  isFirstCheckpointAttempt,
  scoreCheckpoint,
  summarizeCheckpointResults,
} from './checkpoint';
import { findLevelSummaryById, getCoreChaptersOfLevel } from './theoryMeta';
import type { TheoryChapter, TheoryLevelInfo } from '../types';

const DIMENSIONS = ['math', 'preflop', 'postflop', 'handReading'] as const;

function makeChapter(
  id: string,
  order: number,
  questionCount: number,
  supplemental = false,
): TheoryChapter {
  return {
    id,
    level: 1,
    order,
    title: id,
    subtitle: id,
    duration: '10 min',
    variant: 'standard',
    eloDimension: DIMENSIONS[order % DIMENSIONS.length]!,
    supplemental,
    content: [],
    quiz: Array.from({ length: questionCount }, (_, i) => ({
      id: `${id}-q${i + 1}`,
      question: `${id} 题 ${i + 1}`,
      options: ['甲', '乙', '丙', '丁'],
      correctIndex: 0,
      explanation: '解析',
    })),
  };
}

/** 4 个核心章（17 题）+ 1 个增补章（5 题，不得进入检查点题库） */
function makeLevel(): TheoryLevelInfo {
  return {
    id: 't1',
    level: 1,
    tier: 'basic',
    title: '概率论基础',
    description: '',
    icon: '',
    unlockRequirement: '',
    variant: 'standard',
    practiceRecommendations: { lessons: [] },
    chapters: [
      makeChapter('t1-a', 1, 5),
      makeChapter('t1-b', 2, 4),
      makeChapter('t1-c', 3, 5),
      makeChapter('t1-d', 4, 3),
      makeChapter('t1-extra', 5, 5, true),
    ],
  };
}

describe('checkpoint 门禁（目录摘要口径）', () => {
  // 门禁判定读目录摘要（manifest），故这里取真实 T1 核心章 id
  const levelSummary = findLevelSummaryById('t1')!;
  const coreIds = getCoreChaptersOfLevel(levelSummary).map((chapter) => chapter.id);
  const supplementalIds = levelSummary.chapters
    .filter((chapter) => chapter.supplemental === true)
    .map((chapter) => chapter.id);

  it('核心章未读完不开放（增补章完成也不算）', () => {
    expect(coreIds.length).toBeGreaterThan(1);
    expect(isCheckpointUnlocked('t1', [])).toBe(false);
    expect(isCheckpointUnlocked('t1', coreIds.slice(0, -1))).toBe(false);
    expect(
      isCheckpointUnlocked('t1', [...coreIds.slice(0, -1), ...supplementalIds]),
    ).toBe(false);
  });

  it('核心章全部完成即开放（增补章未读不影响）', () => {
    expect(isCheckpointUnlocked('t1', coreIds)).toBe(true);
    expect(isCheckpointUnlocked('t1', [...coreIds, ...supplementalIds])).toBe(true);
  });

  it('未知 Level id 不开放（防御）', () => {
    expect(isCheckpointUnlocked('t9-unknown', coreIds)).toBe(false);
  });
});

describe('checkpoint 抽题', () => {
  const level = makeLevel();

  it('增补章不进入题库（来源章全部是核心章）', () => {
    const sources = getCheckpointSourceChapters(level).map((chapter) => chapter.id);
    expect(sources).toEqual(['t1-a', 't1-b', 't1-c', 't1-d']);
  });

  it('抽 12 题、无重复、全部来自核心章题池', () => {
    const drawn = buildCheckpointQuestions(level, 1);
    expect(drawn).toHaveLength(CHECKPOINT_QUESTION_COUNT);
    expect(new Set(drawn.map((item) => item.question.id)).size).toBe(12);
    expect(drawn.some((item) => item.chapterId === 't1-extra')).toBe(false);
  });

  it('来源章元信息正确（chapterId 归属与 eloDimension 一致）', () => {
    const byId = new Map(level.chapters.map((chapter) => [chapter.id, chapter]));
    for (const item of buildCheckpointQuestions(level, 1)) {
      const source = byId.get(item.chapterId);
      expect(source, item.chapterId).toBeDefined();
      expect(item.eloDimension).toBe(source?.eloDimension);
      expect(source?.quiz.some((q) => q.id === item.question.id)).toBe(true);
    }
  });

  it('同一次序号抽题确定，不同序号换题', () => {
    const first = buildCheckpointQuestions(level, 1).map((item) => item.question.id);
    const again = buildCheckpointQuestions(level, 1).map((item) => item.question.id);
    const second = buildCheckpointQuestions(level, 2).map((item) => item.question.id);
    expect(first).toEqual(again);
    expect(first).not.toEqual(second);
  });

  it('种子只依赖 levelId 与序号', () => {
    expect(getCheckpointSeed('t1', 1)).toBe(getCheckpointSeed('t1', 1));
    expect(getCheckpointSeed('t1', 1)).not.toBe(getCheckpointSeed('t1', 2));
    expect(getCheckpointSeed('t1', 1)).not.toBe(getCheckpointSeed('t2', 1));
  });

  it('题池不足 12 题时全量出战（不重复不补空）', () => {
    const small: TheoryLevelInfo = {
      ...level,
      chapters: [makeChapter('t1-a', 1, 3), makeChapter('t1-b', 2, 2)],
    };
    const drawn = buildCheckpointQuestions(small, 1);
    expect(drawn).toHaveLength(5);
    expect(new Set(drawn.map((item) => item.question.id)).size).toBe(5);
  });

  it('空题库返回空数组（渲染端降级为 notReady）', () => {
    const empty: TheoryLevelInfo = { ...level, chapters: [makeChapter('t1-a', 1, 0)] };
    expect(buildCheckpointQuestions(empty, 1)).toEqual([]);
  });
});

describe('checkpoint 成绩与统计', () => {
  const level = makeLevel();
  const questions = buildCheckpointQuestions(level, 1);

  it('得分四舍五入，空集为 0', () => {
    expect(scoreCheckpoint(0, 12)).toBe(0);
    expect(scoreCheckpoint(7, 12)).toBe(58);
    expect(scoreCheckpoint(12, 12)).toBe(100);
    expect(scoreCheckpoint(0, 0)).toBe(0);
  });

  it('按来源维度汇总（总数等于题量、答对数一致）', () => {
    const flags = questions.map((_, index) => index % 2 === 0);
    const stats = summarizeCheckpointResults(questions, flags);
    expect(stats.reduce((sum, item) => sum + item.total, 0)).toBe(questions.length);
    expect(stats.reduce((sum, item) => sum + item.correct, 0)).toBe(flags.filter(Boolean).length);
    for (const item of stats) {
      const inDimension = questions.filter((q) => q.eloDimension === item.dimension).length;
      expect(item.total).toBe(inDimension);
    }
  });

  it('错题按来源章归组（答对的题不出现）', () => {
    const flags = questions.map(() => true);
    flags[0] = false;
    flags[1] = false;
    const groups = groupWrongByChapter(questions, flags);
    const total = groups.reduce((sum, group) => sum + group.questionIds.length, 0);
    expect(total).toBe(2);
    for (const group of groups) {
      const source = questions.filter((q) => q.chapterId === group.chapterId);
      expect(source.length).toBeGreaterThan(0);
    }
  });
});

describe('checkpoint 序号口径', () => {
  const record = { attempts: 2, bestScore: 80, lastScore: 60, lastAt: 1, questionIds: [] };

  it('无记录为首次（序号 1）', () => {
    expect(getCheckpointAttemptNumber(undefined, 't1')).toBe(1);
    expect(isFirstCheckpointAttempt(undefined, 't1')).toBe(true);
  });

  it('已检查 n 次时序号 n+1 且判为练习', () => {
    expect(getCheckpointAttemptNumber({ t1: record }, 't1')).toBe(3);
    expect(isFirstCheckpointAttempt({ t1: record }, 't1')).toBe(false);
    expect(getCheckpointAttemptNumber({ t1: record }, 't2')).toBe(1);
  });
});
