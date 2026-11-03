/** 格式化百分比 "75.3%" */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** 格式化货币 "$1,500" */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** 格式化为大盲注单位 "2.5bb" */
export function formatBB(value: number): string {
  return `${value}bb`;
}

/** 缩写数字：先四舍五入到 1 位小数，整数省略小数位（1.5M / 2M） */
function formatScaled(scaled: number): string {
  const rounded = Math.round(scaled * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1);
}

/** 格式化筹码数 "1,500" 或 "1.5K" */
export function formatChipCount(value: number): string {
  if (value >= 1_000_000) {
    return `${formatScaled(value / 1_000_000)}M`;
  }
  if (value >= 10_000) {
    // 先按 1 位小数取整再判断是否进位到 M 档：
    // 否则 999,950–999,999 会渲染成 "1000.0K"（越档 + 4 位整数 + 无意义小数位）
    if (Math.round((value / 1_000) * 10) / 10 >= 1_000) {
      return `${formatScaled(value / 1_000_000)}M`;
    }
    return `${formatScaled(value / 1_000)}K`;
  }
  return new Intl.NumberFormat('en-US').format(value);
}
