/**
 * 认证状态的展示层纯函数（冷却倒计时 / Level 完成进度 / 理论锚点回链）。
 *
 * 状态本身由 `utils/certification`（store 的 getCertificationState 单一实现）判定，
 * 这里只做"把时间戳与课程目录翻译成界面可用的数字/字符串"，不引入任何副作用。
 * 理论锚点只读 `data/lessonMeta`，不 import 理论模块。
 */
import { getLevelSummariesByNumber } from './academyMeta';
import { getLessonMeta } from '../data/lessonMeta';

/** 倒计时格式化（语言无关）：≥1 小时用 H:MM:SS，否则 MM:SS */
export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number): string => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}

export interface LevelCompletion {
  completed: number;
  total: number;
}

/** 某 level 数字（含 L4A+L4B / L7 本土课）在目录层的完成进度 */
export function getLevelCompletion(
  level: number,
  completedLessons: readonly string[],
): LevelCompletion {
  const lessons = getLevelSummariesByNumber(level).flatMap((entry) => entry.lessons);
  const completed = new Set(completedLessons);
  return {
    completed: lessons.filter((lesson) => completed.has(lesson.id)).length,
    total: lessons.length,
  };
}

/**
 * 本 Level 课程的理论锚点（去重、按课程顺序取前 limit 个）。
 * T3 未填充前 `getLessonMeta` 返回空锚点 → 调用方隐藏回链区。
 */
export function getLevelTheoryAnchors(level: number, limit = 3): string[] {
  const lessonIds = getLevelSummariesByNumber(level).flatMap((entry) =>
    entry.lessons.map((lesson) => lesson.id),
  );
  const anchors: string[] = [];
  for (const lessonId of lessonIds) {
    for (const anchor of getLessonMeta(lessonId).theoryAnchors) {
      if (anchors.includes(anchor)) continue;
      anchors.push(anchor);
      if (anchors.length >= limit) return anchors;
    }
  }
  return anchors;
}
