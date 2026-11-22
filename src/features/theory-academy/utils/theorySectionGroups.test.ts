/**
 * groupTheorySections 纯函数回归（Fix 4 分组披露 + Fix 5 节号单源）。
 * 锁定双字段契约：rawIndex 原样保留（theoryContentKey 绑定原始 index，分组不得改 key 空间）、
 * headingOrdinal 自 1 连续递增、首 heading 前散段归第 0 组、首段即 heading 时不留空组。
 */
import { describe, it, expect } from 'vitest';
import { groupTheorySections } from './theorySectionGroups';
import type { TheorySection } from '../types';

const heading = (content: string): TheorySection => ({ type: 'heading', content });
const text = (content: string): TheorySection => ({ type: 'text', content });

describe('groupTheorySections', () => {
  it('rawIndex 原样保留：分组后 entries 的 rawIndex 与 content 数组索引一一对应', () => {
    const content = [heading('一'), text('a'), text('b'), heading('二'), text('c')];
    const groups = groupTheorySections(content);
    const flat = groups.flatMap((group) => group.entries);
    expect(flat.map((entry) => entry.rawIndex)).toEqual([0, 1, 2, 3, 4]);
    flat.forEach((entry) => {
      expect(entry.section).toBe(content[entry.rawIndex]);
    });
  });

  it('headingOrdinal 自 1 连续递增，不随原始 index 跳号', () => {
    const content = [
      heading('一'),
      text('a'),
      text('b'),
      heading('二'),
      text('c'),
      heading('三'),
    ];
    const groups = groupTheorySections(content);
    expect(groups.map((group) => group.headingOrdinal)).toEqual([1, 2, 3]);
    expect(groups[0]!.entries).toHaveLength(3);
    expect(groups[1]!.entries).toHaveLength(2);
    expect(groups[2]!.entries).toHaveLength(1);
  });

  it('首 heading 前的散段归第 0 组（headingOrdinal=0），其后 heading 仍从 1 起', () => {
    const content = [text('引言'), text('铺垫'), heading('一'), text('a')];
    const groups = groupTheorySections(content);
    expect(groups.map((group) => group.headingOrdinal)).toEqual([0, 1]);
    expect(groups[0]!.entries.map((entry) => entry.rawIndex)).toEqual([0, 1]);
    expect(groups[1]!.entries.map((entry) => entry.rawIndex)).toEqual([2, 3]);
  });

  it('首段即 heading 时不保留空的第 0 组', () => {
    const groups = groupTheorySections([heading('一'), text('a')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.headingOrdinal).toBe(1);
  });

  it('无 heading 的纯散段内容整体归第 0 组（披露初始即可见）', () => {
    const groups = groupTheorySections([text('a'), text('b')]);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.headingOrdinal).toBe(0);
    expect(groups[0]!.entries).toHaveLength(2);
  });

  it('空内容返回空分组列表', () => {
    expect(groupTheorySections([])).toEqual([]);
  });
});