// src/i18n/preload.ts
// 按需懒加载翻译模块：幂等动态 import + i18next.addResourceBundle 深层合并注入。
// - 幂等：同一 (lng, key) 只加载一次，重复调用直接跳过（防重复请求与重复注入）。
// - 语言切换：对已请求过的模块自动补加载目标语言，保证切语言后当前页面文案完整。
// - 时序：路由页面与翻译模块并行加载，注入完成早于组件渲染，无 key 缺失闪烁。

import i18n from './config';
import {
  CORE_MODULES,
  FEATURE_GROUPS,
  loadModule,
  normalizeLanguage,
  type I18nLanguage,
  type I18nModuleKey,
} from './moduleRegistry';
import { getTouchedTheoryLevels, loadTheoryContentForLevels } from './theoryContent';
import { getTouchedAcademyCourseFiles, loadAcademyCourseFiles } from './academyCourse';

export {
  isTheoryContentLoaded,
  loadAllTheoryContent,
  loadTheoryContentForChapters,
  loadTheoryContentForLevels,
  loadTheoryContentForQuestionIds,
} from './theoryContent';
export {
  isAcademyCourseFilesLoaded,
  loadAcademyBasicsCourse,
  loadAcademyCourseFiles,
  loadAcademyCourses,
  loadAcademyCoursesForLesson,
  loadAcademyCoursesForLevel,
  loadAcademyCoursesForQuickDrill,
} from './academyCourse';

/** 已加载完成的 (lng, key) 缓存 */
const loadedKeys = new Set<string>();
/** 任意语言下请求过的模块 key（语言切换时用于补加载新语言） */
const touchedKeys = new Set<I18nModuleKey>();
/**
 * 普通模块加载 Promise 缓存（in-flight 复用，防并发重复请求）。
 * 与 loadedKeys 分工：loadedKeys 只在**加载成功**后置位（失败可重试），
 * 本 Map 负责去重正在进行的加载并在 settle 后清理。
 */
const loadPromises = new Map<string, Promise<void>>();

function bundleId(lng: I18nLanguage, key: I18nModuleKey): string {
  return `${lng}:${key}`;
}

// core 模块由 config.ts 静态注入双语，标记为已加载使 preloadI18n 真正幂等跳过
// （否则 FEATURE_GROUPS 引用 core 的路由每次导航都重复 addResourceBundle，触发全局重渲染事件）
for (const lng of ['zh', 'en'] as const) {
  for (const key of CORE_MODULES) {
    loadedKeys.add(bundleId(lng, key));
  }
}

async function loadOne(lng: I18nLanguage, key: I18nModuleKey): Promise<void> {
  const id = bundleId(lng, key);
  if (loadedKeys.has(id)) return;
  const inflight = loadPromises.get(id);
  if (inflight) return inflight;
  touchedKeys.add(key);
  const task: Promise<void> = (async () => {
    const loader = loadModule[lng]?.[key];
    if (!loader) {
      // 未知模块/语言：放弃加载，依赖 fallbackLng('zh') 兜底
      return;
    }
    const bundle = await loader();
    // 单一 translation 命名空间，包裹顶层 key 后深层合并注入（deep=true 扩展 + overwrite=true 覆盖）
    i18n.addResourceBundle(lng, 'translation', { [key]: bundle.default }, true, true);
    // 仅在注入成功后置位：失败时不写缓存，下次调用可重试（弱网下单次失败不再永久缺失该模块）
    loadedKeys.add(id);
  })()
    .catch((err: unknown) => {
      console.warn(`[i18n] 加载翻译模块失败 ${lng}/${key}`, err);
    })
    .finally(() => {
      loadPromises.delete(id);
    });
  loadPromises.set(id, task);
  return task;
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
 * 注：academy-course 课程文案已改为按文件懒加载（见 academyCourse.ts），
 * 由页面组件按当前课程/Level 触发，不再在此整批加载。
 */
export async function preloadFeature(group: keyof typeof FEATURE_GROUPS): Promise<void> {
  return preloadI18n(FEATURE_GROUPS[group]);
}

/**
 * 语言切换补加载：普通模块走 preloadI18n（loadModule 注册表）；
 * academy-course / theory-content 按已访问文件（level）定向补加载，避免整批拉取。
 */
async function preloadTouched(lang: I18nLanguage): Promise<void> {
  const tasks: Promise<void>[] = [preloadI18n([...touchedKeys], lang)];
  const touchedCourseFiles = getTouchedAcademyCourseFiles();
  if (touchedCourseFiles.length > 0) {
    tasks.push(loadAcademyCourseFiles(touchedCourseFiles, lang));
  }
  const touchedTheoryLevels = getTouchedTheoryLevels();
  if (touchedTheoryLevels.length > 0) {
    tasks.push(loadTheoryContentForLevels(touchedTheoryLevels, lang));
  }
  await Promise.all(tasks);
}

// 语言切换：对已请求过的模块补加载目标语言（幂等，已加载的语言键自动跳过）
i18n.on('languageChanged', (lng: string) => {
  void preloadTouched(normalizeLanguage(lng));
});

/**
 * 语言切换入口：先预加载目标语言下所有已触及模块的资源，再执行 changeLanguage。
 * 消除"先 fallback 后跳变"闪烁——切换完成时目标语言资源已就绪，useTranslation 组件
 * 立即渲染正确文案，无需等待懒加载模块异步注入。
 * 注：若目标语言资源加载失败仍会切换语言，由 fallbackLng('zh') 兜底。
 */
export async function switchLanguage(next: I18nLanguage): Promise<void> {
  await preloadTouched(next);
  await i18n.changeLanguage(next);
}
