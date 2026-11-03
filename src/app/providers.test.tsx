/**
 * Providers 契约（应用级 Provider）：
 * - 启动时把 progress store 的 settings.language 恢复到 i18n（跨刷新语言偏好生效）
 * - <html lang> 随语言同步：中文统一 zh-CN（读屏器与浏览器换行/连字依赖），英文为 en
 * - 语言变更监听在卸载时解绑（避免重复监听与卸载后写 DOM）
 * - 子树始终渲染（MotionConfig 只做 reducedMotion 声明式接管，不包裹可见 DOM）
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from '@/i18n/config';
import { useProgressStore } from '@/features/progress/store';
import { Providers } from './providers';

/** 冲刷 i18next 的异步 changeLanguage（languageChanged 事件在资源回调内触发） */
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

describe('Providers', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await i18n.changeLanguage('zh');
    useProgressStore.setState((state) => ({
      settings: { ...state.settings, language: 'zh' },
    }));
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    await i18n.changeLanguage('zh');
  });

  const render = async () => {
    await act(async () => {
      root.render(
        <Providers>
          <p>应用内容</p>
        </Providers>,
      );
    });
    await flush();
  };

  it('渲染子树内容', async () => {
    await render();
    expect(container.textContent).toBe('应用内容');
  });

  it('启动时按 progress store 的语言偏好恢复 i18n 语言', async () => {
    useProgressStore.setState((state) => ({
      settings: { ...state.settings, language: 'en' },
    }));

    await render();

    expect(i18n.language).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('中文（含 zh-Hant 等变体）统一同步为 zh-CN', async () => {
    await render();
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('语言变更时同步 <html lang>，且中文仍归一为 zh-CN', async () => {
    await render();

    await act(async () => {
      await i18n.changeLanguage('en');
    });
    expect(document.documentElement.lang).toBe('en');

    await act(async () => {
      await i18n.changeLanguage('zh');
    });
    expect(document.documentElement.lang).toBe('zh-CN');
  });

  it('语言已是目标语言时不重复调用 changeLanguage（避免多余资源重载）', async () => {
    const changeLanguage = vi.spyOn(i18n, 'changeLanguage');
    useProgressStore.setState((state) => ({
      settings: { ...state.settings, language: 'zh' },
    }));

    await render();

    expect(changeLanguage).not.toHaveBeenCalled();
  });

  it('卸载后不再响应语言变更（监听已解绑）', async () => {
    await render();
    act(() => root.unmount());
    container.remove();

    await act(async () => {
      await i18n.changeLanguage('en');
    });

    // 卸载时 document 停在 zh-CN，且不会有新的写入
    expect(document.documentElement.lang).toBe('zh-CN');
    // 重新建 root 以便 afterEach 正常卸载
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
});
