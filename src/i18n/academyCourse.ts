import i18n from './config';
import { normalizeLanguage, type I18nLanguage } from './moduleRegistry';

/**
 * 策略学院课程文案（academy-course/<file>.json）按文件懒加载。
 *
 * 文件已按 Level / 变体 / 专题拆分（level1..8 / short-deck / heads-up / local-lessons /
 * basics / term / opponent / opponentDrill）；课程页只加载当前课程所属文件 + 术语与对手专题，
 * 不再一次载入全部约 1.8MB 源文件。缓存语义与 loadOne 一致：
 * 成功才入缓存、失败可重试、并发共享 in-flight；语言切换只补已访问文件。
 */

type CourseBundle = Record<string, unknown> & { default?: Record<string, unknown> };
type CourseLoader = () => Promise<CourseBundle>;

/** 课程页通用附加文件：术语卡 / 对手画像 / 对手训练（体量小，按页加载避免缺 key） */
const COURSE_EXTRA_FILES = ['term', 'opponent', 'opponentDrill'] as const;

function buildFileLoaders(modules: Record<string, CourseLoader>): Map<string, CourseLoader> {
  const map = new Map<string, CourseLoader>();
  for (const [filePath, loader] of Object.entries(modules)) {
    const file = filePath.split('/').pop()?.replace('.json', '');
    if (file) map.set(file, loader);
  }
  return map;
}

const fileLoaders: Record<I18nLanguage, Map<string, CourseLoader>> = {
  zh: buildFileLoaders(
    import.meta.glob('./locales/zh/academy-course/*.json', {
      import: 'default',
    }) as Record<string, CourseLoader>,
  ),
  en: buildFileLoaders(
    import.meta.glob('./locales/en/academy-course/*.json', {
      import: 'default',
    }) as Record<string, CourseLoader>,
  ),
};

export const ALL_ACADEMY_COURSE_FILES: string[] = [...fileLoaders.zh.keys()].toSorted();

const loadedFiles = new Set<string>();
const filePromises = new Map<string, Promise<void>>();
/** 已访问过的文件（任一语言）——语言切换时按目标语言补加载 */
const touchedFiles = new Set<string>();

/** 课程 id → 该课所属内容文件（未知 id 回退全量，保证不漏 key） */
export function deriveAcademyCourseFilesForLesson(lessonId: string): string[] {
  const extras = [...COURSE_EXTRA_FILES];
  if (lessonId.startsWith('local-')) return ['local-lessons', ...extras];
  if (/^l\d+sd-/.test(lessonId)) return ['short-deck', ...extras];
  if (/^l\d+hu-/.test(lessonId)) return ['heads-up', ...extras];
  const levelMatch = /^l(\d)/.exec(lessonId);
  if (levelMatch) return [`level${levelMatch[1]}`, ...extras];
  if (lessonId.startsWith('drill-')) return ['level1', ...extras];
  return ALL_ACADEMY_COURSE_FILES;
}

/** Level 认证所需文件（标准 Level N + 通用附加） */
export function deriveAcademyCourseFilesForLevel(level: number): string[] {
  return [`level${level}`, ...COURSE_EXTRA_FILES];
}

/** 速训题库覆盖标准全部 Level 与本土课 */
export function deriveAcademyCourseFilesForQuickDrill(): string[] {
  const levels = Array.from({ length: 8 }, (_, index) => `level${index + 1}`);
  return [...levels, 'local-lessons', ...COURSE_EXTRA_FILES];
}

function loadFile(lng: I18nLanguage, file: string): Promise<void> {
  const id = `${lng}:${file}`;
  touchedFiles.add(file);
  if (loadedFiles.has(id)) return Promise.resolve();
  const inflight = filePromises.get(id);
  if (inflight) return inflight;
  const loader = fileLoaders[lng].get(file);
  if (!loader) {
    console.warn(`[i18n] 未找到课程文案文件 ${lng}/${file}`);
    return Promise.resolve();
  }
  const task = (async () => {
    const mod = await loader();
    const content = mod.default ?? mod;
    i18n.addResourceBundle(lng, 'translation', { academy: content }, true, true);
    loadedFiles.add(id);
  })()
    .catch((err: unknown) => {
      console.warn(`[i18n] 加载课程文案失败 ${lng}/${file}`, err);
    })
    .finally(() => filePromises.delete(id));
  filePromises.set(id, task);
  return task;
}

/** 按文件加载课程文案（幂等，并发共享 in-flight） */
export function loadAcademyCourseFiles(
  files: readonly string[],
  lng?: I18nLanguage,
): Promise<void> {
  const lang = lng ?? normalizeLanguage(i18n.language);
  return Promise.all([...new Set(files)].map((file) => loadFile(lang, file))).then(
    () => undefined,
  );
}

export function loadAcademyCoursesForLesson(lessonId: string, lng?: I18nLanguage): Promise<void> {
  return loadAcademyCourseFiles(deriveAcademyCourseFilesForLesson(lessonId), lng);
}

export function loadAcademyCoursesForLevel(level: number, lng?: I18nLanguage): Promise<void> {
  return loadAcademyCourseFiles(deriveAcademyCourseFilesForLevel(level), lng);
}

export function loadAcademyCoursesForQuickDrill(lng?: I18nLanguage): Promise<void> {
  return loadAcademyCourseFiles(deriveAcademyCourseFilesForQuickDrill(), lng);
}

export function loadAcademyBasicsCourse(lng?: I18nLanguage): Promise<void> {
  return loadAcademyCourseFiles(['basics'], lng);
}

/** 加载全部课程文案（测试环境全量就绪 / 未知课程兜底） */
export function loadAcademyCourses(lng?: I18nLanguage): Promise<void> {
  return loadAcademyCourseFiles(ALL_ACADEMY_COURSE_FILES, lng);
}

/** 同步查询文件是否已就绪（渲染期判断，避免已缓存时闪骨架） */
export function isAcademyCourseFilesLoaded(
  files: readonly string[],
  lng?: I18nLanguage,
): boolean {
  const lang = lng ?? normalizeLanguage(i18n.language);
  return files.every((file) => loadedFiles.has(`${lang}:${file}`));
}

/** 已访问文件列表（preload.preloadTouched 语言切换补加载用） */
export function getTouchedAcademyCourseFiles(): string[] {
  return [...touchedFiles].toSorted();
}