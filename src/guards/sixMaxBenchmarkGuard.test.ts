import { describe, expect, it } from 'vitest';
import { PRESET_RANGES } from '@/features/range-trainer/constants';
import {
  SIX_MAX_BENCHMARK_SCOPE,
  SIX_MAX_RFI_100BB_NO_ANTE,
  type SixMaxOpenPosition,
} from '@/features/theory-academy/data/sixMaxBenchmarks';

/**
 * 6-max 开池基准守卫（双列口径的单源对齐）。
 *
 * 防的缺陷：理论教材与 range-trainer 预设各自维护一套「6-max 开池宽度」，
 * 任一侧改数就会让读者学到的基准与训练器判定的基准打架。
 *
 * 判据单源分两层：
 * - `standard` 列 = range-trainer `PRESET_RANGES` 中 `(~N%)` 名称标注（6-max open 预设）；
 * - `beginner` 列只做方向约束（不宽于标准列），允许入门简化。
 */

const POSITIONS: readonly SixMaxOpenPosition[] = ['UTG', 'HJ', 'CO', 'BTN', 'SB'];
const PRESET_NAME = /^(UTG|HJ|CO|BTN|SB) Open Raise \(~(\d+)%\)$/;

function parsePresetWidths(): Map<SixMaxOpenPosition, number> {
  const parsed = new Map<SixMaxOpenPosition, number>();
  for (const preset of PRESET_RANGES) {
    const match = PRESET_NAME.exec(preset.name);
    if (match) parsed.set(match[1] as SixMaxOpenPosition, Number(match[2]));
  }
  return parsed;
}

describe('6-max 开池基准守卫', () => {
  it('基准口径声明为 6 人桌 / 100bb / 无前注', () => {
    expect(SIX_MAX_BENCHMARK_SCOPE).toEqual({ seats: 6, stackBb: 100, ante: false });
  });

  it('standard 列与 range-trainer 预设名称的 (~N%) 标注逐位置一致', () => {
    const parsed = parsePresetWidths();
    // 扫描面自检：名称格式或预设集合被改动时不得空洞通过
    expect(parsed.size, '预置范围名称解析失效：应命中 5 个 6-max open 预设').toBe(POSITIONS.length);
    for (const position of POSITIONS) {
      expect(parsed.get(position), `${position} 的预设宽度`).toBe(
        SIX_MAX_RFI_100BB_NO_ANTE[position].standard,
      );
    }
  });

  it('方向不变式：新手列不宽于标准列，BTN 为标准列最宽', () => {
    for (const position of POSITIONS) {
      const { standard, beginner } = SIX_MAX_RFI_100BB_NO_ANTE[position];
      expect(beginner, `${position} 新手列不应宽于标准列`).toBeLessThanOrEqual(standard);
    }
    const widest = POSITIONS.reduce((a, b) =>
      SIX_MAX_RFI_100BB_NO_ANTE[b].standard > SIX_MAX_RFI_100BB_NO_ANTE[a].standard ? b : a,
    );
    expect(widest).toBe('BTN');
  });
});
