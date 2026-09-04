import { describe, expect, it } from 'vitest';
import {
  classifyEvImpact,
  evImpactToneClass,
  parseEvImpactNumber,
} from './evImpactTone';

/**
 * evImpact 自由文本着色单元测试。
 * 用例值全部取自真实题库（src/features/strategy-academy/data/lessons/variants/**），
 * 重点是旧实现（startsWith('+') ? success : danger）误判为红色的三类：
 * 零值、无符号数值、叙述型文本。
 */

describe('parseEvImpactNumber', () => {
  it('解析带符号数值（BB/100、BB、ante、货币）', () => {
    expect(parseEvImpactNumber('+0.5 BB/100')).toBe(0.5);
    expect(parseEvImpactNumber('-1.0 BB/100')).toBe(-1);
    expect(parseEvImpactNumber('+0.5BB')).toBe(0.5);
    expect(parseEvImpactNumber('-1.5BB（失去偷盲机会）')).toBe(-1.5);
    expect(parseEvImpactNumber('-1.0 ante')).toBe(-1);
    expect(parseEvImpactNumber('+$15')).toBe(15);
    expect(parseEvImpactNumber('-$30')).toBe(-30);
  });

  it('无符号零值可解析为 0（旧实现把它判成红色的主因之一）', () => {
    expect(parseEvImpactNumber('0 BB/100')).toBe(0);
    expect(parseEvImpactNumber('0BB')).toBe(0);
    expect(parseEvImpactNumber('0')).toBe(0);
  });

  it('叙述型文本解析不出数值 → null', () => {
    expect(parseEvImpactNumber('保护资金安全')).toBeNull();
    expect(parseEvImpactNumber('保护资金')).toBeNull();
    expect(parseEvImpactNumber('+长期盈利')).toBeNull();
    expect(parseEvImpactNumber('-学习速度')).toBeNull();
    expect(parseEvImpactNumber('-信心')).toBeNull();
    expect(parseEvImpactNumber('')).toBeNull();
    expect(parseEvImpactNumber(undefined)).toBeNull();
    expect(parseEvImpactNumber(null)).toBeNull();
  });

  it('数值不在起始位置（叙述前缀）时不解析，避免把语义相反的值标成正向', () => {
    expect(parseEvImpactNumber('破产风险+200%')).toBeNull();
  });
});

describe('classifyEvImpact', () => {
  it('严格为负 → negative', () => {
    expect(classifyEvImpact('-0.5 BB/100')).toBe('negative');
    expect(classifyEvImpact('-1BB')).toBe('negative');
  });

  it('≥ 0 数值 → positive（含零「无 EV 损失」）', () => {
    expect(classifyEvImpact('+1.5 BB/100')).toBe('positive');
    expect(classifyEvImpact('0 BB/100')).toBe('positive');
    expect(classifyEvImpact('0')).toBe('positive');
    expect(classifyEvImpact('0BB')).toBe('positive');
  });

  it('无法解析 → neutral（不再默认红色）', () => {
    expect(classifyEvImpact('保护资金安全')).toBe('neutral');
    expect(classifyEvImpact('-学习速度')).toBe('neutral');
    expect(classifyEvImpact('破产风险+200%')).toBe('neutral');
  });
});

describe('evImpactToneClass', () => {
  it('三态各自映射到 token 色类（禁硬编码颜色）', () => {
    expect(evImpactToneClass('-2.0 BB/100')).toBe('text-[var(--danger)]');
    expect(evImpactToneClass('+2.0 BB/100')).toBe('text-[var(--success)]');
    expect(evImpactToneClass('0 BB/100')).toBe('text-[var(--success)]');
    expect(evImpactToneClass('保护资金安全')).toBe('text-[var(--ivory-muted)]');
    expect(evImpactToneClass(undefined)).toBe('text-[var(--ivory-muted)]');
  });
});
