import { describe, it, expect, afterEach, beforeEach, beforeAll } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import RangeStatsPage from './RangeStatsPage';
import GTOStatsPage from './GTOStatsPage';
import { useProgressStore } from '../../store';

/**
 * RangeStatsPage / GTOStatsPage（jsdom）。
 *
 * 两者都是「lazy(ModuleStatsPage) + 固定 moduleName / displayName」的薄封装：
 * 契约是懒加载解析后按 nav.* 译文渲染标题，且把模块名透传给统计页（记录过滤口径）。
 *
 * 懒加载目标依赖 recharts（首次 import 较重），全量并行跑时可能因 CPU 竞争超时：
 * 故先在 beforeAll 预热模块图，用例内 flush Suspense，waitFor 仅作兜底。
 */

function renderPage(page: React.ReactNode) {
  return render(<MemoryRouter initialEntries={['/progress/range']}>{page}</MemoryRouter>);
}

beforeAll(async () => {
  // 预热懒加载目标与 recharts，避免首次动态 import 受并行测试资源竞争影响
  await import('../dashboard/ModuleStatsPage');
}, 30000);

beforeEach(() => {
  useProgressStore.setState({ records: [] });
});

afterEach(() => {
  cleanup();
  useProgressStore.setState({ records: [] });
});

describe('统计子页面懒加载包装', () => {
  it('RangeStatsPage 解析懒加载后渲染手牌范围训练标题与详情区', async () => {
    const { container } = renderPage(<RangeStatsPage />);

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(
      () => {
        expect(container.textContent).toContain('手牌范围训练');
      },
      { timeout: 10000 },
    );
    expect(container.textContent).toContain('详细训练统计');
  });

  it('GTOStatsPage 解析懒加载后渲染 GTO 模拟器标题', async () => {
    const { container } = renderPage(<GTOStatsPage />);

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(
      () => {
        expect(container.textContent).toContain('GTO 模拟器');
      },
      { timeout: 10000 },
    );
    expect(container.textContent).toContain('总训练次数');
  });
});
