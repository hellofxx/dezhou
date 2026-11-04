/**
 * 两院共用的题库注入器（纯函数）。
 *
 * 约定：
 * - 输入项只需 `{ id, quiz }`；题库以 `Record<itemId, questions[]>` 提供。
 * - 只替换已登记条目的 `quiz`；未登记条目沿用原 `quiz`（空数组占位合法）。
 * - 同 id 重复题只保留首条；默认保留声明顺序，可由调用方传 `sort` 覆盖。
 * - `validate` 抛错时由调用方决定错误语义（如理论要求 `<chapterId>-q<n>`）。
 */

export interface QuizBankOptions<Q> {
  /** 题目排序；缺省保留题库声明顺序。 */
  sort?: (a: Q, b: Q) => number;
  /** 单题校验；抛错即视为数据缺陷。 */
  validate?: (itemId: string, question: Q) => void;
  /** 未知题库键处理；缺省忽略（由调用方守卫断言）。 */
  onUnknownKey?: (itemId: string) => void;
}

export function mergeQuizBank<
  T extends { id: string; quiz: Q[] },
  Q extends { id: string },
>(
  items: readonly T[],
  bank: Readonly<Record<string, readonly Q[]>>,
  options: QuizBankOptions<Q> = {},
): T[] {
  const knownIds = new Set(items.map((item) => item.id));
  for (const itemId of Object.keys(bank)) {
    if (!knownIds.has(itemId)) options.onUnknownKey?.(itemId);
  }

  return items.map((item) => {
    const questions = bank[item.id];
    if (!questions || questions.length === 0) return item;

    const seen = new Set<string>();
    const deduped: Q[] = [];
    for (const question of questions) {
      options.validate?.(item.id, question);
      if (seen.has(question.id)) continue;
      seen.add(question.id);
      deduped.push(question);
    }

    const quiz = options.sort ? deduped.toSorted(options.sort) : deduped;
    return { ...item, quiz };
  });
}
