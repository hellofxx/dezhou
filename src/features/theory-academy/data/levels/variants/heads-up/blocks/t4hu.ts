import type { TheorySection } from '../../../../../types';

// T4HU 富文本块（单挑）：只追加在各章 content 尾部，索引型 i18n key 的既有下标不变。
// 表头与单元格一律语言中立 token（数字 / 缩写 / 牌面记号），同一份数据服务 zh 与 en。
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't4hu-range-width': [
    table(
      '宽度与价格的对照：范围宽度不是风格选择，每一个宽度都对应一个价格门槛。SB 的参与率与 BB 的防守率之所以高，是因为两个节点的价格都低到可以接受大量边缘牌。',
      ['spot', 'width', 'price'],
      [
        ['SB open', '~80%', '0.5 → 1.5bb'],
        ['BB vs min-raise', '~60%', '1 ÷ 4 = 25%'],
        ['BB 3-bet', '~15-20%', '5 ÷ 8 = 62.5%'],
        ['SB vs 3-bet', '~37.5%', '1 − 62.5%'],
      ],
    ),
  ],
  't4hu-polarization': [
    table(
      '尺度与均衡比例对照：诈唬占比按 b ÷ (1 + 2b) 计算，价值:诈唬比等于 1/b + 1；Alpha 是同一尺度下的保本弃牌率。尺度越大，诈唬占比越高，对手需要弃牌的比例也越高。',
      ['size (×P)', 'value : bluff', 'Alpha'],
      [
        ['1/3', '4 : 1', '25.0%'],
        ['1/2', '3 : 1', '33.3%'],
        ['1', '2 : 1', '50.0%'],
        ['2', '3 : 2', '66.7%'],
      ],
    ),
  ],
  't4hu-blocking': [
    table(
      '挡牌的组合账：你手里的每一张牌都会让对手的对应组合按 C(n,2) 重算。阻断越靠近对手范围的顶端，诈唬的价值越高；阻断的若是对手的弃牌部分，反而让对手更容易跟注。',
      ['holding', 'opponent combos'],
      [
        ['A♠ on K♠9♠4♠', '10 → 0'],
        ['A♦ on K♠9♠4♠', '10 → 10'],
        ['A♠ on K♠9♠4♦', '55 → 45'],
        ['K♠ anywhere', '6 → 3'],
      ],
    ),
  ],
  't4hu-range-advantage': [
    table(
      '牌面归属速查：顶端与总量可以分居两边。归属决定频率、顶端决定尺度——先把两个判断分开做完，再合成一行策略。',
      ['board', 'nut edge', 'range edge', 'flop plan'],
      [
        ['A♠7♦2♣', 'SB', 'SB', 'high freq · 1/3 pot'],
        ['K♦J♦4♣', 'SB', 'SB', 'high freq · 1/3 - 1/2 pot'],
        ['8♠7♦6♣', 'BB', 'SB slight', 'lower freq · 2/3 pot+'],
        ['5♥4♣3♠', 'BB', 'BB', 'low freq · polarized'],
      ],
    ),
  ],
  't4hu-preflop-structure': [
    table(
      '翻前四节点的价格账本：多投与可赢都是相对该节点起点的增量。门槛一列里，3-bet 与 4-bet 两行是 Alpha（对手需要弃牌的比例），跟注行是所需权益。',
      ['node', 'invest', 'win', 'threshold'],
      [
        ['BB vs min-raise', '1bb', '4bb', '25% equity'],
        ['BB 3-bet to 6bb', '5bb', '3bb', '62.5% fold'],
        ['SB 4-bet to 15bb', '13bb', '8bb', '61.9% fold'],
        ['BB vs 4-bet', '9bb', '30bb', '30% equity'],
      ],
    ),
  ],
};
