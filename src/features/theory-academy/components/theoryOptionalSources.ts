import type {
  TheoryBibliographyEntry,
  TheoryContentOps,
  TheoryGlossaryTerm,
} from '../types';

/**
 * 理论学院「内容运营数据」容错读取层。
 *
 * 归属说明：`data/glossary.ts` / `data/bibliography.ts` / `data/contentOps.ts` 由内容侧维护，
 * 本层只读取、不写入，也不假设导出名（不同批次可能导出 `THEORY_GLOSSARY` 或 `GLOSSARY_TERMS`）。
 * 因此用 Vite 原生 `import.meta.glob({ eager: true })` 取模块命名空间后按**结构**挑选：
 * 文件尚未落地时 glob 命中为空集合，三个 getter 分别返回安全空值，UI 自然走空态分支；
 * 数据文件落地后无需改动本层或任何组件即可生效（glob 在构建期重新解析）。
 *
 * 只暴露同步 getter：三份数据都是静态常量，体积小、无 IO，接入首屏不构成额外请求。
 */

type ModuleNamespace = Record<string, unknown>;

const glossaryModules = import.meta.glob<ModuleNamespace>('../data/glossary.ts', {
  eager: true,
});
const bibliographyModules = import.meta.glob<ModuleNamespace>('../data/bibliography.ts', {
  eager: true,
});
const contentOpsModules = import.meta.glob<ModuleNamespace>('../data/contentOps.ts', {
  eager: true,
});

function valuesOf(modules: Record<string, ModuleNamespace>): unknown[] {
  return Object.values(modules).flatMap((namespace) => Object.values(namespace));
}

/** 结构判定：数组且（空数组或首项满足类型守卫） */
function pickArray<T>(candidates: unknown[], guard: (value: unknown) => value is T): T[] {
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    if (candidate.length === 0) return [];
    if (candidate.every(guard)) return candidate;
  }
  return [];
}

function isGlossaryTerm(value: unknown): value is TheoryGlossaryTerm {
  if (typeof value !== 'object' || value === null) return false;
  const term = value as Partial<Record<keyof TheoryGlossaryTerm, unknown>>;
  return typeof term.id === 'string'
    && typeof term.termKey === 'string'
    && typeof term.definitionKey === 'string';
}

function isBibliographyEntry(value: unknown): value is TheoryBibliographyEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<Record<keyof TheoryBibliographyEntry, unknown>>;
  return typeof entry.id === 'string' && typeof entry.titleKey === 'string';
}

function isContentOps(value: unknown): value is TheoryContentOps {
  if (typeof value !== 'object' || value === null) return false;
  const ops = value as { lastReviewed?: unknown };
  return typeof ops.lastReviewed === 'object' && ops.lastReviewed !== null;
}

/** 术语表条目（文件缺失 / 结构不符时为空数组） */
export function getTheoryGlossaryTerms(): TheoryGlossaryTerm[] {
  return pickArray(valuesOf(glossaryModules), isGlossaryTerm);
}

/** 参考书目条目（文件缺失 / 结构不符时为空数组） */
export function getTheoryBibliographyEntries(): TheoryBibliographyEntry[] {
  return pickArray(valuesOf(bibliographyModules), isBibliographyEntry);
}

/** 内容运营元数据（文件缺失时为空对象，即「无校对日期」） */
export function getTheoryContentOps(): TheoryContentOps {
  const found = valuesOf(contentOpsModules).find(isContentOps);
  return found ?? { lastReviewed: {} };
}

/** 单章最近校对日期（ISO 8601）；无记录时 undefined（渲染端不展示该标签） */
export function getChapterLastReviewed(chapterId: string): string | undefined {
  return getTheoryContentOps().lastReviewed[chapterId];
}
