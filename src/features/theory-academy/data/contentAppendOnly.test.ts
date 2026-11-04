import { describe, expect, it } from 'vitest';
import { standardLevels } from './levels/variants/standard';
import { STANDARD_LEVEL_1_CHAPTERS } from './levels/variants/standard/standardLevel1';
import { STANDARD_LEVEL_2_CHAPTERS } from './levels/variants/standard/standardLevel2';
import { STANDARD_LEVEL_3_CHAPTERS } from './levels/variants/standard/standardLevel3';
import { STANDARD_LEVEL_4_CHAPTERS } from './levels/variants/standard/standardLevel4';
import { STANDARD_LEVEL_5_CHAPTERS } from './levels/variants/standard/standardLevel5';
import { STANDARD_LEVEL_6_CHAPTERS } from './levels/variants/standard/standardLevel6';
import { STANDARD_LEVEL_7_CHAPTERS } from './levels/variants/standard/standardLevel7';
import { STANDARD_LEVEL_8_CHAPTERS } from './levels/variants/standard/standardLevel8';
import { STANDARD_LEVEL_9_CHAPTERS } from './levels/variants/standard/standardLevel9';
import { sixMaxTableChapter } from './levels/variants/standard/chapters/t1-sixmax-table';
import { blindBattleChapter } from './levels/variants/standard/chapters/t3-blind-battle';
import { sixMaxRangesChapter } from './levels/variants/standard/chapters/t4-sixmax-ranges';
import { threeBetPotChapter } from './levels/variants/standard/chapters/t6-3bet-pot';
import { srpPostflopChapter } from './levels/variants/standard/chapters/t6-srp-postflop';
import { turnRiverChapter } from './levels/variants/standard/chapters/t6-turn-river';
import { sixMaxCapstoneChapter } from './levels/variants/standard/chapters/t9-sixmax-capstone';
import type { TheoryChapter, TheorySection } from '../types';

/**
 * 追加式内容守卫：富文本块只能接在既有正文末尾。
 *
 * 正文段落的 i18n key 是下标型（`theory.content.<chapterId>.<index>`），
 * 在中间插入或重排会让 zh/en 数组静默错位，而 JSON key 依然「存在」。
 * 本测试以「合并前原始章节」为基线逐段比对：前 N 段必须逐字相同，新增段只能追加。
 */
const RAW_CHAPTERS: TheoryChapter[] = [
  ...STANDARD_LEVEL_1_CHAPTERS,
  ...STANDARD_LEVEL_2_CHAPTERS,
  ...STANDARD_LEVEL_3_CHAPTERS,
  ...STANDARD_LEVEL_4_CHAPTERS,
  ...STANDARD_LEVEL_5_CHAPTERS,
  ...STANDARD_LEVEL_6_CHAPTERS,
  ...STANDARD_LEVEL_7_CHAPTERS,
  ...STANDARD_LEVEL_8_CHAPTERS,
  ...STANDARD_LEVEL_9_CHAPTERS,
  ...sixMaxTableChapter,
  ...blindBattleChapter,
  ...sixMaxRangesChapter,
  ...srpPostflopChapter,
  ...threeBetPotChapter,
  ...turnRiverChapter,
  ...sixMaxCapstoneChapter,
];
const RAW_BY_ID = new Map(RAW_CHAPTERS.map((chapter) => [chapter.id, chapter]));

const HAN_RE = /[一-鿿]/;
const RANKS = '23456789TJQKA';

/** 13×13 手牌 token 校验：口袋对子 `AA`，或高张在前的 `AKs` / `AKo` */
function isHandToken(hand: string): boolean {
  if (/^(.)\1$/.test(hand)) return RANKS.includes(hand[0]!);
  if (hand.length === 3 && (hand[2] === 's' || hand[2] === 'o')) {
    return RANKS.indexOf(hand[0]!) > RANKS.indexOf(hand[1]!);
  }
  return false;
}
const BLOCK_KINDS = new Set(['table', 'range-matrix', 'decision-tree']);
const RANGE_ACTIONS = new Set(['raise', 'bet', 'call', 'check', 'fold', 'all-in', 'mixed']);

