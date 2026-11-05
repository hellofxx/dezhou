import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { AcademyVariantRuleCard, type AcademyVariantRuleItem } from '@/shared/components/academy';
import { headsUpRules } from '@/shared/constants/headsUpRules';
import {
  buildHeadsUpRuleRows,
  type VariantRuleLabelKey,
  type VariantRuleValueKey,
} from '@/shared/utils/academyVariantRules';
import type { TheoryChapter } from '../types';

/**
 * 单挑变体规则卡（理论章节页薄包装）。
 *
 * 分工：展示由两院共享的 `AcademyVariantRuleCard` 承担（零 i18n / 零 router / 零 store），
 * 本组件只做理论侧适配——变体判定（仅 heads-up 渲染）、规则数据回退
 * （`chapter.variantRules ?? shared headsUpRules`）与显式字面量 key 翻译。
 *
 * 行构造交给 shared 纯函数 `buildHeadsUpRuleRows`（顺序与省略规则单一事实源）：
 * 数据没说的行就不渲染，避免卡片写死方向、数据已改的双源漂移。
 * 方向值（翻前 / 翻后先行动）不在本文件写散文，只由 `positionDynamics` 布尔派生后取译文。
 * key 一律显式字面量（不用模板拼接）：模板 key 会绕过 staticKeyGuard 与 variantRuleCopyGuard。
 */

type VariantChapter = Pick<TheoryChapter, 'variant' | 'variantRules'>;

/** 行标签 key → 译文（switch 穷举 VariantRuleLabelKey，新增行类型时编译期即报缺失） */
function resolveLabel(t: TFunction, key: VariantRuleLabelKey): string {
  switch (key) {
    case 'variant.headsUpRules.playersLabel':
      return t('variant.headsUpRules.playersLabel');
    case 'variant.headsUpRules.deckSizeLabel':
      return t('variant.headsUpRules.deckSizeLabel');
    case 'variant.headsUpRules.preflopFirstLabel':
      return t('variant.headsUpRules.preflopFirstLabel');
    case 'variant.headsUpRules.postflopFirstLabel':
      return t('variant.headsUpRules.postflopFirstLabel');
    case 'variant.headsUpRules.blindsLabel':
      return t('variant.headsUpRules.blindsLabel');
    case 'variant.headsUpRules.anteLabel':
      return t('variant.headsUpRules.anteLabel');
    case 'variant.headsUpRules.contextStackLabel':
      return t('variant.headsUpRules.contextStackLabel');
    case 'variant.headsUpRules.contextAnteLabel':
      return t('variant.headsUpRules.contextAnteLabel');
    case 'variant.headsUpRules.contextButtonLabel':
      return t('variant.headsUpRules.contextButtonLabel');
  }
}

/** 行值 key → 译文（方向 / Ante 有无；其余行是语言中立数字或盲注记号，原样渲染） */
function resolveValue(t: TFunction, key: VariantRuleValueKey): string {
  switch (key) {
    case 'variant.headsUpRules.preflopFirstValue':
      return t('variant.headsUpRules.preflopFirstValue');
    case 'variant.headsUpRules.postflopFirstValue':
      return t('variant.headsUpRules.postflopFirstValue');
    case 'variant.headsUpRules.anteYes':
      return t('variant.headsUpRules.anteYes');
    case 'variant.headsUpRules.anteNo':
      return t('variant.headsUpRules.anteNo');
  }
}

export interface TheoryVariantRuleCardProps {
  /** 当前章节（只需变体与规则字段，整章传入亦可） */
  chapter: VariantChapter;
}

/**
 * 仅单挑章节渲染：其余变体（标准 / 短牌）返回 null，
 * 由调用方直接放进正文流，无需在外层再写变体分支。
 */
export function TheoryVariantRuleCard({ chapter }: TheoryVariantRuleCardProps) {
  const { t } = useTranslation();
  if (chapter.variant !== 'heads-up') return null;

  // 章节未挂规则时回退 shared 单源（heads-up 规则只此一份，理论侧只有重导出 shim）
  const rules = chapter.variantRules ?? headsUpRules;
  const items: AcademyVariantRuleItem[] = buildHeadsUpRuleRows(rules).map((row) => ({
    id: row.id,
    label: resolveLabel(t, row.labelKey),
    value: row.value ?? (row.valueKey ? resolveValue(t, row.valueKey) : ''),
  }));

  return (
    <AcademyVariantRuleCard
      title={t('variant.headsUpRules.title')}
      subtitle={t('variant.headsUpRules.subtitle')}
      items={items}
    />
  );
}
