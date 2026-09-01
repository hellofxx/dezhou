import { ActionType } from '@/shared/types/action';

/**
 * 扑克动作术语源（BUG-GTO-010 收口）。
 *
 * 产品决策（已裁定）：扑克动作术语刻意保留英文（Fold / Check / Call / Raise /
 * All-In，社区惯例），不做本地化。故此处 NOT 走 i18n，而是把原先散落各组件
 * （DecisionTree / ActionSelector / StrategyMatrix / GTOFeedback）的硬编码英文字面量
 * 集中到此单一来源，四组件共用同一份取值，杜绝英中混杂与多副本漂移。
 *
 * 若未来产品改判为本地化，只需在此替换为映射到 gto.action.* i18n key、经 t() 解析的
 * 函数，各消费组件无需改动。
 */
export const ACTION_TERMS = {
  [ActionType.Fold]: 'Fold',
  [ActionType.Check]: 'Check',
  [ActionType.Call]: 'Call',
  [ActionType.Raise]: 'Raise',
  [ActionType.AllIn]: 'All-In',
} as const;

/**
 * 生成动作显示标签。Call/Raise 携带金额时附加金额后缀（如 "Call 2.5BB"），
 * 语义与社区惯例一致，仅措辞为单位上的英文术语。
 */
export function actionTerm(action: ActionType): string {
  return ACTION_TERMS[action];
}

export function actionLabel(action: ActionType, amount?: number): string {
  const term = ACTION_TERMS[action];
  if (amount === undefined) return term;
  switch (action) {
    case ActionType.Fold:
    case ActionType.Check:
      return term;
    case ActionType.Call:
    case ActionType.Raise:
      return `${term} ${amount}BB`;
    case ActionType.AllIn:
      return `${term} (${amount} BB)`;
    default:
      return term;
  }
}
