import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { OddsDisplay } from './OddsDisplay';

/**
 * OddsDisplay 展示契约（L2 / jsdom）：
 * 主口径百分比、需要胜率 / 估算胜率 / EV / 安全边际，以及"建议跟注 / 建议弃牌"
 * 必须与 isProfitable 一致（P1B-01/P1B-03 修复后的用户可见结论）。
 */
afterEach(cleanup);

describe('OddsDisplay 盈利结论', () => {
  it('估算胜率高于所需胜率：显示建议跟注、正 EV 与正安全边际', () => {
    const { container } = render(
      <OddsDisplay potOdds={25} requiredEquity={25} estimatedEquity={36} isProfitable ev={22} />,
    );

    const text = container.textContent ?? '';
    expect(text).toContain('底池赔率');
    expect(text).toContain('你需要至少 25.0% 的胜率来盈利');
    expect(text).toContain('36.0%');
    expect(text).toContain('+22.0');
    expect(text).toContain('+11.0%');
    expect(screen.getByText('建议跟注')).toBeTruthy();
    expect(
      screen.getByText('你的估算胜率 (36.0%) 高于底池赔率 (25.0%)，长期有利可图'),
    ).toBeTruthy();
  });

  it('估算胜率低于所需胜率：显示建议弃牌、负 EV 与负安全边际', () => {
    const { container } = render(
      <OddsDisplay potOdds={33.3} requiredEquity={33.3} estimatedEquity={17} isProfitable={false} ev={-14.2} />,
    );

    const text = container.textContent ?? '';
    expect(text).toContain('-14.2');
    expect(text).toContain('-16.3%');
    expect(screen.getByText('建议弃牌')).toBeTruthy();
    expect(
      screen.getByText('你的估算胜率 (17.0%) 低于底池赔率 (33.3%)，跟注会亏损'),
    ).toBeTruthy();
  });

  it('恰好打平：安全边际为 +0.0%，EV 为零时同样带正号前缀', () => {
    const { container } = render(
      <OddsDisplay potOdds={25} requiredEquity={25} estimatedEquity={25} isProfitable ev={0} />,
    );

    const text = container.textContent ?? '';
    expect(text).toContain('+0.0%');
    expect(text).toContain('+0.0');
    expect(screen.getByText('建议跟注')).toBeTruthy();
  });

  it('主数值展示 potOdds 本身（与 requiredEquity 不同的入参不会互相覆盖）', () => {
    const { container } = render(
      <OddsDisplay potOdds={30} requiredEquity={25} estimatedEquity={40} isProfitable ev={10} />,
    );

    const text = container.textContent ?? '';
    expect(text).toContain('30.0%');
    expect(text).toContain('25.0%');
  });
});
