import type { Lesson } from '../types';
import { loadAcademyLessonsForQuickDrill } from '../data/lessons/loaders';

/**
 * 策略学院全文检索索引（P5）。
 *
 * 分层：首页/搜索页的标题、副标题即时结果来自 manifest（utils/academyMeta），不触碰正文；
 * 只有当查询串达到 SEARCH_MIN_QUERY_LENGTH 且用户确实在搜索时，才懒加载标准全量课时
 * （data/lessons/loaders 的 loadAcademyLessonsForQuickDrill），并把正文/objectives/小测
 * 题干与解析拍平成可搜索条目缓存复用。加载失败时清空 in-flight 记录，允许用户重试。
 *
 * 文案事实源：索引基于数据层原文（中文）构建，英文环境经渲染层 key 覆盖显示；
 * 因此英文查询只命中数据层内含的英文术语（EV / GTO / c-bet 等），不做语种翻译检索。
 */

/** 触发全文加载的最小查询长度（0/1 字符只走标题即时搜索） */
export const SEARCH_MIN_QUERY_LENGTH = 2;

/** 结果摘要截取长度（围绕命中位置的上下文窗口） */
export const SEARCH_SNIPPET_LENGTH = 80;

/** 全文结果上限，避免一次查询渲染过长列表 */
export const SEARCH_MAX_RESULTS = 20;

/** 命中来源：标题 / 副标题与学习目标 / 正文 / 小测题干与解析 */
export type SearchMatchSource = 'title' | 'overview' | 'content' | 'quiz';

export interface LessonSearchSegment {
  source: SearchMatchSource;
  text: string;
}

export interface LessonSearchEntry {
  lessonId: string;
  level: number;
  title: string;
  segments: LessonSearchSegment[];
}

export interface LessonSearchHit {
  lessonId: string;
  level: number;
  title: string;
  source: SearchMatchSource;
  snippet: string;
}

function collectSegments(lesson: Lesson): LessonSearchSegment[] {
  const segments: LessonSearchSegment[] = [];
  const push = (source: SearchMatchSource, text: string | undefined) => {
    if (text && text.trim()) segments.push({ source, text });
  };

  push('title', lesson.title);
  push('overview', lesson.subtitle);
  for (const objective of lesson.objectives ?? []) push('overview', objective);
  for (const section of lesson.content ?? []) push('content', section.content);
  for (const question of lesson.quiz ?? []) {
    push('quiz', question.question);
    push('quiz', question.explanation);
  }
  return segments;
}

/** 把完整课时拍平为可搜索条目（纯函数，便于单测） */
export function buildLessonSearchIndex(lessons: readonly Lesson[]): LessonSearchEntry[] {
  return lessons.map((lesson) => ({
    lessonId: lesson.id,
    level: lesson.level,
    title: lesson.title,
    segments: collectSegments(lesson),
  }));
}

/**
 * 围绕命中位置截取摘要：先压平空白，再以命中处为中心开窗，两端补省略号。
 * 未命中时退化为头部截断（调用方通常只在命中时调用）。
 */
export function createSnippet(
  text: string,
  rawQuery: string,
  maxLength = SEARCH_SNIPPET_LENGTH,
): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= maxLength) return flat;

  const needle = rawQuery.trim().toLowerCase();
  const matchIndex = needle ? flat.toLowerCase().indexOf(needle) : -1;
  if (matchIndex < 0) return `${flat.slice(0, maxLength).trimEnd()}…`;

  const context = Math.max(0, Math.floor((maxLength - needle.length) / 2));
  const start = Math.max(0, Math.min(matchIndex - context, flat.length - maxLength));
  const window = flat.slice(start, start + maxLength).trim();
  const prefix = start > 0 ? '…' : '';
  const suffix = start + maxLength < flat.length ? '…' : '';
  return `${prefix}${window}${suffix}`;
}

/** 每个课时取首个命中片段；空查询返回空数组（不触碰索引加载） */
export function searchLessonIndex(
  index: readonly LessonSearchEntry[],
  rawQuery: string,
): LessonSearchHit[] {
  const needle = rawQuery.trim().toLowerCase();
  if (!needle) return [];

  const hits: LessonSearchHit[] = [];
  for (const entry of index) {
    const matched = entry.segments.find((segment) => segment.text.toLowerCase().includes(needle));
    if (!matched) continue;
    hits.push({
      lessonId: entry.lessonId,
      level: entry.level,
      title: entry.title,
      source: matched.source,
      snippet: createSnippet(matched.text, needle),
    });
  }
  return hits;
}

let cachedIndex: LessonSearchEntry[] | null = null;
let indexPromise: Promise<LessonSearchEntry[]> | null = null;

/** 已缓存的索引（组件渲染期同步读取，未加载返回 null） */
export function getCachedLessonSearchIndex(): LessonSearchEntry[] | null {
  return cachedIndex;
}

/**
 * 懒加载并缓存全文索引：并发/连续查询共用同一个 in-flight Promise，
 * 成功后长期缓存；失败时清空 in-flight 记录，允许调用方重试。
 */
export function loadLessonSearchIndex(): Promise<LessonSearchEntry[]> {
  if (cachedIndex) return Promise.resolve(cachedIndex);
  if (indexPromise) return indexPromise;

  const task = loadAcademyLessonsForQuickDrill()
    .then((lessons) => {
      cachedIndex = buildLessonSearchIndex(lessons);
      return cachedIndex;
    })
    .finally(() => {
      if (indexPromise === task) indexPromise = null;
    });
  indexPromise = task;
  return task;
}

/** 清空缓存（测试用；运行时索引随会话常驻） */
export function resetLessonSearchIndexCache(): void {
  cachedIndex = null;
  indexPromise = null;
}
