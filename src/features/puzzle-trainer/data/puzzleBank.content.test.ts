import { describe, expect, it } from 'vitest';
import { getAllPuzzles, PUZZLE_THEMES } from './puzzleBank';
import type { PuzzleQuestion, PuzzleTheme } from '../types';

/**
 * 题库内容结构守卫。
 *
 * 与 puzzleBank.ids.test.ts / puzzleBank.optionOrder.test.ts 互补：
 * - ids.test.ts 锁 id 唯一与 205 题规模；
 * - optionOrder.test.ts 锁选项语义排序与正确答案位置；
 * - 本文件锁「内容本身可解析、可复算」的结构前提：
 *   牌面合法性 / 街道与主题匹配 / 同花听牌真实性 / 解析非空，
 *   以及 2026-10 内容审计已确认错误的回归锁。
 *
 * 注意：具体的策略正确性（范围、EV、ICM）仍须非作者学科复核，
 * 不由本文件替代。
 */

const RANK_CHARS = '23456789TJQKA';
const SUIT_CHARS = ['♠', '♥', '♦', '♣'] as const;
const SHORTHAND_HAND_RE = /^[2-9TJQKA]{2}[so]?$/;
const PREFLOP_THEMES: readonly PuzzleTheme[] = [
  'preflop-rfi',
  'big-blind-defense',
  'three-bet',
  'icm',
];

interface Card {
  rank: string;
  suit: string;
}

/** 解析显式牌面（如 'A♠ 5♠' / '10♣'），忽略分隔符。 */
function parseExplicitCards(text: string | undefined): Card[] {
  if (!text) return [];
  const cards: Card[] = [];
  const re = /(10|[2-9TJQKA])\s*([♠♥♦♣])/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    const rawRank = match[1] ?? '';
    cards.push({
      rank: rawRank === '10' ? 'T' : rawRank,
      suit: match[2] ?? '',
    });
  }
  return cards;
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function textOf(q: PuzzleQuestion): string {
  return [
    q.scenario,
    q.correctExplanation,
    ...q.options.flatMap((o) => [o.text, o.explanation]),
  ].join('\n');
}

const puzzles = getAllPuzzles();
const byId = new Map(puzzles.map((q) => [q.id, q]));

function getPuzzle(id: string): PuzzleQuestion {
  const q = byId.get(id);
  if (!q) throw new Error(`题库缺少题目 ${id}`);
  return q;
}

describe('puzzleBank 内容结构守卫', () => {
  it('10 个主题均有题目，且主题元数据覆盖题库实际用到的主题', () => {
    expect(PUZZLE_THEMES).toHaveLength(10);
    expect(new Set(puzzles.map((q) => q.theme)).size).toBe(PUZZLE_THEMES.length);
  });

  it('手牌格式合法：两字符简写（AKo/76s/89）或两张显式牌', () => {
    for (const q of puzzles) {
      expect(q.hand, `${q.id} 缺少手牌`).toBeTruthy();
      const hand = (q.hand ?? '').trim();
      if (/[♠♥♦♣]/.test(hand)) {
        expect(parseExplicitCards(hand), `${q.id} 显式手牌应恰为 2 张：${hand}`).toHaveLength(2);
      } else {
        expect(SHORTHAND_HAND_RE.test(hand), `${q.id} 手牌格式非法：${hand}`).toBe(true);
      }
    }
  });

  it('显式牌面合法：无重复牌、手牌与公共牌不冲突、牌面为 3 或 5 张', () => {
    for (const q of puzzles) {
      const hand = parseExplicitCards(q.hand);
      const board = parseExplicitCards(q.board);
      const explicit = [...hand, ...board];
      for (const card of explicit) {
        expect(RANK_CHARS, `${q.id} 点数非法：${card.rank}`).toContain(card.rank);
        expect(SUIT_CHARS as readonly string[], `${q.id} 花色非法：${card.suit}`).toContain(
          card.suit
        );
      }
      const keys = explicit.map(cardKey);
      expect(new Set(keys).size, `${q.id} 手牌/公共牌存在重复牌：${keys.join(' ')}`).toBe(
        keys.length
      );
      if (q.board) {
        expect([3, 5], `${q.id} 公共牌应为翻牌 3 张或河牌 5 张`).toContain(board.length);
      }
    }
  });

  it('主题与街道匹配：翻前主题无公共牌，c-bet 为翻牌，river-value/bluff 为河牌', () => {
    for (const q of puzzles) {
      const board = parseExplicitCards(q.board);
      if (PREFLOP_THEMES.includes(q.theme)) {
        expect(q.board, `${q.id} 翻前主题不应有公共牌`).toBeUndefined();
      }
      if (q.theme === 'c-bet') {
        expect(board.length, `${q.id} c-bet 应为 3 张翻牌`).toBe(3);
      }
      if (q.theme === 'river-value' || q.theme === 'bluff') {
        expect(board.length, `${q.id} ${q.theme} 应为 5 张河牌`).toBe(5);
      }
    }
  });

  it('flush-draw 题目必须真是同花听牌：4 张同花、手牌占 2 张、未成同花', () => {
    for (const q of puzzles.filter((item) => item.theme === 'flush-draw')) {
      const hand = parseExplicitCards(q.hand);
      const board = parseExplicitCards(q.board);
      expect(hand, `${q.id} 同花听牌题应使用显式手牌`).toHaveLength(2);
      expect(board, `${q.id} 同花听牌题应为 3 张翻牌`).toHaveLength(3);
      const flushSuit = SUIT_CHARS.find(
        (suit) => [...hand, ...board].filter((card) => card.suit === suit).length >= 4
      );
      expect(flushSuit, `${q.id} 未形成同花听牌：${q.hand} / ${q.board}`).toBeTruthy();
      if (!flushSuit) continue;
      const handCount = hand.filter((card) => card.suit === flushSuit).length;
      const totalCount = [...hand, ...board].filter((card) => card.suit === flushSuit).length;
      expect(handCount, `${q.id} 手牌应恰有 2 张听牌花色`).toBe(2);
      expect(totalCount, `${q.id} 应为 4 张同花听牌而非已成同花`).toBe(4);
    }
  });

  it('题干/正确解析/每个选项解析均非空', () => {
    for (const q of puzzles) {
      expect(q.scenario.trim().length, `${q.id} 题干为空`).toBeGreaterThan(10);
      expect(q.correctExplanation.trim().length, `${q.id} 正确解析为空`).toBeGreaterThan(20);
      for (const option of q.options) {
        expect(option.text.trim().length, `${q.id} 选项文本为空`).toBeGreaterThan(0);
        expect(option.explanation.trim().length, `${q.id}/${option.text} 选项解析为空`).toBeGreaterThan(0);
      }
    }
  });
});

