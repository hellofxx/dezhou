// src/i18n/preload.ts
// 按需懒加载翻译模块：幂等动态 import + i18next.addResourceBundle 深层合并注入。
// - 幂等：同一 (lng, key) 只加载一次，重复调用直接跳过（防重复请求与重复注入）。
// - 语言切换：对已请求过的模块自动补加载目标语言，保证切语言后当前页面文案完整。
// - 时序：路由页面与翻译模块并行加载，注入完成早于组件渲染，无 key 缺失闪烁。

import i18n from './config';
import {
  FEATURE_GROUPS,
  loadModule,
  type I18nLanguage,
  type I18nModuleKey,
} from './moduleRegistry';

/** 已加载完成的 (lng, key) 缓存 */
const loadedKeys = new Set<string>();
/** 任意语言下请求过的模块 key（语言切换时用于补加载新语言） */
const touchedKeys = new Set<I18nModuleKey>();

function normalizeLanguage(lng: string | undefined): I18nLanguage {
  return lng === 'en' ? 'en' : 'zh';
}

function bundleId(lng: I18nLanguage, key: I18nModuleKey): string {
  return `${lng}:${key}`;
}

async function loadOne(lng: I18nLanguage, key: I18nModuleKey): Promise<void> {
  const id = bundleId(lng, key);
  if (loadedKeys.has(id)) return;
  loadedKeys.add(id);
  touchedKeys.add(key);
  const loader = loadModule[lng]?.[key];
  if (!loader) {
    // 未知模块/语言：放弃加载，依赖 fallbackLng('zh') 兜底
    return;
  }
  try {
    const bundle = await loader();
    // 单一 translation 命名空间，包裹顶层 key 后深层合并注入（deep=true 扩展 + overwrite=true 覆盖）
    i18n.addResourceBundle(lng, 'translation', { [key]: bundle.default }, true, true);
  } catch (err) {
    console.warn(`[i18n] 加载翻译模块失败 ${lng}/${key}`, err);
  }
}

/**
 * 幂等预加载指定翻译模块（使用当前语言；可显式指定目标语言）。
 * 供路由懒加载与语言切换场景调用。
 */
export async function preloadI18n(
  keys: readonly I18nModuleKey[],
  lng?: I18nLanguage,
): Promise<void> {
  const lang = lng ?? normalizeLanguage(i18n.language);
  await Promise.all(keys.map((key) => loadOne(lang, key)));
}

/**
 * 预加载某个路由分组（见 FEATURE_GROUPS 映射）。
 * 返回值用于 lazyPage 的 Promise.all 并行加载。
 */
export function preloadFeature(group: keyof typeof FEATURE_GROUPS): Promise<void> {
  return preloadI18n(FEATURE_GROUPS[group]);
}

// 语言切换：对已请求过的模块补加载目标语言（幂等，已加载的语言键自动跳过）
i18n.on('languageChanged', (lng: string) => {
  const lang = normalizeLanguage(lng);
  void preloadI18n([...touchedKeys], lang);
});

/**
 * 语言切换入口：先预加载目标语言下所有已触及模块的资源，再执行 changeLanguage。
 * 消除"先 fallback 后跳变"闪烁——切换完成时目标语言资源已就绪，useTranslation 组件
 * 立即渲染正确文案，无需等待懒加载模块异步注入。
 * 注：若目标语言资源加载失败仍会切换语言，由 fallbackLng('zh') 兜底。
 */
export async function switchLanguage(next: I18nLanguage): Promise<void> {
  await preloadI18n([...touchedKeys], next);
  await i18n.changeLanguage(next);
}
