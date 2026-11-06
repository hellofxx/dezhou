/**
 * ResultActions 契约（共享结果页动作区）：
 * - 按顺序渲染动作，点击各自触发对应回调
 * - variant 映射到按钮金属族：primary → .btn-brass / secondary → .btn-metal / outline → 描边
 * - layout：row 居中并排（不铺满）；stack 移动端堆叠、≥sm 并排等分（flex-1）
 * - 无障碍：type="button" + min-h-11 触摸目标；图标 aria-hidden 不进入可访问名称
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RotateCcw } from 'lucide-react';
import { ResultActions, type ResultAction } from './ResultActions';

afterEach(() => cleanup());

function renderActions(actions: ResultAction[], layout?: 'row' | 'stack', className?: string) {
  const view = render(
    <ResultActions actions={actions} layout={layout} className={className} />,
  );
  return { ...view, container: view.container };
}

const RETRY = { label: '再练一次', onClick: vi.fn() };
const BACK = { label: '返回首页', onClick: vi.fn(), variant: 'outline' as const };

describe('ResultActions 动作渲染与回调', () => {
  it('按顺序渲染全部动作并触发各自回调', () => {
    const onRetry = vi.fn();
    const onBack = vi.fn();

    renderActions([
      { label: '再练一次', onClick: onRetry },
      { label: '返回首页', onClick: onBack, variant: 'outline' },
    ]);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((btn) => btn.textContent)).toEqual(['再练一次', '返回首页']);

    fireEvent.click(screen.getByRole('button', { name: '再练一次' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '返回首页' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('按钮为 type="button"（结果页无表单，避免误提交）并保留 44px 触摸目标', () => {
    renderActions([RETRY, BACK]);

    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.className).toContain('min-h-11');
    }
  });

  it('图标 aria-hidden，不污染可访问名称', () => {
    renderActions([{ label: '再练一次', onClick: vi.fn(), icon: <RotateCcw /> }]);

    const button = screen.getByRole('button', { name: '再练一次' });
    const icon = button.querySelector('svg');
    expect(icon).toBeTruthy();
    expect(icon?.parentElement?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('ResultActions variant 映射（按钮金属族）', () => {
  it('primary → .btn-brass，secondary → .btn-metal，outline → 描边', () => {
    renderActions([
      { label: '主 CTA', onClick: vi.fn(), variant: 'primary' },
      { label: '次动作', onClick: vi.fn(), variant: 'secondary' },
      { label: '返回', onClick: vi.fn(), variant: 'outline' },
    ]);

    expect(screen.getByRole('button', { name: '主 CTA' }).className).toContain('btn-brass');
    expect(screen.getByRole('button', { name: '次动作' }).className).toContain('btn-metal');
    expect(screen.getByRole('button', { name: '返回' }).className).toContain('border');
  });

  it('缺省 variant 视作 primary', () => {
    renderActions([{ label: '唯一动作', onClick: vi.fn() }]);

    expect(screen.getByRole('button', { name: '唯一动作' }).className).toContain('btn-brass');
  });
});

describe('ResultActions layout', () => {
  it('row（默认）居中并排且不铺满', () => {
    const { container } = renderActions([RETRY, BACK]);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('justify-center');
    expect(wrapper?.className).not.toContain('flex-col');
    expect(screen.getByRole('button', { name: '再练一次' }).className).not.toContain('flex-1');
  });

  it('stack 移动端堆叠、≥sm 并排等分', () => {
    const { container } = renderActions([RETRY, BACK], 'stack');

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('flex-col');
    expect(wrapper?.className).toContain('sm:flex-row');
    expect(screen.getByRole('button', { name: '再练一次' }).className).toContain('flex-1');
  });
});

describe('ResultActions className 合并', () => {
  it('容器与单个动作的自定义 class 均生效', () => {
    const { container } = renderActions(
      [{ label: '再练一次', onClick: vi.fn(), className: 'px-6' }],
      'row',
      'pt-4',
    );

    expect(container.firstElementChild?.className).toContain('pt-4');
    expect(screen.getByRole('button', { name: '再练一次' }).className).toContain('px-6');
  });
});
