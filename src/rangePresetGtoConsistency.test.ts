import { describe, expect, it } from 'vitest';

/**
 * P1A-06 / P1A-08 跨模块一致性守卫（2026-07-31 跨模块专批 C，platform-dev 维护）。
 *
 * 数据源定性（P1-C 结论）：
 * - gto-simulator `data/preflop-ranges.json`（6max_100bb_preflop，11 spot）是 open /
 *   facing-open 场景的**权威频率源**；range-trainer 的 open / call 类 preset 以其为源
 *   按「频率 ≥ 0.5」离散化生成，本测试锁定两侧一致（任一侧漂移即变红）。
 * - 「发起 3-bet」类 preset（btn-3bet-vs-co / co-3bet-vs-hj）与「通用 4-bet」（4bet-range）
 *   在 JSON 中**没有**对应表：JSON 的 `btn_vs_co_3bet` / `co_vs_hj_3bet` 语义是
 *   「Hero open 后面对 3-bet 的响应」，与「发起 3-bet」是不同 spot，**明确排除**在
 *   一致性断言之外（二者互相校验会把不同 spot 的数据错误对齐；亦严禁为对齐而臆造
 *   JSON 求解器频率数据）。
 * - 例外：bb-3bet-vs-btn 对应 `bb_vs_btn_open` 的 raise 侧（BB 面对 BTN open 时
 *   raise 即发起 3-bet），JSON 有覆盖，纳入守卫。
 * - 变体 preset（短牌 / HU / 4-Max）无 JSON 对应口径（JSON 仅 6-max 100bb），不参与守卫。
 *
 * 本文件位于 src 根（同 eslintCrossImports.test.ts 先例）：range-trainer 依 ESLint 模块
 * 隔离规则不得引用 gto-simulator，平台级跨模块守卫置于 feature 目录之外。
 */
import {
  ADVANCED_PRESET_RANGES,
  FOUR_MAX_PRESET_RANGES,
  HU_PRESET_RANGES,
  PRESET_RANGES,
  SHORT_DECK_PRESET_RANGES,
} from '@/features/range-trainer/constants';
import { getRangeComboPercentage } from '@/features/range-trainer/utils/rangeCombos';
import preflopData from '@/features/gto-simulator/data/preflop-ranges.json';
import type { HandNotation } from '@/shared/types/poker';

interface HandFrequency {
  fold: number;
  call: number;
  raise: number;
  raiseAmount?: number;
}

const SPOTS = (preflopData as { '6max_100bb_preflop': Record<string, Record<string, HandFrequency>> })[
  '6max_100bb_preflop'
];

/** preset ↔ JSON spot 映射（open/call 类 + bb 发起 3-bet 例外，阈值 ≥ 0.5） */
const CONSISTENCY_PAIRS: Array<{ presetId: string; spot: string; action: 'raise' | 'call' }> = [
  { presetId: 'utg-open', spot: 'utg_open', action: 'raise' },
  { presetId: 'hj-open', spot: 'hj_open', action: 'raise' },
  { presetId: 'co-open', spot: 'co_open', action: 'raise' },
  { presetId: 'btn-open', spot: 'btn_open', action: 'raise' },
  { presetId: 'sb-open', spot: 'sb_open', action: 'raise' },
  { presetId: 'bb-call-vs-btn', spot: 'bb_vs_btn_open', action: 'call' },
  { presetId: 'bb-3bet-vs-btn', spot: 'bb_vs_btn_open', action: 'raise' },
];

/**
 * 明确排除项（P1A-06 定性，见 range-trainer/constants.ts ADVANCED 段头注释）：
 * - btn-3bet-vs-co / co-3bet-vs-hj：发起 3-bet spot，JSON 仅有「面对 3-bet 响应」表
 *   （btn_vs_co_3bet / co_vs_hj_3bet），不同 spot 不得互相校验；模块自身权威源。
 * - 4bet-range：通用教学范围，JSON 无单一对应 spot。
 */
const EXCLUDED_PRESET_IDS = ['btn-3bet-vs-co', 'co-3bet-vs-hj', '4bet-range'];

