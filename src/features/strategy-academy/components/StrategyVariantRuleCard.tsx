import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  AcademyVariantRuleCard,
  type AcademyVariantRuleItem,
} from '@/shared/components/academy';
import { headsUpRules } from '@/shared/constants/headsUpRules';
import {
  buildHeadsUpRuleRows,
  type VariantRuleLabelKey,
  type VariantRuleRow,
  type VariantRuleRowId,
  type VariantRuleValueKey,
} from '@/shared/utils/academyVariantRules';
import type { Lesson } from '../types';

/** 课时级上下文行（共享纯函数在 `lesson.variantContext` 有值时才追加） */
const CONTEXT_ROW_IDS: readonly VariantRuleRowId[] = [
  'stackDepth',
  'anteStructure',
  'dealerButtonPosition',
];

/**
 * 行标签翻译：共享纯函数只产出 key，包装层用**字面量 key** 逐项展开。
 * 显式 switch 而非 `t(row.labelKey)` 模板调用，既让 staticKeyGuard 能静态校验词典，
 * 也让共享层新增行时在此处编译报错（强制同批补文案）。
 */
function translateLabel(t: TFunction, key: VariantRuleLabelKey): string {
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

/** 需要翻译的行值（方向 / Ante 有无）：同样逐项字面量展开 */
function translateValue(t: TFunction, key: VariantRuleValueKey): string {
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

/**
 * 行 → 卡片条目。语言中立值（人数 / 牌数 / 盲注 / 筹码深度 / 座位码）由共享纯函数原样透传，
 * 包装层不改写、不猜译名（新增上下文码时只动数据，不需要在此拼 key）。
 */
function toItems(t: TFunction, rows: VariantRuleRow[]): AcademyVariantRuleItem[] {
  return rows.map((row) => ({
    id: row.id,
    label: translateLabel(t, row.labelKey),
    value: row.valueKey ? translateValue(t, row.valueKey) : (row.value ?? ''),
  }));
}

export interface StrategyVariantRuleCardProps {
  /** 课时：只消费变体归属与课时上下文，不读正文/题库 */
  lesson: Pick<Lesson, 'variant' | 'variantContext'>;
}

/**
 * 单挑规则卡（策略学院薄包装，共享底座 `AcademyVariantRuleCard`）。
 *
 * 职责边界：共享层零 i18n/零 router/零 store，变体判定与文案都在本层——
 * 仅 `lesson.variant === 'heads-up'` 渲染，标准 / 短牌课时整块不出现（防止规则误标）。
 * 规则取值来自 shared `headsUpRules` 纯数据，方向行由 `buildHeadsUpRuleRows` 从布尔派生，
 * 本层不写死「翻前 SB 先 / 翻后 BB 先」散文；`lesson.variantContext` 有值时另起一张
 * 「本课上下文」卡（共享卡只有一个标题位，上下文需要可见标签）。
 */
export function StrategyVariantRuleCard({ lesson }: StrategyVariantRuleCardProps) {
  const { t } = useTranslation();

  if (lesson.variant !== 'heads-up') return null;

  const rows = buildHeadsUpRuleRows(headsUpRules, lesson.variantContext);
  const ruleItems = toItems(
    t,
    rows.filter((row) => !CONTEXT_ROW_IDS.includes(row.id)),
  );
  const contextItems = toItems(
    t,
    rows.filter((row) => CONTEXT_ROW_IDS.includes(row.id)),
  );

  return (
    <>
      <AcademyVariantRuleCard
        title={t('variant.headsUpRules.title')}
        subtitle={t('variant.headsUpRules.subtitle')}
        items={ruleItems}
      />
      {/* contextItems 为空时共享卡自身返回 null，调用方无需再判空 */}
      <AcademyVariantRuleCard
        title={t('variant.headsUpRules.contextTitle')}
        items={contextItems}
      />
    </>
  );
}
