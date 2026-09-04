/**
 * contentAlignment.test.ts 的历史漂移棘轮基线（2026-09-04 冻结首跑 id 型 key 覆盖结果）。
 * 条目形如 `zh-mirror:<key>`。棘轮只允许缩短：修复一条即从本文件删除一条，
 * 禁止为跑绿新增条目（守卫侧有「基线卫生」断言强制）。
 */

/**
 * 曾挂起的「数据侧文案待裁定」两项已消解（2026-09-04）：
 * `academy.drill.d-l4-ev-q4` / `d-l4-ev-q8` 的解析草稿自述与矛盾结论已按题面数字重新推导，
 * 判分答案键随之修正（q4 → +1.1BB；q8 → +0.5BB），zh/en locale 同步回写，
 * 两条条目一并从棘轮移除，基线回到空集。
 */
const NEEDS_DECISION: string[] = [];

export const DRIFT_BASELINE: readonly string[] = [...NEEDS_DECISION];
