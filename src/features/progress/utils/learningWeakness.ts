import type { TrainingRecord } from '../types';

export interface TopicWeakness {
  topic: string;
  relatedLessonIds: string[];
  total: number;
  correct: number;
  accuracy: number;
  lastPlayedAt: number;
}

export interface LearningWeaknessSnapshot {
  topics: TopicWeakness[];
  lessonIds: string[];
}

const WEAKNESS_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_ATTEMPTS = 3;
const WEAK_ACCURACY_THRESHOLD = 0.7;
const MAX_WEAK_TOPICS = 3;

interface TopicStats {
  topic: string;
  relatedLessonIds: string[];
  total: number;
  correct: number;
  lastPlayedAt: number;
}

export function getLearningWeakness(
  records: readonly TrainingRecord[],
  now: number = Date.now(),
): LearningWeaknessSnapshot {
  const cutoff = now - WEAKNESS_WINDOW_MS;
  const byTopic = new Map<string, TopicStats>();

  for (const record of records) {
    if (record.createdAt < cutoff) continue;
    for (const detail of record.result.details) {
      if (!detail || typeof detail !== 'object') continue;
      const topic = typeof detail.topic === 'string' ? detail.topic.trim() : '';
      if (!topic) continue;
      const relatedLessonId = typeof detail.relatedLessonId === 'string'
        ? detail.relatedLessonId.trim()
        : '';
      const stats = byTopic.get(topic) ?? {
        topic,
        relatedLessonIds: [],
        total: 0,
        correct: 0,
        lastPlayedAt: record.createdAt,
      };
      stats.total += 1;
      if (detail.isCorrect) stats.correct += 1;
      stats.lastPlayedAt = Math.max(stats.lastPlayedAt, record.createdAt);
      if (relatedLessonId && !stats.relatedLessonIds.includes(relatedLessonId)) {
        stats.relatedLessonIds.push(relatedLessonId);
      }
      byTopic.set(topic, stats);
    }
  }

  const topics = [...byTopic.values()]
    .filter((stats) => stats.total >= MIN_ATTEMPTS && stats.correct / stats.total < WEAK_ACCURACY_THRESHOLD)
    .map((stats): TopicWeakness => ({
      ...stats,
      relatedLessonIds: [...stats.relatedLessonIds],
      accuracy: stats.correct / stats.total,
    }))
    .toSorted((a, b) =>
      a.accuracy - b.accuracy ||
      b.total - a.total ||
      b.lastPlayedAt - a.lastPlayedAt ||
      a.topic.localeCompare(b.topic)
    )
    .slice(0, MAX_WEAK_TOPICS);

  return {
    topics,
    lessonIds: [...new Set(topics.flatMap((topic) => topic.relatedLessonIds))],
  };
}
