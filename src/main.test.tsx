/**
 * 应用入口启动集成测试（入口回归例外）：
 * - SW 注册失败必须留下带 SW URL 与 APP_VERSION 的可查信号
 * - SW 注册成功不得误报失败
 * 入口与组合壳的常规豁免见 `docs/testing/README.md` §11。
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const register = vi.fn();

vi.mock('@/features/progress/store.bootstrap', () => ({
  initProgressStore: () => Promise.resolve(),
  waitForProgressHydration: () => Promise.resolve(),
}));
vi.mock('@/app/woodTexture', () => ({ installWoodTexture: vi.fn() }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: vi.fn() }),
}));
vi.mock('./App', () => ({ default: () => null }));
vi.mock('@/features/strategy-academy/store.bootstrap', () => ({}));
vi.mock('@/features/puzzle-trainer/store.bootstrap', () => ({}));
vi.mock('@/features/theory-academy/store.bootstrap', () => ({}));

import { APP_VERSION } from '@/shared/constants/app';

const SW_FAILURE_MESSAGE = '[bootstrap] Service worker registration failed';

describe('应用入口 Service Worker 注册', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeAll(async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.replaceChildren(root);
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });
    await import('./main');
  });

  beforeEach(() => {
    register.mockReset();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('注册失败时输出带 SW URL 与版本的错误信号', async () => {
    register.mockRejectedValue(new Error('sw unavailable'));
    window.dispatchEvent(new Event('load'));

    await vi.waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        SW_FAILURE_MESSAGE,
        expect.stringContaining('sw.js?v='),
        APP_VERSION,
        expect.any(Error),
      );
    });
  });

  it('注册成功时不输出错误信号', async () => {
    register.mockResolvedValue(undefined);
    window.dispatchEvent(new Event('load'));

    await vi.waitFor(() => {
      expect(register).toHaveBeenCalled();
    });
    expect(consoleError).not.toHaveBeenCalledWith(
      SW_FAILURE_MESSAGE,
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });
});