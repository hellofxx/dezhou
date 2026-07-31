import type { Card, HandNotation } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import { classifyHand } from '@/features/range-trainer/utils/handClassifier';
import type { HandStrategy, PreviousAction } from '../types';
import preflopData from '../data/preflop-ranges.json';

type PreflopData = Record<string, Record<string, Record<string, HandStrategy>>>;

const GAME_KEY = '6max_100bb_preflop';

/**
 * 根据 previousActions 确定 preflop spot key（模块内唯一事实源，P1C-03）。
 *
 * 仅返回 GTO 频率表中实际存在的 key；未覆盖场景返回 null，由调用方显式提示
 * "该 spot 无 GTO 数据"，禁止静默降级为 open 场景误导初学者。
 *
 * 覆盖场景（与 preflop-ranges.json 中的 11 个 spot 一致）：
 *   - 0 raise: `${pos}_open`（utg/hj/co/btn/sb open；BB 无 open 场景，返回 null）
 *   - 1 raise + hero=BB: `bb_vs_${opener}_open`（opener ∈ {hj, co, btn}；utg 未覆盖）
 *   - 1 raise + hero=SB: `sb_vs_${opener}_open`（仅 sb_vs_bb_open 命中，6-max 中罕见）
 *   - ≥2 raise: `${pos}_vs_${lastRaiser}_3bet`（仅 btn_vs_co_3bet / co_vs_hj_3bet 命中）
 *
 * 未覆盖场景示例（返回 null）：
 *   - HJ/CO/BTN 冷 call（如 UTG open → HJ 行动）：GTO 表无 `hj_vs_utg_open` 等 key
 *   - SB vs UTG/HJ/CO/BTN open、BB vs UTG open
 *   - 大多数 3bet 场景（3-bet spot 数据补齐挂起 P1A-06 专批）
 */
export function resolveSpotKey(position: Position, previousActions?: PreviousAction[]): string | null {
  const pos = position.toLowerCase();
  const data = (preflopData as PreflopData)[GAME_KEY];
  if (!data) return null;

  // 没有任何动作或全是 fold：hero 是 open raiser
  const raises = previousActions?.filter((a) => a.action === ActionType.Raise) ?? [];
  if (raises.length === 0) {
    const key = `${pos}_open`;
    return data[key] ? key : null;
  }

  // 面对一个 open（raises.length === 1）：hero 是跟注/3bet 决策者
  if (raises.length === 1) {
    const opener = raises[0]!;
    const openerPos = opener.position.toLowerCase();
    if (pos === 'bb') {
      const key = `bb_vs_${openerPos}_open`;
      return data[key] ? key : null;
    }
    if (pos === 'sb') {
      const key = `sb_vs_${openerPos}_open`;
      return data[key] ? key : null;
    }
    // HJ/CO/BTN 冷 call 场景：GTO 表未覆盖，返回 null 由调用方提示
    return null;
  }

  // 面对 3bet 及以上（raises.length >= 2）：hero 是 4bet/call/fold 决策者
  const lastRaiser = raises[raises.length - 1]!;
  // P1C-25 后 hero 自己的 open 也在 raises 中，最后一个非 hero 的 raiser 才是 3-bettor
  const villainRaiser = lastRaiser.position === position
    ? raises.filter((r) => r.position !== position).pop()
    : lastRaiser;
  if (!villainRaiser) return null;
  const key = `${pos}_vs_${villainRaiser.position.toLowerCase()}_3bet`;
  return data[key] ? key : null;
}

/** 获取某 spot 的完整 169 手策略表（不存在返回 null） */
export function getStrategiesForSpot(spotKey: string | null): Record<HandNotation, HandStrategy> | null {
  if (!spotKey) return null;
  const data = (preflopData as PreflopData)[GAME_KEY];
  return (data?.[spotKey] as Record<HandNotation, HandStrategy> | undefined) ?? null;
}

/**
 * 查询 preflop 场景下指定手牌的 GTO 策略。
 * 未覆盖场景 / 缺手牌数据时返回 null（P1C-03：调用方需显式 fallback，不得静默用 open 表）。
 */
export function getPreflopHandStrategy(
  position: Position,
  previousActions: PreviousAction[] | undefined,
  heroHand: [Card, Card]
): HandStrategy | null {
  const spotKey = resolveSpotKey(position, previousActions);
  const spotData = getStrategiesForSpot(spotKey);
  if (!spotData) return null;
  const notation = classifyHand(heroHand[0], heroHand[1]);
  return spotData[notation] ?? null;
}
