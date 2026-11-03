/**
 * formatters 契约：数字 → 展示字符串的四条出口。
 * 边界重点是「单位换算阈值」与「四舍五入后的跨档进位」——
 * 后者曾出现 `999,999 → "1000.0K"` 的越档显示（同一数值出现 4 位整数 + 单位）。
 */
import { describe, expect, it } from 'vitest';
import { formatBB, formatChipCount, formatCurrency, formatPercentage } from './formatters';

describe('formatPercentage', () => {
  it('默认保留 1 位小数并追加百分号', () => {
    expect(formatPercentage(75.34)).toBe('75.3%');
    expect(formatPercentage(100)).toBe('100.0%');
  });

  it('小数位可覆盖，0 位时四舍五入到整数', () => {
    expect(formatPercentage(75.6, 0)).toBe('76%');
    expect(formatPercentage(33.333, 2)).toBe('33.33%');
  });

  it('零与负值照原样格式化（不做视觉钳制，由调用方决定语义）', () => {
    expect(formatPercentage(0)).toBe('0.0%');
    expect(formatPercentage(-12.5)).toBe('-12.5%');
  });
});

describe('formatCurrency', () => {
  it('USD 使用千分位整数（无小数）', () => {
    expect(formatCurrency(1500)).toBe('$1,500');
    expect(formatCurrency(0)).toBe('$0');
  });

  it('小数四舍五入到整数位', () => {
    expect(formatCurrency(1500.4)).toBe('$1,500');
    expect(formatCurrency(1500.6)).toBe('$1,501');
  });

  it('币种可替换（币种符号跟随 currency 参数）', () => {
    const eur = formatCurrency(1000, 'EUR');
    expect(eur).toContain('1,000');
    expect(eur).not.toContain('$');
  });
});

describe('formatBB', () => {
  it('原样保留数值并追加 bb 单位', () => {
    expect(formatBB(2.5)).toBe('2.5bb');
    expect(formatBB(0)).toBe('0bb');
  });
});

describe('formatChipCount', () => {
  it('万以下走千分位整数', () => {
    expect(formatChipCount(0)).toBe('0');
    expect(formatChipCount(1500)).toBe('1,500');
    expect(formatChipCount(9999)).toBe('9,999');
  });

  it('万级走 K 缩写，整数省略小数位', () => {
    expect(formatChipCount(10_000)).toBe('10K');
    expect(formatChipCount(15_500)).toBe('15.5K');
    expect(formatChipCount(999_500)).toBe('999.5K');
  });

  it('百万级走 M 缩写，整数省略小数位', () => {
    expect(formatChipCount(1_000_000)).toBe('1M');
    expect(formatChipCount(2_500_000)).toBe('2.5M');
  });

  it('回归锁：K 档四舍五入进位到 M 档，不出现 "1000.0K"', () => {
    expect(formatChipCount(999_999)).toBe('1M');
    expect(formatChipCount(999_950)).toBe('1M');
  });

  it('负值不进入缩写分支（避免 "-1.5K" 这类歧义单位）', () => {
    expect(formatChipCount(-1500)).toBe('-1,500');
  });
});
