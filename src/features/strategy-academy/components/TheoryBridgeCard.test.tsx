/**
 * TheoryBridgeCard（策略 → 理论 薄包装）契约：
 * - 章节 id → `/theory/chapter/<id>` 路由，点击回调交回调用方
 * - 章节 id → `theory.chapterTitle.<id>` 文案；词典缺失时降级为章节 id，绝不渲染裸 key
 * - anchors 为空时不渲染（完成页/首页不需要空壳）
 * - 标题与副标题可被调用方覆盖
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import TheoryBridgeCard from './TheoryBridgeCard';

MotionGlobalConfig.skipAnimations = true;

afterEach(cleanup);

describe('TheoryBridgeCard', () => {
  it('按理论章节标题渲染条目，点击回调 /theory/chapter/<id>', () => {
    const onNavigate = vi.fn();
    render(
      <TheoryBridgeCard anchors={['t3-position-value', 't2-ev']} onNavigate={onNavigate} />,
    );

    expect(screen.getByRole('heading', { name: '查看理论推导' })).toBeTruthy();

    const row = screen.getByRole('button', { name: '位置价值的来源' });
    row.click();
    expect(onNavigate).toHaveBeenCalledWith('/theory/chapter/t3-position-value');

    screen.getByRole('button', { name: '期望值（EV）：所有决策的统一度量' }).click();
    expect(onNavigate).toHaveBeenCalledWith('/theory/chapter/t2-ev');
  });

  it('anchors 为空时不渲染（不产出空卡片）', () => {
    const { container } = render(<TheoryBridgeCard anchors={[]} onNavigate={vi.fn()} />);
    expect(container.querySelector('section')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('标题与副标题可被调用方覆盖', () => {
    render(
      <TheoryBridgeCard
        anchors={['t2-ev']}
        onNavigate={vi.fn()}
        title="本课理论"
        subtitle="推导在三章里"
      />,
    );

    expect(screen.getByRole('heading', { name: '本课理论' })).toBeTruthy();
    expect(screen.getByText('推导在三章里')).toBeTruthy();
  });

  it('章节标题未命中词典时降级为章节 id，不泄露裸 i18n key', () => {
    render(<TheoryBridgeCard anchors={['t9-future-chapter']} onNavigate={vi.fn()} />);

    const row = screen.getByRole('button', { name: 't9-future-chapter' });
    expect(row.textContent).not.toContain('theory.chapterTitle');
  });
});
