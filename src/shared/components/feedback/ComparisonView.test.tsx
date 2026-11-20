/**
 * ComparisonView 契约（你的决策 vs GTO 最优）：
 * - 左右两栏按条件渲染，缺一侧不渲染空栏
 * - 两栏底色分别走 danger / brass token；响应式堆叠由 flex-col + sm:flex-row 承担
 * - recommendedLabel 覆盖默认 GTO 标题
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from '@/i18n/config';
import { ComparisonView } from './ComparisonView';

describe('ComparisonView', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await i18n.changeLanguage('zh');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  const rootEl = () => container.firstElementChild as HTMLElement;
  const text = () => container.textContent ?? '';

  it('双栏渲染：用户列 danger 底、GTO 列 brass 光底，移动端堆叠', () => {
    render(<ComparisonView userAction="全下" gtoAction="弃牌" />);

    expect(rootEl().className).toContain('flex-col');
    expect(rootEl().className).toContain('sm:flex-row');

    const columns = Array.from(rootEl().children) as HTMLElement[];
    expect(columns).toHaveLength(2);
    expect(columns[0]!.className).toContain('bg-[var(--poker-danger-bg)]');
    expect(columns[1]!.className).toContain('bg-[var(--poker-brass-glow)]');

    expect(text()).toContain(i18n.t('feedback.decisionAnalysis.yourDecision'));
    expect(text()).toContain(i18n.t('feedback.decisionAnalysis.gtoOptimal'));
    expect(text()).toContain('全下');
    expect(text()).toContain('弃牌');
  });

  it('只给一侧动作时只渲染对应栏', () => {
    render(<ComparisonView userAction="过牌" />);
    expect(rootEl().children).toHaveLength(1);
    expect(text()).toContain(i18n.t('feedback.decisionAnalysis.yourDecision'));
    expect(text()).not.toContain(i18n.t('feedback.decisionAnalysis.gtoOptimal'));

    render(<ComparisonView gtoAction="加注" />);
    expect(rootEl().children).toHaveLength(1);
    expect(text()).toContain(i18n.t('feedback.decisionAnalysis.gtoOptimal'));
    expect(text()).not.toContain(i18n.t('feedback.decisionAnalysis.yourDecision'));
  });

  it('两侧动作都缺失时不渲染空壳栏', () => {
    render(<ComparisonView />);
    expect(rootEl().children).toHaveLength(0);
  });

  it('recommendedLabel 覆盖默认 GTO 标题', () => {
    render(
      <ComparisonView userAction="跟注" gtoAction="加注" recommendedLabel="推荐动作" />,
    );
    expect(text()).toContain('推荐动作');
    expect(text()).not.toContain(i18n.t('feedback.decisionAnalysis.gtoOptimal'));
  });
});