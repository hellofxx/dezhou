import { describe, expect, it } from 'vitest';
import type { PokerVariant } from '@/shared/types/elo';
import {
  getLoadedTheoryLevel,
  getLoadedTheoryLevels,
  loadTheoryLevelById,
  loadTheoryLevelsForVariant,
  loadTheoryLevelsForVariants,
} from './loaders';
import { getLevelSummariesByVariant } from '../../utils/theoryMeta';
import { headsUpLevels } from './variants/heads-up';
import { applyTheoryContentBlocks } from './variants/applyContentBlocks';
import { applyTheoryQuizBank } from './variants/applyQuizBank';
import { composeVariantChapters } from './variants/composeVariantChapters';
import type { TheoryChapter, TheoryQuizQuestion } from '../../types';

/**
 * 完整数据懒加载映射守卫：
 * - 章节页按 Level 加载，单个 Level 不能串入其他章节；
 * - 全变体加载（疑难清单）与 manifest 的 Level/章节目录一致；
 * - 单挑：新章 / 独立题库 / 富文本块经 glob 并入后，loader 与静态聚合同序同内容。
 */

const VARIANTS: PokerVariant[] = ['standard', 'short-deck', 'heads-up'];

/** 组合/注入器单测的最小章节（正文与题库只放占位内容） */
function makeChapter(id: string, order: number, level: 1 | 2 = 2): TheoryChapter {
  return {
    id,
    level,
    order,
    title: id,
    subtitle: id,
    duration: '10 min',
    variant: 'heads-up',
    eloDimension: 'math',
    content: [{ type: 'text', content: id }],
    quiz: [],
  };
}

function makeQuestion(id: string): TheoryQuizQuestion {
  return { id, question: id, options: ['a', 'b'], correctIndex: 0, explanation: id };
}

describe('theory 完整数据按变体懒加载', () => {
  it('未加载时 getLoadedTheoryLevels 返回 null，且不会误报已就绪', () => {
    expect(getLoadedTheoryLevels(['short-deck'])).toBeNull();
  });

  it('按 Level 加载时只返回该 Level 的章节，与 manifest 一致', async () => {
    for (const variant of VARIANTS) {
      for (const summary of getLevelSummariesByVariant(variant)) {
        const level = await loadTheoryLevelById(summary.id);
        expect(level?.id).toBe(summary.id);
        expect(level?.variant).toBe(variant);
        const loadedIds = level?.chapters.map((chapter) => chapter.id) ?? [];
        const manifestIds = summary.chapters.map((chapter) => chapter.id);
        // 单挑新章由内容轨并行落地，manifest 在集成阶段由 `pnpm theory:manifest` 重跑：
        // 在此之前只允许 loader 比 manifest 多章（已登记章的顺序不变），不允许缺章或错序。
        if (variant === 'heads-up') {
          expect(loadedIds.filter((id) => manifestIds.includes(id))).toEqual(manifestIds);
        } else {
          expect(loadedIds).toEqual(manifestIds);
        }
        expect(getLoadedTheoryLevel(summary.id)).toBe(level);
      }
    }
  });

  it('未知 Level 返回 undefined', async () => {
    expect(await loadTheoryLevelById('t99')).toBeUndefined();
    expect(getLoadedTheoryLevel('t99')).toBeUndefined();
  });

  it('逐变体加载后与 manifest 的 Level/章节目录一致', async () => {
    for (const variant of VARIANTS) {
      const levels = await loadTheoryLevelsForVariant(variant);
      const summary = getLevelSummariesByVariant(variant);
      expect(levels.map((level) => level.id)).toEqual(summary.map((level) => level.id));
      const loadedIds = levels.flatMap((level) => level.chapters).map((chapter) => chapter.id);
      const manifestIds = summary.flatMap((level) => level.chapters).map((chapter) => chapter.id);
      if (variant === 'heads-up') {
        expect(loadedIds.filter((id) => manifestIds.includes(id))).toEqual(manifestIds);
      } else {
        expect(loadedIds).toEqual(manifestIds);
      }
    }
  });

  it('全部变体加载后按入参顺序拼接；多变体批量加载去重', async () => {
    const levels = await loadTheoryLevelsForVariants(['heads-up', 'standard', 'heads-up']);
    expect(getLoadedTheoryLevels(['heads-up', 'standard'])).toEqual(levels);
    expect(levels[0]?.variant).toBe('heads-up');
  });

  it('单挑：loader 章节顺序与静态聚合一致（新章经 glob 并入并按 order 排序）', async () => {
    const loaded = await loadTheoryLevelsForVariant('heads-up');
    expect(loaded.map((level) => level.chapters.map((chapter) => chapter.id))).toEqual(
      headsUpLevels.map((level) => level.chapters.map((chapter) => chapter.id)),
    );
    for (const level of loaded) {
      const orders = level.chapters.map((chapter) => chapter.order);
      expect(orders, level.id).toEqual(orders.toSorted((left, right) => left - right));
    }
  });

  it('单挑：题库与富文本块在运行时路径已注入（与静态聚合逐章一致）', async () => {
    const loaded = await loadTheoryLevelsForVariant('heads-up');
    const runtime = new Map(
      loaded.flatMap((level) => level.chapters).map((chapter) => [chapter.id, chapter]),
    );
    for (const staticChapter of headsUpLevels.flatMap((level) => level.chapters)) {
      const injected = runtime.get(staticChapter.id);
      expect(injected, staticChapter.id).toBeDefined();
      expect(injected?.quiz, `${staticChapter.id} quiz`).toEqual(staticChapter.quiz);
      expect(injected?.content.length, `${staticChapter.id} content`).toBe(
        staticChapter.content.length,
      );
    }
  });
});

