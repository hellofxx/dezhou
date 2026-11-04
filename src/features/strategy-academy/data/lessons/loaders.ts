import type { PokerVariant } from '@/shared/types/elo';
import type { Lesson, QuizQuestion } from '../../types';
import { applyQuizBank } from '../../utils/applyQuizBank';
import { inferVariantFromLessonId } from '../../utils/academyMeta';

/**
 * 策略学院完整课程数据按 Level / 变体懒加载。
 * 首页/store 只读 manifest；课程页只需要当前课程所属 Level 的文件，
 * 认证只需要目标 Level；速训才加载标准全级别。
 */

const standardLevelLoaders: Record<number, () => Promise<Lesson[]>> = {
  1: () => import('./variants/standard/standardLevel1').then((mod) => mod.STANDARD_LEVEL_1_LESSONS),
  2: () => import('./variants/standard/standardLevel2').then((mod) => mod.STANDARD_LEVEL_2_LESSONS),
  3: () => import('./variants/standard/standardLevel3').then((mod) => mod.STANDARD_LEVEL_3_LESSONS),
  4: () =>
    Promise.all([
      import('./variants/standard/standardLevel4a'),
      import('./variants/standard/standardLevel4b'),
    ]).then(([a, b]) => [...a.STANDARD_LEVEL_4A_LESSONS, ...b.STANDARD_LEVEL_4B_LESSONS]),
  5: () => import('./variants/standard/standardLevel5').then((mod) => mod.STANDARD_LEVEL_5_LESSONS),
  6: () => import('./variants/standard/standardLevel6').then((mod) => mod.STANDARD_LEVEL_6_LESSONS),
  7: () => import('./variants/standard/standardLevel7').then((mod) => mod.STANDARD_LEVEL_7_LESSONS),
  8: () => import('./variants/standard/standardLevel8').then((mod) => mod.STANDARD_LEVEL_8_LESSONS),
};

type QuizBank = Record<string, QuizQuestion[]>;

const standardBankLoaders: Record<number, () => Promise<QuizBank>> = {
  1: () => import('./variants/standard/quizBank/level1').then((mod) => mod.LEVEL_1_QUIZ_BANK),
  2: () => import('./variants/standard/quizBank/level2').then((mod) => mod.LEVEL_2_QUIZ_BANK),
  3: () => import('./variants/standard/quizBank/level3').then((mod) => mod.LEVEL_3_QUIZ_BANK),
  4: () => import('./variants/standard/quizBank/level4').then((mod) => mod.LEVEL_4_QUIZ_BANK),
  5: () => import('./variants/standard/quizBank/level5').then((mod) => mod.LEVEL_5_QUIZ_BANK),
  6: () => import('./variants/standard/quizBank/level6').then((mod) => mod.LEVEL_6_QUIZ_BANK),
  // L7 含 16 门本土课，题库 = L7 标准 + 本土
  7: () =>
    Promise.all([
      import('./variants/standard/quizBank/level7'),
      import('./variants/standard/quizBank/local'),
    ]).then(([level, local]) => ({ ...level.LEVEL_7_QUIZ_BANK, ...local.LOCAL_QUIZ_BANK })),
  8: () => import('./variants/standard/quizBank/level8').then((mod) => mod.LEVEL_8_QUIZ_BANK),
};

const variantLoaders: Record<'short-deck' | 'heads-up', () => Promise<Lesson[]>> = {
  'short-deck': () =>
    import('./variants/short-deck').then((mod) => mod.SHORT_DECK_STRATEGY_COURSES),
  'heads-up': () => import('./variants/heads-up').then((mod) => mod.HEADS_UP_STRATEGY_COURSES),
};

const levelCache = new Map<number, Lesson[]>();
const variantCache = new Map<PokerVariant, Lesson[]>();
let localCache: Lesson[] | null = null;
const levelPromises = new Map<number, Promise<Lesson[]>>();
const variantPromises = new Map<PokerVariant, Promise<Lesson[]>>();
let localPromise: Promise<Lesson[]> | null = null;

