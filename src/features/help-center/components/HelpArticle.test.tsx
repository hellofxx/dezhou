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
            <Route path="/help" element={<div id="help-home-sentinel" />} />
          </Routes>
        </MemoryRouter>,
      );
    });
  };

  it('tip 段正文不带 italic', () => {
    renderAt('/help/article/range-trainer');
    expect(container.querySelector('.border-l-2'), 'tip 块未渲染').not.toBeNull();

    for (const element of Array.from(container.querySelectorAll<HTMLElement>('*'))) {
      expect(element.className.toString()).not.toContain('italic');
    }
  });

  it('文章使用 article 语义与可访问标题', () => {
    renderAt('/help/article/range-trainer');
    const article = container.querySelector('article');
    expect(article?.getAttribute('aria-labelledby')).toBe('help-article-title');
    expect(container.querySelector('#help-article-title')?.textContent).toBe('手牌范围训练');
    expect(container.querySelector('h1')).toBeNull();
  });

  it('底部提供上一篇与下一篇真实链接', () => {
    renderAt('/help/article/range-trainer');
    const nav = container.querySelector('nav[aria-label="继续阅读"]');
    const links = Array.from(nav?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/help/article/overview',
      '/help/article/pot-odds',
    ]);
    expect(links[0]?.getAttribute('aria-label')).toBe('上一篇：平台总览');
    expect(links[1]?.getAttribute('aria-label')).toBe('下一篇：赔率计算器');
  });

  it('未知文章 id 渲染共享 EmptyState', () => {
    renderAt('/help/article/not-a-real-article');
    expect(container.textContent).toContain('文章不存在');
    expect(container.textContent).toContain('该教程可能已迁移或链接有误');
    expect(container.querySelector('h3')?.textContent).toBe('文章不存在');
    expect(container.querySelector('button[aria-label="返回帮助中心"]')).not.toBeNull();
  });

  it('未知文章 id 的返回动作导航回 /help', () => {
    renderAt('/help/article/not-a-real-article');
    expect(container.querySelector('#help-home-sentinel')).toBeNull();

    const back = container.querySelector<HTMLButtonElement>('button[aria-label="返回帮助中心"]');
    act(() => back?.click());
    expect(container.querySelector('#help-home-sentinel')).not.toBeNull();
    expect(container.textContent).not.toContain('文章不存在');
  });
});
