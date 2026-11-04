import type { TheorySection } from '../../../../../types';

// T5 博弈论：同一尺度下 MDF / Alpha / 跟注所需权益的三列对照（互补关系一眼可见）。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't5-mdf-alpha': [
    table(
      'MDF、Alpha 与跟注所需权益的对照表（b 为下注额相对底池的倍数）：MDF + Alpha = 100%，两者是同一枚硬币的两面；跟注所需权益永远低于 Alpha，因为跟注还能赢下对手的下注。',
      ['b (×P)', 'MDF', 'Alpha', 'call equity'],
      [
        ['1/4', '80.0%', '20.0%', '16.7%'],
        ['1/3', '75.0%', '25.0%', '20.0%'],
        ['1/2', '66.7%', '33.3%', '25.0%'],
        ['2/3', '60.0%', '40.0%', '28.6%'],
        ['1', '50.0%', '50.0%', '33.3%'],
        ['1.5', '40.0%', '60.0%', '37.5%'],
        ['2', '33.3%', '66.7%', '40.0%'],
      ],
    ),
  ],
};
