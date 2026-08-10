import type { TFunction } from 'i18next';
import type { BasicsStep, ConceptNode, LearningTrack, LevelInfo, Lesson } from '../types';

/**
 * 渲染层课程/等级标题 i18n key 解析（单源）。
 *
 * 背景：数据层（data/lessons/**）title/subtitle/description/unlockRequirement 为硬编码中文，
 * 全量迁移数据层成本极高。本工具提供「渲染层 key 覆盖」：消费组件经
 * `t(key, { defaultValue: <数据层中文> })` 渲染，英文环境命中 i18n key，中文环境回退数据层原文。
 * key 命名遵循 `<module>.<context>.<field>`：academy.lessonTitle.<id> 等。
 */
export function lessonTitleKey(lessonId: string): string {
  return `academy.lessonTitle.${lessonId}`;
}

export function lessonSubtitleKey(lessonId: string): string {
  return `academy.lessonSubtitle.${lessonId}`;
}

export function levelTitleKey(levelId: string): string {
  return `academy.levelTitle.${levelId}`;
}

export function levelDescriptionKey(levelId: string): string {
  return `academy.levelDescription.${levelId}`;
}

export function levelUnlockKey(levelId: string): string {
  return `academy.levelUnlock.${levelId}`;
}

export function resolveLessonTitle(t: TFunction, lesson: Lesson): string {
  return t(lessonTitleKey(lesson.id), { defaultValue: lesson.title });
}

export function resolveLessonSubtitle(t: TFunction, lesson: Lesson): string {
  return t(lessonSubtitleKey(lesson.id), { defaultValue: lesson.subtitle });
}

export function resolveLevelTitle(t: TFunction, level: LevelInfo): string {
  return t(levelTitleKey(level.id ?? String(level.level)), { defaultValue: level.title });
}

export function resolveLevelDescription(t: TFunction, level: LevelInfo): string {
  return t(levelDescriptionKey(level.id ?? String(level.level)), {
    defaultValue: level.description,
  });
}

export function resolveLevelUnlock(t: TFunction, level: LevelInfo): string {
  return t(levelUnlockKey(level.id ?? String(level.level)), {
    defaultValue: level.unlockRequirement,
  });
}

export function trackNameKey(trackId: string): string {
  return `academy.trackName.${trackId}`;
}

export function trackDescriptionKey(trackId: string): string {
  return `academy.trackDescription.${trackId}`;
}

export function trackAudienceKey(trackId: string): string {
  return `academy.trackAudience.${trackId}`;
}

export function trackDurationKey(trackId: string): string {
  return `academy.trackDuration.${trackId}`;
}

export function resolveTrackName(t: TFunction, track: LearningTrack): string {
  return t(trackNameKey(track.id), { defaultValue: track.name });
}

export function resolveTrackDescription(t: TFunction, track: LearningTrack): string {
  return t(trackDescriptionKey(track.id), { defaultValue: track.description });
}

export function resolveTrackAudience(t: TFunction, track: LearningTrack): string {
  return t(trackAudienceKey(track.id), { defaultValue: track.targetAudience });
}

export function resolveTrackDuration(t: TFunction, track: LearningTrack): string {
  return t(trackDurationKey(track.id), { defaultValue: track.estimatedDuration });
}

export function conceptNameKey(conceptId: string): string {
  return `academy.conceptName.${conceptId}`;
}

export function conceptDescriptionKey(conceptId: string): string {
  return `academy.conceptDescription.${conceptId}`;
}

export function basicsStepTitleKey(stepId: string): string {
  return `academy.basicsStepTitle.${stepId}`;
}

export function resolveConceptName(t: TFunction, concept: ConceptNode): string {
  return t(conceptNameKey(concept.id), { defaultValue: concept.name });
}

export function resolveConceptDescription(t: TFunction, concept: ConceptNode): string {
  return t(conceptDescriptionKey(concept.id), { defaultValue: concept.description });
}

export function resolveBasicsStepTitle(t: TFunction, step: BasicsStep): string {
  return t(basicsStepTitleKey(step.id), { defaultValue: step.title });
}
