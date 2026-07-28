// ELO 算法工具函数（P1-2.2）
import type { EloRating, Rank } from '@/shared/types/elo';
import { RANKS } from '@/shared/types/elo';

/**
 * 简化 ELO 更新算法
 *
 * 期望胜率公式（简化版）：
 *   E = 1 / (1 + 10^((difficulty*800 - currentRating + 400) / 400))
 *
 * 实际得分 S = isCorrect（0 或 1）
 * 变化量 = kFactor * (S - E)
 *
 * 特性：
 * - 答对难题加分多（difficulty 高 → E 低 → S-E 大）
 * - 答错简单题扣分多（difficulty 低 → E 高 → 0-E 负值大）
 *
 * @param currentRating 当前分数
 * @param isCorrect 是否答对（0 或 1）
 * @param questionDifficulty 题目难度 (0=最简单, 1=最难)
 * @param kFactor K 因子（默认 32，新手 48，高分 24）
 * @returns ELO 变化量（可为负，未做边界 clamp，调用方决定如何应用）
 */
export function calculateEloChange(
  currentRating: number,
  isCorrect: number,
  questionDifficulty: number,
  kFactor: number = 32
): number {
  // 钳制难度到 [0, 1]
  const diff = Math.min(1, Math.max(0, questionDifficulty));
  // 难度映射到题目"等效分数"：难度 0 → 0；难度 1 → 800
  const questionEffectiveRating = diff * 800;
  // 期望胜率：题目等效分接近当前分时 E≈0.5
  const exponent = (questionEffectiveRating - currentRating + 400) / 400;
  const expected = 1 / (1 + Math.pow(10, exponent));
  const actual = isCorrect > 0 ? 1 : 0;
  return kFactor * (actual - expected);
}

/**
 * 根据分数获取段位
 * - 找到第一个 score < maxScore 的段位
 * - 超过最高段位上限则返回专家
 * - 低于最低段位则返回新手
 */
export function getRankForScore(score: number): Rank {
  // 钳制到合法范围
  const clamped = Math.min(3000, Math.max(0, score));
  // 找到第一个 maxScore > clamped 的段位
  const rank = RANKS.find((r) => clamped < r.maxScore);
  return rank ?? RANKS[RANKS.length - 1]!;
}

/**
 * 根据 gamesPlayed 计算 K 因子
 * - 新手（<50 局）：48
 * - 默认：32
 * - 高分（>200 局且 overall>1600）：24
 */
export function getDynamicKFactor(gamesPlayed: number, overall: number): number {
  if (gamesPlayed > 200 && overall > 1600) return 24;
  if (gamesPlayed < 50) return 48;
  return 32;
}

/**
 * 根据 abilityAssessment（0-100）映射到 ELO 初始值（300-1500）
 * 用于 migrate 函数：将老的 abilityAssessment 维度映射到 ELO 维度
 *
 * 映射：ability=0 → 300；ability=50 → 800；ability=100 → 1500
 */
export function abilityToElo(ability: number): number {
  const clamped = Math.min(100, Math.max(0, ability));
  // 线性映射 0-100 → 300-1500
  return Math.round(300 + (clamped / 100) * 1200);
}

/**
 * 检查是否发生段位升级
 * 仅返回"向上跨段位"事件；段位内分数变化或降级返回 null
 */
export function checkRankUp(
  oldScore: number,
  newScore: number
): { isUp: boolean; newRank: Rank | null } {
  const oldRank = getRankForScore(oldScore);
  const newRank = getRankForScore(newScore);
  // 升级：新段位的 minScore 严格大于旧段位的 minScore
  if (newRank.minScore > oldRank.minScore) {
    return { isUp: true, newRank };
  }
  return { isUp: false, newRank: null };
}

/**
 * 计算五维 ELO 的综合分（overall）
 * 简单平均
 */
export function computeOverallElo(elo: Pick<EloRating, 'preflop' | 'postflop' | 'math' | 'handReading' | 'mental'>): number {
  const { preflop, postflop, math, handReading, mental } = elo;
  return Math.round((preflop + postflop + math + handReading + mental) / 5);
}

/**
 * 应用 ELO 变化到指定维度并返回新的整体 ELO 状态
 * - 钳制每维分数到 [0, 3000]
 * - 重算 overall（五维平均）
 * - 重算 kFactor
 * - 增加 gamesPlayed
 */
export function applyEloChange(
  current: EloRating,
  dimension: keyof Pick<EloRating, 'preflop' | 'postflop' | 'math' | 'handReading' | 'mental'>,
  isCorrect: boolean,
  difficulty: number
): EloRating {
  const delta = calculateEloChange(current[dimension], isCorrect ? 1 : 0, difficulty, current.kFactor);
  const newDimensionScore = Math.min(3000, Math.max(0, Math.round(current[dimension] + delta)));
  const updated: EloRating = {
    ...current,
    [dimension]: newDimensionScore,
    gamesPlayed: current.gamesPlayed + 1,
    lastUpdated: Date.now(),
  };
  updated.overall = computeOverallElo(updated);
  updated.kFactor = getDynamicKFactor(updated.gamesPlayed, updated.overall);
  return updated;
}
