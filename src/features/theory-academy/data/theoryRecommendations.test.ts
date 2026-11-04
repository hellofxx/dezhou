import { describe, expect, it } from 'vitest';
import { DEFAULT_ELO, type EloRating } from '@/shared/types/elo';
import {
  MULTI_LOW_DIMENSION_COUNT,
  MULTI_LOW_ELO_THRESHOLD,
  countWeakDimensions,
  findWeakestDimension,
  getTheoryChapterRecommendation,
  hasEloData,
} from './theoryRecommendations';
import { getCoreChaptersOfLevel, getLevelSummariesByVariant } from '../utils/theoryMeta';

/**
 * 反向桥接映射契约（纯函数，不需要 jsdom）：
 * - 无数据（gamesPlayed = 0）→ T1 首章，reason 为 fallback
 * - 单维度最弱 → 该维度候选 Level 的首个未读核心章（math → T1/T2/T4 等）
 * - 多维度低于阈值 → T9 综合章（需 T9 已解锁，否则退到最弱维度）
 * - T8 核心章读完 → T9 综合章
 * - 同分取 DIMENSION_ORDER 靠前维度（结果确定）
 * - 全读完 → null
 *
 * 依赖真实 manifest 目录：章节 id 断言走 getCoreChaptersOfLevel，不写死 id，
 * 避免内容侧增删章节时测试失效。
 */

const standardLevels = getLevelSummariesByVariant('standard');

function firstCoreChapterId(levelNo: number): string {
  const level = standardLevels.find((item) => item.id === `t${levelNo}`)!;
  return getCoreChaptersOfLevel(level)[0]!.id;
}

/** 构造一条完整完成链：t1..t(n) 的核心章全部完成，使下一级解锁 */
function completedUpTo(levelNo: number): string[] {
  const ids: string[] = [];
  for (const level of standardLevels) {
    if (level.level > levelNo) break;
    ids.push(...getCoreChaptersOfLevel(level).map((chapter) => chapter.id));
  }
  return ids;
}

function elo(patch: Partial<EloRating>): EloRating {
  return { ...DEFAULT_ELO, gamesPlayed: 10, ...patch };
}

describe('getTheoryChapterRecommendation', () => {
  it('无数据时从 T1 起步并标为 fallback', () => {
    const result = getTheoryChapterRecommendation({
      elo: { ...DEFAULT_ELO, gamesPlayed: 0 },
      completedChapters: [],
    });
    expect(result).toEqual({
      chapterId: firstCoreChapterId(1),
      reason: 'fallback',
    });
  });

  it('math 最弱时落到 T1/T2/T4 序列的首个未读核心章', () => {
    const lost = completedUpTo(3);
    const result = getTheoryChapterRecommendation({
      elo: elo({ math: 420, preflop: 1100, postflop: 1100, handReading: 1100, mental: 1100 }),
      completedChapters: lost,
    });
    // T1/T2 已读完且 T3 完成使 T4 解锁，故落到 T4 首章
    expect(result?.chapterId).toBe(firstCoreChapterId(4));
    expect(result?.reason).toBe('math');
    expect(result?.dimension).toBe('math');
  });

  it('mental 最弱时指向 T8（单维度低分不触发 T9 综合）', () => {
    const result = getTheoryChapterRecommendation({
      elo: elo({ mental: 400, math: 1200, preflop: 1200, postflop: 1200, handReading: 1200 }),
      completedChapters: completedUpTo(7),
    });
    expect(result?.reason).toBe('mental');
    expect(result?.chapterId).toBe(firstCoreChapterId(8));
  });

  it('多维度低于阈值时改读 T9 综合章（前提 T9 已解锁）', () => {
    const completed = completedUpTo(8);
    const result = getTheoryChapterRecommendation({
      elo: elo({ math: 600, preflop: 650, postflop: 1300, handReading: 1300, mental: 1300 }),
      completedChapters: completed,
    });
    expect(result?.reason).toBe('fallback');
    expect(result?.chapterId).toBe(firstCoreChapterId(9));
  });

  it('多维度低分但 T9 未解锁时退回最弱维度的候选章', () => {
    const result = getTheoryChapterRecommendation({
      elo: elo({ math: 600, preflop: 650, postflop: 650, handReading: 1300, mental: 1300 }),
      completedChapters: [],
    });
    expect(result?.reason).toBe('math');
    expect(result?.chapterId).toBe(firstCoreChapterId(1));
  });

  it('T8 读完即进入 T9（即使五维都不低）', () => {
    const result = getTheoryChapterRecommendation({
      elo: elo({ math: 1500, preflop: 1500, postflop: 1500, handReading: 1500, mental: 1500 }),
      completedChapters: completedUpTo(8),
    });
    expect(result?.chapterId).toBe(firstCoreChapterId(9));
  });

  it('全部核心章读完时返回 null', () => {
    const all = standardLevels.flatMap((level) =>
      getCoreChaptersOfLevel(level).map((chapter) => chapter.id),
    );
    expect(
      getTheoryChapterRecommendation({ elo: elo({ math: 1200 }), completedChapters: all }),
    ).toBeNull();
  });

  it('定位免修的 Level 不影响推荐可达性（免修不写 completedChapters）', () => {
    const result = getTheoryChapterRecommendation({
      elo: elo({ preflop: 400, math: 1200, postflop: 1200, handReading: 1200, mental: 1200 }),
      completedChapters: [],
      creditLevels: ['t1', 't2'],
    });
    // preflop → T3/T4；T3 因免修链解锁（前一 Level 免修），故落在 T3 首章
    expect(result?.chapterId).toBe(firstCoreChapterId(3));
    expect(result?.reason).toBe('preflop');
  });
});

describe('辅助判定', () => {
  it('hasEloData 以 gamesPlayed 为准', () => {
    expect(hasEloData({ ...DEFAULT_ELO, gamesPlayed: 0 })).toBe(false);
    expect(hasEloData({ ...DEFAULT_ELO, gamesPlayed: 1 })).toBe(true);
  });

  it('countWeakDimensions 统计低于阈值的维度数', () => {
    const rating = elo({
      math: MULTI_LOW_ELO_THRESHOLD - 1,
      preflop: MULTI_LOW_ELO_THRESHOLD,
      postflop: 1200,
      handReading: 1200,
      mental: MULTI_LOW_ELO_THRESHOLD - 100,
    });
    expect(countWeakDimensions(rating)).toBe(2);
    expect(MULTI_LOW_DIMENSION_COUNT).toBe(2);
  });

  it('findWeakestDimension 同分时取 DIMENSION_ORDER 靠前维度', () => {
    const rating = elo({
      math: 900,
      preflop: 900,
      postflop: 1200,
      handReading: 1200,
      mental: 1200,
    });
    expect(findWeakestDimension(rating)).toBe('math');
  });
});
