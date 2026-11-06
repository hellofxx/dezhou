/**
 * 焦点环单源（结构批次）。
 *
 * - FOCUS_RING：多数派控制件的规范焦点环（focus 时移除 outline，focus-visible 显示黄铜 ring）。
 * - FOCUS_RING_VISIBLE：仅 focus-visible 移除 outline 的变体（BackLink 等既有实现）。
 * - BUTTON_FOCUS_RING：shadcn Button 的既有焦点环，结构批次保持视觉不变；V1 再统一。
 *
 * 不要把这三段字面量复制回业务组件；新增控制件优先使用 FOCUS_RING。
 */
export const FOCUS_RING =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60';

export const FOCUS_RING_VISIBLE =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60';

export const BUTTON_FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
