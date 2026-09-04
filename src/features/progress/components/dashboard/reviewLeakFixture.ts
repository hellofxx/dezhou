/**
 * 测试专用夹具（仅被 *.test.tsx 引用，不进应用依赖图）。
 *
 * 构造「到期、label/front/back 均为理论题库 i18n key」的复习项，
 * 形态与 theory-academy 实际入队载荷一致（见 theorySrs.ts 的语言中立契约）。
 */
import { act } from 'react';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { createReviewItem, getTodayString } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

/** q1 题干的双语文案（与 locales/{zh,en}/theory.json 逐字对齐，用作渲染结果断言基准） */
export const THEORY_QUESTION_TEXT: Record<'zh' | 'en', string> = {
  zh: '德州扑克起手牌的总组合数是多少？',
  en: "What is the total number of starting-hand combinations in Texas Hold'em?",
};

export function theoryQuestionKey(quizId: string): string {
  return `theory.quiz.${quizId}.question`;
}

/** @param quizId theory.json 中真实存在的题目 id（如 t1-combinatorics-q1） */
export function buildTheoryReviewFixture(quizId = 't1-combinatorics-q1'): ReviewItem {
  const key = theoryQuestionKey(quizId);
  return {
    ...createReviewItem(`theory:${quizId}`, key, 'theory', {
      source: 'theory',
      route: `/theory/chapter/${quizId.replace(/-q\d+$/, '')}`,
      front: key,
      back: key.replace(/\.question$/, '.explanation'),
    }),
    // createReviewItem 默认 nextReviewDate = 明天，此处改为今日到期
    nextReviewDate: getTodayString(),
  };
}

/**
 * 切到目标语言并等待其 theory 包就绪。
 * 必须显式 preloadI18n：preload.ts 对 languageChanged 的补加载是 fire-and-forget
 * （见 preload.ts 末尾 i18n.on('languageChanged')），测试内不 await 会读到 zh 兜底译文。
 */
export async function setLanguage(lng: 'zh' | 'en'): Promise<void> {
  await act(async () => {
    await preloadI18n(['theory'], lng);
    await i18n.changeLanguage(lng);
  });
}
