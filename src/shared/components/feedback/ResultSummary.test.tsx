/**
 * ResultSummary 契约（四训练模块共用结算页）：
 * - 标题 / 按钮文案走 i18n，自定义字符串按 defaultValue 原样透传（非 key 用法）
 * - 正确率百分比四舍五入展示，副标题按四档语义文案分档（>=90/70/50 与以下）
 * - 统计卡逐项渲染 label + value；retry / back 触发调用方回调
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ResultSummary } from './ResultSummary';

const renderSummary = (overrides: Partial<Parameters<typeof ResultSummary>[0]> = {}) => {
  const onRetry = vi.fn();
  const onBack = vi.fn();
  const view = render(
    <ResultSummary
      accuracy={0.95}
      stats={[{ icon: null, label: '总题数', value: '20' }]}
      onRetry={onRetry}
      onBack={onBack}
      {...overrides}
    />,
  );
  return { ...view, onRetry, onBack };
};

describe('ResultSummary', () => {
  afterEach(() => cleanup());

  it('默认标题取 i18n，正确率展示为四舍五入百分比', () => {
    renderSummary({ accuracy: 0.876 });

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('训练完成！');
    expect(screen.getByText('88%')).toBeTruthy();
    expect(screen.getByText('正确率')).toBeTruthy();
  });

  it('正确率四档语义文案随 accuracy 切换，并作为默认副标题', () => {
    const cases: Array<[number, string]> = [
      [0.9, '优秀！'],
      [0.7, '良好'],
      [0.5, '继续加油'],
      [0.49, '需要更多练习'],
    ];

    for (const [accuracy, label] of cases) {
      const { unmount } = renderSummary({ accuracy });
      expect(screen.getByText(label)).toBeTruthy();
      unmount();
    }
  });

  it('自定义 title / subtitle / accuracyLabel 覆盖默认文案', () => {
    renderSummary({ title: '本局复盘完成', subtitle: '自定义副标题', accuracyLabel: '命中率' });

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('本局复盘完成');
    expect(screen.getByText('自定义副标题')).toBeTruthy();
  });

  it('逐项渲染统计卡的标签与数值', () => {
    renderSummary({
      stats: [
        { icon: null, label: '总题数', value: '20' },
        { icon: null, label: '平均用时', value: '6.4s' },
      ],
    });

    expect(screen.getByText('总题数')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('平均用时')).toBeTruthy();
    expect(screen.getByText('6.4s')).toBeTruthy();
  });

  it('retry / back 按钮触发调用方回调，自定义按钮文案生效', () => {
    const { onRetry, onBack } = renderSummary({ retryLabel: '再练一轮', backLabel: '回首页' });

    fireEvent.click(screen.getByRole('button', { name: /再练一轮/ }));
    fireEvent.click(screen.getByRole('button', { name: /回首页/ }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('children 追加模块自定义内容（薄弱点 / 错题等）', () => {
    renderSummary({ children: <div>薄弱点：3-bet 范围</div> });
    expect(screen.getByText('薄弱点：3-bet 范围')).toBeTruthy();
  });
});
