/**
 * TheoryVariantRuleCard 契约（jsdom）。
 *
 * 覆盖：① 单挑章渲染规则卡，标题 / 副标题 / 六行（固定顺序）文案取 `variant.headsUpRules.*` 译文，
 * 期望值一律经 `i18n.t` 取，不在测试里写死中文；② 标准 / 短牌章节即使带了规则数据也不渲染
 * （变体判定在包装层，共享卡不做分派）；③ 章节未挂 `variantRules` 时回退 shared `headsUpRules`；
 * ④ `variantRules` 为空对象不崩且不补默认方向行；⑤ DOM 不出现裸 `variant.headsUpRules` key；
 * ⑥ 章节页把本卡插在正文（`chapter.content.map`）之前、header 之外（源码级定位断言）。
 *
 * 未覆盖：真实浏览器下的动效与窄屏排版（Q2 浏览器验证）。
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { headsUpRules } from '@/shared/constants/headsUpRules';
import type { PokerVariant } from '@/shared/types/elo';
import type { VariantRuleInfo } from '@/shared/types/variantRules';
import { TheoryVariantRuleCard } from './TheoryVariantRuleCard';

MotionGlobalConfig.skipAnimations = true;

/** 与 shared 纯函数 `buildHeadsUpRuleRows` 的固定行顺序一致（数据齐备时） */
const FULL_ROWS = ['players', 'deckSize', 'preflopFirst', 'postflopFirst', 'blinds', 'ante'];

const LABEL_KEYS = [
  'variant.headsUpRules.playersLabel',
  'variant.headsUpRules.deckSizeLabel',
  'variant.headsUpRules.preflopFirstLabel',
  'variant.headsUpRules.postflopFirstLabel',
  'variant.headsUpRules.blindsLabel',
  'variant.headsUpRules.anteLabel',
] as const;

const HAN = /[㐀-鿿]/;

/** 章节页源码（raw glob：component 项目跑在 jsdom，import.meta.url 非 file scheme） */
const SOURCES = import.meta.glob<string>(['./TheoryChapterView.tsx'], {
  query: '?raw',
  import: 'default',
  eager: true,
});

function mount(variant: PokerVariant, variantRules?: VariantRuleInfo) {
  return render(<TheoryVariantRuleCard chapter={{ variant, variantRules }} />);
}

const rowIds = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-variant-rule]')).map((node) =>
    node.getAttribute('data-variant-rule'),
  );

const textOf = (container: HTMLElement, selector: string) =>
  Array.from(container.querySelectorAll(selector)).map((node) => node.textContent);

afterEach(() => {
  cleanup();
  void i18n.changeLanguage('zh');
});

describe('TheoryVariantRuleCard', () => {
  it('单挑章渲染规则卡：标题 / 副标题 / 六行按固定顺序取译文', () => {
    const { container } = mount('heads-up', headsUpRules);

    const heading = container.querySelector('h3');
    expect(heading?.textContent).toBe(i18n.t('variant.headsUpRules.title'));
    expect(container.textContent).toContain(i18n.t('variant.headsUpRules.subtitle'));

    expect(rowIds(container)).toEqual(FULL_ROWS);
    expect(textOf(container, 'dt')).toEqual(LABEL_KEYS.map((key) => i18n.t(key)));
    // 前两行是语言中立值（人数 / 牌数），其余交 i18n 解析
    expect(textOf(container, 'dd')).toEqual([
      '2',
      '52',
      i18n.t('variant.headsUpRules.preflopFirstValue'),
      i18n.t('variant.headsUpRules.postflopFirstValue'),
      '0.5 / 1',
      i18n.t('variant.headsUpRules.anteYes'),
    ]);
  });

  it('方向值随 positionDynamics 派生：翻前指向 SB、翻后指向 BB', () => {
    const { container } = mount('heads-up', headsUpRules);

    const preflopValue = container.querySelector('[data-variant-rule="preflopFirst"] dd')?.textContent ?? '';
    const postflopValue = container.querySelector('[data-variant-rule="postflopFirst"] dd')?.textContent ?? '';
    expect(preflopValue).toMatch(/\bSB\b/);
    expect(postflopValue).toMatch(/\bBB\b/);
    // 布尔单源：规则数据说谁先，卡片就渲染谁（数据驱动，不在组件写散文）
    expect(headsUpRules.positionDynamics?.sbFirstActionPreflop).toBe(true);
    expect(headsUpRules.positionDynamics?.bbFirstActionPostflop).toBe(true);
  });

  it('标准 / 短牌章节不渲染（即便带了规则数据）', () => {
    for (const variant of ['standard', 'short-deck'] as const) {
      const { container } = mount(variant, headsUpRules);
      expect(container.firstChild, `${variant} 不应渲染规则卡`).toBeNull();
    }
  });

  it('章节未挂 variantRules 时回退 shared headsUpRules', () => {
    const { container } = mount('heads-up');

    expect(rowIds(container)).toEqual(FULL_ROWS);
    expect(textOf(container, 'dt')).toEqual(LABEL_KEYS.map((key) => i18n.t(key)));
  });

  it('variantRules 为空对象不崩：只渲染人数行，不补默认方向值', () => {
    const { container } = mount('heads-up', {});

    expect(rowIds(container)).toEqual(['players']);
    expect(container.textContent).not.toContain(i18n.t('variant.headsUpRules.postflopFirstLabel'));
    expect(container.textContent).not.toContain(i18n.t('variant.headsUpRules.preflopFirstLabel'));
  });

  it('zh 侧不泄漏裸 key', () => {
    const { container } = mount('heads-up', headsUpRules);
    expect(container.textContent).not.toContain('variant.headsUpRules');
  });

  it('en 侧全部取译文：无汉字、无裸 key', async () => {
    await i18n.changeLanguage('en');
    const { container } = mount('heads-up', headsUpRules);

    const text = container.textContent ?? '';
    expect(HAN.test(text), `en 侧含汉字：${text.slice(0, 80)}`).toBe(false);
    expect(text).not.toContain('variant.headsUpRules');
  });

  it('章节页把规则卡插在正文之前、header 之外', () => {
    const source = SOURCES['./TheoryChapterView.tsx'];
    expect(source, '未能读取 TheoryChapterView 源码').toBeTruthy();

    const headerIdx = source!.indexOf('<TheoryChapterHeader');
    const cardIdx = source!.indexOf('<TheoryVariantRuleCard');
    const contentIdx = source!.indexOf('chapter.content.map');
    expect(headerIdx).toBeGreaterThan(-1);
    expect(cardIdx, '章节页必须渲染 TheoryVariantRuleCard').toBeGreaterThan(-1);
    expect(contentIdx).toBeGreaterThan(-1);
    // header 先渲染，规则卡在 header 之后（不塞进 header），且在正文之前
    expect(cardIdx).toBeGreaterThan(headerIdx);
    expect(cardIdx).toBeLessThan(contentIdx);
  });
});
