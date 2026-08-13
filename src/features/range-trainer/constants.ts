import { Position } from '@/shared/types/position';
import type { GameVariant } from '@/shared/types/poker';
import type { RangePreset } from './types';

/**
 * 6-max 基础预置范围（open 类）。
 *
 * 数据源定性（2026-07-31 跨模块专批 C，P1A-06）：
 *   以 gto-simulator `data/preflop-ranges.json`（6max_100bb_preflop）为权威源，
 *   按「raise 频率 ≥ 0.5」阈值离散化生成（call 类 preset 用「call 频率 ≥ 0.5」）。
 *   一致性由跨模块守卫测试 `src/rangePresetGtoConsistency.test.ts` 锁定；
 *   修改本表或 JSON 任一侧都会使守卫变红。
 *   注意：「发起 3-bet」类 preset（见 ADVANCED_PRESET_RANGES 内注释）不在此口径内。
 */
export const PRESET_RANGES: RangePreset[] = [
  {
    id: 'utg-open',
    name: 'UTG Open Raise (~19%)',
    position: Position.UTG,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s',
      'KQs', 'KJs', 'KTs', 'K9s',
      'QJs', 'QTs',
      'JTs', 'J9s',
      'T9s',
      '98s',
      '87s',
      '76s',
      '65s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo',
      'KQo', 'KJo',
      'QJo',
      'JTo',
    ],
  },
  {
    id: 'hj-open',
    name: 'HJ Open Raise (~22%)',
    position: Position.HJ,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A5s', 'A4s', 'A3s',
      'KQs', 'KJs', 'KTs', 'K9s',
      'QJs', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s', 'T8s',
      '98s',
      '87s',
      '76s',
      '65s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo',
      'KQo', 'KJo',
      'QJo',
      'JTo',
      'T9o',
    ],
  },
  {
    id: 'co-open',
    name: 'CO Open Raise (~32%)',
    position: Position.CO,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
      'QJs', 'QTs', 'Q9s', 'Q8s',
      'JTs', 'J9s', 'J8s',
      'T9s', 'T8s', 'T7s',
      '98s', '97s',
      '87s', '86s',
      '76s', '75s',
      '65s', '64s',
      '54s', '53s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
      'KQo', 'KJo', 'KTo',
      'QJo', 'QTo',
      'JTo', 'J9o',
      'T9o',
      '98o',
      '87o',
      '76o',
    ],
  },
  {
    id: 'btn-open',
    name: 'BTN Open Raise (~39%)',
    position: Position.BTN,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s',
      'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
      'JTs', 'J9s', 'J8s',
      'T9s', 'T8s',
      '98s', '97s',
      '87s', '86s',
      '76s', '75s',
      '65s', '64s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o',
      'KQo', 'KJo', 'KTo', 'K9o',
      'QJo', 'QTo', 'Q9o',
      'JTo', 'J9o',
      'T9o', 'T8o',
      '98o',
      '87o',
    ],
  },
  {
    id: 'sb-open',
    name: 'SB Open Raise (~38%)',
    position: Position.SB,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
      'QJs', 'QTs', 'Q9s', 'Q8s',
      'JTs', 'J9s', 'J8s',
      'T9s', 'T8s', 'T7s',
      '98s', '97s',
      '87s', '86s',
      '76s', '75s',
      '65s', '64s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o',
      'KQo', 'KJo', 'KTo', 'K9o',
      'QJo', 'QTo', 'Q9o',
      'JTo', 'J9o',
      'T9o', 'T8o',
      '98o',
      '87o',
      '76o',
    ],
  },
];

/** 6-max 位置列表（用于 UI 按钮组） */
export const SIX_MAX_POSITIONS = [
  Position.UTG,
  Position.HJ,
  Position.CO,
  Position.BTN,
  Position.SB,
  Position.BB,
] as const;

