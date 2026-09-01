/**
 * i18n 按需加载失败可重试回归测试（BUG-PLT-004）。
 *
 * 旧实现：loadOne 在 `await loader()` **之前**即写入 loadedKeys，catch 分支不回退缓存
 *  → 弱网下某个翻译模块 chunk 首次加载失败后，该 (lng, key) 永久跳过，
 *    此后所有导航都不再尝试加载，模块文案一直缺失（直到刷新页面）。
 * 新实现：loadedKeys 仅在注入成功后置位；in-flight Promise 负责并发去重，
 *    失败后清理缓存允许下次调用重试；loadOne 对外仍永不 reject。
 *
 * preload.ts 的 loadedKeys / loadPromises / touchedKeys 为模块级单例缓存，
 * 每个用例前 resetModules + 重新 import 以获得干净的缓存状态
 * （否则上一条用例成功加载的条目会让后续用例退化为平凡断言）。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { I18nModuleKey } from './moduleRegistry';

// 测试用假模块键：真实 I18nModuleKey 联合里没有 'probe'，需双层断言绕过类型检查。
// type-only 导入不受 vi.mock 影响（编译期擦除），运行期仍是字符串 'probe'。
const PROBE = 'probe' as unknown as I18nModuleKey;

const ctx = vi.hoisted(() => ({
  fail: true,
  calls: 0,
  injected: new Set<string>(),
}));

vi.mock('./config', () => ({
  default: {
    language: 'zh',
    on: () => undefined,
    addResourceBundle: (lng: string, _ns: string, obj: Record<string, unknown>) => {
      for (const key of Object.keys(obj)) ctx.injected.add(`${lng}:${key}`);
    },
  },
}));

vi.mock('./moduleRegistry', () => {
  const loader = async (): Promise<{ default: Record<string, unknown> }> => {
    ctx.calls += 1;
    if (ctx.fail) throw new Error('模拟 chunk 加载失败');
    return { default: { title: 'ok' } };
  };
  return {
    CORE_MODULES: [],
    FEATURE_GROUPS: {},
    ALL_MODULES: ['probe'],
    loadModule: {
      zh: { probe: loader },
      en: { probe: loader },
    },
  };
});

type PreloadModule = typeof import('./preload');

async function freshPreload(): Promise<PreloadModule['preloadI18n']> {
  const mod: PreloadModule = await import('./preload');
  return mod.preloadI18n;
}

describe('preloadI18n 加载失败后可重试（BUG-PLT-004）', () => {
  beforeEach(() => {
    ctx.fail = true;
    ctx.calls = 0;
    ctx.injected.clear();
    vi.resetModules();
  });

  it('首次失败不污染已加载缓存，且 loadOne 不向外抛出', async () => {
    const preloadI18n = await freshPreload();
    await expect(preloadI18n([PROBE], 'zh')).resolves.toBeUndefined();
    expect(ctx.calls).toBe(1);
    expect(ctx.injected.size).toBe(0);
  });

  it('失败后再次调用可成功注入（旧实现此处永久跳过）', async () => {
    const preloadI18n = await freshPreload();
    await preloadI18n([PROBE], 'zh');
    expect(ctx.calls).toBe(1);
    ctx.fail = false;
    await preloadI18n([PROBE], 'zh');
    expect(ctx.calls).toBe(2);
    expect(ctx.injected.has('zh:probe')).toBe(true);
  });

  it('注入成功后幂等：后续调用不再触发 loader', async () => {
    ctx.fail = false;
    const preloadI18n = await freshPreload();
    await preloadI18n([PROBE], 'zh');
    expect(ctx.calls).toBe(1);
    await preloadI18n([PROBE], 'zh');
    await preloadI18n([PROBE], 'zh');
    expect(ctx.calls).toBe(1);
    expect(ctx.injected.has('zh:probe')).toBe(true);
  });

  it('并发调用共享同一 in-flight 加载，loader 只执行一次', async () => {
    ctx.fail = false;
    const preloadI18n = await freshPreload();
    await Promise.all([preloadI18n([PROBE], 'en'), preloadI18n([PROBE], 'en')]);
    expect(ctx.calls).toBe(1);
    expect(ctx.injected.has('en:probe')).toBe(true);
  });
});
