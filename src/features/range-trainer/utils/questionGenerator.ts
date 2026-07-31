import type { HandNotation, GameVariant } from '@/shared/types/poker';
import type { Position } from '@/shared/types/position';
import type { RangePreset, QuizQuestion } from '../types';
import { getAllHandNotations } from '@/shared/utils/deck';

/** 生成短牌81种手牌表示 */
export function getShortDeckHandNotations(): HandNotation[] {
  const rankLetters: Record<number, string> = {
    6: '6', 7: '7', 8: '8', 9: '9', 10: 'T',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A',
  };
  const rankValues = [14, 13, 12, 11, 10, 9, 8, 7, 6];
  const notations: HandNotation[] = [];
  for (const r of rankValues) {
    notations.push(`${rankLetters[r]!}${rankLetters[r]!}`);
  }
  for (let i = 0; i < rankValues.length; i++) {
    for (let j = i + 1; j < rankValues.length; j++) {
      const high = rankLetters[rankValues[i]!]!;
      const low = rankLetters[rankValues[j]!]!;
      notations.push(`${high}${low}s`);
      notations.push(`${high}${low}o`);
    }
  }
  return notations;
}

/** 加权随机抽样（handWeights 让答错的牌更频繁出现） */
function weightedPick(
  pool: HandNotation[],
  count: number,
  handWeights: Record<string, number>,
): HandNotation[] {
  const picked: HandNotation[] = [];
  const used = new Set<string>();
  const maxAttempts = count * 10;
  let attempts = 0;

  while (picked.length < count && attempts < maxAttempts) {
    attempts++;
    const available = pool.filter((h) => !used.has(h));
    if (available.length === 0) break;

    const weights = available.map((h) => handWeights[h] ?? 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalWeight;

    for (let i = 0; i < available.length; i++) {
      r -= weights[i]!;
      if (r <= 0) {
        picked.push(available[i]!);
        used.add(available[i]!);
        break;
      }
    }
  }
  return picked;
}

/**
 * 生成测验题目（纯函数）：
 * - 约 50% 来自范围内（正确答案=raise）
 * - 约 50% 来自范围外（正确答案=fold）
 * - 使用加权随机（handWeights）让答错的牌更频繁出现
 *
 * P1A-10 修复：presets 由调用方传入（store 中已按 variant + playerCount
 * 变体化的 presets），不再在此硬编码 6-max / HU 人数。
 * 无匹配 preset 时返回空数组，由调用方（startQuiz）拒绝进入 running（P1A-01）。
 */
export function generateQuestions(
  presets: RangePreset[],
  position: Position,
  actionType: string,
  totalQuestions: number,
  handWeights: Record<string, number>,
  variant: GameVariant = 'standard',
): QuizQuestion[] {
  const preset = presets.find(
    (p) => p.position === position && p.actionType === actionType
  );

  if (!preset) return [];

  const rangeHands = new Set(preset.hands);
  const allHands = variant === 'short-deck' ? getShortDeckHandNotations() : getAllHandNotations();

  // 分为范围内和范围外
  const inRange = allHands.filter((h) => rangeHands.has(h));
  const outRange = allHands.filter((h) => !rangeHands.has(h));

  const questions: QuizQuestion[] = [];
  const halfCount = Math.ceil(totalQuestions / 2);

  // 范围内题目（正确答案=raise）
  const inPicks = weightedPick(inRange, halfCount, handWeights);
  for (const hand of inPicks) {
    questions.push({
      hand,
      position,
      correctAction: 'raise',
      context: `${position} ${actionType}`,
    });
  }

  // 范围外题目（正确答案=fold）
  const outPicks = weightedPick(outRange, totalQuestions - halfCount, handWeights);
  for (const hand of outPicks) {
    questions.push({
      hand,
      position,
      correctAction: 'fold',
      context: `${position} ${actionType}`,
    });
  }

  // 随机打乱顺序
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j]!, questions[i]!];
  }

  return questions;
}
