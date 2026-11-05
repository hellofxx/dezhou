import { describe, expect, it } from 'vitest';
import { loadTheoryLevelsForVariant } from '../../loaders';
import type { TheoryChapter } from '../../../../types';
import { headsUpLevels } from './index';

/**
 * 单挑「静态聚合（eager glob）↔ 运行时 loader（按 Level 懒加载）」双路径一致性守卫。
 *
 * 两条路径各自收集 core 章、`chapters/t*hu-*.ts` 新章、`quizBank/t*hu.ts` 题库与
 * `blocks/t*hu.ts` 块，再走同一个 `composeVariantChapters`。任一侧漏收的表现是
 * 「目录 37 章但章节页少题少章」——静态守卫（theoryIntegrity）抓不到这类分叉，
 * 因此这里对 id/order/content/quiz 做深比较。
 */

/** 投影出会随注入链变化的字段（其余字段两条路径同源，不重复比较） */
function project(chapter: TheoryChapter) {
  return {
    id: chapter.id,
    level: chapter.level,
    order: chapter.order,
    title: chapter.title,
    content: chapter.content,
    quiz: chapter.quiz,
    objectives: chapter.objectives,
    practiceRecommendations: chapter.practiceRecommendations,
  };
}

describe('单挑：静态聚合与运行时 loader 一致', () => {
  it('Level 划分与章节 id/order 完全一致（含新章并入顺序）', async () => {
    const runtime = await loadTheoryLevelsForVariant('heads-up');
    expect(runtime.map((level) => level.id)).toEqual(headsUpLevels.map((level) => level.id));
    expect(runtime.map((level) => level.chapters.map((c) => [c.id, c.order]))).toEqual(
      headsUpLevels.map((level) => level.chapters.map((c) => [c.id, c.order])),
    );
  });

  it('逐章正文/小测/目标/实践推荐深比较（题库与富文本块注入同结果）', async () => {
    const runtime = await loadTheoryLevelsForVariant('heads-up');
    expect(runtime.flatMap((level) => level.chapters).map(project)).toEqual(
      headsUpLevels.flatMap((level) => level.chapters).map(project),
    );
  });

  it('章节 id 全局唯一（core 章与 chapters/ 文件撞名时组合层已抛错，这里再兜一层）', async () => {
    const runtime = await loadTheoryLevelsForVariant('heads-up');
    const ids = runtime.flatMap((level) => level.chapters).map((chapter) => chapter.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('每章正文非空：题库/块文件为空态时不丢章、不丢正文', () => {
    for (const level of headsUpLevels) {
      expect(level.chapters.length, level.id).toBeGreaterThan(0);
      for (const chapter of level.chapters) {
        expect(chapter.content.length, chapter.id).toBeGreaterThan(0);
        expect(Array.isArray(chapter.quiz), `${chapter.id} quiz`).toBe(true);
      }
    }
  });
});