describe('变体章节组合（composeVariantChapters）', () => {
  const practice = {
    't2hu-x': { lessons: [{ id: 'l4hu-gto-basics', title: '单挑 GTO 基础' }] },
  };

  it('核心章与额外章按 order 升序合并，并附加章节级实践推荐', () => {
    const chapters = composeVariantChapters({
      core: [makeChapter('t2hu-a', 1), makeChapter('t2hu-x', 4)],
      extra: [makeChapter('t2hu-c', 3), makeChapter('t2hu-b', 2)],
      practice,
    });
    expect(chapters.map((chapter) => chapter.id)).toEqual([
      't2hu-a',
      't2hu-b',
      't2hu-c',
      't2hu-x',
    ]);
    expect(chapters[3]?.practiceRecommendations).toEqual(practice['t2hu-x']);
    expect(chapters[0]?.practiceRecommendations).toBeUndefined();
  });

  it('富文本块追加在 content 尾部；题库替换 quiz 并按题号升序，源数据不被改写', () => {
    const core = [makeChapter('t2hu-a', 1), makeChapter('t2hu-b', 2)];
    const blocks = { 't2hu-a': [{ type: 'takeaway' as const, content: '要点' }] };
    const quizBank = {
      't2hu-a': [
        makeQuestion('t2hu-a-q3'),
        makeQuestion('t2hu-a-q1'),
        makeQuestion('t2hu-a-q2'),
      ],
    };
    const composed = composeVariantChapters({ core, blocks, quizBank, strictQuizBank: true });

    expect(composed[0]?.content.map((section) => section.content)).toEqual(['t2hu-a', '要点']);
    expect(composed[0]?.quiz.map((question) => question.id)).toEqual([
      't2hu-a-q1',
      't2hu-a-q2',
      't2hu-a-q3',
    ]);
    // 未登记题库/块的章节原样返回（内容轨并行期题库可能尚未落地）
    expect(composed[1]?.content).toBe(core[1]?.content);
    expect(composed[1]?.quiz).toEqual([]);
    expect(core[0]?.content).toHaveLength(1);
    expect(core[0]?.quiz).toEqual([]);
  });

  it('题库 strict：未知章节键抛错；非 strict 时静默忽略', () => {
    const core = [makeChapter('t2hu-a', 1)];
    const quizBank = { 't2hu-missing': [makeQuestion('t2hu-missing-q1')] };
    expect(() => composeVariantChapters({ core, quizBank, strictQuizBank: true })).toThrow(
      /未知章节/,
    );
    expect(composeVariantChapters({ core, quizBank })[0]).toBe(core[0]);
  });

  it('题 id 不符合 <chapterId>-q<n> 或章节 id 重复时抛错', () => {
    expect(() =>
      composeVariantChapters({
        core: [makeChapter('t2hu-a', 1)],
        quizBank: { 't2hu-a': [makeQuestion('t2hu-a-1')] },
      }),
    ).toThrow(/题 id 非法/);
    expect(() =>
      composeVariantChapters({
        core: [makeChapter('t2hu-a', 1)],
        extra: [makeChapter('t2hu-b', 2), makeChapter('t2hu-b', 3)],
      }),
    ).toThrow(/章节 id 重复/);
  });

  it('额外章与核心章撞名时以核心章为准（Level 文件显式 import 与 chapters/ glob 两种写法并存）', () => {
    const core = [makeChapter('t2hu-a', 1)];
    const chapters = composeVariantChapters({
      core,
      extra: [makeChapter('t2hu-a', 2), makeChapter('t2hu-b', 3)],
    });
    expect(chapters.map((chapter) => chapter.id)).toEqual(['t2hu-a', 't2hu-b']);
    expect(chapters[0]).toBe(core[0]);
  });

  it('空表注入不改动章节对象（变体通用注入器）', () => {
    const core = [makeChapter('t2hu-a', 1)];
    expect(applyTheoryContentBlocks(core, {})[0]).toBe(core[0]);
    expect(applyTheoryQuizBank(core, {})[0]).toBe(core[0]);
  });
});
