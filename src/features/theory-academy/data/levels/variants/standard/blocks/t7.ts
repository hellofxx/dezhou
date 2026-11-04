import type { TheorySection } from '../../../../../types';

// T7 对手分析：统计指标的紧/标准/松三档参考线（6-max 现金经验量级）。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't7-stats': [
    table(
      '四大指标的三档参考线（6-max 现金，经验量级）：VPIP 与 PFR 组合看松紧与被动倾向，AF 与 WTSD 看翻后风格。任何单项指标都必须结合样本量解读。',
      ['metric', 'band'],
      [
        ['VPIP', '< 20%'],
        ['VPIP', '22-27%'],
        ['VPIP', '> 32%'],
        ['PFR', '< 15%'],
        ['PFR', '18-24%'],
        ['PFR', '> 28%'],
        ['AF', '< 1.5'],
        ['AF', '2-3'],
        ['AF', '> 4'],
        ['WTSD', '< 22%'],
        ['WTSD', '26-30%'],
        ['WTSD', '> 32%'],
      ],
    ),
  ],
};
