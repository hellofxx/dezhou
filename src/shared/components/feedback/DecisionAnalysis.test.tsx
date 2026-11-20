/**
 * DecisionAnalysis 契约（决策分析折叠区）：
 * - aria-expanded 常驻；aria-controls 仅在展开时出现且指向存在的面板 id
 * - 相关课程 chip 必须在 relatedLessonId 与 onRelatedLessonOpen 同时存在时渲染
 * - recommendedLabel 透传 ComparisonView；多实例面板 id 唯一
 *
 * 注意：AnimatePresence 退场在 jsdom 不完成，收起只断言 aria 状态，不断言节点消失。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from '@/i18n/config';
import { DecisionAnalysis } from './DecisionAnalysis';

describe('DecisionAnalysis', () => {
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

  const head = () => container.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
  const text = () => container.textContent ?? '';
  const click = (el: HTMLElement) => {
    act(() => {
      el.click();
    });
  };

  it('默认折叠：aria-expanded=false 且无 aria-controls，点击展开并指向存在的面板', () => {
    render(<DecisionAnalysis userAction="全下" gtoAction="弃牌" />);

    expect(head().getAttribute('aria-expanded')).toBe('false');
    expect(head().getAttribute('aria-controls')).toBeNull();
    expect(text()).toContain(i18n.t('feedback.decisionAnalysis.viewAnalysis'));
    expect(text()).not.toContain(i18n.t('feedback.decisionAnalysis.yourDecision'));

    click(head());

    expect(head().getAttribute('aria-expanded')).toBe('true');
    const panelId = head().getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).not.toBeNull();
    expect(text()).toContain(i18n.t('feedback.decisionAnalysis.hideAnalysis'));
    expect(text()).toContain(i18n.t('feedback.decisionAnalysis.yourDecision'));

    click(head());

    expect(head().getAttribute('aria-expanded')).toBe('false');
    expect(head().getAttribute('aria-controls')).toBeNull();
  });

  it('defaultOpen 渲染即展开，差异原因文案完整', () => {
    render(
      <DecisionAnalysis
        defaultOpen
        difference="下注尺寸偏小"
      />,
    );

    expect(head().getAttribute('aria-expanded')).toBe('true');
    expect(head().getAttribute('aria-controls')).toBeTruthy();
    expect(text()).toContain(`${i18n.t('feedback.decisionAnalysis.differenceTitle')}：`);
    expect(text()).toContain('下注尺寸偏小');
    expect(text()).not.toContain(i18n.t('feedback.decisionAnalysis.yourDecision'));
  });

  it('相关课程 chip 双条件门禁：缺少回调时不渲染死链', () => {
    render(<DecisionAnalysis defaultOpen relatedLessonId="lesson-1" />);
    const chipLabel = i18n.t('feedback.relatedLesson');
    expect(container.querySelector(`button[aria-label="${chipLabel}"]`)).toBeNull();

    const onOpen = vi.fn();
    render(
      <DecisionAnalysis
        defaultOpen
        relatedLessonId="lesson-1"
        onRelatedLessonOpen={onOpen}
      />,
    );
    const chip = container.querySelector<HTMLButtonElement>(
      `button[aria-label="${chipLabel}"]`,
    );
    expect(chip).not.toBeNull();

    click(chip!);
    expect(onOpen).toHaveBeenCalledWith('lesson-1');
  });

  it('recommendedLabel 透传到对比视图并覆盖默认 GTO 标题', () => {
    render(
      <DecisionAnalysis
        defaultOpen
        userAction="跟注"
        gtoAction="加注"
        recommendedLabel="教练推荐"
      />,
    );

    expect(text()).toContain('教练推荐');
    expect(text()).not.toContain(i18n.t('feedback.decisionAnalysis.gtoOptimal'));
    expect(text()).toContain('跟注');
    expect(text()).toContain('加注');
  });

  it('同页多实例的面板 id 互不重复', () => {
    render(
      <>
        <DecisionAnalysis defaultOpen difference="第一处" />
        <DecisionAnalysis defaultOpen difference="第二处" />
      </>,
    );

    const ids = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-expanded="true"]'),
    ).map((button) => button.getAttribute('aria-controls'));

    expect(ids).toHaveLength(2);
    expect(ids[0]).toBeTruthy();
    expect(ids[1]).toBeTruthy();
    expect(ids[0]).not.toBe(ids[1]);
    expect(document.getElementById(ids[0]!)).not.toBeNull();
    expect(document.getElementById(ids[1]!)).not.toBeNull();
  });
});