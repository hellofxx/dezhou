import type { TheoryChapter, TheoryPathTag } from '../../../../types';

/**
 * 标准变体的章节级元数据（增补标记 + 主题标签）单源。
 *
 * 为什么不写在章节数据文件里：`standardLevelN.ts` 已顶到单文件行数上限，
 * 而增补章独立成文件（`chapters/t<level>-*.ts`）只承载正文；两类文件共用同一份
 * 「哪些章是增补、属于哪些主题」的判定，集中一处才不会有第二套口径。
 *
 * 目录层（manifest）与完整数据层（loader）都必须套用 `applyStandardChapterMeta`，
 * 否则首页看到的 `supplemental` / `pathTags` 与章节页拿到的对不上。
 *
 * 本文件刻意放在 `chapters/` 目录之外：loader 用 `import.meta.glob('./variants/standard/chapters/t*-*.ts')`
 * 按章节收集文件，元数据文件若落进该目录会被当成一章加载。
 */

/** 增补章 id 集合：不参与 Level 解锁与核心进度，但完成仍记入既有持久化字段 */
export const SUPPLEMENTAL_CHAPTER_IDS: ReadonlySet<string> = new Set<string>([
  't1-sixmax-table',
  't3-blind-battle',
  't4-sixmax-ranges',
  't6-srp-postflop',
  't6-3bet-pot',
  't6-turn-river',
  't9-sixmax-capstone',
]);

/**
 * 章节主题标签表（7 个增补章 + 10 个存量核心章）。
 * 未登记的章节没有主题归属——空标签不等于"属于所有路径"，学习路径只按本表筛选。
 */
export const PATH_TAGS: Readonly<Record<string, readonly TheoryPathTag[]>> = {
  // ===== 6-max 现金主线（增补章） =====
  't1-sixmax-table': ['six-max', 'foundation'],
  't3-blind-battle': ['six-max', 'preflop'],
  't4-sixmax-ranges': ['six-max', 'preflop', 'cash'],
  't6-srp-postflop': ['six-max', 'postflop', 'cash'],
  't6-3bet-pot': ['six-max', 'postflop', 'cash'],
  't6-turn-river': ['six-max', 'postflop', 'cash'],
  't9-sixmax-capstone': ['six-max', 'cash'],

  // ===== 存量核心章的主题归属 =====
  't9-icm': ['mtt'],
  't9-multiway': ['mtt'],
  't9-cash-vs-mtt': ['mtt', 'cash'],
  't5-multiway-frequency': ['mtt'],
  't4-structure-economics': ['cash', 'mtt'],
  't4-range-advantage': ['postflop'],
  't5-mdf-alpha': ['postflop'],
  't6-bet-purpose': ['postflop'],
  't6-sizing-theory': ['postflop'],
  't6-geometric': ['postflop'],
};

/**
 * 给标准变体章节打上增补标记与主题标签。
 * 幂等：未命中任何表的章节直接返回原对象引用；命中时字段值恒定，
 * 重复调用不产生差异（可安全地在 loader 与 index 两处都套一层）。
 */
export function applyStandardChapterMeta(chapters: TheoryChapter[]): TheoryChapter[] {
  return chapters.map((chapter) => {
    const supplemental = SUPPLEMENTAL_CHAPTER_IDS.has(chapter.id);
    const tags = PATH_TAGS[chapter.id];
    if (!supplemental && !tags) return chapter;
    return {
      ...chapter,
      ...(supplemental ? { supplemental: true } : {}),
      ...(tags ? { pathTags: [...tags] } : {}),
    };
  });
}
