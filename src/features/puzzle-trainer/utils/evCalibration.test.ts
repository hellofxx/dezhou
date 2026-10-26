import { describe, expect, it } from 'vitest';
import { getAllPuzzles } from '../data/puzzleBank';
import { hasCalibratedEv, normalizeEvBasis } from './evCalibration';

/**
 * PRD §6.7.1「EV 标定诚实性」：
 * 只有 solver / verified 才允许呈现五级评级与 EV 数值；
 * estimate / none / 缺省一律按未标定处理。
 */
describe('puzzle EV 标定判定', () => {
  it('只有 solver / verified 视为已标定', () => {
    expect(hasCalibratedEv({ evBasis: 'solver' })).toBe(true);
    expect(hasCalibratedEv({ evBasis: 'verified' })).toBe(true);
    expect(hasCalibratedEv({ evBasis: 'estimate' })).toBe(false);
    expect(hasCalibratedEv({ evBasis: 'none' })).toBe(false);
    expect(hasCalibratedEv({})).toBe(false);
  });

  it('缺省 evBasis 归一为 none', () => {
    expect(normalizeEvBasis(undefined)).toBe('none');
    expect(normalizeEvBasis('solver')).toBe('solver');
  });

  it('题库出口为每道题补齐 evBasis（当前均未标定）', () => {
    const puzzles = getAllPuzzles();
    expect(puzzles.length).toBe(205);
    for (const q of puzzles) {
      expect(q.evBasis, `${q.id} 出口未补齐 evBasis`).toBeDefined();
      expect(hasCalibratedEv(q), `${q.id} 当前不应被视为已标定`).toBe(false);
    }
  });
});
