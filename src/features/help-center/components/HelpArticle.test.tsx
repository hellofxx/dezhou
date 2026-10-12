/**
 * HelpArticle 组件测试（jsdom）：
 * 锁定 Design QA 修复项 —— tip 段不得再用中文斜体（DESIGN_LANGUAGE §3.2），
 * 文章不存在时走共享 EmptyState 而非自写空态。
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
});
