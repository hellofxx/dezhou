/**
 * 统一本地日期格式化工具（单一事实源）。
 * 替代项目中 10+ 处手写 `getFullYear + padStart` 副本。
 */
export const DAY_MS = 86_400_000;

/**
 * 将时间戳转为本地日期字符串 "YYYY-MM-DD"。
 * @param ts 毫秒时间戳
 */
export function toLocalDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
