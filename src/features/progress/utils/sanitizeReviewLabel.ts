/**
 * 清洗历史遗留的硬编码中文"决策"后缀（GTO 场景 name 曾为 "BTN Turn 决策"）。
 * 统一口径：migrate / onRehydrateStorage / 渲染端兜底三处共用此正则。
 */
const DECISION_SUFFIX_RE = /\s*决策$/;

export function sanitizeReviewLabel(label: string): string {
  return label.replace(DECISION_SUFFIX_RE, '');
}
