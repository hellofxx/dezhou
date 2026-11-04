import type { TheorySection } from '../../../../../types';

// T6 下注理论：SPR → 三街几何尺度、加注底池账本、范围结构 → 尺度的决策树。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

const tree = (
  content: string,
  rootId: string,
  nodes: { id: string; labelKey: string }[],
  edges: { from: string; to: string; labelKey: string }[],
): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'decision-tree', rootId, nodes, edges },
});

const KEY = 'theory.block.t6-sizing-theory.0';

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't6-geometric': [
    table(
      '三街几何尺度速查：给定 SPR，按同一比例逐街下注即可在河牌恰好打光筹码。SPR 越高，每街需要的比例越大；SPR 超过 10 时几何尺度已逼近满池，实战通常改为两街规划。',
      ['SPR', '3 streets'],
      [
        ['1', '22.1%'],
        ['2', '35.5%'],
        ['3', '45.6%'],
        ['4', '54.0%'],
        ['5', '61.2%'],
        ['7.5', '76.0%'],
        ['10', '87.9%'],
      ],
    ),
  ],
  't6-3bet-pot': [
    table(
      '加注底池账本（6-max，100bb，无前注）：单加注底池 SPR 约 17.7、3-bet 底池约 4.4、4-bet 底池约 2.0。SPR 越低，全下承诺所需的权益门槛越低，范围也越极化。',
      ['pot', 'SPR', 'commit equity'],
      [
        ['SRP', '17.7', 'n/a'],
        ['3-bet', '4.4', '44.9%'],
        ['4-bet', '2.0', '39.9%'],
      ],
    ),
  ],
  't6-sizing-theory': [
    tree(
      '范围结构决定尺度的决策树：先判断下注范围是极化、线性还是只剩中等牌力，再选尺度。中等牌力没有可支撑大注的诈唬容量，过牌是默认动作。',
      'start',
      [
        { id: 'start', labelKey: `${KEY}.node.start` },
        { id: 'polar', labelKey: `${KEY}.node.polar` },
        { id: 'linear', labelKey: `${KEY}.node.linear` },
        { id: 'medium', labelKey: `${KEY}.node.medium` },
        { id: 'large', labelKey: `${KEY}.node.large` },
        { id: 'small', labelKey: `${KEY}.node.small` },
        { id: 'check', labelKey: `${KEY}.node.check` },
      ],
      [
        { from: 'start', to: 'polar', labelKey: `${KEY}.edge.polar` },
        { from: 'start', to: 'linear', labelKey: `${KEY}.edge.linear` },
        { from: 'start', to: 'medium', labelKey: `${KEY}.edge.medium` },
        { from: 'polar', to: 'large', labelKey: `${KEY}.edge.large` },
        { from: 'linear', to: 'small', labelKey: `${KEY}.edge.small` },
        { from: 'medium', to: 'check', labelKey: `${KEY}.edge.check` },
      ],
    ),
  ],
};