describe('2026-10 内容审计回归锁', () => {
  const mustNotContain = (id: string, pattern: RegExp) => {
    expect(textOf(getPuzzle(id)), `${id} 不应再出现 ${pattern}`).not.toMatch(pattern);
  };

  it('牌面/顺子读牌错误不得回归', () => {
    mustNotContain('cbet-004', /J-7 顺子/);
    mustNotContain('rv-002', /K-T 顺子/);
    mustNotContain('rv-006', /K-Q 顺子/);
    mustNotContain('rv-009', /K-Q 顺子/);
    mustNotContain('rv-012', /K-9 顺子/);
    mustNotContain('rv-018', /K-Q 顺子/);
    mustNotContain('rv-019', /3-6-7-8-9/);
    expect(getPuzzle('rv-013').hand).toBe('AJ');
    expect(getPuzzle('rv-013').board).toBe('A♠ Q♦ 9♣ 7♥ 5♦');
    expect(getPuzzle('rv-013').correctExplanation).not.toMatch(/K 顺子/);
    expect(getPuzzle('rv-009').board).toBe('T♠ 8♦ 3♣ 2♥ J♦');
    mustNotContain('rv-009', /J 转牌/);
  });

  it('成手牌描述错误不得回归', () => {
    mustNotContain('cbet-007', /顶对/);
    mustNotContain('cbet-012', /顶对/);
    expect(getPuzzle('cbet-012').correctExplanation).toContain('超对');
    expect(getPuzzle('rv-007').hand).toBe('A8o');
    expect(getPuzzle('rv-007').correctExplanation).not.toMatch(/A9o/);
    mustNotContain('rv-008', /K 转牌/);
    expect(getPuzzle('rv-008').correctExplanation).toContain('K 河牌');
  });

  it('outs / 组合数 / 主题错位不得回归', () => {
    mustNotContain('flsh-002', /×2 = 60%/);
    mustNotContain('flsh-005', /= 13 outs/);
    expect(getPuzzle('flsh-005').options.some((o) => o.explanation.includes('15 outs'))).toBe(true);
    mustNotContain('flsh-006', /× 2|×2/);
    mustNotContain('3bet-011', /12 组合/);
    expect(getPuzzle('bbd-008').theme).toBe('three-bet');
  });

  it('选项尺度与解析一致（cbet-009 修正为 3/4 池）', () => {
    const q = getPuzzle('cbet-009');
    expect(q.options.find((o) => o.isCorrect)?.text).toBe('C-bet 4BB');
    mustNotContain('cbet-009', /JTOff/);
  });
});