/**
 * P4 修复（4.4-P1-1）：位置渐进解锁配置
 *
 * 设计原则（由易到难）：
 *   - UTG 始终解锁（最基础的前位开池训练）
 *   - 后位 + 防御位需达到前一位置的 ELO 阈值才解锁
 *   - 阈值参考 GTO 训练平台标准（ELO 800/1200/1500/1800/2000）
 *
 * 用于 RangeSelector 控制 UI 显示与可选性，避免新手直接面对 BTN/SB/BB 等复杂位置。
 * 仅覆盖 6-max 实际使用的位置；MP/UTG1 等其他枚举值默认解锁（不在 6-max 中使用）。
 */
export const POSITION_UNLOCK_THRESHOLDS: Partial<Record<Position, number>> = {
  [Position.UTG]: 0,     // 始终解锁
  [Position.HJ]: 800,    // UTG ELO ≥ 800 解锁
  [Position.CO]: 1000,   // HJ ELO ≥ 1000 解锁
  [Position.BTN]: 1200,  // CO ELO ≥ 1200 解锁
  [Position.SB]: 1500,   // BTN ELO ≥ 1500 解锁
  [Position.BB]: 1800,   // SB ELO ≥ 1800 解锁（BB 防御最复杂，最后解锁）
};

/** 判断指定位置是否已解锁（基于 preflop ELO） */
export function isPositionUnlocked(position: Position, preflopElo: number): boolean {
  const threshold = POSITION_UNLOCK_THRESHOLDS[position];
  // 未配置阈值的位置（如 MP/UTG1）默认解锁
  if (threshold === undefined) return true;
  return preflopElo >= threshold;
}

/** 动作类型选项 */
export const ACTION_TYPES = [
  { value: 'open', label: 'Open Raise' },
  { value: '3bet', label: '3-Bet' },
  { value: '4bet', label: '4-Bet' },
  { value: 'call-vs-raise', label: 'Call vs Raise' },
] as const;

/** 13×13 矩阵的牌面排序（A→2）——单一事实源在 shared/constants/poker.ts，此处 re-export 兼容旧路径 */
export { GRID_RANKS } from '@/shared/constants/poker';

/** 短牌 9×9 矩阵的牌面排序（A→6） */
export const SHORT_DECK_GRID_RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6'] as const;

// ─── 短牌预置范围（变体 preset：JSON 口径为 6max_100bb，无对应表，模块自身权威源）────────────────────

export const SHORT_DECK_PRESET_RANGES: RangePreset[] = [
  {
    id: 'sd-co-open',
    name: '短牌 CO Open Raise',
    position: Position.CO,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s',
      'KQs', 'KJs', 'KTs', 'K9s',
      'QJs', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s', 'T8s',
      '98s', '97s',
      '87s',
      'AKo', 'AQo', 'AJo',
      'KQo', 'KJo',
      'QJo',
    ],
  },
  {
    id: 'sd-btn-open',
    name: '短牌 BTN Open Raise',
    position: Position.BTN,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
      'QJs', 'QTs', 'Q9s', 'Q8s',
      'JTs', 'J9s', 'J8s',
      'T9s', 'T8s', 'T7s',
      '98s', '97s', '96s',
      '87s', '86s',
      '76s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
      'KQo', 'KJo', 'KTo', 'K9o',
      'QJo', 'QTo',
      'JTo', 'J9o',
      'T9o',
      '98o',
    ],
  },
];

// ─── HU 预置范围 ─────────────────────────────────────────────────────────────

