/**
 * Button 组件守卫（shared/ui）：金属件变体类 + 移动端触摸目标 + 可访问名称直通。
 * 依据：DESIGN.md §5.5（一级 btn-brass / 二级 btn-metal）、§6.3（移动端 ≥44px）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Button } from './button';

describe('Button', () => {
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

  const render = (node: ReactNode) => {
    act(() => {
      root.render(node);
    });
    const button = container.querySelector('button');
    expect(button).toBeTruthy();
    return button as HTMLButtonElement;
  };

  it('默认变体渲染一级金属件 btn-brass', () => {
    const button = render(<Button>开始训练</Button>);
    expect(button.classList.contains('btn-brass')).toBe(true);
    expect(button.classList.contains('btn-metal')).toBe(false);
  });

  it('variant="secondary" 渲染二级金属件 btn-metal', () => {
    const button = render(<Button variant="secondary">稍后再说</Button>);
    expect(button.classList.contains('btn-metal')).toBe(true);
    expect(button.classList.contains('btn-brass')).toBe(false);
  });

  it('默认与 sm 尺寸都带移动端触摸目标 max-md:min-h-11', () => {
    expect(render(<Button>默认</Button>).classList.contains('max-md:min-h-11')).toBe(true);
    expect(render(<Button size="sm">小尺寸</Button>).classList.contains('max-md:min-h-11')).toBe(
      true,
    );
  });

  it('可访问名称来自子内容，并直通 aria-label', () => {
    const withText = render(<Button>开始训练</Button>);
    expect(withText.textContent).toBe('开始训练');

    const withLabel = render(<Button aria-label="关闭设置面板" />);
    expect(withLabel.getAttribute('aria-label')).toBe('关闭设置面板');
  });
});
