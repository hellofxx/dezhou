import type { PuzzleEvBasis, PuzzleQuestion } from '../types';

/**
 * EV 标定判定（PRD §6.7.1「EV 标定诚实性」）。
 *
 * - solver：求解器输出；
 * - verified：人工复算并经非作者复核；
 * - estimate：经验估算 / 示意值；
 * - none：未标定（含缺省）。
 *
 * 只有 solver / verified 允许呈现五级评级与 EV 损失数值；
 * estimate / none 必须降级为「正确 / 错误 + 解析」二态。
 */
export function hasCalibratedEv(
  question: Pick<PuzzleQuestion, 'evBasis'>
): boolean {
  return question.evBasis === 'solver' || question.evBasis === 'verified';
}

/** 缺省 evBasis 归一为 'none'，避免 UI 把 undefined 误当已标定。 */
export function normalizeEvBasis(basis: PuzzleEvBasis | undefined): PuzzleEvBasis {
  return basis ?? 'none';
}
