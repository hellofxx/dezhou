/**
 * GameVariantSelector 契约（受控组件，shared 不依赖 feature store）：
 * - 三个变体按 aria-label 暴露本地化名称，aria-pressed 标记当前变体
 * - 点击回调上报变体标识（调用方负责写 progress store）
 * - compact 仅图标 + 名称（6+ 徽标保留），完整模式额外呈现描述与牌数/人数
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { GameVariantSelector } from './GameVariantSelector';

const VARIANTS = ['标准德州', '短牌德州', '单挑'];

describe('GameVariantSelector — 完整模式', () => {
  afterEach(() => cleanup());

  it('渲染三个变体，当前变体 aria-pressed=true', () => {
    render(<GameVariantSelector currentVariant="short-deck" />);

    for (const name of VARIANTS) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    expect(screen.getByRole('button', { name: '短牌德州' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '标准德州' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('点击上报变体标识（受控：只回调不改自身状态）', () => {
    const onChange = vi.fn();
    render(<GameVariantSelector currentVariant="standard" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '单挑' }));
    fireEvent.click(screen.getByRole('button', { name: '短牌德州' }));

    expect(onChange.mock.calls).toEqual([['heads-up'], ['short-deck']]);
    // 受控语义：未收到新 props 前仍显示原变体为选中
    expect(screen.getByRole('button', { name: '标准德州' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('呈现描述与牌数 / 人数区间（来自 GAME_VARIANT_CONFIGS 单源）', () => {
    render(<GameVariantSelector currentVariant="standard" />);

    expect(screen.getByText('经典52张牌，全球最流行的扑克变体')).toBeTruthy();
    expect(screen.getByText('52 张牌 · 2-9 人')).toBeTruthy();
    expect(screen.getByText('36 张牌 · 2-6 人')).toBeTruthy();
    expect(screen.getByText('52 张牌 · 2-2 人')).toBeTruthy();
  });

  it('无 onChange 时点击不抛错（只读展示场景）', () => {
    render(<GameVariantSelector currentVariant="standard" />);
    expect(() => fireEvent.click(screen.getByRole('button', { name: '短牌德州' }))).not.toThrow();
  });
});

describe('GameVariantSelector — compact 模式', () => {
  afterEach(() => cleanup());

  it('只保留图标 + 名称，不渲染描述段落', () => {
    const { container } = render(<GameVariantSelector compact currentVariant="standard" />);

    expect(container.querySelectorAll('button')).toHaveLength(3);
    expect(container.querySelectorAll('p')).toHaveLength(0);
    expect(screen.queryByText('经典52张牌，全球最流行的扑克变体')).toBeNull();
  });

  it('6+ 徽标只出现在短牌变体上，且随选中态切换配色类', () => {
    render(<GameVariantSelector compact currentVariant="short-deck" />);
    const badge = screen.getByRole('button', { name: '短牌德州' }).querySelector('span.absolute');
    expect(badge?.textContent).toBe('6+');
    expect(badge?.classList.contains('bg-[var(--felt-deep)]')).toBe(true);

    cleanup();
    render(<GameVariantSelector compact currentVariant="standard" />);
    const inactiveBadge = screen.getByRole('button', { name: '短牌德州' }).querySelector('span.absolute');
    expect(inactiveBadge?.classList.contains('bg-[var(--felt-deep)]')).toBe(false);
  });

  it('compact 点击同样上报变体标识', () => {
    const onChange = vi.fn();
    render(<GameVariantSelector compact currentVariant="standard" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '单挑' }));
    expect(onChange).toHaveBeenCalledWith('heads-up');
  });
});