function assertBlock(section: TheorySection): void {
  const data = section.data;
  expect(data, 'block 段必须带 data').toBeDefined();
  if (!data) return;
  expect(BLOCK_KINDS.has(data.kind)).toBe(true);
  if (data.captionKey !== undefined) expect(data.captionKey.startsWith('theory.')).toBe(true);

  switch (data.kind) {
    case 'table': {
      expect(data.headers.length).toBeGreaterThan(0);
      for (const row of data.rows) expect(row.length).toBe(data.headers.length);
      for (const cell of [...data.headers, ...data.rows.flat()]) {
        // 表格只存语言中立 token / 数字：出现汉字即说明文案漏进结构化数据。
        expect(HAN_RE.test(cell), `表格单元格含汉字：${cell}`).toBe(false);
      }
      break;
    }
    case 'range-matrix': {
      expect(data.cells.length).toBeGreaterThan(0);
      const hands = new Set<string>();
      for (const cell of data.cells) {
        expect(isHandToken(cell.hand), `非法手牌 token：${cell.hand}`).toBe(true);
        expect(hands.has(cell.hand), `重复手牌 ${cell.hand}`).toBe(false);
        hands.add(cell.hand);
        expect(cell.weight).toBeGreaterThanOrEqual(0);
        expect(cell.weight).toBeLessThanOrEqual(100);
        expect(RANGE_ACTIONS.has(cell.action)).toBe(true);
      }
      break;
    }
    case 'decision-tree': {
      const nodeIds = new Set(data.nodes.map((node) => node.id));
      expect(nodeIds.has(data.rootId)).toBe(true);
      expect(nodeIds.size).toBe(data.nodes.length);
      for (const edge of data.edges) {
        expect(nodeIds.has(edge.from)).toBe(true);
        expect(nodeIds.has(edge.to)).toBe(true);
        expect(edge.labelKey.trim().length).toBeGreaterThan(0);
      }
      for (const node of data.nodes) expect(node.labelKey.startsWith('theory.')).toBe(true);
      break;
    }
  }
}

describe('content append-only: 富文本块只追加、不插入', () => {
  it('每个合并章节的前 N 段与原始章节逐字一致（N = 原始段数）', () => {
    const bad: string[] = [];
    for (const level of standardLevels) {
      for (const chapter of level.chapters) {
        const raw = RAW_BY_ID.get(chapter.id);
        if (!raw) {
          bad.push(`${chapter.id}: 缺少原始章节基线`);
          continue;
        }
        if (chapter.content.length < raw.content.length) {
          bad.push(`${chapter.id}: 段数少于基线（内容被删除）`);
          continue;
        }
        for (let i = 0; i < raw.content.length; i += 1) {
          if (JSON.stringify(chapter.content[i]) !== JSON.stringify(raw.content[i])) {
            bad.push(`${chapter.id}[${i}]: 既有段落被改写或重排`);
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('原始章节的题库占位为 quiz: []，题库只在合并层注入', () => {
    expect(RAW_CHAPTERS.filter((chapter) => chapter.quiz.length > 0).map((c) => c.id)).toEqual([]);
  });

  it('新增段（含 data 的富文本块）全部通过结构与语言中立校验', () => {
    const blocks: { chapterId: string; index: number }[] = [];
    for (const level of standardLevels) {
      for (const chapter of level.chapters) {
        const rawLength = RAW_BY_ID.get(chapter.id)?.content.length ?? 0;
        chapter.content.slice(rawLength).forEach((section, offset) => {
          blocks.push({ chapterId: chapter.id, index: rawLength + offset });
          expect(section.content.trim().length, `${chapter.id} 追加段正文为空`).toBeGreaterThan(0);
          assertBlock(section);
        });
      }
    }
    // 块数量是内容规模守卫：至少 10 个，防止块表被整体删除后测试空转。
    expect(blocks.length).toBeGreaterThanOrEqual(10);
  });

  it('只有预期章节追加块，且每个块章节的追加段全部是 data 块', () => {
    const withBlocks = new Set(
      standardLevels.flatMap((level) =>
        level.chapters
          .filter((chapter) => chapter.content.some((section) => section.data !== undefined))
          .map((chapter) => chapter.id),
      ),
    );
    expect([...withBlocks].toSorted()).toEqual(
      [
        't2-pot-odds',
        't4-sixmax-ranges',
        't5-mdf-alpha',
        't6-3bet-pot',
        't6-geometric',
        't6-sizing-theory',
        't7-stats',
        't8-bankroll-psych',
        't9-icm',
        't9-sixmax-capstone',
      ].toSorted(),
    );
    for (const level of standardLevels) {
      for (const chapter of level.chapters) {
        const rawLength = RAW_BY_ID.get(chapter.id)?.content.length ?? 0;
        for (const section of chapter.content.slice(rawLength)) {
          expect(section.data, `${chapter.id} 追加段缺少 data 块`).toBeDefined();
        }
      }
    }
  });
});
