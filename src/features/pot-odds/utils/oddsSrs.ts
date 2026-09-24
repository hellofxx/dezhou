import type { PotOddsQuizQuestion } from '../types';

/**
 * 赔率训练答题 → SRS 复习项载荷构造（纯函数，无 store 依赖，可直接单测）。
 *
 * 语言契约（与 `theory-academy/utils/theorySrs.ts` 同款）：
 * `label` 与 `metadata.front/back/options[].text` 一律存 **i18n key**，由渲染层
 * （`ReviewSession` / `SpacedRepetitionPanel`）经 `t()` 解析。
 *
 * 题库 `data/quizQuestions.ts` 已全量 key 化（`potOdds.quizBank.qN.*`），故此处
 * **直接透传 key，禁止对 key 做任何截断、拼接或取子串**：
 * 历史实现用 `scenario.slice(0, 40)` 做摘要，产出形如 `potOdds.quizBank.q1.scenar…`
 * 的残缺 key，i18next 无法命中、原样回显入参，导致中英文界面的复习卡片都显示裸 key 片段。
 */
export interface OddsReviewItemInput {
  id: string;
  label: string;
  metadata: {
    front: string;
    back: string;
    options: { text: string; isCorrect: boolean; explanation: string }[];
    source: 'odds';
    scenario: string;
  };
}

/** 赔率复习项 id 命名空间（与策略学院裸 lessonId、理论 `theory:` 前缀三方隔离） */
export const ODDS_REVIEW_ID_PREFIX = 'odds:';

/** 构造赔率复习项 id（`odds:<questionId>`，题 id 稳定故可作 SRS 键） */
export function oddsReviewItemId(questionId: number | string): string {
  return `${ODDS_REVIEW_ID_PREFIX}${questionId}`;
}

/**
 * 把一道赔率题转为复习项载荷。
 *
 * `metadata.back` 取正确选项文本（key），供自评模式对照；多选题模式下渲染层优先用
 * `metadata.options` 判分，`back` 不参与判分。
 */
export function buildOddsReviewItemInput(question: PotOddsQuizQuestion): OddsReviewItemInput {
  const correct = question.options.find((o) => o.isCorrect);
  return {
    id: oddsReviewItemId(question.id),
    label: question.scenario,
    metadata: {
      front: question.question,
      back: correct?.text ?? '',
      options: question.options.map((o) => ({
        text: o.text,
        isCorrect: o.isCorrect,
        explanation: o.explanation,
      })),
      source: 'odds',
      scenario: question.scenario,
    },
  };
}
