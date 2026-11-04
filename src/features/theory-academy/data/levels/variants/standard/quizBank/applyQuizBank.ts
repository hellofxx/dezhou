import type { TheoryChapter, TheoryQuizQuestion } from '../../../../../types';

/**
 * 题库注入器（无副作用纯函数，单独成文件）。
 *
 * 为什么与 index.ts 分离：loaders.ts（运行时路径）只需要注入函数；
 * 若从 index.ts 导入，会顺带把 9 个 Level 题库文件全部拉进主 chunk。
 * 运行时按 Level 经 import.meta.glob 懒加载 t<n>.ts，再把该 Level 的题库传给本函数。
 */

/** `<chapterId>-q<n>` 的序号提取；不匹配返回 null（由调用方抛错） */
function questionNumber(chapterId: string, questionId: string): number | null {
  const prefix = `${chapterId}-q`;
  if (!questionId.startsWith(prefix)) return null;
  const suffix = questionId.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return null;
  return Number(suffix);
}

/**
 * 把题库注入章节数组：
 * - 仅替换 `quiz` 字段，章节其余字段与对象结构保持不变；
 * - 题库缺省的章节沿用原 quiz（空数组占位即合法）；
 * - 同 id 重复题只保留首条（dedupe），排序按题号而非声明顺序；
 * - 题 id 不符合 `<chapterId>-q<n>` 视为数据缺陷并抛错。
 */
export function applyStandardQuizBank(
  chapters: TheoryChapter[],
  bank: Readonly<Record<string, TheoryQuizQuestion[]>>,
): TheoryChapter[] {
  return chapters.map((chapter) => {
    const questions = bank[chapter.id];
    if (!questions || questions.length === 0) return chapter;

    const seen = new Set<string>();
    const numbered: { number: number; question: TheoryQuizQuestion }[] = [];
    for (const question of questions) {
      const number = questionNumber(chapter.id, question.id);
      if (number === null) {
        throw new Error(
          `[theory] 题库题 id 非法：${question.id}（章节 ${chapter.id} 要求 ${chapter.id}-q<n>）`,
        );
      }
      if (seen.has(question.id)) continue;
      seen.add(question.id);
      numbered.push({ number, question });
    }
    const quiz = numbered.toSorted((a, b) => a.number - b.number).map((entry) => entry.question);
    return { ...chapter, quiz };
  });
}
