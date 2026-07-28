import type { PracticeQuestion, QuestionDifficulty } from '../types';
import { getAllLessons } from './courseProgress';

/**
 * 从全局题库中按条件筛选快速训练题目
 * 用于"5分钟速训"功能
 */
export function getQuickDrillQuestions(
  weakAreas: string[],
  difficulty: QuestionDifficulty,
  count: number = 10,
  excludeLessons: string[] = []
): PracticeQuestion[] {
  const allQuestions = collectAllPracticeQuestions();
  const candidates: PracticeQuestion[] = [];

  // 1. 优先选择与弱点相关的题目
  for (const q of allQuestions) {
    if (excludeLessons.some((id) => q.id.startsWith(id))) continue;

    const matchesDifficulty = !q.difficulty || q.difficulty === difficulty;
    const matchesWeakArea = weakAreas.length === 0 ||
      weakAreas.some((area) => isQuestionRelatedToArea(q, area));

    if (matchesDifficulty && matchesWeakArea) {
      candidates.push(q);
    }
  }

  // 2. 如果候选不够，放宽条件
  if (candidates.length < count) {
    for (const q of allQuestions) {
      if (candidates.includes(q)) continue;
      if (excludeLessons.some((id) => q.id.startsWith(id))) continue;
      candidates.push(q);
      if (candidates.length >= count * 2) break;
    }
  }

  // 3. 随机抽取指定数量
  return shuffleArray(candidates).slice(0, count);
}

/**
 * 收集所有课程中的 practice questions
 */
export function collectAllPracticeQuestions(): PracticeQuestion[] {
  const allLessons = getAllLessons();
  const questions: PracticeQuestion[] = [];

  for (const lesson of allLessons) {
    if (lesson.practice && lesson.practice.questions.length > 0) {
      questions.push(...lesson.practice.questions);
    }
  }

  return questions;
}

/**
 * 获取题库统计信息
 */
export function getQuestionPoolStats(): {
  total: number;
  byDifficulty: Record<QuestionDifficulty, number>;
  byStreet: Record<string, number>;
} {
  const allQuestions = collectAllPracticeQuestions();
  const byDifficulty: Record<QuestionDifficulty, number> = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  };
  const byStreet: Record<string, number> = {};

  for (const q of allQuestions) {
    const diff = q.difficulty ?? 'beginner';
    byDifficulty[diff]++;
    const street = q.scenario.street;
    byStreet[street] = (byStreet[street] ?? 0) + 1;
  }

  return { total: allQuestions.length, byDifficulty, byStreet };
}

/** 判断题目是否与某能力维度相关 */
function isQuestionRelatedToArea(q: PracticeQuestion, area: string): boolean {
  const { scenario } = q;

  switch (area) {
    case 'rangeKnowledge':
      return scenario.street === 'preflop';
    case 'oddsCalculation':
      return scenario.street === 'flop' || scenario.street === 'turn';
    case 'gtoUnderstanding':
      return !!scenario.board && scenario.board.length >= 3;
    case 'positionalPlay':
      return ['BTN', 'CO', 'SB'].includes(scenario.heroPosition);
    case 'emotionalControl':
      return !!scenario.gameContext?.icmPressure && scenario.gameContext.icmPressure !== 'low';
    default:
      return true;
  }
}

/** Fisher-Yates 洗牌 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}
