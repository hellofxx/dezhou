import { describe, expect, it } from 'vitest';

/**
 * P1D-11 定性守卫（2026-07-31 跨模块专批 C）。
 *
 * 核查结论（路径 A，保守方案，零迁移）：
 * - puzzle-trainer **不注册 SRS ReviewItem**（全模块无 addReviewItem / processReview
 *   调用），题库短 id（如 `rfi-001`）从不进入 progress SRS 键空间，与
 *   `range:` / `odds:` / `gto:` 前缀键无碰撞可能。
 * - 因此题库短 id 定性为**模块内部标识**，不改数据、不做存量迁移；
 *   `puzzle:{theme}:{questionId}` 规范仅约束「未来接入 SRS 时注册处的 key 拼接」
 *   （届时在注册代码拼前缀，题库静态数据仍保持短 id）。
 * - 本测试锁定短 id 作为模块内标识的前提：全库唯一（含跨主题）。
 */
import { getAllPuzzles, PUZZLE_THEMES } from './puzzleBank';

describe('puzzle 题库 id 守卫（P1D-11 定性：短 id 为模块内标识）', () => {
  it('全库题目 id 唯一（跨 10 主题无重复）', () => {
    const ids = getAllPuzzles().map((q) => q.id);
    const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dup, `重复 id: ${dup.join(',')}`).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('题库规模与主题元数据一致（205 题 / 10 主题）', () => {
    expect(getAllPuzzles().length).toBe(205);
    expect(PUZZLE_THEMES.length).toBe(10);
  });

  it('题库 id 不含 `puzzle:` 前缀（前缀仅在未来 SRS 注册处拼接，静态数据保持短 id）', () => {
    for (const q of getAllPuzzles()) {
      expect(q.id.startsWith('puzzle:'), `${q.id} 不应在题库层带前缀`).toBe(false);
    }
  });
});
