/**
 * HelpHero 组件测试（jsdom）：
 * 锁定 House Rules 台卡的 4 个跳转入口（主 CTA + 01/02/03 三条规则）到
 * HelpHome section 锚点的映射契约 —— 锚点写错时用户点击会滚到错误分区或毫无反应。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import HelpHero, { type HelpHeroAnchor } from './HelpHero';

/** 规则卡编号 ↔ 锚点映射（顺序与源码 rules 数组一致） */
const RULE_ANCHORS: ReadonlyArray<{ index: number; num: string; anchor: HelpHeroAnchor }> = [
  { index: 0, num: '01', anchor: 'quickstart' },
  { index: 1, num: '02', anchor: 'articles' },
  { index: 2, num: '03', anchor: 'faq' },
];

describe('HelpHero 组件测试', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderHero = () => {
    const onRuleClick = vi.fn<(anchor: HelpHeroAnchor) => void>();
    act(() => {
      root.render(<HelpHero onRuleClick={onRuleClick} />);
    });
    return onRuleClick;
  };

  const ruleButtons = () =>
    Array.from(container.querySelectorAll<HTMLButtonElement>('.house-rules-item'));

  it('渲染 01/02/03 三条编号规则与 zh 文案', () => {
    renderHero();

    const buttons = ruleButtons();
    expect(buttons).toHaveLength(RULE_ANCHORS.length);
    expect(buttons.map((btn) => btn.querySelector('.house-rules-num')?.textContent)).toEqual([
      '01',
      '02',
      '03',
    ]);
    expect(
      buttons.map((btn) => btn.querySelector('.house-rules-text-title')?.textContent),
    ).toEqual(['快速上手', '模块教程', '常见问答']);
  });

  it('台卡容器带 role=group + aria-label，且内部按钮全部显式 type=button', () => {
    renderHero();

    const card = container.querySelector('.house-rules-card');
    expect(card?.getAttribute('role')).toBe('group');
    expect(card?.getAttribute('aria-label')).toBe('台卡快捷导航');

    // 03 条规则 + 1 个主 CTA
    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons).toHaveLength(RULE_ANCHORS.length + 1);
    for (const btn of buttons) {
      expect(btn.getAttribute('type'), 'Hero 内按钮须显式 type=button').toBe('button');
    }
  });

  it.each(RULE_ANCHORS)('点击规则 $num 回传 $anchor 锚点', ({ index, anchor }) => {
    const onRuleClick = renderHero();

    const target = ruleButtons()[index] as HTMLButtonElement;
    act(() => target.click());

    expect(onRuleClick).toHaveBeenCalledTimes(1);
    expect(onRuleClick).toHaveBeenCalledWith(anchor);
  });

  it('点击主 CTA 回传 quickstart（与规则 01 同一锚点）', () => {
    const onRuleClick = renderHero();

    const cta = container.querySelector('.help-hero-cta') as HTMLButtonElement;
    expect(cta.textContent).toContain('从快速上手开始');

    act(() => cta.click());

    expect(onRuleClick).toHaveBeenCalledTimes(1);
    expect(onRuleClick).toHaveBeenCalledWith('quickstart');
  });
});