export const HU_PRESET_RANGES: RangePreset[] = [
  {
    id: 'hu-btn-open',
    name: 'HU BTN Open Raise (~62%)',
    position: Position.BTN,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s', 'K4s', 'K3s', 'K2s',
      'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s', 'Q3s', 'Q2s',
      'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s', 'J2s',
      'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s', 'T3s', 'T2s',
      '98s', '97s', '96s', '95s', '94s', '93s', '92s',
      '87s', '86s', '85s', '84s', '83s', '82s',
      '76s', '75s', '74s', '73s', '72s',
      '65s', '64s', '63s', '62s',
      '54s', '53s', '52s',
      '43s', '42s',
      '32s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o', 'A5o', 'A4o', 'A3o', 'A2o',
      'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o',
      'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o',
      'JTo', 'J9o', 'J8o', 'J7o',
      'T9o', 'T8o', 'T7o',
      '98o', '97o',
      '87o',
      '76o',
      '65o',
      '54o',
    ],
  },
  {
    id: 'hu-bb-3bet',
    name: 'HU BB 3-Bet',
    position: Position.BB,
    actionType: '3bet',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A5s', 'A4s',
      'KQs', 'KJs', 'KTs',
      'QJs', 'QTs',
      'JTs', 'J9s',
      'T9s',
      '98s',
      '87s',
      '76s',
      '65s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo',
      'KQo', 'KJo',
      'QJo',
    ],
  },
];

// ─── 4-Max 预置范围 ──────────────────────────────────────────────────────────

export const FOUR_MAX_PRESET_RANGES: RangePreset[] = [
  {
    id: '4max-co-open',
    name: '4-Max CO Open Raise',
    position: Position.CO,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s',
      'KQs', 'KJs', 'KTs', 'K9s',
      'QJs', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s', 'T8s',
      '98s', '97s',
      '87s', '86s',
      '76s',
      '65s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo',
      'KQo', 'KJo',
      'QJo',
      'JTo',
    ],
  },
  {
    id: '4max-btn-open',
    name: '4-Max BTN Open Raise',
    position: Position.BTN,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44', '33', '22',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
      'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
      'JTs', 'J9s', 'J8s',
      'T9s', 'T8s', 'T7s',
      '98s', '97s',
      '87s', '86s',
      '76s', '75s',
      '65s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
      'KQo', 'KJo', 'KTo', 'K9o',
      'QJo', 'QTo',
      'JTo', 'J9o',
      'T9o',
      '98o',
      '87o',
    ],
  },
  {
    id: '4max-sb-open',
    name: '4-Max SB Open Raise',
    position: Position.SB,
    actionType: 'open',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', '44',
      'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A5s', 'A4s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
      'QJs', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s', 'T8s',
      '98s', '97s',
      '87s',
      '76s',
      '65s',
      '54s',
      'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
      'KQo', 'KJo', 'KTo',
      'QJo', 'QTo',
      'JTo',
      'T9o',
    ],
  },
];

// ─── 6-Max 3-Bet / BB Defense / 4-Bet 预置范围 ────────────────────────────────
//
// 数据源定性（2026-07-31 跨模块专批 C，P1A-06 / P1-C 已定性）：
// - 「发起 3-bet」类 preset（btn-3bet-vs-co / co-3bet-vs-hj）与「通用 4-bet」（4bet-range）
//   在 gto-simulator `preflop-ranges.json` 中**没有**对应频率表：JSON 的 `btn_vs_co_3bet` /
//   `co_vs_hj_3bet` 语义是「Hero open 后**面对** 3-bet 的响应（4-bet/call/fold）」，与本处
//   「面对 open **发起** 3-bet」是不同 spot，二者**不得互相校验/对齐**。
// - 上述三个 preset 以本模块为自身权威源（教学参考范围）；严禁为对齐而臆造 JSON 频率数据
//   （臆造的求解器频率会成为错误教学权威源，危害大于数据缺口）。
// - 例外：bb-3bet-vs-btn / bb-call-vs-btn 对应 JSON `bb_vs_btn_open` 表（BB 面对 BTN open，
//   raise 即发起 3-bet），JSON 有覆盖，已纳入一致性守卫（src/rangePresetGtoConsistency.test.ts）。

