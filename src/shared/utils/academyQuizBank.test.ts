import { describe, expect, it } from 'vitest';
import { mergeQuizBank } from './academyQuizBank';

interface Question {
  id: string;
  text: string;
}

interface Item {
  id: string;
  quiz: Question[];
}

const items: Item[] = [
  { id: 'a', quiz: [{ id: 'a1', text: 'old-a1' }] },
  { id: 'b', quiz: [{ id: 'b1', text: 'old-b1' }] },
];

describe('mergeQuizBank', () => {
  it('只替换已登记条目，未登记条目沿用原 quiz', () => {
    const merged = mergeQuizBank(items, {
      a: [
        { id: 'a2', text: 'new-a2' },
        { id: 'a1', text: 'new-a1' },
        { id: 'a2', text: 'duplicate' },
      ],
    });

    expect(merged[0]!.quiz).toEqual([
      { id: 'a2', text: 'new-a2' },
      { id: 'a1', text: 'new-a1' },
    ]);
    expect(merged[1]).toBe(items[1]);
  });

  it('支持排序且不修改原数组', () => {
    const merged = mergeQuizBank(
      items,
      {
        a: [
          { id: 'a2', text: 'two' },
          { id: 'a1', text: 'one' },
        ],
      },
      { sort: (x, y) => x.id.localeCompare(y.id) },
    );

    expect(merged[0]!.quiz.map((q) => q.id)).toEqual(['a1', 'a2']);
    expect(items[0]!.quiz).toEqual([{ id: 'a1', text: 'old-a1' }]);
  });

  it('校验失败立即抛错', () => {
    expect(() =>
      mergeQuizBank(
        items,
        { a: [{ id: 'bad', text: 'x' }] },
        {
          validate: (_itemId, question) => {
            if (!question.id.startsWith('a-')) throw new Error('bad id');
          },
        },
      ),
    ).toThrow('bad id');
  });

  it('未知题库键交给回调处理', () => {
    const unknown: string[] = [];
    mergeQuizBank(items, {}, { onUnknownKey: (id) => unknown.push(id) });
    expect(unknown).toEqual([]);

    mergeQuizBank(items, { z: [{ id: 'z1', text: 'z' }] }, { onUnknownKey: (id) => unknown.push(id) });
    expect(unknown).toEqual(['z']);
  });

  it('空题库沿用原 quiz', () => {
    const merged = mergeQuizBank<Item, Question>(items, { a: [] });
    expect(merged[0]).toBe(items[0]);
  });
});
