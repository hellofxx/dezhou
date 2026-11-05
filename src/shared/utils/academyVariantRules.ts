import type { VariantRuleContext, VariantRuleInfo } from '@/shared/types/variantRules';

/**
 * 变体规则卡行的纯函数构造（理论 / 策略两院共用）。
 *
 * 设计边界：
 * - 零 i18n：只产出 key（`labelKey` / `valueKey`）与语言中立值（`value`），
 *   翻译由包装层用显式字面量 key 完成，禁止在此拼模板（会绕过 staticKeyGuard）。
 * - 零 feature import：只依赖 shared 类型，包装层不反向依赖。
 * - 方向值数据驱动：谁先行动只由 `positionDynamics` 布尔派生，
 *   不在本文件写死「翻前 SB 先 / 翻后 BB 先」这类散文（文案随 i18n 走）。
 */

/** 行标签 i18n key（包装层逐行显式映射，不使用模板拼接） */
export type VariantRuleLabelKey =
  | 'variant.headsUpRules.playersLabel'
  | 'variant.headsUpRules.deckSizeLabel'
  | 'variant.headsUpRules.preflopFirstLabel'
  | 'variant.headsUpRules.postflopFirstLabel'
  | 'variant.headsUpRules.blindsLabel'
  | 'variant.headsUpRules.anteLabel'
  | 'variant.headsUpRules.contextStackLabel'
  | 'variant.headsUpRules.contextAnteLabel'
  | 'variant.headsUpRules.contextButtonLabel';

/** 需要翻译的行值 i18n key（方向 / Ante 有无） */
export type VariantRuleValueKey =
  | 'variant.headsUpRules.preflopFirstValue'
  | 'variant.headsUpRules.postflopFirstValue'
  | 'variant.headsUpRules.anteYes'
  | 'variant.headsUpRules.anteNo';

/** 稳定行 id：包装层、组件与测试据此定位，不参与翻译 */
export type VariantRuleRowId =
  | 'players'
  | 'deckSize'
  | 'preflopFirst'
  | 'postflopFirst'
  | 'blinds'
  | 'ante'
  | 'stackDepth'
  | 'anteStructure'
  | 'dealerButtonPosition';

export interface VariantRuleRow {
  id: VariantRuleRowId;
  labelKey: VariantRuleLabelKey;
  /** 语言中立值（数字 / 盲注 / 上下文原文）：与 valueKey 互斥，包装层原样渲染 */
  value?: string;
  /** 需要翻译的值：与 value 互斥，包装层用 t(valueKey) 渲染 */
  valueKey?: VariantRuleValueKey;
}

/** 单挑固定 2 人（变体定义，不由 rules 数据推导） */
const HEADS_UP_PLAYERS = 2;

/** Ante 结构取值（与 strategy-academy 课时 variantContext 对齐） */
const ANTE_STRUCTURES = ['sb_ante', 'both_ante', 'no_ante'] as const;
type AnteStructure = (typeof ANTE_STRUCTURES)[number];

function isAnteStructure(value: unknown): value is AnteStructure {
  return typeof value === 'string' && (ANTE_STRUCTURES as readonly string[]).includes(value);
}

/**
 * 构造单挑规则卡的行（固定顺序：players → deckSize → preflopFirst → postflopFirst
 * → blinds → ante，有 context 时追加 stackDepth → anteStructure → dealerButtonPosition）。
 *
 * 缺失的行直接省略（数据没有就说没有，不补默认值）：这样数据被改动时卡片跟着改，
 * 不会出现「卡片写死方向、数据已变」的双源漂移。
 */
export function buildHeadsUpRuleRows(
  rules: VariantRuleInfo,
  context?: VariantRuleContext,
): VariantRuleRow[] {
  const rows: VariantRuleRow[] = [
    {
      id: 'players',
      labelKey: 'variant.headsUpRules.playersLabel',
      value: String(HEADS_UP_PLAYERS),
    },
  ];

  if (typeof rules.deckSize === 'number') {
    rows.push({
      id: 'deckSize',
      labelKey: 'variant.headsUpRules.deckSizeLabel',
      value: String(rules.deckSize),
    });
  }

  const dynamics = rules.positionDynamics;
  // 方向行只由布尔派生：翻前先行动者恒为 SB、翻后先行动者恒为 BB（对应 value 文案由 i18n 保真）
  if (dynamics?.sbFirstActionPreflop) {
    rows.push({
      id: 'preflopFirst',
      labelKey: 'variant.headsUpRules.preflopFirstLabel',
      valueKey: 'variant.headsUpRules.preflopFirstValue',
    });
  }
  if (dynamics?.bbFirstActionPostflop) {
    rows.push({
      id: 'postflopFirst',
      labelKey: 'variant.headsUpRules.postflopFirstLabel',
      valueKey: 'variant.headsUpRules.postflopFirstValue',
    });
  }

  const blinds = rules.blindStructure;
  if (typeof blinds?.sbAmount === 'number' && typeof blinds.bbAmount === 'number') {
    rows.push({
      id: 'blinds',
      labelKey: 'variant.headsUpRules.blindsLabel',
      value: `${blinds.sbAmount} / ${blinds.bbAmount}`,
    });
  }

  if (typeof dynamics?.sbAnte === 'boolean') {
    rows.push({
      id: 'ante',
      labelKey: 'variant.headsUpRules.anteLabel',
      valueKey: dynamics.sbAnte ? 'variant.headsUpRules.anteYes' : 'variant.headsUpRules.anteNo',
    });
  }

  if (!context) return rows;

  if (typeof context.stackDepth === 'number' && Number.isFinite(context.stackDepth)) {
    rows.push({
      id: 'stackDepth',
      labelKey: 'variant.headsUpRules.contextStackLabel',
      value: String(context.stackDepth),
    });
  }

  if (isAnteStructure(context.anteStructure)) {
    rows.push({
      id: 'anteStructure',
      labelKey: 'variant.headsUpRules.contextAnteLabel',
      valueKey: context.anteStructure === 'no_ante' ? 'variant.headsUpRules.anteNo' : 'variant.headsUpRules.anteYes',
    });
  }

  const button = context.dealerButtonPosition;
  if (typeof button === 'string' && button.trim().length > 0) {
    rows.push({
      id: 'dealerButtonPosition',
      labelKey: 'variant.headsUpRules.contextButtonLabel',
      value: button.trim(),
    });
  }

  return rows;
}
