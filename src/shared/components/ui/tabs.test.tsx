/**
 * Tabs（shared/ui shadcn 封装）契约：
 * - TabsList / TabsTrigger / TabsContent 暴露 Radix 语义角色（tablist / tab / tabpanel）
 * - 受控与非受控两种用法都要工作：点击切换选中态，并回传 onValueChange
 * - 只有当前面板可见（未激活面板不进 DOM）
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const renderTabs = (props: Record<string, unknown> = {}) =>
  render(
    <Tabs defaultValue="range" {...props}>
      <TabsList aria-label="模块切换">
        <TabsTrigger value="range">手牌范围</TabsTrigger>
        <TabsTrigger value="odds">赔率</TabsTrigger>
        <TabsTrigger value="gto">GTO</TabsTrigger>
      </TabsList>
      <TabsContent value="range">范围内容</TabsContent>
      <TabsContent value="odds">赔率内容</TabsContent>
      <TabsContent value="gto">GTO 内容</TabsContent>
    </Tabs>,
  );

describe('Tabs', () => {
  afterEach(() => cleanup());

  it('渲染 tablist / tab 语义，默认选中项 aria-selected=true', () => {
    renderTabs();

    expect(screen.getByRole('tablist', { name: '模块切换' })).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: '手牌范围' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: '赔率' }).getAttribute('aria-selected')).toBe('false');
  });

  it('未激活面板不渲染，激活面板可访问', () => {
    renderTabs();

    expect(screen.getByRole('tabpanel').textContent).toBe('范围内容');
    expect(screen.queryByText('赔率内容')).toBeNull();
  });

  it('点击触发器切换面板并更新 aria-selected', () => {
    renderTabs();

    fireEvent.mouseDown(screen.getByRole('tab', { name: '赔率' }), { button: 0 });
    fireEvent.click(screen.getByRole('tab', { name: '赔率' }), { button: 0 });

    expect(screen.getByRole('tab', { name: '赔率' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').textContent).toBe('赔率内容');
  });

  it('受控用法：value 决定选中项，切换只回传 onValueChange', () => {
    const onValueChange = vi.fn();
    renderTabs({ value: 'gto', onValueChange, defaultValue: undefined });

    expect(screen.getByRole('tab', { name: 'GTO' }).getAttribute('aria-selected')).toBe('true');

    fireEvent.mouseDown(screen.getByRole('tab', { name: '手牌范围' }), { button: 0 });
    fireEvent.click(screen.getByRole('tab', { name: '手牌范围' }), { button: 0 });

    expect(onValueChange).toHaveBeenCalledWith('range');
    // 受控：未收到新 value 前仍停留在 GTO
    expect(screen.getByRole('tab', { name: 'GTO' }).getAttribute('aria-selected')).toBe('true');
  });

  it('禁用触发器不响应点击', () => {
    render(
      <Tabs defaultValue="a">
        <TabsList aria-label="测试">
          <TabsTrigger value="a">A</TabsTrigger>
          <TabsTrigger value="b" disabled>
            B
          </TabsTrigger>
        </TabsList>
        <TabsContent value="a">A 面板</TabsContent>
        <TabsContent value="b">B 面板</TabsContent>
      </Tabs>,
    );

    const disabledTab = screen.getByRole('tab', { name: 'B' }) as HTMLButtonElement;
    expect(disabledTab.disabled).toBe(true);
    fireEvent.click(disabledTab, { button: 0 });
    expect(screen.getByRole('tabpanel').textContent).toBe('A 面板');
  });
});
