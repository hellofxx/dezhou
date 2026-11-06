import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DrillProgressHeader } from './DrillProgressHeader';

/**
 * DrillProgressHeader 契约（strategy-academy drills 答题进度头 feature-local 模板）：
 * - 进度语义 = 已作答 / 总题数（第 N 题填充 (N-1)/total），暴露 role=progressbar + aria-valuenow
 * - 可见进度文字同时作为进度条可访问名称（字符串时）
 * - 当前正确率由组件按模板插值：默认 `drills.common.runningAccuracy`（{{correct}}/{{answered}}），
 *   不得渲染裸占位符；`answered === 0` 不渲染
 * - 自定义模板（`academy.drill.liveAccuracy`）插 `{{accuracy}}` 百分比
 * - 退出入口（BackLink）与 `extra`（难度 pill / 压力标记）透传
 */

afterEach(() => cleanup());

function progressbar(): HTMLElement {
  return screen.getByRole('progressbar');
}

describe('DrillProgressHeader：进度', () => {
  it('按已作答比例填充，aria-valuenow 与可视比例一致，进度文字作为可访问名称', () => {
    render(<DrillProgressHeader current={3} total={8} progressText="第 3 / 8 题" />);

    // 已作答 2 / 8 = 25%
    expect(progressbar().getAttribute('aria-valuenow')).toBe('25');
    expect(progressbar().getAttribute('aria-valuemin')).toBe('0');
    expect(progressbar().getAttribute('aria-valuemax')).toBe('100');
    expect(progressbar().getAttribute('aria-label')).toBe('第 3 / 8 题');
    expect(screen.getByText('第 3 / 8 题')).toBeTruthy();
  });

  it('首题（未作答）填充为 0，末题后为 100', () => {
    const { unmount } = render(<DrillProgressHeader current={1} total={6} />);
    expect(progressbar().getAttribute('aria-valuenow')).toBe('0');
    unmount();

    render(<DrillProgressHeader current={7} total={6} />);
    expect(progressbar().getAttribute('aria-valuenow')).toBe('100');
  });

  it('ariaLabel 覆盖可访问名称（混合节点进度文字的兜底）', () => {
    render(
      <DrillProgressHeader
        current={2}
        total={4}
        progressText={
          <span>
            <b>2</b> / 4
          </span>
        }
        ariaLabel="第 2 / 4 题"
      />,
    );
    expect(progressbar().getAttribute('aria-label')).toBe('第 2 / 4 题');
  });
});

describe('DrillProgressHeader：当前正确率', () => {
  it('默认模板插 correct/answered，不出现裸占位符', () => {
    render(
      <DrillProgressHeader current={3} total={8} runningAccuracy={{ correct: 2, answered: 2 }} />,
    );
    expect(screen.getByText('当前正确率 2/2')).toBeTruthy();
    expect(screen.queryByText(/\{\{/)).toBeNull();
  });

  it('answered 为 0 时不渲染当前正确率', () => {
    render(
      <DrillProgressHeader current={1} total={8} runningAccuracy={{ correct: 0, answered: 0 }} />,
    );
    expect(screen.queryByText(/当前正确率/)).toBeNull();
  });

  it('自定义模板可插 accuracy 百分比（liveAccuracy 复用路径）', () => {
    render(
      <DrillProgressHeader
        current={3}
        total={8}
        runningAccuracy={{ correct: 1, answered: 2, textKey: 'academy.drill.liveAccuracy' }}
      />,
    );
    expect(screen.getByText('正确率 50%')).toBeTruthy();
  });
});

describe('DrillProgressHeader：退出与附加标记', () => {
  it('传 onExit 渲染退出入口并回调', () => {
    const onExit = vi.fn();
    render(<DrillProgressHeader current={1} total={4} onExit={onExit} />);
    fireEvent.click(screen.getByText('退出'));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('不传 onExit 时不渲染退出入口（PracticeDrill 无退出）', () => {
    render(<DrillProgressHeader current={1} total={4} />);
    expect(screen.queryByText('退出')).toBeNull();
  });

  it('extra 渲染在行尾（难度 pill / 压力标记）', () => {
    render(
      <DrillProgressHeader
        current={2}
        total={4}
        progressText="2 / 4"
        extra={<span>压力模式</span>}
      />,
    );
    expect(screen.getByText('压力模式')).toBeTruthy();
  });

  it('valueTone=danger 使用纯色危险填充（压力模式），brass 默认纯色黄铜', () => {
    const { unmount } = render(<DrillProgressHeader current={2} total={4} valueTone="danger" />);
    const dangerFill = progressbar().firstElementChild as HTMLElement;
    expect(dangerFill.className).toContain('bg-[var(--danger)]');
    unmount();

    render(<DrillProgressHeader current={2} total={4} />);
    const brassFill = progressbar().firstElementChild as HTMLElement;
    expect(brassFill.className).toContain('bg-[var(--brass-bright)]');
    // 纯色覆盖：关掉共享渐变与 glow，保持收编前观感
    expect(brassFill.className).toContain('bg-none');
    expect(brassFill.className).toContain('shadow-none');
  });
});
