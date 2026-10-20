import type { TFunction } from 'i18next';
import type { TheoryChapterSummary, TheoryLevelSummary } from '../types';

type ChapterLabel = Pick<TheoryChapterSummary, 'id' | 'title'>;
type ChapterSubtitle = Pick<TheoryChapterSummary, 'id' | 'subtitle'>;
type LevelLabel = Pick<TheoryLevelSummary, 'id' | 'title' | 'description' | 'unlockRequirement'>;

/**
 * 渲染层理论章节/等级标题 i18n key 解析（单源）。
 *
 * 背景：数据层（data/levels/**）title/subtitle/description/unlockRequirement 为硬编码中文，
 * 全量迁移数据层成本极高。本工具提供「渲染层 key 覆盖」：消费组件经
 * `t(key, { defaultValue: <数据层中文> })` 渲染，英文环境命中 i18n key，中文环境回退数据层原文。
 * key 命名遵循 `<module>.<context>.<field>`：theory.chapterTitle.<id> 等。
 */
export function chapterTitleKey(chapterId: string): string {
  return `theory.chapterTitle.${chapterId}`;
}

export function chapterSubtitleKey(chapterId: string): string {
  return `theory.chapterSubtitle.${chapterId}`;
}

export function theoryLevelTitleKey(levelId: string): string {
  return `theory.levelTitle.${levelId}`;
}

export function theoryLevelDescriptionKey(levelId: string): string {
  return `theory.levelDescription.${levelId}`;
}

export function theoryLevelUnlockKey(levelId: string): string {
  return `theory.levelUnlock.${levelId}`;
}

export function resolveChapterTitle(t: TFunction, chapter: ChapterLabel): string {
  return t(chapterTitleKey(chapter.id), { defaultValue: chapter.title });
}

export function resolveChapterSubtitle(t: TFunction, chapter: ChapterSubtitle): string {
  return t(chapterSubtitleKey(chapter.id), { defaultValue: chapter.subtitle });
}

export function resolveTheoryLevelTitle(t: TFunction, level: LevelLabel): string {
  return t(theoryLevelTitleKey(level.id), { defaultValue: level.title });
}

export function resolveTheoryLevelDescription(t: TFunction, level: LevelLabel): string {
  return t(theoryLevelDescriptionKey(level.id), { defaultValue: level.description });
}

export function resolveTheoryLevelUnlock(t: TFunction, level: LevelLabel): string {
  return t(theoryLevelUnlockKey(level.id), { defaultValue: level.unlockRequirement });
}
