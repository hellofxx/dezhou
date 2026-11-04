/**
 * 策略参考书目数据结构与聚合守卫：
 * - 条目数量、id 唯一、必读书目齐备（Theory of Poker / MOP / Applications / Modern Poker Theory /
 *   Harrington / Mental Game）；
 * - levels 落在 1-8，且每个 Level（L1-L8）至少有一本书可读；
 * - noteKey 与条目 id 一一对应（academy.bibliography.<id>.note）；
 * - groupStrategyBibliographyByLevel 升序聚合、条目按 levels 落位、不丢不重。
 */
import { describe, expect, it } from 'vitest';
import {
  STRATEGY_BIBLIOGRAPHY,
  groupStrategyBibliographyByLevel,
  type StrategyBibliographyEntry,
} from './bibliography';

describe('bibliography：数据完整性', () => {
  it('条目数在 8-12 本之间且 id 唯一', () => {
    expect(STRATEGY_BIBLIOGRAPHY.length).toBeGreaterThanOrEqual(8);
    expect(STRATEGY_BIBLIOGRAPHY.length).toBeLessThanOrEqual(12);
    expect(new Set(STRATEGY_BIBLIOGRAPHY.map((entry) => entry.id)).size).toBe(
      STRATEGY_BIBLIOGRAPHY.length,
    );
  });

  it('书名 / 作者非空，levels 落在 1-8 且不自造空集合', () => {
    for (const entry of STRATEGY_BIBLIOGRAPHY) {
      expect(entry.title.trim(), `${entry.id} 缺书名`).not.toBe('');
      expect(entry.author.trim(), `${entry.id} 缺作者`).not.toBe('');
      expect(entry.levels.length, `${entry.id} 未关联 Level`).toBeGreaterThan(0);
      for (const level of entry.levels) {
        expect(Number.isInteger(level) && level >= 1 && level <= 8, `${entry.id}`).toBe(true);
      }
    }
  });

  it('noteKey 与条目 id 对应，且不重复', () => {
    const keys = STRATEGY_BIBLIOGRAPHY.map((entry) => entry.noteKey);
    for (const entry of STRATEGY_BIBLIOGRAPHY) {
      expect(entry.noteKey).toBe(`academy.bibliography.${entry.id}.note`);
    }
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('必读权威书目齐备', () => {
    const ids = new Set(STRATEGY_BIBLIOGRAPHY.map((entry) => entry.id));
    for (const required of [
      'theory-of-poker',
      'mathematics-of-poker',
      'applications-of-nlhe',
      'modern-poker-theory',
      'harrington-on-holdem',
      'mental-game-of-poker',
    ]) {
      expect(ids.has(required), `缺少 ${required}`).toBe(true);
    }
  });
});

describe('groupStrategyBibliographyByLevel', () => {
  it('L1-L8 每个 Level 都有可读书目，分组升序', () => {
    const groups = groupStrategyBibliographyByLevel();
    expect(groups.map((group) => group.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('条目按 levels 落位，不丢不重', () => {
    const groups = groupStrategyBibliographyByLevel();
    const placements = new Map<string, number[]>();
    for (const group of groups) {
      for (const entry of group.entries) {
        placements.set(entry.id, [...(placements.get(entry.id) ?? []), group.level]);
      }
    }
    for (const entry of STRATEGY_BIBLIOGRAPHY) {
      expect(placements.get(entry.id)?.toSorted(), entry.id).toEqual(entry.levels.toSorted());
    }
    expect([...placements.keys()].length).toBe(STRATEGY_BIBLIOGRAPHY.length);
  });

  it('空输入返回空分组（页面空态可渲染）', () => {
    expect(groupStrategyBibliographyByLevel([])).toEqual([]);
  });

  it('自定义条目集合只聚合传入条目', () => {
    const sole: StrategyBibliographyEntry = {
      id: 'x',
      title: 'X',
      author: 'Y',
      levels: [3],
      noteKey: 'academy.bibliography.x.note',
    };
    expect(groupStrategyBibliographyByLevel([sole])).toEqual([{ level: 3, entries: [sole] }]);
  });
});
