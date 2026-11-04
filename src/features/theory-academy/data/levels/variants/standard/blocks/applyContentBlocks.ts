import type { TheoryChapter, TheorySection } from '../../../../../types';

/**
 * 富文本块追加器（无副作用纯函数，单独成文件，避免运行时路径把 9 个 Level 文件全拉进主包）。
 *
 * 追加式契约：块只能接在章节既有 content 尾部。正文段落 i18n key 是下标型
 * （`theory.content.<chapterId>.<index>`），任何插入或重排都会让 zh/en 数组错位，
 * 因此这里只做 `[...chapter.content, ...blocks]`，绝不插入、绝不改序。
 */
export function applyStandardContentBlocks(
  chapters: TheoryChapter[],
  blocks: Readonly<Record<string, TheorySection[]>>,
): TheoryChapter[] {
  return chapters.map((chapter) => {
    const appended = blocks[chapter.id];
    if (!appended || appended.length === 0) return chapter;
    return { ...chapter, content: [...chapter.content, ...appended] };
  });
}
