import type { PokerVariant } from '@/shared/types/elo';
import type {
  PracticeRecommendation,
  TheoryChapter,
  TheoryLevelInfo,
  TheoryLevelSummary,
  TheoryQuizQuestion,
  TheorySection,
} from '../../types';
import {
  HEADS_UP_LEVEL_SUMMARIES,
  SHORT_DECK_LEVEL_SUMMARIES,
  STANDARD_LEVEL_SUMMARIES,
} from './manifest';
import { composeVariantChapters } from './variants/composeVariantChapters';
import { applyStandardChapterMeta } from './variants/standard/chapterMeta';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as HEADS_UP_PRACTICE } from './variants/heads-up/chapterPracticeMap';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as SHORT_DECK_PRACTICE } from './variants/short-deck/chapterPracticeMap';
import { CHAPTER_PRACTICE_RECOMMENDATIONS as STANDARD_PRACTICE } from './variants/standard/chapterPracticeMap';

/**
 * 理论完整数据按 Level 懒加载：首页与 store 只读 manifest，章节页只加载当前 Level
 * 的单文件 chunk；疑难清单经 loadTheoryLevelsForVariant 逐 Level 组合。
 * 缓存语义：成功才入缓存、失败可重试、并发共享 in-flight。
 *
 * 四组 glob 按变体查表，最终都交给同一个 `composeVariantChapters`（顺序与静态聚合一致）：
 * - Level 文件：standardLevelN / shortDeckLevelN / headsUpLevelN；
 * - 额外章节：standard 增补章 `chapters/t<N>-*.ts`、heads-up 新章 `chapters/t<N>hu-*.ts`（short-deck 空表）；
 * - 题库 / 富文本块：`quizBank/t<N>.ts` 与 `blocks/t<N>.ts`（heads-up 为 `t<N>hu.ts`）。
 * `applyStandardChapterMeta` 仍只对 standard 生效（增补标记与主题标签是 6-max 现金主线专属）。
 */

type LevelModule = Record<string, unknown>;
type LevelLoader = () => Promise<LevelModule>;
/** Level 编号 → 单文件 loader */
type LoaderIndex = Map<number, LevelLoader>;
/** Level 编号 → 该 Level 的多个单章 loader（按路径排序） */
type GroupedLoaderIndex = Map<number, LevelLoader[]>;

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

function indexLevelLoaders(modules: Record<string, LevelLoader>, pattern: RegExp): LoaderIndex {
  const result: LoaderIndex = new Map();
  for (const [file, loader] of Object.entries(modules)) {
    const match = pattern.exec(file);
    if (match?.[1]) result.set(Number(match[1]), loader);
  }
  return result;
}

/** 单章文件按路径排序后归组：同 Level 多章的加载顺序不依赖 glob 枚举顺序 */
function indexGroupedLoaders(
  modules: Record<string, LevelLoader>,
  pattern: RegExp,
): GroupedLoaderIndex {
  const result: GroupedLoaderIndex = new Map();
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

/** 核心 Level 文件：每 Level 单文件、独立 chunk */
const LEVEL_LOADERS: Record<PokerVariant, LoaderIndex> = {
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

/** 额外章节（每文件单章）：standard 增补章 / heads-up 新章；short-deck 无 */
const EXTRA_CHAPTER_LOADERS: Record<PokerVariant, GroupedLoaderIndex> = {
  standard: indexGroupedLoaders(
    import.meta.glob('./variants/standard/chapters/t*-*.ts') as Record<string, LevelLoader>,
    /chapters\/t(\d+)-[^/]+\.ts$/,
  ),
  'short-deck': new Map(),
  'heads-up': indexGroupedLoaders(
    import.meta.glob('./variants/heads-up/chapters/t*hu-*.ts') as Record<string, LevelLoader>,
    /chapters\/t(\d+)hu-[^/]+\.ts$/,
  ),
};

/** 独立题库：每 Level 单文件（standard `t<N>.ts` / heads-up `t<N>hu.ts`） */
const QUIZ_BANK_LOADERS: Record<PokerVariant, LoaderIndex> = {
  standard: indexLevelLoaders(
    import.meta.glob('./variants/standard/quizBank/t*.ts') as Record<string, LevelLoader>,
    /quizBank\/t(\d)\.ts$/,
  ),
  'short-deck': new Map(),
  'heads-up': indexLevelLoaders(
    import.meta.glob('./variants/heads-up/quizBank/t*hu.ts') as Record<string, LevelLoader>,
    /quizBank\/t(\d)hu\.ts$/,
  ),
};

/** 富文本块：每 Level 单文件（口径同题库） */
const CONTENT_BLOCK_LOADERS: Record<PokerVariant, LoaderIndex> = {
  standard: indexLevelLoaders(
    import.meta.glob('./variants/standard/blocks/t*.ts') as Record<string, LevelLoader>,
    /blocks\/t(\d)\.ts$/,
  ),
  'short-deck': new Map(),
  'heads-up': indexLevelLoaders(
    import.meta.glob('./variants/heads-up/blocks/t*hu.ts') as Record<string, LevelLoader>,
    /blocks\/t(\d)hu\.ts$/,
  ),
};

/** 取模块里的表格导出（`QUIZ_BANK` / `CONTENT_BLOCKS`；缺失或类型异常返回空表） */
function tableOfModule<T>(
  moduleExports: LevelModule | undefined,
  exportName: string,
): Record<string, T> {
  const table = moduleExports?.[exportName];
  return typeof table === 'object' && table !== null ? (table as Record<string, T>) : {};
}

/** standard 导出章节数组，短牌/单挑导出完整 TheoryLevelInfo */
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
function chaptersOfModule(moduleExports: LevelModule | undefined): TheoryChapter[] | null {
  if (!moduleExports) return null;
  for (const value of Object.values(moduleExports)) {
    const chapters = chaptersFromModule(value);
    if (chapters) return chapters;
  }
  return null;
}

async function loadTheoryLevelUncached(levelId: string): Promise<TheoryLevelInfo | undefined> {
  const summary = SUMMARY_BY_ID.get(levelId);
  if (!summary) return undefined;
  const variant = summary.variant;
  const loader = LEVEL_LOADERS[variant].get(summary.level);
  if (!loader) return undefined;
  const quizLoader = QUIZ_BANK_LOADERS[variant].get(summary.level);
  const blockLoader = CONTENT_BLOCK_LOADERS[variant].get(summary.level);
  const extraLoaders = EXTRA_CHAPTER_LOADERS[variant].get(summary.level) ?? [];
  const modules = await Promise.all([
    loader(),
    quizLoader ? quizLoader() : Promise.resolve(undefined),
    blockLoader ? blockLoader() : Promise.resolve(undefined),
    ...extraLoaders.map((load) => load()),
  ]);
  const [coreModule, quizModule, blockModule] = modules;
  const coreChapters = chaptersOfModule(coreModule);
  if (!coreChapters) return undefined;
  const chapters = composeVariantChapters({
    core: coreChapters,
    extra: modules.slice(3).flatMap((moduleExports) => chaptersOfModule(moduleExports) ?? []),
    practice: PRACTICE_BY_VARIANT[variant],
    blocks: tableOfModule<TheorySection[]>(blockModule, 'CONTENT_BLOCKS'),
    quizBank: tableOfModule<TheoryQuizQuestion[]>(quizModule, 'QUIZ_BANK'),
    applyMeta: variant === 'standard' ? applyStandardChapterMeta : undefined,
    strictQuizBank: variant === 'heads-up',
  });
  return { ...summary, chapters };
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
