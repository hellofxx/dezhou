import type { TheorySection } from '../../../../../types';

// T9 综合：ICM 名次概率与 $EV、6-max 五步决策链。
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

const CHAIN_KEY = 'theory.block.t9-sixmax-capstone.0';

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't9-icm': [
    table(
      '3 人 SNG 的 ICM 折算（奖池 50/30/20，筹码 5000/3000/2000）：筹码占比越高的玩家，$EV 占比越低于筹码占比——筹码的边际价值递减正是 ICM 压力的来源。三人 $EV 之和恰为 100。',
      ['stack', 'P1', 'P2', 'P3', '$EV'],
      [
        ['5000', '50.0%', '33.9%', '16.1%', '38.4'],
        ['3000', '30.0%', '37.5%', '32.5%', '32.8'],
        ['2000', '20.0%', '28.6%', '51.4%', '28.9'],
      ],
    ),
  ],
  't9-sixmax-capstone': [
    tree(
      '6-max 现金局的五步决策链：从位置与筹码深度出发，经过对手范围与牌面归属，落到本街目标与剥削调整。任何一步跳过，后面的结论都会失去依据。',
      'position',
      [
        { id: 'position', labelKey: `${CHAIN_KEY}.node.position` },
        { id: 'range', labelKey: `${CHAIN_KEY}.node.range` },
        { id: 'board', labelKey: `${CHAIN_KEY}.node.board` },
        { id: 'line', labelKey: `${CHAIN_KEY}.node.line` },
        { id: 'exploit', labelKey: `${CHAIN_KEY}.node.exploit` },
      ],
      [
        { from: 'position', to: 'range', labelKey: '1' },
        { from: 'range', to: 'board', labelKey: '2' },
        { from: 'board', to: 'line', labelKey: '3' },
        { from: 'line', to: 'exploit', labelKey: '4' },
      ],
    ),
  ],
};
