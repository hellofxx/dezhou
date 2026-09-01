// BUG-GTO-009 守卫测试：preflop 场景生成与 GTO 表覆盖契约（report §5 建议 2）。
//
// 目标：随机生成 N 个 preflop 场景，断言 resolveSpotKey 命中率 = 100%。
// 理由：generatePreviousActions 已按表内可达 spot 约束（非 BB open / BB vs {HJ,CO,BTN}），
// 生成的 preflop 前置动作理论上必然命中 GTO 表；因此 100% 是一个明确、可达的硬阈值。
// 若未来改判放宽 3bet/multiway 生成而未补数据，此测试将在命中率 < 100% 时立即变红。
//
// BUG-GTO-012 守卫测试：同 seed 产出完全相同场景（可复现训练）。

import { describe, it, expect } from 'vitest';
import { Position } from '@/shared/types/position';
import { seededRandom } from '@/shared/utils/seededShuffle';
import { generatePreviousActions, generateScenario } from './scenarioGenerator';
import { resolveSpotKey } from './spotKey';
import { actionTerm, actionLabel } from './actionTerms';
import { ActionType } from '@/shared/types/action';

const ALL_TRAINABLE_POSITIONS = [
  Position.UTG, Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB,
];
const PLAYER_COUNTS = [2, 3, 4, 5, 6];

describe('BUG-GTO-009：preflop 场景生成与 GTO 表覆盖契约（命中率 100%）', () => {
  it('generatePreviousActions preflop 分支对全部位置/人数组产出的前置动作必命中表内 spot', () => {
    let generated = 0;
    let hit = 0;
    for (const count of PLAYER_COUNTS) {
      for (const pos of ALL_TRAINABLE_POSITIONS) {
        for (let seed = 1; seed <= 40; seed++) {
          const rng = seededRandom(seed);
          const actions = generatePreviousActions('preflop', pos, count, 'intermediate', rng);
          const key = resolveSpotKey(pos, actions);
          generated++;
          if (key !== null) hit++;
          // 失败时打印上下文便于定位
          expect(key, `preflop spot 应命中表：pos=${pos} count=${count} seed=${seed}`).not.toBeNull();
        }
      }
    }
    expect(hit).toBe(generated);
  });

  it('generateScenario（含出口过滤）随机的 preflop 场景必命中表内 spot', () => {
    // 覆盖 open 方（BTN）与 BB 方两种约束路径
    const positions = [Position.BTN, Position.BB];
    let preflopScenarios = 0;
    let hit = 0;
    for (const pos of positions) {
      for (let seed = 1; seed <= 400; seed++) {
        const cfg = {
          gameType: 'cash' as const,
          effectiveStack: 100,
          position: pos,
          playerCount: 6,
          gameVariant: 'standard' as const,
          difficulty: 'intermediate' as const,
          scenarioCount: 1,
        };
        const s = generateScenario(cfg, seed, seed);
        if (s.street !== 'preflop') continue;
        preflopScenarios++;
        const key = resolveSpotKey(s.position, s.previousActions);
        if (key !== null) hit++;
      }
    }
    // intermediate 下 preflop 概率 65%，两个 position 共 800 次注入应产生充足 preflop 样本
    expect(preflopScenarios).toBeGreaterThan(200);
    expect(hit).toBe(preflopScenarios);
  });
});

describe('BUG-GTO-012：场景生成可复现（同 seed 产出相同场景）', () => {
  /** 递归剥离所有 id 字段（顶层 id 与多步节点 id 均为时间戳/种子派生，属装饰性标识），
   *  只比较训练语义内容（手牌/板面/底池/street/策略/前置动作）。 */
  function stripIds(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stripIds);
    if (value !== null && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        if (k === 'id') continue;
        out[k] = stripIds(v);
      }
      return out;
    }
    return value;
  }

  it('相同 config+index+seed 生成内容完全一致的场景', () => {
    const cfg = {
      gameType: 'cash' as const,
      effectiveStack: 100,
      position: Position.BTN,
      playerCount: 6,
      gameVariant: 'standard' as const,
      difficulty: 'intermediate' as const,
      scenarioCount: 1,
    };
    for (let i = 0; i < 20; i++) {
      const a = stripIds(generateScenario(cfg, i, i));
      const b = stripIds(generateScenario(cfg, i, i));
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    }
  });

  it('不同 seed 通常产生不同内容（未破坏随机性分布）', () => {
    const cfg = {
      gameType: 'cash' as const,
      effectiveStack: 100,
      position: Position.BTN,
      playerCount: 6,
      gameVariant: 'standard' as const,
      difficulty: 'intermediate' as const,
      scenarioCount: 1,
    };
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const s = generateScenario(cfg, seed, seed);
      seen.add(`${s.heroHand[0]!.rank}-${s.heroHand[0]!.suit}-${s.heroHand[1]!.rank}-${s.heroHand[1]!.suit}-${s.street}`);
    }
    expect(seen.size).toBeGreaterThan(5);
  });
});

describe('BUG-GTO-010：扑克动作术语源（actionTerms）为英文合并单源', () => {
  it('动作术语为社区惯例英文，且供各组件消费的 actionTerm/actionLabel 语义正确', () => {
    expect(actionTerm(ActionType.Fold)).toBe('Fold');
    expect(actionTerm(ActionType.Check)).toBe('Check');
    expect(actionTerm(ActionType.Call)).toBe('Call');
    expect(actionTerm(ActionType.Raise)).toBe('Raise');
    expect(actionTerm(ActionType.AllIn)).toBe('All-In');

    // 带金额的标签
    expect(actionLabel(ActionType.Raise, 2.5)).toBe('Raise 2.5BB');
    expect(actionLabel(ActionType.Call, 2.5)).toBe('Call 2.5BB');
    expect(actionLabel(ActionType.Fold)).toBe('Fold');
    expect(actionLabel(ActionType.Check)).toBe('Check');
    expect(actionLabel(ActionType.AllIn, 100)).toBe('All-In (100 BB)');
  });
});
