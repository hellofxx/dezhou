import { useEffect } from 'react';
import { loadTheoryContentForQuestionIds, preloadI18n } from '@/i18n/preload';
import type { I18nModuleKey } from '@/i18n/moduleRegistry';
import type { ReviewItem, ReviewItemMetadata } from '@/shared/utils/spacedRepetition';

/**
 * 复习项渲染前置：确保其 label / metadata.front|back 所含 i18n key 的翻译包已就绪。
 *
 * 背景（语言契约）：复习项持久化载荷刻意只存 i18n key（语言中立，见 theorySrs.ts），
 * 渲染层经 t() 解析。但 i18next 的翻译包按路由懒加载（见 moduleRegistry.FEATURE_GROUPS），
 * 而复习队列 / 复习会话渲染在 Dashboard（'/'）与 progress 路由上 —— 这些分组不含
 * theory / rangeTrainer / potOdds / gto。冷启动直达首页时包尚未注入，
 * t(key) 会原样回显 key 字面量（中英皆错），比回显中文更糟。
 *
 * 故在渲染处按需补加载：preloadI18n 幂等，注入后 addResourceBundle 触发 store 'added'，
 * config.ts 已配 bindI18nStore: 'added removed' → 所有 useTranslation 组件自动重渲染，
 * 无需本地 loading 态即可从 key 字面量刷新为译文。
 *
 * 代价：仅在确有该来源的到期复习项时才拉取（theory 核心包约 24KB，另按 level 补内容包）。
 * 'strategy' 的 academy 属 CORE_MODULES（启动即加载），无需列出。
 */
const SOURCE_I18N_MODULE: Partial<Record<NonNullable<ReviewItemMetadata['source']>, I18nModuleKey>> =
  {
    theory: 'theory',
    range: 'rangeTrainer',
    odds: 'potOdds',
    gto: 'gto',
  };

/** 收集一组复习项需要补加载的翻译包（去重，未知/无 source 项忽略） */
export function collectReviewSourceModules(
  items: readonly ReviewItem[],
): I18nModuleKey[] {
  const keys = new Set<I18nModuleKey>();
  for (const item of items) {
    const source = item.metadata?.source;
    const key = source ? SOURCE_I18N_MODULE[source] : undefined;
    if (key) keys.add(key);
  }
  return [...keys].toSorted();
}

const THEORY_QUIZ_KEY_RE = /^theory\.quiz\.(.+)\.(?:question|explanation|options\.\d+)$/;

/** 从复习项 key 载荷中提取理论题 id（label / metadata.front|back） */
export function collectTheoryQuestionIds(items: readonly ReviewItem[]): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    for (const value of [item.label, item.metadata?.front, item.metadata?.back]) {
      if (typeof value !== 'string') continue;
      const match = THEORY_QUIZ_KEY_RE.exec(value);
      if (match?.[1]) ids.add(match[1]);
    }
  }
  return [...ids].toSorted();
}

/**
 * 按需补加载复习项来源模块的翻译包（theory 另按 level 加载课程内容包）。
 * @param items 当前正在渲染的复习项（队列或会话均可）
 */
export function useEnsureReviewSourceI18n(items: readonly ReviewItem[]): void {
  // items 每次渲染都是新数组，故以序列化结果作依赖，避免每渲染周期重复触发加载
  const modules = collectReviewSourceModules(items).join(',');
  const theoryQuestions = collectTheoryQuestionIds(items).join(',');
  const dependency = `${modules}|${theoryQuestions}`;

  useEffect(() => {
    if (dependency === '|') return;
    const tasks: Promise<unknown>[] = [];
    if (modules) tasks.push(preloadI18n(modules.split(',') as I18nModuleKey[]));
    if (theoryQuestions) tasks.push(loadTheoryContentForQuestionIds(theoryQuestions.split(',')));
    // 加载失败不阻断渲染（i18next 回显 key 字面量）；两侧加载器均内置失败可重试
    void Promise.all(tasks).catch(() => undefined);
  }, [dependency, modules, theoryQuestions]);
}
