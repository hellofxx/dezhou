import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/config';

// 语言切换重渲染回归测试（.test.tsx = component 项目，jsdom）
// 背景：react-i18next 默认 bindI18nStore=''，懒加载翻译模块在 changeLanguage 后异步补加载，
// addResourceBundle 注入完成后不触发 useTranslation 组件重渲染，文案滞留 fallback 语言。
// config.ts 配置 react.bindI18nStore='added removed' 后，资源注入即触发全局重渲染。
function Probe({ a, b }: { a: string; b: string }) {
  const { t } = useTranslation();
  return (
    <span>
      {t(a)} / {t(b)}
    </span>
  );
}

describe('语言切换：懒加载资源注入后自动重渲染', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    await act(async () => {
      await i18n.changeLanguage('zh');
    });
  });

  it('core 模块立即切换；懒加载模块在 addResourceBundle 注入后自动刷新', async () => {
    const coreKey = `__core_probe_${Math.random()}_`;
    const lazyKey = `__lazy_probe_${Math.random()}_`;

    await act(async () => {
      await i18n.changeLanguage('zh');
      // core 模块：zh/en 双资源就绪（静态打包）
      i18n.addResourceBundle('zh', 'translation', { [coreKey]: '核心中文' }, true, true);
      i18n.addResourceBundle('en', 'translation', { [coreKey]: 'Core English' }, true, true);
      // 懒加载模块：仅 zh 就绪（en 尚未异步加载）
      i18n.addResourceBundle('zh', 'translation', { [lazyKey]: '懒加载中文' }, true, true);
    });

    await act(async () => {
      root.render(<Probe a={coreKey} b={lazyKey} />);
    });
    expect(container.textContent).toContain('核心中文');
    expect(container.textContent).toContain('懒加载中文');

    // 切换英文：core 立即生效；懒加载 en 资源缺失 → fallback 中文（复现"部分滞后"）
    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(container.textContent).toContain('Core English');
    expect(container.textContent).toContain('懒加载中文');

    // 模拟 preloadI18n 补加载完成：注入 en 懒加载资源 → bindI18nStore 'added' 触发重渲染
    await act(async () => {
      i18n.addResourceBundle('en', 'translation', { [lazyKey]: 'Lazy English' }, true, true);
    });
    expect(container.textContent).toContain('Lazy English');
  });
});
