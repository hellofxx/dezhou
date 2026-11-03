/**
 * MobileQuickNavSheet 契约（移动端训练快捷 Sheet）：
 * - 打开：由底部导航「训练」按钮触发的受控 Sheet，标题 sr-only（nav.quickNavTitle）
 * - 四个训练入口：手牌范围训练 / 赔率计算器 / GTO 模拟器 / 牌局复盘
 * - 关闭：点击入口后导航并关闭；关闭按钮与 Escape 均能关闭（焦点陷阱由 Radix 提供）
 */
import { afterEach, describe, expect, it } from 'vitest';
import { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MobileQuickNavSheet from '@/layouts/MobileQuickNavSheet';

function Harness() {
  const [open, setOpen] = useState(false);

  return (
    <MemoryRouter initialEntries={['/']}>
      <button type="button" onClick={() => setOpen(true)}>
        打开训练入口
      </button>
      <MobileQuickNavSheet open={open} onOpenChange={setOpen} />
      <Routes>
        <Route path="/" element={<p>首页占位</p>} />
        <Route path="/range-trainer" element={<p>范围训练占位</p>} />
        <Route path="/pot-odds" element={<p>赔率占位</p>} />
        <Route path="/gto-simulator" element={<p>GTO 占位</p>} />
        <Route path="/hand-history" element={<p>复盘占位</p>} />
      </Routes>
    </MemoryRouter>
  );
}

const openSheet = () => {
  fireEvent.click(screen.getByRole('button', { name: '打开训练入口' }));
  return screen.getByRole('dialog');
};

describe('MobileQuickNavSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('默认关闭，点击触发器后打开并带 sr-only 标题', async () => {
    render(<Harness />);
    expect(screen.queryByRole('dialog')).toBeNull();

    const dialog = openSheet();

    expect(dialog).toBeTruthy();
    expect(dialog.textContent).toContain('训练入口');
    expect(await screen.findByRole('heading', { name: '训练入口' })).toBeTruthy();
  });

  it('列出四个训练入口，均指向对应路由', () => {
    render(<Harness />);
    const dialog = openSheet();

    const expected: [string, string][] = [
      ['手牌范围训练', '/range-trainer'],
      ['赔率计算器', '/pot-odds'],
      ['GTO 模拟器', '/gto-simulator'],
      ['牌局复盘', '/hand-history'],
    ];

    for (const [label, href] of expected) {
      const link = screen.getByRole('link', { name: label });
      expect(link.getAttribute('href')).toBe(href);
      expect(dialog.contains(link)).toBe(true);
    }
  });

  it('点击入口后导航到目标路由并关闭 Sheet', async () => {
    render(<Harness />);
    openSheet();

    fireEvent.click(screen.getByRole('link', { name: '赔率计算器' }));

    expect(await screen.findByText('赔率占位')).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('关闭按钮与 Escape 均可关闭 Sheet', async () => {
    render(<Harness />);
    openSheet();

    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    const dialog = openSheet();
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
