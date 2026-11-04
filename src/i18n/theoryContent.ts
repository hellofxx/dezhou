import i18n from './config';
import { normalizeLanguage, type I18nLanguage } from './moduleRegistry';

/**
 * 理论学院课程内容按 level 懒加载。
 *
 * theory.json 只保留目录/UI 文案；正文、题目与目标拆到 theory-content/<level>.json，
 * 由章节页、疑难清单与首页复习项按需注入同一 theory.* 命名空间（deep merge）。
 * 缓存语义与 preload.loadOne 一致：成功才入缓存、失败可重试、并发共享 in-flight。
 * 语言切换时由 preload.preloadTouched 对已访问 level 补加载目标语言。
 */

const THEORY_LEVEL_RE = /^(t\d(?:sd|hu)?)-/;

type ContentBundle = Record<string, unknown> & { default?: Record<string, unknown> };
type ContentLoader = () => Promise<ContentBundle>;

function buildLevelLoaders(
  modules: Record<string, ContentLoader>,
): Map<string, ContentLoader> {
  const map = new Map<string, ContentLoader>();
  for (const [filePath, loader] of Object.entries(modules)) {
    const levelId = filePath.split('/').pop()?.replace('.json', '');
    if (levelId) map.set(levelId, loader);
  }
  return map;
}

const levelLoaders: Record<I18nLanguage, Map<string, ContentLoader>> = {
  zh: buildLevelLoaders(
    import.meta.glob('./locales/zh/theory-content/*.json', {
      import: 'default',
    }) as Record<string, ContentLoader>,
  ),
  en: buildLevelLoaders(
    import.meta.glob('./locales/en/theory-content/*.json', {
      import: 'default',
    }) as Record<string, ContentLoader>,
  ),
};

const loadedLevels = new Set<string>();
const levelPromises = new Map<string, Promise<void>>();
/** 已访问过的 level（任一语言）——语言切换时按目标语言补加载 */
const touchedLevels = new Set<string>();

function levelIdsFromChapterIds(chapterIds: readonly string[]): string[] {
  return [
    ...new Set(
      chapterIds
        .map((chapterId) => THEORY_LEVEL_RE.exec(chapterId)?.[1])
        .filter((levelId): levelId is string => levelId !== undefined),
    ),
  ];
}

function loadLevel(lng: I18nLanguage, levelId: string): Promise<void> {
  const id = `${lng}:${levelId}`;
  touchedLevels.add(levelId);
  if (loadedLevels.has(id)) return Promise.resolve();
  const inflight = levelPromises.get(id);
  if (inflight) return inflight;
  const loader = levelLoaders[lng].get(levelId);
  if (!loader) {
    console.warn(`[i18n] 未找到理论内容包 ${lng}/${levelId}`);
    return Promise.resolve();
  }
  const task = (async () => {
    const mod = await loader();
    const content = mod.default ?? mod;
    i18n.addResourceBundle(lng, 'translation', { theory: content }, true, true);
    loadedLevels.add(id);
  })()
    .catch((err: unknown) => {
      console.warn(`[i18n] 加载理论内容包失败 ${lng}/${levelId}`, err);
    })
    .finally(() => levelPromises.delete(id));
  levelPromises.set(id, task);
  return task;
}

/** 按 level 加载理论正文/题目/目标（幂等，并发共享 in-flight） */
export function loadTheoryContentForLevels(
  levelIds: readonly string[],
  lng?: I18nLanguage,
): Promise<void> {
  const lang = lng ?? normalizeLanguage(i18n.language);
  return Promise.all([...new Set(levelIds)].map((levelId) => loadLevel(lang, levelId))).then(
    () => undefined,
  );
}

/** 按章节 id 加载（章节页入口；level 前缀 t<n>[sd|hu]-） */
export function loadTheoryContentForChapters(
  chapterIds: readonly string[],
  lng?: I18nLanguage,
): Promise<void> {
  return loadTheoryContentForLevels(levelIdsFromChapterIds(chapterIds), lng);
}

/** 按题目 id 加载（复习项入口；题 id 契约 `${chapterId}-q<n>`） */
export function loadTheoryContentForQuestionIds(
  questionIds: readonly string[],
  lng?: I18nLanguage,
): Promise<void> {
  return loadTheoryContentForChapters(
    questionIds.map((questionId) => questionId.replace(/-q\d+$/, '')),
    lng,
  );
}

/** 同步查询章节所需内容包是否已就绪（渲染期判断，避免已缓存时闪骨架） */
export function isTheoryContentLoaded(
  chapterIds: readonly string[],
  lng?: I18nLanguage,
): boolean {
  const lang = lng ?? normalizeLanguage(i18n.language);
  const levels = levelIdsFromChapterIds(chapterIds);
  return levels.length > 0 && levels.every((levelId) => loadedLevels.has(`${lang}:${levelId}`));
}

/** 加载非 level 的独立内容包（如 glossary：术语 + 参考书目），幂等 */
export function loadTheoryContentBundle(
  bundleId: string,
  lng?: I18nLanguage,
): Promise<void> {
  const lang = lng ?? normalizeLanguage(i18n.language);
  return loadLevel(lang, bundleId);
}

/** 独立内容包是否已就绪（渲染期判断，避免已缓存时闪骨架） */
export function isTheoryContentBundleLoaded(
  bundleId: string,
  lng?: I18nLanguage,
): boolean {
  const lang = lng ?? normalizeLanguage(i18n.language);
  return loadedLevels.has(`${lang}:${bundleId}`);
}

/** 预加载全部 level（测试环境全量就绪；运行时请按需调用） */
export function loadAllTheoryContent(lng?: I18nLanguage): Promise<void> {
  const lang = lng ?? normalizeLanguage(i18n.language);
  return loadTheoryContentForLevels([...levelLoaders[lang].keys()], lang);
}

/** 已访问过的 level 列表（preload.preloadTouched 语言切换补加载用） */
export function getTouchedTheoryLevels(): string[] {
  return [...touchedLevels].toSorted();
}
