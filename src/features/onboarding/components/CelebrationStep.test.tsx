/**
 * CelebrationStep 组件测试（jsdom，P2A-02 回归）：
 * 庆祝页只做展示，不再调用 recordTrainingDay——跨日卡在庆祝页
 * 重新挂载（unmount → remount）也不会重复记训练日（旧实现挂载 effect 即记，
 * 幂等仅防同日，跨日重挂载会白嫖一天 streak）。
 * recordTrainingDay 的唯一触发点已移至 FirstDrillStep 完成动作（见其测试）。
 * 生产侧经 progress 公共入口调用，故以 progressCommands 为断言面。
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import CelebrationStep from './CelebrationStep';
import { progressCommands } from '@/features/progress/api';

describe('CelebrationStep 不记训练日（P2A-02）', () => {
  let container: HTMLDivElement;
  let root: Root;
  const commands = { recordTrainingDay: vi.fn() };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    commands.recordTrainingDay.mockClear();
    vi.spyOn(progressCommands, 'recordTrainingDay').mockImplementation(commands.recordTrainingDay);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it('挂载 → 卸载 → 重挂载（模拟跨日重开），recordTrainingDay 始终 0 次', () => {
    // StrictMode 双跑 effect，进一步确保无任何挂载副作用调用
    act(() => {
      root.render(
        <StrictMode>
          <CelebrationStep />
        </StrictMode>,
      );
    });
    expect(commands.recordTrainingDay).not.toHaveBeenCalled();

    // 模拟跨日：用户停在庆祝页，次日刷新页面重新挂载
    act(() => root.unmount());
    root = createRoot(container);
    act(() => {
      root.render(
        <StrictMode>
          <CelebrationStep />
        </StrictMode>,
      );
    });

    expect(commands.recordTrainingDay).not.toHaveBeenCalled();
    // 页面正常渲染（Day 1 Streak 徽章为纯展示）
    expect(container.textContent).toContain('Day 1 Streak');
  });
});
