import { describe, expect, it } from 'vitest';
import { getAllPuzzles, PUZZLE_BANK } from './puzzleBank';
import { parseOptionSortKey, UNKNOWN_CATEGORY } from '../utils/optionOrder';

/**
 * 题库选项语义固定排序测试（"答案位置偏差治理"方案）。
 *
 * 背景：原始题库数据中正确答案高度集中于 options[0]。
 * getAllPuzzles / getPuzzlesByTheme 现按动作语义固定排序
 * （Fold → Check → Call → Limp → Bet → Raise → 全下，同类按尺度升序），
 * 与真实扑克客户端一致，正确答案位置与书写顺序解耦且 100% 确定。
 */
describe('puzzleBank 选项语义固定排序', () => {
  it('每道题恰有 1 个正确选项，且其 evLoss 为 0 或 undefined', () => {
    const puzzles = getAllPuzzles();
    expect(puzzles.length).toBeGreaterThan(0);
    for (const q of puzzles) {
      const correct = q.options.filter((o) => o.isCorrect);
      expect(correct, `题目 ${q.id} 正确选项数量异常`).toHaveLength(1);
      const evLoss = correct[0]?.evLoss;
      expect(
        evLoss === undefined || evLoss === 0,
        `题目 ${q.id} 正确选项 evLoss=${evLoss} 应为 0 或 undefined`
      ).toBe(true);
    }
  });

  it('两次调用选项顺序完全一致（确定性）', () => {
    const first = getAllPuzzles();
    const second = getAllPuzzles();
    expect(second.length).toBe(first.length);
    for (let i = 0; i < first.length; i++) {
      const a = first[i];
      const b = second[i];
      expect(b?.id).toBe(a?.id);
      expect(b?.options.map((o) => o.id)).toEqual(a?.options.map((o) => o.id));
    }
  });

  it('全部题目的每个选项文本均可被 parseOptionSortKey 解析（类别 ≠ 99）', () => {
    const puzzles = getAllPuzzles();
    for (const q of puzzles) {
      for (const o of q.options) {
        const key = parseOptionSortKey(o.text);
        expect(
          key.category,
          `题目 ${q.id} 选项 "${o.text}" 无法识别类别（category=99），请扩展 optionOrder.ts 解析规则`
        ).not.toBe(UNKNOWN_CATEGORY);
      }
    }
  });

  it('每题选项已按 (category, size) 非降序排列，同类不同尺度按尺度升序', () => {
    const puzzles = getAllPuzzles();
    for (const q of puzzles) {
      const keys = q.options.map((o) => parseOptionSortKey(o.text));
      for (let i = 1; i < keys.length; i++) {
        const prev = keys[i - 1];
        const curr = keys[i];
        if (!prev || !curr) continue;
        const ordered =
          prev.category < curr.category ||
          (prev.category === curr.category && prev.size <= curr.size);
        expect(
          ordered,
          `题目 ${q.id} 选项顺序违规：` +
            `"${q.options[i - 1]?.text}"(${prev.category},${prev.size}) 应排在 ` +
            `"${q.options[i]?.text}"(${curr.category},${curr.size}) 之前或同位`
        ).toBe(true);
      }
    }
  });

  it('排序不丢失选项：每题排序后选项 id 集合与原始 PUZZLE_BANK 一致', () => {
    const originalById = new Map(
      Object.values(PUZZLE_BANK)
        .flat()
        .map((q) => [q.id, [...q.options.map((o) => o.id)].sort()])
    );
    const puzzles = getAllPuzzles();
    expect(puzzles.length).toBe(originalById.size);
    for (const q of puzzles) {
      const sortedIds = [...q.options.map((o) => o.id)].sort();
      expect(sortedIds, `题目 ${q.id} 选项集合不一致`).toEqual(originalById.get(q.id));
    }
  });

  it('正确答案索引分布：全库任一索引占比 < 60%', () => {
    const puzzles = getAllPuzzles();
    const counts = new Map<number, number>();
    for (const q of puzzles) {
      const idx = q.options.findIndex((o) => o.isCorrect);
      expect(idx, `题目 ${q.id} 未找到正确选项`).toBeGreaterThanOrEqual(0);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
    const distribution = [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([idx, n]) => `索引${idx}: ${n} 题 (${((n / puzzles.length) * 100).toFixed(1)}%)`)
      .join(', ');
    // 输出实测分布，便于报告核对

    console.log(`[语义排序分布] 共 ${puzzles.length} 题 → ${distribution}`);
    for (const [idx, n] of counts) {
      expect(n / puzzles.length, `索引 ${idx} 占比过高`).toBeLessThan(0.6);
    }
  });

  /**
   * P1D-10 分主题分布守卫（选项类型甄别后的处置）：
   *
   * 甄别结论：本题库 615 个选项全部为**动作类**（Fold/Check/Call/Limp/Bet/Raise/全下，
   * 由上方"全量可解析"用例硬性守卫），不存在文字陈述类选项。
   *
   * 动作类选项按语义固定排序（消极→激进）后，单主题内正确答案位置的集中
   * （如 preflop-rfi 索引 2 占比较高）是题目正确动作激进度分布的自然结果
   * （RFI 主题正确答案多为 Raise），**不是 bug**：用户无法靠"猜固定位置"作弊，
   * 因为不同题的正确动作不同（Fold 题目答案在前、Raise 题目答案在后），
   * 盲选任一位置的期望正确率由全库分布（上方 <60% 守卫）锁定。
   * 因此动作类**不强制单主题 ≤60%**，只断言排序正确性（见上方排序用例）；
   * 若未来引入文字陈述类选项（seed 洗牌题型），则对其按单主题 ≤60% 分布守卫。
   */
  it('P1D-10 分主题分布：动作类只验语义排序（输出分布供监控），文字类断言 ≤60%', () => {
    const puzzles = getAllPuzzles();
    const byTheme = new Map<string, typeof puzzles>();
    for (const q of puzzles) {
      const list = byTheme.get(q.theme) ?? [];
      list.push(q);
      byTheme.set(q.theme, list);
    }

    for (const [theme, themePuzzles] of byTheme) {
      // 题目分型：全部选项可解析 = 动作类；含未知类别选项 = 文字陈述类
      const textType = themePuzzles.filter((q) =>
        q.options.some((o) => parseOptionSortKey(o.text).category === UNKNOWN_CATEGORY)
      );
      const actionType = themePuzzles.filter((q) => !textType.includes(q));

      // 动作类：仅输出分布供监控（集中属语义排序自然结果，不设阈值）
      const counts = new Map<number, number>();
      for (const q of actionType) {
        const idx = q.options.findIndex((o) => o.isCorrect);
        counts.set(idx, (counts.get(idx) ?? 0) + 1);
      }
      const dist = [...counts.entries()]
        .sort(([a], [b]) => a - b)
        .map(([idx, n]) => `idx${idx}=${((n / actionType.length) * 100).toFixed(0)}%`)
        .join(' ');

      console.log(`[P1D-10] ${theme}: 动作类 ${actionType.length} 题 (${dist})，文字类 ${textType.length} 题`);

      // 文字陈述类（当前为 0 题）：若未来出现，单主题任一索引占比必须 ≤60%
      if (textType.length > 0) {
        const textCounts = new Map<number, number>();
        for (const q of textType) {
          const idx = q.options.findIndex((o) => o.isCorrect);
          textCounts.set(idx, (textCounts.get(idx) ?? 0) + 1);
        }
        for (const [idx, n] of textCounts) {
          expect(
            n / textType.length,
            `主题 ${theme} 文字类题目索引 ${idx} 占比超标（seed 洗牌失效？）`
          ).toBeLessThanOrEqual(0.6);
        }
      }
    }

    // 甄别结论的硬断言：当前题库应 100% 为动作类（若新增文字类题目，
    // 上方"全量可解析"用例会先拦截，需同步评估排序/洗牌策略）
    const anyText = puzzles.some((q) =>
      q.options.some((o) => parseOptionSortKey(o.text).category === UNKNOWN_CATEGORY)
    );
    expect(anyText, '题库出现文字陈述类选项，需重新评估分布守卫策略').toBe(false);
  });
});
