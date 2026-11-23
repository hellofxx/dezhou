/**
 * 课程区来源感知返回（单源纯函数）。
 *
 * 前进链接经 hubFrom / theoryMapFrom / academyMapFrom 携带来源 state；
 * 课程/章节执行页经 resolveCourseBack 解析返回目标与文案键（nav.*，core 恒可用）。
 * 深链 / 刷新 / 非法 state 一律兜底课程主线 /lesson。
 *
 * 消费方：strategy-academy（CourseView 等）与 theory-academy（TheoryChapterView 等）。
 */

export type CourseBackSource = 'hub' | 'theory-map' | 'academy-map';

export interface CourseFromState {
  source: CourseBackSource;
  /** 主线阶段序号（1 起），用于 /lesson#hub-stage-N 锚点回位 */
  stageIndex?: number;
}

export const COURSE_FROM_KEY = 'courseFrom';

export interface CourseBackTarget {
  to: string;
  labelKey: string;
}

const HUB_BACK: CourseBackTarget = { to: '/lesson', labelKey: 'nav.backToCourseHub' };

export function hubFrom(stageIndex?: number): { courseFrom: CourseFromState } {
  return {
    courseFrom: stageIndex === undefined ? { source: 'hub' } : { source: 'hub', stageIndex },
  };
}

export function theoryMapFrom(): { courseFrom: CourseFromState } {
  return { courseFrom: { source: 'theory-map' } };
}

export function academyMapFrom(): { courseFrom: CourseFromState } {
  return { courseFrom: { source: 'academy-map' } };
}

function isCourseFromState(value: unknown): value is CourseFromState {
  if (typeof value !== 'object' || value === null) return false;
  const source = (value as { source?: unknown }).source;
  if (source !== 'hub' && source !== 'theory-map' && source !== 'academy-map') return false;
  const stageIndex = (value as { stageIndex?: unknown }).stageIndex;
  return (
    stageIndex === undefined ||
    (typeof stageIndex === 'number' && Number.isInteger(stageIndex) && stageIndex >= 1)
  );
}

export function resolveCourseBack(state: unknown): CourseBackTarget {
  const from =
    typeof state === 'object' && state !== null
      ? (state as Record<string, unknown>)[COURSE_FROM_KEY]
      : undefined;
  if (!isCourseFromState(from)) return HUB_BACK;
  if (from.source === 'theory-map') return { to: '/theory', labelKey: 'nav.backToTheoryMap' };
  if (from.source === 'academy-map') return { to: '/academy', labelKey: 'nav.backToAcademyMap' };
  return from.stageIndex === undefined
    ? HUB_BACK
    : { to: `/lesson#hub-stage-${from.stageIndex}`, labelKey: 'nav.backToCourseHub' };
}