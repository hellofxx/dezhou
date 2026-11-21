/**
 * ResultSlip 契约（共享结果纸条）：
 * - overlay：Dialog 内 h2 标题、默认钢印、指标/徽章/导师语/详情槽与动作组
 * - page：dealer-slip 整页 region（无 dialog role）
 * - 关闭：X 按钮走 onClose；动作回调独立触发
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ResultSlip } from './ResultSlip';

afterEach(() => cleanup());

const ACTIONS = [
  { label: '再练一次', onClick: vi.fn(), variant: 'primary' as const },
  { label: '返回站首页', onClick: vi.fn(), variant: 'outline' as const },
];

describe('ResultSlip overlay', () => {
  it('渲染 dialog、h2 标题、默认钢印、指标与动作', () => {
    render(
      <ResultSlip
        open
        onClose={vi.fn()}
        title="训练完成"
        subtitle="命中率 88%"
        metrics={[
          { label: '正确率', value: '88%' },
          { label: '题量', value: '20' },
        ]}
        badges={[{ label: '已记录' }]}
        actions={ACTIONS}
      />,
    );

    expect(screen.getByRole('dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: '训练完成' })).toBeTruthy();
    expect(screen.getByText('命中率 88%')).toBeTruthy();
    expect(screen.getByText('已完成')).toBeTruthy();
    expect(screen.getByText('已记录')).toBeTruthy();
    expect(screen.getByText('88%')).toBeTruthy();
    expect(screen.getByRole('button', { name: '再练一次' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '返回站首页' })).toBeTruthy();
  });

  it('关闭按钮走 onClose，动作回调独立触发', () => {
    const onClose = vi.fn();
    const retry = vi.fn();
    render(
      <ResultSlip
        open
        onClose={onClose}
        title="训练完成"
        actions={[{ label: '再练一次', onClick: retry, variant: 'primary' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: '再练一次' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('ResultSlip page', () => {
  it('渲染 dealer-slip region 与 h2，不产生 dialog', () => {
    render(
      <ResultSlip
        presentation="page"
        title="对局复盘"
        stamp="已保存"
        detail={<p>EV Loss 明细</p>}
        actions={ACTIONS}
      />,
    );

    const region = screen.getByRole('region', { name: '对局复盘' });
    expect(region.className).toContain('dealer-slip');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: '对局复盘' })).toBeTruthy();
    expect(screen.getByText('已保存')).toBeTruthy();
    expect(screen.getByText('EV Loss 明细')).toBeTruthy();
  });
});
