/**
 * 难度阈值 — ProgressPage 难度档位判定与 DifficultyIndicator 建议的共享单源。
 *
 * 统一口径说明：
 * - ProgressPage 依 overallAccuracy 判定当前难度档位（advanced / intermediate / beginner）；
 * - DifficultyIndicator 依 accuracy 与会话数给出升档 / 降档建议。
 * 二者阈值必须一致，避免出现「已显示最高档但仍建议升级」的矛盾。
 */
export const DIFFICULTY_THRESHOLDS = {
  /** 正确率高于该值 → 判为 advanced（最高难度档位）；同时作为建议升档的阈值 */
  advanced: 0.85,
  /** 正确率高于该值 → 判为 intermediate，否则为 beginner */
  intermediate: 0.55,
  /** 正确率低于该值 → 建议降档 */
  downshift: 0.5,
  /** 建议升档所需的最小会话数（与 advanced 阈值共同生效） */
  upgradeMinSessions: 20,
} as const;
