/**
 * ELO 难度口径（0-1，供 progress.updateElo 的 difficulty 参数）。
 *
 * 与理论学院 getChapterDifficulty 同口径（T1≈0.2 逐级递增，封顶 0.8），
 * 保证两院 ELO 增量可比；策略侧按课时 Level 与实战题难度档各自映射。
 */
import type { QuestionDifficulty } from '../types';

const MIN_DIFFICULTY = 0.2;
const MAX_DIFFICULTY = 0.8;

/** 课时 Level（L1-L8）→ ELO 难度：L1=0.2 起，每级 +0.075，封顶 0.8。 */
export function getLessonEloDifficulty(level: number): number {
  const level1Based = Math.max(1, level);
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, 0.2 + (level1Based - 1) * 0.075));
}

/** 实战题难度档 → ELO 难度：入门 0.3 / 进阶 0.5 / 高级 0.7；未标注按入门。 */
export function getQuestionEloDifficulty(difficulty: QuestionDifficulty | undefined): number {
  switch (difficulty) {
    case 'advanced':
      return 0.7;
    case 'intermediate':
      return 0.5;
    default:
      return 0.3;
  }
}
