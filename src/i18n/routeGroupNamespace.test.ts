/**
 * 路由组 i18n 命名空间覆盖守卫（静态契约）。
 *
 * 背景：反馈组件是跨模块共享的，路由组只声明「本页会渲染」的 feature 包；
 * 曾因 /range-trainer/quiz 未加载 mentor、/onboarding 未加载 rangeTrainer，
 * 导致页面直接渲染原始 i18n key。
 *
 * 为什么不用渲染型测试：component 项目 setup 会预加载 ALL_MODULES，
 * 任何渲染断言都会因全局缓存而通过，无法复现缺失命名空间。
 * 因此这里直接解析反馈组件的命名空间引用，与 CORE ∪ 路由组做集合校验。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CORE_MODULES, FEATURE_GROUPS, type I18nModuleKey } from './moduleRegistry';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

const QUIZ_CARD = 'src/shared/components/business/QuizCard.tsx';
const GTO_FEEDBACK = 'src/features/gto-simulator/components/GTOFeedback.tsx';

/** 路由组 → 在该路由渲染的反馈组件 */
const FEEDBACK_ROUTES: { group: keyof typeof FEATURE_GROUPS; components: string[] }[] = [
  { group: '/onboarding', components: [QUIZ_CARD] },
  { group: '/range-trainer/quiz', components: [QUIZ_CARD] },
  { group: '/gto-simulator', components: [GTO_FEEDBACK] },
  { group: '/gto-simulator/session/:scenarioId', components: [GTO_FEEDBACK] },
  { group: '/gto-simulator/result/:sessionId', components: [GTO_FEEDBACK] },
];

/**
 * 提取组件直接引用的命名空间：
 * - t('ns.key') / Trans i18nKey="ns.key"
 * - 通过共享反馈组件间接消费的命名空间（renderMentorFeedback → mentor 等）
 */
function extractNamespaces(source: string): Set<string> {
  const namespaces = new Set<string>();
  const patterns = [
    /\bt\(\s*['"]([A-Za-z0-9_-]+)\./g,
    /i18nKey=["']([A-Za-z0-9_-]+)\./g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) namespaces.add(match[1]);
    }
  }
  if (source.includes('renderMentorFeedback')) namespaces.add('mentor');
  if (source.includes('GRADE_DISPLAY_CONFIG')) namespaces.add('feedback');
  if (source.includes('DecisionAnalysis') || source.includes('TryAgainButton')) namespaces.add('feedback');
  if (source.includes('MobileFeedbackSheet') || source.includes('PositionBadge')) namespaces.add('common');
  if (source.includes('actionTerm')) namespaces.add('gto');
  return namespaces;
}

describe('反馈路由组命名空间覆盖', () => {
  it('mentor 属于 core（QuizCard / GTOFeedback 跨模块消费）', () => {
    expect(CORE_MODULES).toContain('mentor');
  });

  it('/onboarding 加载 rangeTrainer（FirstDrillStep 复用 QuizCard）', () => {
    expect(FEATURE_GROUPS['/onboarding']).toContain('rangeTrainer');
  });

  it.each(FEEDBACK_ROUTES)('$group 的 CORE ∪ 路由组覆盖组件所需命名空间', ({ group, components }) => {
    const available = new Set<I18nModuleKey>([
      ...CORE_MODULES,
      ...FEATURE_GROUPS[group],
    ]);
    for (const component of components) {
      const source = readFileSync(resolve(ROOT, component), 'utf8');
      const required = extractNamespaces(source);
      const missing = [...required].filter((ns) => !available.has(ns as I18nModuleKey));
      expect(missing, `${group} 渲染 ${component} 缺少命名空间：${missing.join(', ')}`).toEqual([]);
    }
  });
});
