/**
 * ErrorBoundary 契约（AppLayout 内容区兜底）：
 * - 子组件抛错时渲染兜底页（标题 / 描述 / 重试 / 刷新），不再冒泡炸整页
 * - 「重试」重置错误态后重新挂载子树（恢复后即正常渲染）
 * - 自定义 fallback 完全接管兜底 UI
 * - 错误原文只在 DEV 呈现，生产不向用户暴露内部信息
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;

function Boom() {
  if (shouldThrow) throw new Error('牌桌渲染失败');
  return <p>内容已恢复</p>;
}

describe('ErrorBoundary', () => {
  let container: HTMLDivElement;
  let root: Root;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    shouldThrow = true;
    // React 会向 console.error 输出捕获链路；测试内静音，但要能断言调用了 componentDidCatch
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    consoleError.mockRestore();
  });

  const renderBoundary = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  it('子树抛错时渲染兜底页并上报错误', () => {
    renderBoundary(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(container.querySelector('.error-boundary')).toBeTruthy();
    expect(container.textContent).toContain('页面渲染出错');
    expect(container.textContent).toContain('应用遇到了未预期的错误');
    expect(consoleError).toHaveBeenCalled();
  });

  it('错误原文仅在 DEV 呈现（生产不暴露内部信息）', () => {
    renderBoundary(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    const errorText = container.querySelector('pre')?.textContent ?? null;
    expect(errorText).toBe(import.meta.env.DEV ? '牌桌渲染失败' : null);
  });

  it('重试按钮重置错误态，子树恢复后正常渲染', () => {
    renderBoundary(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    const retry = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === '重试',
    );
    expect(retry).toBeTruthy();

    shouldThrow = false;
    act(() => {
      retry?.click();
    });

    expect(container.textContent).toContain('内容已恢复');
    expect(container.querySelector('.error-boundary')).toBeNull();
  });

  it('提供 fallback 时完全接管兜底 UI', () => {
    renderBoundary(
      <ErrorBoundary fallback={<p>自定义兜底</p>}>
        <Boom />
      </ErrorBoundary>,
    );

    expect(container.textContent).toBe('自定义兜底');
    expect(container.querySelector('.error-boundary')).toBeNull();
  });

  it('无错误时直接渲染子树（不包任何兜底容器）', () => {
    shouldThrow = false;
    renderBoundary(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(container.textContent).toBe('内容已恢复');
  });
});
