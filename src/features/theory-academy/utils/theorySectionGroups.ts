import type { TheorySection } from '../types';

/**
 * 章节正文按 heading 分组（渐进披露与节号 eyebrow 的单源）。
 *
 * 双字段契约：
 * - `rawIndex` 原样保留 content 数组索引 —— `theoryContentKey(chapterId, rawIndex)`
 *   绑定原始 index，分组不得改变 i18n key 空间；
 * - `headingOrdinal` 为 heading 序数（1 起连续），首个 heading 之前的散段归第 0 组
 *   （无 heading 可编号，披露初始可见）。
 */
export interface TheorySectionGroup {
  headingOrdinal: number;
  entries: { section: TheorySection; rawIndex: number }[];
}

export function groupTheorySections(content: TheorySection[]): TheorySectionGroup[] {
  const groups: TheorySectionGroup[] = [{ headingOrdinal: 0, entries: [] }];
  content.forEach((section, rawIndex) => {
    if (section.type === 'heading') {
      groups.push({ headingOrdinal: groups.length, entries: [{ section, rawIndex }] });
    } else {
      groups[groups.length - 1]!.entries.push({ section, rawIndex });
    }
  });
  // 首段即 heading 时第 0 组为空，丢弃以免渲染空披露单元
  return groups[0]!.entries.length === 0 ? groups.slice(1) : groups;
}