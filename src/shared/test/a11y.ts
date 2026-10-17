/**
 * 组件级 a11y 测试工具（jsdom + axe-core）
 *
 * @module shared/test/a11y
 * @description 两个既有 a11y 测试（MobileNav / Dialog）曾整块禁用 8 条 page-level 规则，
 * 导致「元素不在 landmark 内 / 缺 h1 / 缺文档标题」这类真问题在组件测试里永远看不见。
 * 本工具改为**默认启用全部 axe 规则**，并约定组件渲染进
 * `<main><h1>Test</h1>{component}</main>` harness —— 有了 main 与 h1，
 * region / landmark-one-main / page-has-heading-one 即可真实生效；
 * document-title / html-has-lang / html-lang-valid 由 configureA11yDocument() 提供。
 *
 * 豁免只允许逐条、带理由（A11yRuleExemption.reason 为空直接抛错），
 * 现存唯一合法豁免是 `bypass`：skip link 是整页概念，组件级 harness 里不存在
 * 「跳到主内容」这类跨页跳转，因此该规则在组件测试中不适用。
 */

import axe from 'axe-core';
import { expect } from 'vitest';

export interface A11yRuleExemption {
  /** axe 规则 id（如 'bypass'） */
  id: string;
  /** 豁免理由：必填，留空即抛错，避免退回无理由的全量禁用 */
  reason: string;
}

export interface A11yRunOptions {
  disableRules?: A11yRuleExemption[];
}

/** 组件级 harness 的标题（与测试里 <h1>Test</h1> 语义一致，仅用于 document.title） */
const HARNESS_DOCUMENT_TITLE = 'Poker Training Platform — 组件 a11y 测试';

/**
 * 设置扫描所需的文档级 a11y 上下文：document.title 与 <html lang>。
 * 页面级规则（document-title / html-has-lang / html-lang-valid）依赖它们。
 */
export function configureA11yDocument(): void {
  document.title = HARNESS_DOCUMENT_TITLE;
  document.documentElement.lang = 'zh-CN';
}

/**
 * 运行 axe（默认启用全部规则，仅显式豁免项被关闭）。
 * @param context 扫描上下文：普通组件传 harness 容器；Portal 组件（Dialog）传 document.body
 */
export async function runA11y(
  context: HTMLElement,
  options: A11yRunOptions = {},
): Promise<axe.AxeResults> {
  configureA11yDocument();

  const rules: Record<string, { enabled: boolean }> = {};
  for (const exemption of options.disableRules ?? []) {
    if (!exemption.reason.trim()) {
      throw new Error(`axe 规则豁免必须写明理由：${exemption.id}`);
    }
    rules[exemption.id] = { enabled: false };
  }

  return axe.run(context, { rules });
}

/**
 * 断言无 axe 违规；失败时输出 id / impact / 命中节点，便于定位。
 * 返回 results 供调用方补充断言。
 */
export async function expectNoA11yViolations(
  context: HTMLElement,
  options: A11yRunOptions = {},
): Promise<axe.AxeResults> {
  const results = await runA11y(context, options);
  const details = results.violations
    .map(
      (violation) =>
        `- ${violation.id} [${violation.impact ?? 'n/a'}] ${violation.help}\n  ${violation.nodes
          .map((node) => node.target.join(' '))
          .join('\n  ')}`,
    )
    .join('\n');

  expect(results.violations, `axe 检出可访问性违规:\n${details}`).toEqual([]);
  return results;
}
