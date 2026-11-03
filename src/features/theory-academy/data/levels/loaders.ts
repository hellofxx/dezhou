import type { PokerVariant } from '@/shared/types/elo';
import type {
  PracticeRecommendation,
  TheoryChapter,
  TheoryLevelInfo,
  TheoryLevelSummary,
} from '../../types';
import {
  HEADS_UP_LEVEL_SUMMARIES,
  SHORT_DECK_LEVEL_SUMMARIES,
  STANDARD_LEVEL_SUMMARIES,
} from './manifest';
import { applyStandardChapterMeta } from './variants/standard/chapterMeta';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as HEADS_UP_PRACTICE } from './variants/heads-up/chapterPracticeMap';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as SHORT_DECK_PRACTICE } from './variants/short-deck/chapterPracticeMap';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as STANDARD_PRACTICE } from './variants/standard/chapterPracticeMap';

/**
 * 理论完整数据按 Level 懒加载。
 * 首页与 store 只读 manifest；章节页只加载当前 Level 的单文件 chunk，
 * 不再一次拉取整变体（standard 全量约 100KB+ gzip）。疑难清单等需要全变体的
 * 场景经 loadTheoryLevelsForVariant 逐 Level 组合，缓存语义为成功才入缓存、
 * 失败可重试、并发共享 in-flight。
 *
 * standard 变体的增补章独立成 `chapters/t<level>-*.ts`（每文件单章），
 * 与所属 Level 的核心章并行加载后按 order 合并；章节级实践推荐与元数据
 * （supplemental / pathTags）在合并后统一附加，保证目录层与完整数据层口径一致。
 */

const SUMMARIES_BY_VARIANT: Record<PokerVariant, TheoryLevelSummary[]> = {
  standard: STANDARD_LEVEL_SUMMARIES,
  'short-deck': SHORT_DECK_LEVEL_SUMMARIES,
  'heads-up': HEADS_UP_LEVEL_SUMMARIES,
};

const SUMMARY_BY_ID = new Map(
  Object.values(SUMMARIES_BY_VARIANT)
    .flat()
    .map((level) => [level.id, level]),
);

const PRACTICE_BY_VARIANT: Record<
  PokerVariant,
  Readonly<Record<string, PracticeRecommendation>>
> = {
  standard: STANDARD_PRACTICE,
  'short-deck': SHORT_DECK_PRACTICE,
  'heads-up': HEADS_UP_PRACTICE,
};

type LevelModule = Record<string, unknown>;
type LevelLoader = () => Promise<LevelModule>;

function indexLevelLoaders(
  modules: Record<string, LevelLoader>,
  pattern: RegExp,
): Map<number, LevelLoader> {
  const result = new Map<number, LevelLoader>();
  for (const [file, loader] of Object.entries(modules)) {
    const match = pattern.exec(file);
    if (match?.[1]) result.set(Number(match[1]), loader);
  }
  return result;
}

/**
 * 增补章按文件名分组到所属 Level。
 * 先按路径排序再入组：同 Level 多章的加载顺序不依赖 glob 的枚举顺序，
 * 合并后的最终顺序由调用方的 order 排序决定。
 */
function indexSupplementalLoaders(
  modules: Record<string, LevelLoader>,
  pattern: RegExp,
): Map<number, LevelLoader[]> {
  const result = new Map<number, LevelLoader[]>();
  const entries = Object.entries(modules).toSorted((left, right) =>
    left[0].localeCompare(right[0]),
  );
  for (const [file, loader] of entries) {
    const match = pattern.exec(file);
    if (!match?.[1]) continue;
    const level = Number(match[1]);
    const loaders = result.get(level) ?? [];
    loaders.push(loader);
    result.set(level, loaders);
  }
  return result;
}

/** 每个 Level 单文件动态 import：Vite 为每个文件产出独立 chunk */
const LEVEL_LOADERS: Record<PokerVariant, Map<number, LevelLoader>> = {
  standard: indexLevelLoaders(
    import.meta.glob('./variants/standard/standardLevel*.ts') as Record<string, LevelLoader>,
    /standardLevel(\d)\.ts$/,
  ),
  'short-deck': indexLevelLoaders(
    import.meta.glob('./variants/short-deck/shortDeckLevel*.ts') as Record<string, LevelLoader>,
    /shortDeckLevel(\d)\.ts$/,
  ),
  'heads-up': indexLevelLoaders(
    import.meta.glob('./variants/heads-up/headsUpLevel*.ts') as Record<string, LevelLoader>,
    /headsUpLevel(\d)\.ts$/,
  ),
};

/** standard 增补章：每文件单章，按 `/chapters/t<level>-*.ts` 归组 */
const STANDARD_SUPPLEMENTAL_LOADERS: Map<number, LevelLoader[]> = indexSupplementalLoaders(
  import.meta.glob('./variants/standard/chapters/t*-*.ts') as Record<string, LevelLoader>,
  /chapters\/t(\d+)-[^/]+\.ts$/,
);

function applyChapterPractice(
  chapters: TheoryChapter[],
  map: Readonly<Record<string, PracticeRecommendation>>,
): TheoryChapter[] {
  return chapters.map((chapter) => {
    const recommendation = map[chapter.id];
    return recommendation ? { ...chapter, practiceRecommendations: recommendation } : chapter;
  });
}

