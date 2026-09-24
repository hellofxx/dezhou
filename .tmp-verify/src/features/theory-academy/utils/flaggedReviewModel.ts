import type { TFunction } from 'i18next';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import type { PokerVariant } from '@/shared/types/elo';
import type { TheoryChapter, TheoryLevelInfo, TheoryQuizQuestion } from '../types';
import { findChapterById, findLevelByChapterId } from './theoryProgress';
import { theoryQuizQuestionKey } from './contentKeys';
import { theoryChapterRoute, theoryReviewItemId } from './theorySrs';

/**
 * 疑难标记（progress.flaggedQuestions，仅存题 id）→ 复习清单条目（纯函数派生层）。
 *
 * 三条口径约束：
 * 1. **题 id → 章节 id 反解**依赖题库命名契约 `${chapterId}-q<n>`（见 data/levels/**），
 *    反解后仍须 findChapterById + 成员校验双重确认，任一失败即视为脏 id 静默跳过 ——
 *    用户存档可能残留已删题，本页不得白屏或抛错。
 * 2. 题干走 **i18n key + 数据层原文兜底**（复用 contentKeys 单源生成函数），与 theorySrs.ts 的
 *    语言中立载荷口径一致，禁止把某一语言的译文写进模型；变体字段同样只存枚举值
 *    （渲染层经 t('variant.name.<variant>') 解析）。解析文本本页不展示（复习动作 = 回章节重读），
 *    故模型不携带 explanationKey，避免无人消费的死数据。
 * 3. 与 SRS 队列只做**只读联结**（按 theory:<questionId> 命中），用于展示「上次复习/下次复习」
 *    与提示已入队；本页绝不调用 addReviewItem / recordAnswer / updateElo ——
 *    判分与调度权归章末小测（TheoryChapterView），否则同一题会被两处重复入队。
 */

/** 单条疑难复习条目（chapter/level 直挂数据对象，供渲染层复用既有 title 解析函数） */
export interface FlaggedReviewEntry {
  questionId: string;
  question: TheoryQuizQuestion;
  chapter: TheoryChapter;
  level: TheoryLevelInfo;
  variant: PokerVariant;
  /** 题干 i18n key（theory.quiz.<id>.question） */
  questionKey: string;
  /** 所属章节页路由（复用 theorySrs.theoryChapterRoute 单源） */
  route: string;
  /** 该题在 SRS 队列中的复习项 id（theory:<questionId>） */
  srsItemId: string;
  /** 是否已在 SRS 复习队列中（小测答错后自动入队） */
  inSrsQueue: boolean;
  /** 队列内上次复习时间戳；未入队或从未复习过为 undefined */
  lastReviewedAt?: number;
  /** 队列内下次复习日期 YYYY-MM-DD；未入队为 undefined */
  nextReviewDate?: string;
}

/**
 * 由题 id 反解所属章节 id：剥掉 `-q<n>` 题号后缀。
 * 不匹配后缀时原样返回（交由章节查找 + 成员校验兜住，绝不猜）。
 */
export function chapterIdFromQuestionId(questionId: string): string {
  return questionId.replace(/-q\d+$/, '');
}

/** 该题在所属章节 quiz 中的下标，用于同章节内稳定排序（成员校验已保证结果 ≥ 0） */
function questionIndex(question: TheoryQuizQuestion, chapter: TheoryChapter): number {
  return chapter.quiz.indexOf(question);
}

/**
 * 把疑难标记题 id 列表映射为可渲染条目列表。
 * @param flaggedQuestions progress.flaggedQuestions（题 id）
 * @param reviewItems      progress.reviewItems（SRS 队列，只读联结）
 * @returns 按 Level → 章节 order → 题号稳定排序的条目；脏 id 与重复 id 已剔除
 */
export function buildFlaggedReviewEntries(
  flaggedQuestions: readonly string[],
  reviewItems: readonly ReviewItem[],
): FlaggedReviewEntry[] {
  const queueById = new Map<string, ReviewItem>();
  for (const item of reviewItems) queueById.set(item.id, item);

  const seen = new Set<string>();
  const entries: FlaggedReviewEntry[] = [];

  for (const questionId of flaggedQuestions) {
    if (seen.has(questionId)) continue;
    const chapter = findChapterById(chapterIdFromQuestionId(questionId));
    if (!chapter) continue;
    const question = chapter.quiz.find((q) => q.id === questionId);
    if (!question) continue;
    const level = findLevelByChapterId(chapter.id);
    if (!level) continue;

    const srsItemId = theoryReviewItemId(questionId);
    const queued = queueById.get(srsItemId);
    seen.add(questionId);
    entries.push({
      questionId,
      question,
      chapter,
      level,
      variant: chapter.variant,
      questionKey: theoryQuizQuestionKey(questionId),
      route: theoryChapterRoute(chapter.id),
      srsItemId,
      inSrsQueue: queued !== undefined,
      lastReviewedAt: queued?.lastReviewedAt,
      nextReviewDate: queued?.nextReviewDate,
    });
  }

  return entries.toSorted((a, b) => {
    if (a.level.level !== b.level.level) return a.level.level - b.level.level;
    if (a.level.id !== b.level.id) return a.level.id.localeCompare(b.level.id);
    if (a.chapter.order !== b.chapter.order) return a.chapter.order - b.chapter.order;
    return questionIndex(a.question, a.chapter) - questionIndex(b.question, b.chapter);
  });
}

/** 解析题干文案：key 命中取当前语言译文，否则回退数据层原文（与 contentKeys 同口径） */
export function resolveFlaggedQuestionText(t: TFunction, entry: FlaggedReviewEntry): string {
  return t(entry.questionKey, { defaultValue: entry.question.question });
}