export const ADVANCED_PRESET_RANGES: RangePreset[] = [
  {
    // 发起 3-bet spot：JSON 无对应表（btn_vs_co_3bet 是「面对 3-bet 响应」不同 spot），
    // 本 preset 为模块自身权威源，不参与 JSON 一致性守卫（专批 C 定性，勿再误判为应对齐）
    id: 'btn-3bet-vs-co',
    name: 'BTN 3-Bet vs CO Open (~6%)',
    position: Position.BTN,
    actionType: '3bet',
    hands: [
      // 价值 3-bet
      'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo',
      // Bluff 3-bet（Ax blocker + suited connectors）
      'A5s', 'A4s', 'A3s', 'A2s',
      // 可选混合
      'TT', 'AJs', 'KQs',
    ],
  },
  {
    // 发起 3-bet spot：同上，模块自身权威源，不参与 JSON 一致性守卫
    id: 'co-3bet-vs-hj',
    name: 'CO 3-Bet vs HJ Open (~5%)',
    position: Position.CO,
    actionType: '3bet',
    hands: [
      'AA', 'KK', 'QQ', 'JJ', 'AKs', 'AQs', 'AKo',
      'A5s', 'A4s',
      'TT', 'AQo',
    ],
  },
  {
    // 数据源：JSON `bb_vs_btn_open` 表 call 频率 ≥ 0.5（专批 C 重生成，守卫锁定）
    id: 'bb-call-vs-btn',
    name: 'BB Call vs BTN Open (~33%)',
    position: Position.BB,
    actionType: 'call-vs-raise',
    hands: [
      '99', '88', '77', '66', '55', '44', '33', '22',
      'ATs', 'A9s', 'A8s', 'A7s', 'A6s', 'A5s', 'A4s', 'A3s', 'A2s',
      'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
      'QJs', 'QTs', 'Q9s',
      'JTs', 'J9s',
      'T9s', 'T8s',
      '98s', '97s',
      '87s', '86s',
      '76s', '75s',
      '65s',
      '54s',
      'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A5o', 'A4o', 'A3o', 'A2o',
      'KQo', 'KJo', 'KTo', 'K9o',
      'QJo', 'QTo',
      'JTo', 'J9o',
      'T9o',
      '98o',
      '87o',
      '76o',
      '65o',
      '54o',
    ],
  },
  {
    // 数据源：JSON `bb_vs_btn_open` 表 raise 频率 ≥ 0.5（BB 面对 BTN open 时 raise 即发起 3-bet，
    // 此 spot JSON 有覆盖，守卫锁定）
    id: 'bb-3bet-vs-btn',
    name: 'BB 3-Bet vs BTN Open (~5%)',
    position: Position.BB,
    actionType: '3bet',
    hands: [
      // 价值 3-bet（GTO raise 频率 ≥ 0.5）
      'AA', 'KK', 'QQ', 'JJ', 'TT',
      'AKs', 'AQs', 'AJs',
      'AKo', 'AQo',
    ],
  },
  {
    // 通用 4-bet 教学范围：JSON 无单一对应 spot，模块自身权威源，不参与 JSON 一致性守卫
    id: '4bet-range',
    name: '通用 4-Bet 范围 (~4%)',
    position: Position.BTN,
    actionType: '4bet',
    hands: [
      // 价值 4-bet（永远）
      'AA', 'KK', 'QQ', 'AKs',
      // Bluff 4-bet（A blocker）
      'A5s', 'A4s', 'A3s',
      // 可选混合
      'JJ', 'AKo',
    ],
  },
];

/** 根据游戏变体获取对应预置范围 */
export function getPresetsForVariant(variant: GameVariant): RangePreset[] {
  switch (variant) {
    case 'short-deck':
      return SHORT_DECK_PRESET_RANGES;
    case 'heads-up':
      return HU_PRESET_RANGES;
    default:
      return [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES];
  }
}

/** 根据游戏变体和人数获取预置范围（4-Max 特殊处理） */
export function getPresetsForVariantAndPlayerCount(variant: GameVariant, playerCount: number): RangePreset[] {
  if (variant === 'standard' && playerCount === 4) return FOUR_MAX_PRESET_RANGES;
  return getPresetsForVariant(variant);
}
