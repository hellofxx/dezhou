import type { TheorySection } from '../../../../../types';

// T8 资金管理：破产风险随买入数量的衰减（μ=0.05bb/手、σ=8bb/手，扩散近似 exp(−2μB/σ²)）。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't8-bankroll-psych': [
    table(
      '破产风险速查（每 100bb 为一个买入，μ=0.05bb/手、σ=8bb/手）：资金越厚，破产概率按指数衰减。20 个买入约 4.4%，30 个买入已低于 1%——这是「现金桌 20-40 个买入」标准的数学来源。',
      ['buy-ins', 'ROR'],
      [
        ['10', '21.0%'],
        ['15', '9.6%'],
        ['20', '4.4%'],
        ['30', '0.9%'],
        ['40', '0.2%'],
        ['50', '0.04%'],
      ],
    ),
  ],
};
