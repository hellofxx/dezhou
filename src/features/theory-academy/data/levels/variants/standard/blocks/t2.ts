import type { TheorySection } from '../../../../../types';

// T2 赔率体系：下注尺度 → 跟注所需胜率的速查表（b 以底池 P 为单位）。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't2-pot-odds': [
    table(
      '跟注所需胜率速查：所需胜率 = 跟注额 ÷（跟注后总底池）。下注越小，价格越好，所需胜率越低——这张表是翻后跟注决策的基准线。',
      ['bet (×P)', 'call equity'],
      [
        ['1/4', '16.7%'],
        ['1/3', '20.0%'],
        ['1/2', '25.0%'],
        ['2/3', '28.6%'],
        ['1', '33.3%'],
        ['1.5', '37.5%'],
        ['2', '40.0%'],
      ],
    ),
  ],
};
