import { mergeQuizBank } from '@/shared/utils/academyQuizBank';
import type { TheoryChapter, TheoryQuizQuestion } from '../../../types';

/**
 * 题库注入器（三变体共用，无副作用纯函数，单独成文件）。
 *
 * 合并逻辑来自两院共享 `mergeQuizBank`（替换 quiz、按 id 去重、可选排序/校验），
 * 本文件只保留理论侧口径：题 id 必须形如 `<chapterId>-q<n>`、结果按题号升序。
 *
 * 为什么与 index.ts 分离：loaders.ts（运行时路径）只需要注入函数；若从 index.ts 导入，
 * 会顺带把 9 个 Level 题库文件全部拉进主 chunk。运行时按 Level 经 import.meta.glob
 * 懒加载 `t<n>.ts` / `t<n>hu.ts`，再把该 Level 的题库传给本函数。
 */

export interface TheoryQuizBankOptions {
  /**
   * 未知章节键处理：true 时抛错（单挑静态聚合与运行时 loader 同口径 fail loud——
   * 题库写了某章而该章文件缺失，属数据缺陷，不能静默丢题）。
   * 缺省忽略：标准侧的未知键由 `data/theoryIntegrity.test.ts` 的白名单断言兜住。
   */
  strict?: boolean;
}

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
export function applyTheoryQuizBank(
  chapters: TheoryChapter[],
  bank: Readonly<Record<string, TheoryQuizQuestion[]>>,
  options: TheoryQuizBankOptions = {},
): TheoryChapter[] {
  // 题号在 validate 阶段解析一次（共享层回调按章节逐题调用），排序回调按 id 取回，
  // 从而在泛型比较器里保持「按 `<chapterId>-q<n>` 序号」的理论口径。
  const numbers = new Map<string, number>();
  return mergeQuizBank(chapters, bank, {
    onUnknownKey: options.strict
      ? (chapterId: string) => {
          throw new Error(`[theory] 题库存在未知章节：${chapterId}`);
        }
      : undefined,
    validate: (chapterId, question) => {
      const number = questionNumber(chapterId, question.id);
      if (number === null) {
        throw new Error(
          `[theory] 题库题 id 非法：${question.id}（章节 ${chapterId} 要求 ${chapterId}-q<n>）`,
        );
      }
      numbers.set(question.id, number);
    },
    sort: (a, b) => (numbers.get(a.id) ?? 0) - (numbers.get(b.id) ?? 0),
  });
}