/** standard 的 Level 文件导出章节数组，短牌/单挑导出完整 TheoryLevelInfo */
function chaptersFromModule(moduleValue: unknown): TheoryChapter[] | null {
  if (Array.isArray(moduleValue)) return moduleValue as TheoryChapter[];
  if (
    typeof moduleValue === 'object' &&
    moduleValue !== null &&
    Array.isArray((moduleValue as TheoryLevelInfo).chapters)
  ) {
    return (moduleValue as TheoryLevelInfo).chapters;
  }
  return null;
}

/** 取模块里的首个章节数组导出（核心 Level 文件与单章文件都只有一处章节导出） */
function chaptersOfModule(moduleExports: LevelModule): TheoryChapter[] | null {
  for (const value of Object.values(moduleExports)) {
    const chapters = chaptersFromModule(value);
    if (chapters) return chapters;
  }
  return null;
}

/** 合并 standard 的核心章与增补章，按 order 升序（核心章相对顺序不变） */
async function mergeStandardSupplemental(
  level: number,
  core: TheoryChapter[],
): Promise<TheoryChapter[]> {
  const loaders = STANDARD_SUPPLEMENTAL_LOADERS.get(level) ?? [];
  if (loaders.length === 0) return core;
  const modules = await Promise.all(loaders.map((load) => load()));
  const supplemental = modules.flatMap((moduleExports) => chaptersOfModule(moduleExports) ?? []);
  return [...core, ...supplemental].toSorted((a, b) => a.order - b.order);
}

async function loadTheoryLevelUncached(levelId: string): Promise<TheoryLevelInfo | undefined> {
  const summary = SUMMARY_BY_ID.get(levelId);
  if (!summary) return undefined;
  const loader = LEVEL_LOADERS[summary.variant].get(summary.level);
  if (!loader) return undefined;
  const coreChapters = chaptersOfModule(await loader());
  if (!coreChapters) return undefined;
  const isStandard = summary.variant === 'standard';
  const chapters = isStandard
    ? await mergeStandardSupplemental(summary.level, coreChapters)
    : coreChapters;
  const withPractice = applyChapterPractice(chapters, PRACTICE_BY_VARIANT[summary.variant]);
  return {
    ...summary,
    chapters: isStandard ? applyStandardChapterMeta(withPractice) : withPractice,
  };
}

const cache = new Map<PokerVariant, TheoryLevelInfo[]>();
const inflight = new Map<PokerVariant, Promise<TheoryLevelInfo[]>>();
const levelCache = new Map<string, TheoryLevelInfo>();
const levelInflight = new Map<string, Promise<TheoryLevelInfo | undefined>>();

/** 同步读取已加载的 Level；全变体缓存命中时回填到 Level 缓存 */
export function getLoadedTheoryLevel(levelId: string): TheoryLevelInfo | undefined {
  const cached = levelCache.get(levelId);
  if (cached) return cached;
  for (const levels of cache.values()) {
    const found = levels.find((level) => level.id === levelId);
    if (found) {
      levelCache.set(levelId, found);
      return found;
    }
  }
  return undefined;
}

/** 加载单个 Level（章节页唯一入口；缓存 + in-flight 去重） */
export function loadTheoryLevelById(levelId: string): Promise<TheoryLevelInfo | undefined> {
  const cached = getLoadedTheoryLevel(levelId);
  if (cached) return Promise.resolve(cached);
  const existing = levelInflight.get(levelId);
  if (existing) return existing;
  const task = loadTheoryLevelUncached(levelId)
    .then((level) => {
      if (level) levelCache.set(levelId, level);
      return level;
    })
    .finally(() => levelInflight.delete(levelId));
  levelInflight.set(levelId, task);
  return task;
}

export function loadTheoryLevelsForVariant(variant: PokerVariant): Promise<TheoryLevelInfo[]> {
  const cached = cache.get(variant);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(variant);
  if (existing) return existing;
  const task = Promise.all(
    SUMMARIES_BY_VARIANT[variant].map((summary) => loadTheoryLevelById(summary.id)),
  )
    .then((levels) => {
      if (levels.some((level) => level === undefined)) {
        throw new Error(`[theory] 变体 ${variant} 存在未映射的 Level`);
      }
      const resolved = levels as TheoryLevelInfo[];
      cache.set(variant, resolved);
      return resolved;
    })
    .finally(() => inflight.delete(variant));
  inflight.set(variant, task);
  return task;
}

/** 同步读取已加载的变体数据；任一缺失返回 null（渲染期判断，避免已缓存时闪骨架） */
export function getLoadedTheoryLevels(
  variants: readonly PokerVariant[],
): TheoryLevelInfo[] | null {
  const unique = [...new Set(variants)];
  const levels: TheoryLevelInfo[] = [];
  for (const variant of unique) {
    const data = cache.get(variant);
    if (!data) return null;
    levels.push(...data);
  }
  return levels;
}

export function loadTheoryLevelsForVariants(
  variants: readonly PokerVariant[],
): Promise<TheoryLevelInfo[]> {
  const unique = [...new Set(variants)];
  return Promise.all(unique.map(loadTheoryLevelsForVariant)).then((results) => results.flat());
}
