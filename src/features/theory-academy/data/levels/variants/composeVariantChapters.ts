import type {
  PracticeRecommendation,
  TheoryChapter,
  TheoryQuizQuestion,
  TheorySection,
} from '../../../types';
import { applyTheoryContentBlocks } from './applyContentBlocks';
import { applyTheoryQuizBank } from './applyQuizBank';

/**
 * 变体章节组合（静态聚合与运行时 loader 共用的唯一顺序源）。
 *
 * 顺序不可调换：
 * 1. 核心章 + 额外章按 order 升序（同 order 保持「核心在前、文件路径序在后」的稳定次序）；
 * 2. 附加章节级实践推荐（章节数据文件本身不声明该字段）；
 * 3. 套用变体元数据（仅 standard 的增补标记 / 主题标签），必须作用在最终对象上；
 * 4. 追加富文本块（只动 content 尾部，保证下标型 i18n key 不错位）；
 * 5. 最后替换 quiz（level/chapter 文件以 `quiz: []` 占位）。
 *
 * standard 与 heads-up 走同一条链：分叉的后果是目录 37 章但章节页少题/少章，
 * `headsUpStaticRuntimeParity.test.ts` 对此做深比较兜底。
 */

export interface ComposeVariantChaptersOptions {
  /** Level 文件里的核心章（顺序即文件内声明顺序，仍需按 order 归一） */
  core: readonly TheoryChapter[];
  /** 独立成文件的额外章（standard 增补章 / heads-up 新章），可缺省 */
  extra?: readonly TheoryChapter[];
  /** 章节级实践推荐表（chapterPracticeMap），可缺省 */
  practice?: Readonly<Record<string, PracticeRecommendation>>;
  /** 富文本块表（章节 id → 追加到 content 尾部的块），可缺省 */
  blocks?: Readonly<Record<string, TheorySection[]>>;
  /** 独立题库（章节 id → 题目数组），可缺省 */
  quizBank?: Readonly<Record<string, TheoryQuizQuestion[]>>;
  /** 变体元数据打标（standard 传 applyStandardChapterMeta；heads-up 无） */
  applyMeta?: (chapters: TheoryChapter[]) => TheoryChapter[];
  /** 题库未知章节键是否抛错（heads-up 为 true） */
  strictQuizBank?: boolean;
}

function applyChapterPractice(
  chapters: readonly TheoryChapter[],
  map: Readonly<Record<string, PracticeRecommendation>>,
): TheoryChapter[] {
  return chapters.map((chapter) => {
    const recommendation = map[chapter.id];
    return recommendation ? { ...chapter, practiceRecommendations: recommendation } : chapter;
  });
}

/** 同一来源内部的 id 重复必然是复制粘贴缺陷，直接 fail loud */
function assertUniqueChapterIds(chapters: readonly TheoryChapter[], source: string): void {
  const seen = new Set<string>();
  for (const chapter of chapters) {
    if (seen.has(chapter.id)) {
      throw new Error(`[theory] 章节 id 重复：${chapter.id}（${source}）`);
    }
    seen.add(chapter.id);
  }
}

/**
 * 额外章与核心章撞名时以核心章为准（按 id 去重后丢弃额外章）：
 * 内容轨既可以把新章只放进 `chapters/`（由 glob 吸收），也可以在 Level 文件里
 * 显式 import 同一章文件，两种写法都合法，不能让聚合层因写法差异炸掉。
 * 但「核心章内部」或「额外章文件之间」撞名仍是真缺陷，照旧抛错。
 */
function dropCoreDuplicates(
  core: readonly TheoryChapter[],
  extra: readonly TheoryChapter[],
): TheoryChapter[] {
  const coreIds = new Set(core.map((chapter) => chapter.id));
  return extra.filter((chapter) => !coreIds.has(chapter.id));
}

export function composeVariantChapters(options: ComposeVariantChaptersOptions): TheoryChapter[] {
  const {
    core,
    extra = [],
    practice,
    blocks = {},
    quizBank = {},
    applyMeta,
    strictQuizBank = false,
  } = options;

  assertUniqueChapterIds(core, '核心章');
  assertUniqueChapterIds(extra, '额外章文件');
  const merged = [...core, ...dropCoreDuplicates(core, extra)].toSorted(
    (left, right) => left.order - right.order,
  );

  const withPractice = practice ? applyChapterPractice(merged, practice) : merged;
  const withMeta = applyMeta ? applyMeta(withPractice) : withPractice;
  const withBlocks = applyTheoryContentBlocks(withMeta, blocks);
  return applyTheoryQuizBank(withBlocks, quizBank, { strict: strictQuizBank });
}

// ===== eager glob 收集器（静态聚合路径专用） =====

/**
 * `import.meta.glob(pattern, { eager: true })` 的返回值：
 * 文件路径 → 该模块的导出命名空间（Vite 侧类型为 unknown，调用方负责断言）。
 */
export type GlobModules = Readonly<Record<string, Record<string, unknown>>>;

function moduleEntries(modules: GlobModules): [string, Record<string, unknown>][] {
  // 先按路径排序再收集：同 order 的额外章次序不依赖 glob 枚举顺序（可复现）
  return Object.entries(modules).toSorted(([left], [right]) => left.localeCompare(right));
}

/** 取模块里的章节数组：约定导出 `HEADS_UP_CHAPTERS`，退化时取首个数组导出 */
function chapterArrayOf(moduleExports: Record<string, unknown>): TheoryChapter[] {
  const named = moduleExports.HEADS_UP_CHAPTERS;
  if (Array.isArray(named)) return named as TheoryChapter[];
  for (const value of Object.values(moduleExports)) {
    if (Array.isArray(value)) return value as TheoryChapter[];
  }
  return [];
}

/** 收集 `chapters/t*hu-*.ts` 等单章文件的章节（每文件单数组导出） */
export function collectChapterModules(modules: GlobModules): TheoryChapter[] {
  return moduleEntries(modules).flatMap(([, moduleExports]) => chapterArrayOf(moduleExports));
}

/** 合并多份 `QUIZ_BANK` / `CONTENT_BLOCKS`（章节 id → 值）；同键重复登记直接抛错 */
function mergeChapterEntries<T>(modules: GlobModules, exportName: string): Record<string, T> {
  const result: Record<string, T> = {};
  for (const [path, moduleExports] of moduleEntries(modules)) {
    const table = moduleExports[exportName];
    if (typeof table !== 'object' || table === null) continue;
    for (const [chapterId, value] of Object.entries(table as Record<string, T>)) {
      if (Object.prototype.hasOwnProperty.call(result, chapterId)) {
        throw new Error(`[theory] ${exportName} 章节重复登记：${chapterId}（${path}）`);
      }
      result[chapterId] = value;
    }
  }
  return result;
}

export function collectQuizBanks(modules: GlobModules): Record<string, TheoryQuizQuestion[]> {
  return mergeChapterEntries<TheoryQuizQuestion[]>(modules, 'QUIZ_BANK');
}

export function collectContentBlocks(modules: GlobModules): Record<string, TheorySection[]> {
  return mergeChapterEntries<TheorySection[]>(modules, 'CONTENT_BLOCKS');
}

/** 按章节 id 前缀取子表（静态聚合一次收全 9 级，组合时只喂当前 Level，strict 才有意义） */
export function pickChapterEntries<T>(
  table: Readonly<Record<string, T>>,
  prefix: string,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(table).filter(([chapterId]) => chapterId.startsWith(prefix)),
  );
}