const SIX_MAX_PRESETS = [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES];

function jsonHandsAtThreshold(spot: string, action: 'raise' | 'call'): Set<string> {
  const table = SPOTS[spot];
  if (!table) return new Set();
  return new Set(
    Object.entries(table)
      .filter(([, freq]) => freq[action] >= 0.5)
      .map(([hand]) => hand)
  );
}

describe('range-trainer preset ↔ gto-simulator preflop-ranges.json 一致性守卫（P1A-06）', () => {
  it.each(CONSISTENCY_PAIRS)(
    '$presetId 与 JSON $spot.$action ≥ 0.5 完全一致',
    ({ presetId, spot, action }) => {
      const preset = SIX_MAX_PRESETS.find((p) => p.id === presetId);
      expect(preset, `preset ${presetId} 应存在`).toBeDefined();
      const expected = jsonHandsAtThreshold(spot, action);
      expect(expected.size, `JSON spot ${spot} 应有 ${action}≥0.5 的手牌`).toBeGreaterThan(0);
      expect(new Set(preset?.hands)).toEqual(expected);
    }
  );

  it('排除项存在且均为发起 3-bet / 4-bet 类（JSON 无对应 spot，模块自身权威源）', () => {
    for (const id of EXCLUDED_PRESET_IDS) {
      const preset = ADVANCED_PRESET_RANGES.find((p) => p.id === id);
      expect(preset, `排除项 ${id} 应仍存在于 ADVANCED_PRESET_RANGES`).toBeDefined();
      expect(['3bet', '4bet']).toContain(preset?.actionType);
    }
    // 守卫映射 + 排除项应恰好覆盖全部 ADVANCED preset（新增 preset 必须显式归类）
    const covered = new Set([...CONSISTENCY_PAIRS.map((p) => p.presetId), ...EXCLUDED_PRESET_IDS]);
    for (const preset of ADVANCED_PRESET_RANGES) {
      expect(covered.has(preset.id), `ADVANCED preset ${preset.id} 需登记进守卫映射或排除清单`).toBe(true);
    }
  });

  it('JSON 语义提示：btn_vs_co_3bet 是「面对 3-bet 响应」表（raise 侧 ≥0.5 极少），不可当发起 3-bet 表用', () => {
    // 面对 3-bet 的 4-bet（raise）频率天然低：若某天该表 raise≥0.5 手牌数逼近发起 3-bet
    // 范围规模，说明 JSON 语义被改动，需重新定性
    expect(jsonHandsAtThreshold('btn_vs_co_3bet', 'raise').size).toBeLessThan(5);
  });
});

describe('preset 名称百分比标注与组合占比一致（P1A-08）', () => {
  const LABELED: Array<{ hands: HandNotation[]; name: string; shortDeck?: boolean }> = [
    ...SIX_MAX_PRESETS,
    ...HU_PRESET_RANGES,
    ...FOUR_MAX_PRESET_RANGES,
    ...SHORT_DECK_PRESET_RANGES.map((p) => ({ ...p, shortDeck: true })),
  ];

  it('所有带 (~N%) 标注的 preset，标注与按组合数加权的实际占比偏差 ≤ 1 个百分点', () => {
    let labeledCount = 0;
    for (const preset of LABELED) {
      const match = preset.name.match(/\(~(\d+(?:\.\d+)?)%\)/);
      if (!match?.[1]) continue;
      labeledCount += 1;
      const labeled = Number(match[1]);
      const actual = getRangeComboPercentage(
        preset.hands,
        preset.shortDeck ? 'short-deck' : 'standard'
      );
      expect(
        Math.abs(labeled - actual),
        `${preset.name} 标注 ${labeled}% 与实际 ${actual.toFixed(1)}% 偏差超 1pp`
      ).toBeLessThanOrEqual(1);
    }
    // 至少覆盖 6-max 全量 + HU BTN（防止标注被整体删除导致守卫空转）
    expect(labeledCount).toBeGreaterThanOrEqual(11);
  });
});
