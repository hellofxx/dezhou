/**
 * quizOrder 契约（PRD §5.26 / TDD §5.9 选项排序治理）：
 * - 纯数值选项集按数值升序（消除"正确答案位置固定"的位置偏差）
 * - 文字选项集按 seedKey 确定性洗牌（同题跨会话一致、不同题分布互异）
 * - 重排必须同步重映射正确答案索引，且不得修改入参
 */
import { describe, expect, it } from 'vitest';
import { remapCorrectIndex, reorderOptions, type QuizOption } from './quizOrder';

const numericOptions: QuizOption[] = [
  { id: 'a', text: '约 15 个' },
  { id: 'b', text: '8 个（两头顺）' },
  { id: 'c', text: '20%' },
];

const textOptions: QuizOption[] = [
  { id: 'raise', text: '加注' },
  { id: 'call', text: '跟注' },
  { id: 'fold', text: '弃牌' },
  { id: 'allin', text: '全下' },
];

const ids = (options: readonly QuizOption[]) => options.map((option) => option.id);

describe('reorderOptions — ascending 模式', () => {
  it('数值选项集按首个数字升序排列', () => {
    expect(ids(reorderOptions(numericOptions, 'q1', 'ascending'))).toEqual(['b', 'a', 'c']);
  });

  it('getText 可覆盖取值来源（i18n key 型题库先 t() 再排序）', () => {
    const keyed: QuizOption[] = [
      { id: 'x', text: 'quiz.opt.15' },
      { id: 'y', text: 'quiz.opt.9' },
    ];
    const resolved: Record<string, string> = { 'quiz.opt.15': '15 个', 'quiz.opt.9': '9 个' };
    const ordered = reorderOptions(keyed, 'q2', 'ascending', (option) => resolved[option.text] ?? '');
    expect(ids(ordered)).toEqual(['y', 'x']);
  });

  it('非数值选项集降级为种子洗牌（不会因 ascending 而原序返回）', () => {
    const ordered = reorderOptions(textOptions, 'q3', 'ascending');
    expect(ids(ordered).toSorted()).toEqual(ids(textOptions).toSorted());
    // 与同种子的 shuffle 模式结果一致，证明走了洗牌分支
    expect(ids(ordered)).toEqual(ids(reorderOptions(textOptions, 'q3', 'shuffle')));
  });
});

describe('reorderOptions — shuffle 模式', () => {
  it('同一 seedKey 恒定同序（每日谜题"同一天同题同序"契约）', () => {
    const first = ids(reorderOptions(textOptions, 'question-42', 'shuffle'));
    const second = ids(reorderOptions(textOptions, 'question-42', 'shuffle'));
    expect(first).toEqual(second);
  });

  it('不同 seedKey 产生互异分布（避免正确答案固定在原位置）', () => {
    const permutations = new Set(
      Array.from({ length: 12 }, (_, i) =>
        reorderOptions(textOptions, `question-${i}`, 'shuffle').map((o) => o.id).join(','),
      ),
    );
    expect(permutations.size).toBeGreaterThan(1);
  });

  it('不修改入参，且重排结果是新数组', () => {
    const before = ids(textOptions);
    const ordered = reorderOptions(textOptions, 'question-42', 'shuffle');
    expect(ids(textOptions)).toEqual(before);
    expect(ordered).not.toBe(textOptions);
    expect(ids(ordered).toSorted()).toEqual(before.toSorted());
  });

  it('空选项集返回空数组（无 panic）', () => {
    expect(reorderOptions([], 'q4', 'ascending')).toEqual([]);
    expect(reorderOptions([], 'q4', 'shuffle')).toEqual([]);
  });
});

describe('remapCorrectIndex', () => {
  const original = textOptions;
  const shuffled = reorderOptions(original, 'question-42', 'shuffle');

  it('按选项 id 跟随正确答案的新位置', () => {
    const originalIndex = original.findIndex((option) => option.id === 'call');
    const newIndex = remapCorrectIndex(original, shuffled, originalIndex);
    expect(shuffled[newIndex]?.id).toBe('call');
  });

  it('正确答案 id 缺失时回退原索引（不做错位重映射）', () => {
    const foreign = [{ id: 'unknown', text: '未知选项' }];
    expect(remapCorrectIndex(original, foreign, 2)).toBe(2);
  });

  it('原索引越界时回退原索引', () => {
    expect(remapCorrectIndex(original, shuffled, 99)).toBe(99);
  });
});
