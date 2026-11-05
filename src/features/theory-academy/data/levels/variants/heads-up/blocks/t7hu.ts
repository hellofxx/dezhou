import type { TheorySection } from '../../../../../types';

// T7 对手分析（单挑）：对手类型映射表、偷盲期望随弃牌率的变化、指标基线、范围收窄组合账。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't7hu-patterns': [
    table(
      '四类单挑对手的指标形状与对应调整：同一组数字落在不同组合上，指向完全不同的剥削方向——先看形状，再谈幅度。',
      ['type', 'vpip', 'af', 'fcb', 'adjust'],
      [
        ['station', 'high', 'low', 'low', 'thin value, cut bluffs'],
        ['nit', 'low', 'low', 'high', 'wider steal'],
        ['maniac', 'high', 'high', 'low', 'tighten value, let him barrel'],
        ['tag', 'mid', 'mid', 'mid', 'baseline, no exploit'],
      ],
    ),
  ],
  't7hu-exploit': [
    table(
      '按对手弃牌率读偷盲的期望值（0.5 死钱已沉没、加注到 2BB 的 1.5 对 1.5 口径）：EV = f × 1.5 − (1 − f) × 1.5。弃牌率每高出一档，纯偷盲的期望线性上移，50% 是保本点。',
      ['foldRate', 'ev', 'verdict'],
      [
        ['30%', '-0.60', 'needs postflop'],
        ['40%', '-0.30', 'inefficient'],
        ['50%', '0.00', 'break-even'],
        ['60%', '+0.30', 'profitable'],
        ['70%', '+0.60', 'auto-profit'],
      ],
    ),
  ],
  't7hu-stats': [
    table(
      '单挑侧的指标基线与所需样本：基线是经验量级，样本一栏是把它读准所需的大致手数——低于这个量级，指标只能当方向，不能当结论。',
      ['stat', 'huBaseline', 'sample'],
      [
        ['vpip sb', '85% - 100%', '50 - 100'],
        ['vpip bb', '55% - 75%', '50 - 100'],
        ['3-bet bb', '12% - 20%', '150 - 400'],
        ['fcb', '40% - 55%', '150 - 400'],
        ['wwsf', '45% - 55%', '200 - 500'],
      ],
    ),
  ],
  't7hu-hand-reading': [
    table(
      '同一条下注线上的范围收窄（组合数为教学设定）：价值与诈唬的比例在河牌必须与尺度自洽，否则这条线就是反叙事。',
      ['street', 'action', 'combos', 'value', 'bluff'],
      [
        ['preflop', 'open', '600', '-', '-'],
        ['flop', 'cbet', '420', '-', '-'],
        ['turn', 'barrel', '200', '-', '-'],
        ['river', 'overbet', '60', '35', '25'],
      ],
    ),
  ],
};
