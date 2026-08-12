import type { PracticeQuestion, QuestionDifficulty, AdaptiveConfig } from '../types';

// 默认配置
export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  enabled: true,
  upgradeThreshold: 85,
  downgradeThreshold: 60,
  timeBonus: 10,
  recentWindow: 10,
};

const DIFFICULTY_ORDER: QuestionDifficulty[] = ['beginner', 'intermediate', 'advanced'];

/**
 * 根据历史表现判断当前应使用的难度
 */
export function getCurrentDifficulty(
  recentResults: Array<{ isCorrect: boolean; timeTaken: number }>,
  config: AdaptiveConfig,
  currentDifficulty: QuestionDifficulty = 'beginner'
): QuestionDifficulty {
  if (!config.enabled || recentResults.length === 0) return currentDifficulty;

  const window = recentResults.slice(-config.recentWindow);
  const correctCount = window.filter((r) => r.isCorrect).length;
  const accuracy = (correctCount / window.length) * 100;
  const avgTime = window.reduce((sum, r) => sum + r.timeTaken, 0) / window.length;

  const currentIdx = DIFFICULTY_ORDER.indexOf(currentDifficulty);

  // 正确率 > 85% 且平均用时 < timeBonus → 升级
  if (accuracy >= config.upgradeThreshold && avgTime < config.timeBonus) {
    const nextIdx = Math.min(currentIdx + 1, DIFFICULTY_ORDER.length - 1);
    return DIFFICULTY_ORDER[nextIdx]!;
  }

  // 正确率 < 60% → 降级
  if (accuracy <= config.downgradeThreshold) {
    const prevIdx = Math.max(currentIdx - 1, 0);
    return DIFFICULTY_ORDER[prevIdx]!;
  }

  // 60-85% → 当前难度合适
  return currentDifficulty;
}

/**
 * 从题库中筛选适合当前难度的题目
 * 如果没有标记 difficulty 的题目，则全部视为 'beginner'
 */
export function selectQuestionsByDifficulty(
  allQuestions: PracticeQuestion[],
  targetDifficulty: QuestionDifficulty,
  count: number
): PracticeQuestion[] {
  const getDifficulty = (q: PracticeQuestion): QuestionDifficulty => q.difficulty ?? 'beginner';

  // 优先选择目标难度的题目
  const targetQuestions = allQuestions.filter((q) => getDifficulty(q) === targetDifficulty);

  if (targetQuestions.length >= count) {
    return shuffleArray(targetQuestions).slice(0, count);
  }

  // 如果目标难度题目不够，按难度接近程度补充
  const targetIdx = DIFFICULTY_ORDER.indexOf(targetDifficulty);
  // 按与目标难度的距离排序
  const remaining = allQuestions
    .filter((q) => getDifficulty(q) !== targetDifficulty)
    .toSorted((a, b) => {
      const distA = Math.abs(DIFFICULTY_ORDER.indexOf(getDifficulty(a)) - targetIdx);
      const distB = Math.abs(DIFFICULTY_ORDER.indexOf(getDifficulty(b)) - targetIdx);
      return distA - distB;
    });

  const result = [...shuffleArray(targetQuestions), ...remaining];
  return result.slice(0, count);
}

/**
 * 判断是否需要推荐复习
 */
export function shouldRecommendReview(
  recentResults: Array<{ isCorrect: boolean; timeTaken: number }>,
  config: AdaptiveConfig
): { shouldReview: boolean; suggestedTopics: string[] } {
  if (recentResults.length < 3) return { shouldReview: false, suggestedTopics: [] };

  const window = recentResults.slice(-config.recentWindow);
  const correctCount = window.filter((r) => r.isCorrect).length;
  const accuracy = (correctCount / window.length) * 100;

  if (accuracy <= config.downgradeThreshold) {
    const suggestedTopics: string[] = [];
    if (accuracy < 40) {
      suggestedTopics.push('基础规则与牌型');
      suggestedTopics.push('位置的力量');
    } else {
      suggestedTopics.push('起手牌选择');
      suggestedTopics.push('下注大小策略');
    }
    return { shouldReview: true, suggestedTopics };
  }

  return { shouldReview: false, suggestedTopics: [] };
}

/**
 * 计算能力评分变化
 * 正确答题加分，错误减分，快速答题有额外加分
 */
export function updateAbilityScore(
  currentScore: number,
  isCorrect: boolean,
  timeTaken: number,
  difficulty: QuestionDifficulty
): number {
  const difficultyMultiplier: Record<QuestionDifficulty, number> = {
    beginner: 1,
    intermediate: 1.5,
    advanced: 2,
  };

  const multiplier = difficultyMultiplier[difficulty];
  let delta: number;

  if (isCorrect) {
    // 基础加分 3-6 分（根据难度）
    delta = 3 * multiplier;
    // 快速答题额外加分（10秒内）
    if (timeTaken < 10) {
      delta += 2 * multiplier;
    }
  } else {
    // 基础减分 2-4 分（根据难度）
    delta = -(2 * multiplier);
  }

  // 限制在 0-100 范围
  return Math.max(0, Math.min(100, Math.round(currentScore + delta)));
}

/**
 * Fisher-Yates 洗牌算法
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}
