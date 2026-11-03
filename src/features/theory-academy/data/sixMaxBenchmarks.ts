/**
 * 标准 6-max 现金局开池基准（100bb，无前注）。
 *
 * 双列口径：`standard` 列与 range-trainer 的 6-max open 预设同名同值
 * （UTG 19 / HJ 22 / CO 32 / BTN 44 / SB 38），由 `src/guards/sixMaxBenchmarkGuard.test.ts`
 * 锁死；`beginner` 列是入门教学的简化值，只作教学起点，不替代标准列。
 *
 * 仅理论学院运行时消费（教材正文与增补章），未达 shared/ 的「≥2 模块使用」准入门槛。
 */
export const SIX_MAX_BENCHMARK_SCOPE = {
  seats: 6,
  stackBb: 100,
  ante: false,
} as const;

export type SixMaxOpenPosition = 'UTG' | 'HJ' | 'CO' | 'BTN' | 'SB';

export interface SixMaxRfiBenchmark {
  /** 标准 6-max 现金局开池宽度（%，来自 range-trainer 预设） */
  readonly standard: number;
  /** 入门简化口径（%，只用于新手教学，不替代标准列） */
  readonly beginner: number;
}

export const SIX_MAX_RFI_100BB_NO_ANTE: Readonly<Record<SixMaxOpenPosition, SixMaxRfiBenchmark>> = {
  UTG: { standard: 19, beginner: 15 },
  HJ: { standard: 22, beginner: 18 },
  CO: { standard: 32, beginner: 30 },
  BTN: { standard: 44, beginner: 35 },
  SB: { standard: 38, beginner: 35 },
};
