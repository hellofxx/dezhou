/**
 * 推荐项展示文案解析器（DailyTrainingPlan 计划卡 / NewbiePathCard 学习路径卡共用）。
 *
 * 抽为独立文件的唯一理由：渲染推荐文案的入口有两条，必须共用同一份解析口径。
 * 曾发生 Dashboard 侧自行 t() 而漏掉复习项 label，把裸 i18n key 直接显示给用户
 * （浏览器实测：学习路径卡渲染出 "theory.quiz.t1-combinatorics-q1.question"）。
 *
 * 两条要点：
 * 1. 复习项的 itemLabels 多为跨模块 i18n key，而 descReview 模板为 "{{items}}"；
 *    i18next **不递归翻译插值值**，故 items 必须逐条 t() 后再拼接，否则插进去的是 key 字面量。
 *    （本条即裸键泄漏的真实根因，与 useMemo 无关：react-i18next 在 store 'added' 时会
 *    bump 内部 revision、t 引用随之更新，故依赖 [recs, t] 的 memo 本会重算。）
 * 2. 因此解析口径只此一份，且由**渲染该推荐的组件在渲染期自行调用**，
 *    调用方不得各自抄一份 t() 逻辑 —— 历史上正是"第二条路径自己 t() 但漏了 label"导致泄漏。
 */
import type { TFunction } from 'i18next';
import type { DailyRecommendation } from './dailyTrainingPlan';

export function resolveRecommendationText(
  rec: DailyRecommendation,
  t: TFunction,
): { title: string; description: string } {
  const rawTitle = t(rec.title, rec.titleParams);
  // i18n key 缺失回退：i18next 原样返回 key 时改用数据层硬编码兜底 titleParams.title
  const title = rawTitle === rec.title ? String(rec.titleParams?.title ?? rawTitle) : rawTitle;
  const descParams =
    rec.type === 'review'
      ? { ...rec.descParams, items: rec.itemLabels.map((label) => t(label)).join('、') }
      : rec.descParams;
  return { title, description: t(rec.description, descParams) };
}
