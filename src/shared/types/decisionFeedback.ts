/**
 * 决策反馈五级分类（P2-2 升级）
 * 用于 GTO 反馈、Range Quiz、Pot Odds、Puzzle 等训练模块统一反馈语义。
 *
 * 评级基于 EV 损失（BB）：
 *  - best：0 EV 损失（最优决策，最高频动作）
 *  - correct：< 0.5BB 损失（可接受）
 *  - inaccuracy：0.5-2BB 损失（小偏差）
 *  - wrong：2-5BB 损失（错误）
 *  - blunder：>=5BB 损失（重大错误，建议复习相关课程）
 *
 * 向后兼容：旧的 'optimal' / 'acceptable' / 'error' 三级值可通过 `migrateGrade` 映射到新五级。
 */

export type DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder';

/** 旧三级 grade（P0-4），用于 migrateGrade 输入类型 */
export type LegacyDecisionGrade = 'optimal' | 'acceptable' | 'error';

export interface DecisionFeedback {
  grade: DecisionGrade;
  evLoss: number;           // BB 损失（相对于最优动作）
  correctAction: string;    // 最优动作描述
  explanation: string;      // 1-2 句简洁解释
  relatedLessonId?: string; // 相关课程链接（wrong / blunder 级别建议填写）
}

/**
 * 评级阈值（基于 EV 损失，单位 BB）
 *
 * 区间定义（与计划表 3.5 边界一致）：
 *   - best:        evLoss ≤ 0
 *   - correct:     0 < evLoss < 0.5
 *   - inaccuracy:  0.5 ≤ evLoss ≤ 2
 *   - wrong:       2 < evLoss ≤ 5
 *   - blunder:     evLoss > 5
 */
export const GRADE_THRESHOLDS = {
  best: 0,          // ≤ 0 BB 损失，最优
  correct: 0.5,     // < 0.5BB 损失，可接受
  inaccuracy: 2,    // ≤ 2BB，小偏差（含边界 0.5 和 2）
  wrong: 5,         // ≤ 5BB，错误（含边界 5）
  blunder: Infinity, // > 5BB，重大错误
} as const;

// 根据 EV 损失计算 grade（边界值归入更严重的等级）
// NaN 防御：非法 EV 损失按 0 处理（与 pokerMath 的边界防御口径一致），
// 防止调用方计算失误（如 0/0）把 NaN 一路漏进比较链末端误判为 blunder。
export function calculateGrade(evLoss: number): DecisionGrade {
  const safeLoss = Number.isNaN(evLoss) ? 0 : evLoss;
  if (safeLoss <= GRADE_THRESHOLDS.best) return 'best';
  if (safeLoss < GRADE_THRESHOLDS.correct) return 'correct';
  if (safeLoss <= GRADE_THRESHOLDS.inaccuracy) return 'inaccuracy';
  if (safeLoss <= GRADE_THRESHOLDS.wrong) return 'wrong';
  return 'blunder';
}

// 各级别显示配置
// 颜色以 globals.css 的 .grade-* 组件类为唯一样式事实源（DESIGN_LANGUAGE §2.2 低饱和牌室化语义色）：
// 苔藓绿/黄铜/陶土红低透底 + 左侧色条，禁止 Tailwind 霓虹色板类（§1.3 反 SaaS 饱和色禁令）与纯白文字（§1.2）。
export const GRADE_DISPLAY_CONFIG: Record<DecisionGrade, {
  color: string;       // globals.css .grade-* 类（背景 + 左侧色条 + 基础文字色）
  textColor: string;   // token 文字色类（供单独消费 textColor 的场景，如 PuzzleCard）
  icon: string;        // emoji
  titleKey: string;    // i18n key
}> = {
  best:        { color: 'grade-best',       textColor: 'text-[var(--poker-success)]', icon: '🌟', titleKey: 'feedback.grade.best' },
  correct:     { color: 'grade-correct',    textColor: 'text-[var(--poker-success)]', icon: '✅', titleKey: 'feedback.grade.correct' },
  inaccuracy:  { color: 'grade-inaccuracy', textColor: 'text-[var(--brass-bright)]',  icon: '🟡', titleKey: 'feedback.grade.inaccuracy' },
  wrong:       { color: 'grade-wrong',      textColor: 'text-[var(--poker-danger)]',  icon: '🟠', titleKey: 'feedback.grade.wrong' },
  blunder:     { color: 'grade-blunder',    textColor: 'text-[var(--poker-danger)]',  icon: '🔴', titleKey: 'feedback.grade.blunder' },
};

/**
 * 将旧三级 grade 映射到新五级（向后兼容）。
 *
 * GTO 标准映射（保守原则：旧 `error` 包含 wrong + blunder，无法区分时归入 wrong）：
 * - optimal → best（旧"最优"= 新"最优"）
 * - acceptable → correct（旧"可接受"= 新"正确"）
 * - error → wrong（旧"错误"保守映射为 wrong，避免对历史错误过度惩罚）
 *
 * 注：旧 `error` 在五级体系中可能对应 wrong（2-5BB）或 blunder（>5BB），
 * 但旧数据未记录 EV 损失，无法精确区分。保守映射为 wrong 让用户在 SRS 复习中
 * 看到错误但不被过度惩罚，是更合理的策略。
 */
export function migrateGrade(oldGrade: LegacyDecisionGrade): DecisionGrade {
  if (oldGrade === 'optimal') return 'best';
  if (oldGrade === 'acceptable') return 'correct';
  return 'wrong';
}

/**
 * 根据答题是否正确与 EV 损失构造 DecisionFeedback。
 *
 * GTO 标准（统一基于 EV 损失分级，isCorrect 仅影响 evLoss 默认值）：
 *   - 答对（isCorrect=true）：evLoss 默认 0 → grade=best
 *     · 若调用方提供 evLoss（如 0.3），按 calculateGrade 分级（→ correct）
 *     · 这允许"答对但非最优动作"的场景获得 correct 而非 best，更精确
 *   - 答错（isCorrect=false）：evLoss 默认 3 BB（落在 wrong 区间）
 *     · 若调用方提供 evLoss，按 calculateGrade 分级
 *     · 这允许"答错但 EV 损失小"的场景获得 inaccuracy 而非 wrong
 *
 * 注：旧版本强制 isCorrect=true 时 evLoss>0 也返回 correct，掩盖了真实 EV 损失。
 * 新版本统一使用 calculateGrade(evLoss)，让反馈更精确地反映 GTO 决策质量。
 */
export function buildDecisionFeedback(params: {
  isCorrect: boolean;
  evLoss?: number;
  correctAction: string;
  explanation?: string;
  relatedLessonId?: string;
}): DecisionFeedback {
  const { isCorrect, correctAction, explanation = '', relatedLessonId } = params;
  const evLoss = params.evLoss ?? (isCorrect ? 0 : 3);
  // 统一使用 calculateGrade 分级，避免 isCorrect 掩盖真实 EV 损失
  const grade = calculateGrade(evLoss);
  return {
    grade,
    evLoss,
    correctAction,
    explanation,
    relatedLessonId,
  };
}