function loadLevel(level: number): Promise<Lesson[]> {
  const cached = levelCache.get(level);
  if (cached) return Promise.resolve(cached);
  const inflight = levelPromises.get(level);
  if (inflight) return inflight;
  const loader = standardLevelLoaders[level];
  if (!loader) return Promise.reject(new Error(`未知 Level: ${level}`));
  const bankLoader = standardBankLoaders[level];
  const task = Promise.all([
    loader(),
    bankLoader ? bankLoader() : Promise.resolve({} as QuizBank),
  ])
    .then(([lessons, bank]) => applyQuizBank(lessons, bank))
    .then((lessons) => {
      levelCache.set(level, lessons);
      return lessons;
    })
    .finally(() => levelPromises.delete(level));
  levelPromises.set(level, task);
  return task;
}

function loadVariant(variant: PokerVariant): Promise<Lesson[]> {
  const cached = variantCache.get(variant);
  if (cached) return Promise.resolve(cached);
  const inflight = variantPromises.get(variant);
  if (inflight) return inflight;
  const loader = variant !== 'standard' ? variantLoaders[variant] : undefined;
  if (!loader) return Promise.reject(new Error(`未知变体: ${variant}`));
  const task = loader()
    .then((lessons) => {
      variantCache.set(variant, lessons);
      return lessons;
    })
    .finally(() => variantPromises.delete(variant));
  variantPromises.set(variant, task);
  return task;
}

function loadLocal(): Promise<Lesson[]> {
  if (localCache) return Promise.resolve(localCache);
  if (localPromise) return localPromise;
  localPromise = import('../localLessons')
    .then((mod) => {
      localCache = mod.LOCAL_LESSONS;
      return localCache;
    })
    .finally(() => {
      localPromise = null;
    });
  return localPromise;
}

type LessonRequest =
  | { kind: 'level'; level: number }
  | { kind: 'variant'; variant: PokerVariant }
  | { kind: 'local' };

function resolveRequest(lessonId: string): LessonRequest | null {
  if (lessonId.startsWith('local-')) return { kind: 'local' };
  const variant = inferVariantFromLessonId(lessonId);
  if (variant !== 'standard') return { kind: 'variant', variant };
  if (lessonId.startsWith('drill-')) return { kind: 'level', level: 1 };
  const match = /^l(\d)/.exec(lessonId);
  if (!match) return null;
  return { kind: 'level', level: Number(match[1]) };
}

/** 课程页：按当前课程所属 Level/变体加载 */
export function loadAcademyLessonsForLesson(lessonId: string): Promise<Lesson[]> {
  const request = resolveRequest(lessonId);
  if (!request) return Promise.reject(new Error(`未知课程: ${lessonId}`));
  if (request.kind === 'local') return loadLocal();
  if (request.kind === 'variant') return loadVariant(request.variant);
  return loadLevel(request.level);
}

/** 同步读取课程所属 Level/变体数据；未加载返回 null（避免已缓存时闪骨架） */
export function getLoadedAcademyLessonsForLesson(lessonId: string): Lesson[] | null {
  const request = resolveRequest(lessonId);
  if (!request) return null;
  if (request.kind === 'local') return localCache;
  if (request.kind === 'variant') return variantCache.get(request.variant) ?? null;
  return levelCache.get(request.level) ?? null;
}

/** 级别认证：只需要目标 Level（L4 = 4A + 4B） */
export function loadAcademyLessonsForLevel(level: number): Promise<Lesson[]> {
  return loadLevel(level);
}

export function getLoadedAcademyLessonsForLevel(level: number): Lesson[] | null {
  return levelCache.get(level) ?? null;
}

/** 速训：标准全级别题池 */
export function loadAcademyLessonsForQuickDrill(): Promise<Lesson[]> {
  return Promise.all(Object.keys(standardLevelLoaders).map((level) => loadLevel(Number(level)))).then(
    (results) => results.flat(),
  );
}

export function getLoadedAcademyLessonsForQuickDrill(): Lesson[] | null {
  const levels = Object.keys(standardLevelLoaders).map(Number);
  if (levels.some((level) => !levelCache.has(level))) return null;
  return levels.flatMap((level) => levelCache.get(level) ?? []);
}
