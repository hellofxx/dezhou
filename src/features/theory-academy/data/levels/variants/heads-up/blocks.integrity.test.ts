import { describe, expect, it } from 'vitest';
import type { TheoryRichBlockData } from '../../../../types';
import { headsUpLevels } from './index';

const BLOCK_KINDS = new Set<TheoryRichBlockData['kind']>(['table', 'range-matrix', 'decision-tree']);
const BLOCK_LEVELS = new Set([2, 4, 5, 6, 7, 8, 9]);

function assertTable(data: Extract<TheoryRichBlockData, { kind: 'table' }>): string[] {
  const bad: string[] = [];
  if (data.headers.length === 0) bad.push('表头为空');
  if (data.rows.length === 0) bad.push('表格无数据行');
  for (const row of data.rows) {
    if (row.length !== data.headers.length) bad.push(`行列数 ${row.length} ≠ 表头 ${data.headers.length}`);
  }
  return bad;
}

function assertDecisionTree(data: Extract<TheoryRichBlockData, { kind: 'decision-tree' }>): string[] {
  const bad: string[] = [];
  const ids = new Set(data.nodes.map((node) => node.id));
  if (!ids.has(data.rootId)) bad.push('rootId 不在节点集合内');
  if (data.edges.length === 0) bad.push('决策树无分支');
  for (const edge of data.edges) {
    if (!ids.has(edge.from)) bad.push(`边起点 ${edge.from} 不存在`);
    if (!ids.has(edge.to)) bad.push(`边终点 ${edge.to} 不存在`);
  }
  return bad;
}

function assertRangeMatrix(data: Extract<TheoryRichBlockData, { kind: 'range-matrix' }>): string[] {
  const bad: string[] = [];
  if (data.cells.length === 0) bad.push('范围矩阵无单元格');
  for (const cell of data.cells) {
    if (cell.weight < 0 || cell.weight > 100) bad.push(`${cell.hand}: 权重越界`);
  }
  return bad;
}

describe('heads-up blocks integrity', () => {
  it('T2 / T4–T9 每章至少一个富文本块，T1/T3 不建块', () => {
    const bad: string[] = [];
    for (const level of headsUpLevels) {
      for (const chapter of level.chapters) {
        const blocks = chapter.content.filter((section) => section.data !== undefined);
        if (BLOCK_LEVELS.has(level.level)) {
          if (blocks.length === 0) bad.push(`${chapter.id}: 缺少富文本块`);
          if (chapter.content.at(-1)?.data === undefined) bad.push(`${chapter.id}: 块未追加在 content 尾部`);
        } else if (blocks.length > 0) {
          bad.push(`${chapter.id}: T${level.level} 不应有富文本块`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('块类型合法且结构完整', () => {
    const bad: string[] = [];
    for (const level of headsUpLevels) {
      for (const chapter of level.chapters) {
        for (const section of chapter.content) {
          const data = section.data;
          if (!data) continue;
          if (!BLOCK_KINDS.has(data.kind)) bad.push(`${chapter.id}: 未知块类型 ${data.kind}`);
          if (data.kind === 'table') bad.push(...assertTable(data).map((msg) => `${chapter.id}: ${msg}`));
          if (data.kind === 'decision-tree') bad.push(...assertDecisionTree(data).map((msg) => `${chapter.id}: ${msg}`));
          if (data.kind === 'range-matrix') bad.push(...assertRangeMatrix(data).map((msg) => `${chapter.id}: ${msg}`));
        }
      }
    }
    expect(bad).toEqual([]);
  });
});
