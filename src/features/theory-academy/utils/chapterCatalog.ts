import type { PokerVariant } from '@/shared/types/elo';
import type { TheoryChapterIndexEntry } from '@/shared/types/theoryDataSource';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as STANDARD_PRACTICE } from '../data/levels/variants/standard/chapterPracticeMap';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as HEADS_UP_PRACTICE } from '../data/levels/variants/heads-up/chapterPracticeMap';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as SHORT_DECK_PRACTICE } from '../data/levels/variants/short-deck/chapterPracticeMap';
import { getLevelSummariesByVariant } from './theoryMeta';

const PRACTICE_MAPS: Record<PokerVariant, Readonly<Record<string, { lessons: readonly { id: string }[] }>>> = {
  standard: STANDARD_PRACTICE,
  'heads-up': HEADS_UP_PRACTICE,
  'short-deck': SHORT_DECK_PRACTICE,
};

const cache = new Map<PokerVariant, readonly TheoryChapterIndexEntry[]>();

/**
 * 理论章节目录投影（静态数据，按变体缓存稳定引用）。
 * 只投影 id/levelId/实践课 id；章节标题仍由 theory.chapterTitle.* 解析。
 */
export function getChapterCatalog(variant: PokerVariant): readonly TheoryChapterIndexEntry[] {
  const cached = cache.get(variant);
  if (cached) return cached;

  const practiceMap = PRACTICE_MAPS[variant];
  const entries: TheoryChapterIndexEntry[] = getLevelSummariesByVariant(variant).flatMap((level) =>
    level.chapters.map((chapter) => ({
      chapterId: chapter.id,
      levelId: level.id,
      practiceLessonIds: practiceMap[chapter.id]?.lessons.map((lesson) => lesson.id) ?? [],
    })),
  );

  cache.set(variant, entries);
  return entries;
}