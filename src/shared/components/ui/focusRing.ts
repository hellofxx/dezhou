/**
 * 焦点环单源（结构批次）。
 *
 * - FOCUS_RING：多数派控制件的规范焦点环（focus 时移除 outline，focus-visible 显示黄铜 ring）。
 * - FOCUS_RING_VISIBLE：仅 focus-visible 移除 outline 的变体（BackLink 等既有实现）。
 *
 * V1 起 Button / Input / Select / Dialog 也统一使用 FOCUS_RING；
 * 不要把这两段字面量复制回业务组件。
 */
export const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60';

export const FOCUS_RING_VISIBLE =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60';
