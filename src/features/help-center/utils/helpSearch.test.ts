import { describe, expect, it } from 'vitest';
import { filterHelpItems, normalizeHelpQuery } from './helpSearch';

const ITEMS = [
  { id: 'a', text: 'Freeze Card / 冻结卡' },
  { id: 'b', text: 'GTO Simulator / EV loss' },
  { id: 'c', text: 'Export JSON backup' },
] as const;

describe('helpSearch', () => {
  it('normalizes trim, width and case', () => {
    expect(normalizeHelpQuery('  ＧＴＯ  ')).toBe('gto');
  });

  it('returns all items for an empty query without mutating the source', () => {
    const source = Object.freeze([...ITEMS]);
    expect(filterHelpItems(source, '   ', (item) => item.text)).toEqual(ITEMS);
    expect(source).toEqual(ITEMS);
  });

  it('matches Chinese and English terms case-insensitively', () => {
    expect(filterHelpItems(ITEMS, 'gto', (item) => item.text).map((item) => item.id)).toEqual(['b']);
    expect(filterHelpItems(ITEMS, '冻结', (item) => item.text).map((item) => item.id)).toEqual(['a']);
  });

  it('requires every whitespace-separated term to match', () => {
    expect(filterHelpItems(ITEMS, 'gto loss', (item) => item.text).map((item) => item.id)).toEqual(['b']);
    expect(filterHelpItems(ITEMS, 'gto backup', (item) => item.text)).toEqual([]);
  });

  it('returns no items for an unknown keyword', () => {
    expect(filterHelpItems(ITEMS, 'leaderboard', (item) => item.text)).toEqual([]);
  });
});
