import type { Scenario } from '../types';
import type { Decision } from '@/shared/types/action';
import { classifyHand } from '@/shared/utils/handClassifier';
import { resolveSpotKey } from './spotKey';

/**
 * GTO 训练答题 → SRS 复习项载荷构造（纯函数，无 store 依赖，可直接单测）。
 *
 * 与 pot-odds（静态题库、题目文本本身就是 i18n key）不同，**GTO 场景由
 * `utils/scenarioGenerator.ts` 运行时生成**：`scenario.name` / `description`
 * 与最优动作文案都是动态拼接文本，没有现成的 locale key 可用。
 *
 * 因此本模块采用「静态 key + 结构化插值参数」方案：
 * - `label` / `front` 只使用**不需要翻译**的元素（位置缩写、牌面符号、数值），
 *   这样 params 里的值无论切成哪种语言都无需二次翻译；
 * - `back` 按动作类型分键（`gto.review.back.<action>`），金额走 `{{amount}}` 插值；
 * - 结构化数据存入 `metadata.params`，由渲染层 `t(key, params)` 组装
 *   （`ReviewSession` 对 label/front/back 均已传入 params）。
 *
 * **严禁**把 `scenario.description` 之类的运行时文本、或任何语言的原文写入持久化载荷：
 * 复习项存在 localStorage，切到另一种语言时 i18next 无法翻译已存的原文，会直接裸显。
 */
export const GTO_REVIEW_ID_PREFIX = 'gto:';

/** 标签类 key（不含变量，靠 params 插值） */
export const GTO_REVIEW_LABEL_KEY = 'gto.review.label';
export const GTO_REVIEW_FRONT_KEY = 'gto.review.front';
/** 无最优动作参考时的回退键（对应 zh「参考 GTO 策略」） */
export const GTO_REVIEW_BACK_UNAVAILABLE_KEY = 'gto.review.back.unavailable';

export interface GtoReviewItemInput {
  id: string;
  label: string;
  metadata: {
    front: string;
    back: string;
    source: 'gto';
    params: Record<string, string | number>;
  };
}

/** 构造 GTO 复习项 id（`gto:<spotKey>:<handNotation>`，稳定语义键，不含时间戳） */
export function gtoReviewItemId(spotKey: string, handNotation: string): string {
  return `${GTO_REVIEW_ID_PREFIX}${spotKey}:${handNotation}`;
}

/** 构造最优动作对应的 back key（动作枚举值直接作为 key 末段，无动作时回退） */
export function gtoReviewBackKey(action?: string): string {
  return action ? `gto.review.back.${action}` : GTO_REVIEW_BACK_UNAVAILABLE_KEY;
}

/**
 * 把一个 GTO 场景与它的最优决策转为复习项载荷。
 *
 * `optimal` 为 null（场景无决策节点）时 back 回退到 `gto.review.back.unavailable`，
 * 不写入任何硬编码文案。
 */
export function buildGtoReviewItemInput(
  scenario: Scenario,
  optimal: Decision | null,
): GtoReviewItemInput {
  const spotKey = resolveSpotKey(scenario.position, scenario.previousActions) ?? 'unknown';
  const hand = classifyHand(scenario.heroHand[0], scenario.heroHand[1]);
  return {
    id: gtoReviewItemId(spotKey, hand),
    label: GTO_REVIEW_LABEL_KEY,
    metadata: {
      front: GTO_REVIEW_FRONT_KEY,
      back: gtoReviewBackKey(optimal?.action),
      source: 'gto',
      params: {
        position: scenario.position,
        hand,
        players: scenario.playerCount,
        pot: scenario.potSize,
        stack: scenario.effectiveStack,
        amount: optimal?.amount ?? 0,
      },
    },
  };
}
