/**
 * HelpHome 组件冒烟测试（jsdom）：
 * 验证标题渲染、模块卡片数 = 9、FAQ 展开交互。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import HelpHome from './HelpHome';

describe('HelpHome 冒烟测试', () => {
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

  it('渲染标题与 9 张模块卡片', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <HelpHome />
        </MemoryRouter>,
      );
    });

    // 标题存在
    expect(container.textContent).toContain('帮助中心');

    // 9 张模块卡片（module-card 类）
    const cards = container.querySelectorAll('.module-card');
    expect(cards.length).toBe(9);
  });

  it('FAQ 折叠交互：点击展开显示答案', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <HelpHome />
        </MemoryRouter>,
      );
    });

    // 找到第一个 FAQ 按钮
    const faqButtons = container.querySelectorAll('[aria-expanded]');
    expect(faqButtons.length).toBeGreaterThanOrEqual(8);

    const firstBtn = faqButtons[0] as HTMLButtonElement;
    expect(firstBtn.getAttribute('aria-expanded')).toBe('false');

    // 点击展开
    act(() => {
      firstBtn.click();
    });

    expect(firstBtn.getAttribute('aria-expanded')).toBe('true');
  });
});
