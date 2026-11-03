/**
 * HelpArticle 组件测试（jsdom）：
 * 锁定 Design QA 修复项 —— tip 段不得再用中文斜体（DESIGN.md §3.2），
 * 文章不存在时走共享 EmptyState 而非自写空态，且其返回动作导航回 /help。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HelpArticle from './HelpArticle';

describe('HelpArticle 组件测试', () => {
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

  const renderAt = (path: string) => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/help/article/:articleId" element={<HelpArticle />} />
            {/* 帮助中心首页哨兵：用于断言空态返回动作的导航目标 */}
            <Route path="/help" element={<div id="help-home-sentinel" />} />
          </Routes>
        </MemoryRouter>,
      );
    });
  };

  it('tip 段正文不带 italic（中文斜体禁令 + 未加载 italic 字体面）', () => {
    renderAt('/help/article/range-trainer');

    // 防假绿：先确认这篇文章确实渲染出了 tip 块（左侧 brass 竖条）
    expect(container.querySelector('.border-l-2'), 'tip 块未渲染').not.toBeNull();

    for (const el of Array.from(container.querySelectorAll<HTMLElement>('*'))) {
      expect(el.className.toString(), '正文残留 italic').not.toContain('italic');
    }
  });

  it('未知文章 id 渲染共享 EmptyState（标题 + 说明 + 返回动作）', () => {
    renderAt('/help/article/not-a-real-article');

    expect(container.textContent).toContain('文章不存在');
    expect(container.textContent).toContain('该教程可能已迁移或链接有误');
    const heading = container.querySelector('h3');
    expect(heading?.textContent).toBe('文章不存在');
    expect(container.querySelector('button[aria-label="返回帮助中心"]')).not.toBeNull();
  });

  it('未知文章 id 的返回动作导航回 /help 首页', () => {
    renderAt('/help/article/not-a-real-article');

    // 防假绿：导航前首页哨兵不应存在
    expect(container.querySelector('#help-home-sentinel')).toBeNull();

    const back = container.querySelector(
      'button[aria-label="返回帮助中心"]',
    ) as HTMLButtonElement;
    act(() => back.click());

    expect(container.querySelector('#help-home-sentinel')).not.toBeNull();
    expect(container.textContent).not.toContain('文章不存在');
  });
});
