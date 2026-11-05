/**
 * Heads-Up（单挑）理论 Level 聚合。
 * 各 Level 内容分散于 headsUpLevel1.ts ~ headsUpLevel9.ts（每 Level 单文件），
 * 本文件负责把「核心章 + 独立新章 + 章节级实践推荐 + 富文本块 + 独立题库」组合成 headsUpLevels。
 * ID 命名规则：t{level}hu-{topic}
 *
 * 新章（`chapters/t*hu-*.ts`）、题库（`quizBank/t*hu.ts`）、富文本块（`blocks/t*hu.ts`）
 * 一律由 eager glob 自动吸收：内容轨新增文件后无需改本文件，消除聚合清单上的写者冲突。
 * 组合顺序与运行时 loader 完全一致（见 variants/composeVariantChapters），
 * 由 `headsUpStaticRuntimeParity.test.ts` 深比较兜底。
 */
import type { TheoryChapter, TheoryLevelInfo } from '../../../../types';
import {
  collectChapterModules,
  collectContentBlocks,
  collectQuizBanks,
  composeVariantChapters,
  pickChapterEntries,
  type GlobModules,
} from '../composeVariantChapters';
import { CHAPTER_PRACTICE_RECOMMENDATIONS } from './chapterPracticeMap';
import { HEADS_UP_LEVEL_1 } from './headsUpLevel1';
import { HEADS_UP_LEVEL_2 } from './headsUpLevel2';
import { HEADS_UP_LEVEL_3 } from './headsUpLevel3';
import { HEADS_UP_LEVEL_4 } from './headsUpLevel4';
import { HEADS_UP_LEVEL_5 } from './headsUpLevel5';
import { HEADS_UP_LEVEL_6 } from './headsUpLevel6';
import { HEADS_UP_LEVEL_7 } from './headsUpLevel7';
import { HEADS_UP_LEVEL_8 } from './headsUpLevel8';
import { HEADS_UP_LEVEL_9 } from './headsUpLevel9';

/**
 * 章节级实践推荐引用的是策略学院变体课时 id 字符串，不产生模块 import；
 * 因变体课时不在策略学院 `LEVELS` 内、无法进任何白名单，存在性由
 * `strategy-academy/data/theoryVariantBridgeIntegrity.test.ts` 反向守卫。
 *
 * 目录为空（内容轨尚未落地）时三张表均为 `{}`，组合退化为「只给核心章附加实践推荐」，
 * 现有的核心章与内联 quiz 原样返回，不会因缺文件抛错。
 */
const EXTRA_CHAPTERS: TheoryChapter[] = collectChapterModules(
  import.meta.glob('./chapters/t*hu-*.ts', { eager: true }) as GlobModules,
);

const QUIZ_BANK = collectQuizBanks(
  import.meta.glob('./quizBank/t*hu.ts', { eager: true }) as GlobModules,
);

const CONTENT_BLOCKS = collectContentBlocks(
  import.meta.glob('./blocks/t*hu.ts', { eager: true }) as GlobModules,
);

/** 按章节 id 前缀取该 Level 的额外章（id 前缀是 Level 的唯一事实源，level 字段由完整性守卫校验） */
function extraChaptersOfLevel(level: number): TheoryChapter[] {
  const prefix = `t${level}hu-`;
  return EXTRA_CHAPTERS.filter((chapter) => chapter.id.startsWith(prefix));
}

/**
 * 单 Level 组合：核心章 + 新章按 order 排序 → 附加实践推荐 → 追加块 → 替换题库。
 * 题库按 Level 前缀切分后再注入并开启 strict：既让「题库写了某章而该章文件缺失」
 * 立刻抛错，又不会因为其他 Level 的题库键误报。
 */
function composeLevel(level: TheoryLevelInfo): TheoryLevelInfo {
  const prefix = `t${level.level}hu-`;
  return {
    ...level,
    chapters: composeVariantChapters({
      core: level.chapters,
      extra: extraChaptersOfLevel(level.level),
      practice: CHAPTER_PRACTICE_RECOMMENDATIONS,
      blocks: pickChapterEntries(CONTENT_BLOCKS, prefix),
      quizBank: pickChapterEntries(QUIZ_BANK, prefix),
      strictQuizBank: true,
    }),
  };
}

/** Heads-Up 全部 Level（T1-T9） */
export const headsUpLevels: TheoryLevelInfo[] = [
  HEADS_UP_LEVEL_1,
  HEADS_UP_LEVEL_2,
  HEADS_UP_LEVEL_3,
  HEADS_UP_LEVEL_4,
  HEADS_UP_LEVEL_5,
  HEADS_UP_LEVEL_6,
  HEADS_UP_LEVEL_7,
  HEADS_UP_LEVEL_8,
  HEADS_UP_LEVEL_9,
].map(composeLevel);
