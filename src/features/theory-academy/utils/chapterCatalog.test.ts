import { describe, expect, it } from 'vitest';
import { getChapterCatalog } from './chapterCatalog';

describe('理论章节目录投影', () => {
  it('按变体缓存稳定引用，并带出实践课 id', () => {
    const standard = getChapterCatalog('standard');

    expect(standard.length).toBeGreaterThan(40);
    expect(getChapterCatalog('standard')).toBe(standard);
    expect(standard.every((entry) => entry.chapterId.length > 0 && entry.levelId.startsWith('t'))).toBe(
      true,
    );

    const combinatorics = standard.find((entry) => entry.chapterId === 't1-combinatorics');
    expect(combinatorics?.practiceLessonIds?.length).toBeGreaterThan(0);
  });

  it('单挑/短牌目录只包含各自变体章节', () => {
    const headsUp = getChapterCatalog('heads-up');
    const shortDeck = getChapterCatalog('short-deck');

    expect(headsUp.length).toBeGreaterThan(0);
    expect(headsUp.some((entry) => entry.chapterId.includes('hu'))).toBe(true);
    expect(shortDeck.length).toBeGreaterThan(0);
    expect(shortDeck.some((entry) => entry.chapterId.includes('sd'))).toBe(true);
  });
});