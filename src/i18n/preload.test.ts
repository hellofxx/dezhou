// i18n 模块注册表 + 按需懒加载测试：
// ① 注册表完整性（ALL_MODULES 唯一 / CORE ⊆ ALL / FEATURE_GROUPS 与 loadModule 均引用有效 key）
// ② preloadI18n 幂等与深层合并注入（core 已就绪、feature 懒加载、重复调用不破坏）
// ③ 显式语言加载与 languageChanged 自动补加载

import { describe, expect, it } from 'vitest';
import i18n from './config';
import { preloadI18n } from './preload';
import {
  ALL_MODULES,
  CORE_MODULES,
  FEATURE_GROUPS,
  loadModule,
  type I18nLanguage,
} from './moduleRegistry';

const LANGS: readonly I18nLanguage[] = ['zh', 'en'];

function waitForResource(lng: string, key: string, timeout = 2000): Promise<unknown> {
  const start = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const val = i18n.getResource(lng, 'translation', key);
      if (val !== undefined || Date.now() - start > timeout) {
        resolve(val);
      } else {
        setTimeout(tick, 10);
      }
    };
    tick();
  });
}

describe('moduleRegistry 注册表完整性', () => {
  it('ALL_MODULES 无重复，且与 I18nModuleKey 联合类型一一对应', () => {
    expect(new Set(ALL_MODULES).size).toBe(ALL_MODULES.length);
    expect(ALL_MODULES.length).toBeGreaterThan(0);
  });

  it('CORE_MODULES ⊆ ALL_MODULES', () => {
    const all = new Set<string>(ALL_MODULES);
    for (const key of CORE_MODULES) {
      expect(all.has(key), `core 模块 ${key} 必须存在于 ALL_MODULES`).toBe(true);
    }
  });

  it('FEATURE_GROUPS 中每个分组引用的 key 均为有效模块', () => {
    const all = new Set<string>(ALL_MODULES);
    for (const [route, keys] of Object.entries(FEATURE_GROUPS)) {
      for (const key of keys) {
        expect(all.has(key), `路由 ${route} 引用了未注册的模块 ${key}`).toBe(true);
      }
    }
  });

  it('loadModule 双语 loader 的 key 集合与 ALL_MODULES 完全一致', () => {
    for (const lng of LANGS) {
      expect(Object.keys(loadModule[lng]).sort()).toEqual([...ALL_MODULES].sort());
    }
  });

  it('ALL_MODULES 均被 CORE/FEATURE_GROUPS 引用（无未消费模块）', () => {
    const referenced = new Set<string>(CORE_MODULES);
    for (const keys of Object.values(FEATURE_GROUPS)) {
      for (const key of keys) referenced.add(key);
    }
    const unconsumed = ALL_MODULES.filter((m) => !referenced.has(m)).sort();
    // 历史 7 个未消费模块（adaptive/app/dailyPlan/localTrack/opponent/opponentDrill/toast）已清理，
    // 若新增模块必须同时接入 CORE_MODULES 或 FEATURE_GROUPS 引用面。
    expect(unconsumed).toEqual([]);
  });
});

describe('preloadI18n 幂等注入', () => {
  it('core 模块启动即就绪（config 静态注入，nav/dashboard 可用）', () => {
    expect(i18n.t('nav.rangeTrainer')).toBeTruthy();
    expect(i18n.t('dashboard.title')).toBeTruthy();
    // t() 返回译文而非 key 本身
    expect(i18n.t('nav.rangeTrainer')).not.toBe('nav.rangeTrainer');
  });

  it('懒加载非 core 模块并保持嵌套结构（rangeTrainer.rangeSelect.title）', async () => {
    await preloadI18n(['rangeTrainer']);
    const nested = i18n.getResource('zh', 'translation', 'rangeTrainer.rangeSelect.title');
    expect(nested).toBeTruthy();
    expect(typeof nested).toBe('string');
  });

  it('重复调用幂等：不破坏已注入资源，嵌套层级合并正确', async () => {
    await preloadI18n(['nav', 'rangeTrainer']);
    await preloadI18n(['nav', 'rangeTrainer']);
    expect(i18n.t('nav.dashboard')).toBeTruthy();
    expect(i18n.t('rangeTrainer.title')).toBeTruthy();
    expect(i18n.t('rangeTrainer.rangeSelect.title')).toBeTruthy();
  });

  it('多模块并行加载后全部可用（深层合并，互不覆盖）', async () => {
    await preloadI18n(['gto', 'puzzle', 'progress']);
    expect(i18n.t('gto.title')).toBeTruthy();
    expect(i18n.t('puzzle.title')).toBeTruthy();
    expect(i18n.t('progress.title')).toBeTruthy();
  });
});

describe('preloadI18n 语言维度', () => {
  it('显式指定语言加载对应资源（en 模块未加载 zh 也独立注入）', async () => {
    await preloadI18n(['rangeTrainer'], 'en');
    const enVal = i18n.getResource('en', 'translation', 'rangeTrainer.title');
    expect(enVal).toBeTruthy();
    expect(typeof enVal).toBe('string');
  });

  it('languageChanged 后对已请求过的模块自动补加载新语言', async () => {
    await preloadI18n(['rangeTrainer'], 'zh');
    await i18n.changeLanguage('en');
    // preload.ts 监听 languageChanged 自动补加载 en 版本（异步，轮询等待）
    const enVal = await waitForResource('en', 'rangeTrainer.title');
    expect(enVal).toBeTruthy();
    // 切回 zh 不影响已注入的 zh 资源
    await i18n.changeLanguage('zh');
    expect(i18n.getResource('zh', 'translation', 'rangeTrainer.title')).toBeTruthy();
  });
});
