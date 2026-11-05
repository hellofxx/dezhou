import type { TheorySection } from '../../../../../types';

/**
 * T8 单挑心理战 · 富文本块（表格）。
 *
 * 追加式契约：块只接在章节既有 content 尾部（由 `applyTheoryContentBlocks` 统一合并），
 * 因此 index 型 i18n key（`theory.content.<chapterId>.<index>`）的既有下标永远不变；
 * 新增块的中文说明同步追加在 `theory-content/t8hu.json` 的 content 数组末尾。
 *
 * 单元格一律语言中立（数字 / 百分比 / 短 token）：渲染端按 `t()` 解析 key、
 * 非 key 字面量原样输出，同一份数据服务 zh / en，不在表格里写自然语言。
 */
const table = (content: string, headers: string[], rows: string[][]): TheorySection => ({
  type: 'text',
  content,
  data: { kind: 'table', headers, rows },
});

export const CONTENT_BLOCKS: Record<string, TheorySection[]> = {
  't8hu-pressure': [
    table(
      '波动预算速查（p=60%、池底 100、边际 20）：手数越多，期望按 N 线性增长、波动只按 √N 增长，EV ÷ σ 的比值随手数变好——这就是「打得多」能压低短期运气权重的数学来源。',
      ['hands', 'EV', 'sigma', 'EV/sigma'],
      [
        ['50', '1000', '346', '2.9'],
        ['200', '4000', '693', '5.8'],
        ['500', '10000', '1096', '9.1'],
      ],
    ),
  ],
  't8hu-reads': [
    table(
      '频率观察的标准误（p=45% 的弃牌率）：20 手样本的 95% 区间约 ±21.8 个百分点，400 手才收窄到约 ±4.9 个百分点。样本不足时，任何「他弃牌很多」的判断都还在区间里。',
      ['hands', 'SE(p=45%)', '95%+/-'],
      [
        ['20', '11.1', '21.8'],
        ['40', '7.9', '15.4'],
        ['100', '5.0', '9.8'],
        ['400', '2.5', '4.9'],
      ],
    ),
  ],
  't8hu-tilt-types': [
    table(
      'Tilt 代价时间化（单手差额 0.25bb、每小时 200 手）：15 分钟就烧掉 12.5bb，两小时 100bb 即一个买入。把代价换算成时间，停手点才是可执行的。',
      ['minutes', 'hands', 'cost(bb)'],
      [
        ['15', '50', '12.5'],
        ['30', '100', '25.0'],
        ['60', '200', '50.0'],
        ['120', '400', '100.0'],
      ],
    ),
  ],
  't8hu-session': [
    table(
      'session 长度与波动（σ = 9bb/手，100bb 为一个买入）：波动随 √手数放大，1200 手约 3.1 个买入、2000 手约 4.0 个买入。时长翻倍不等于波动翻倍，但绝对金额的增长会明显放大情绪压力。',
      ['hands', 'sigma(bb)', 'buyins'],
      [
        ['200', '127', '1.3'],
        ['400', '180', '1.8'],
        ['1200', '312', '3.1'],
        ['2000', '403', '4.0'],
      ],
    ),
  ],
};
