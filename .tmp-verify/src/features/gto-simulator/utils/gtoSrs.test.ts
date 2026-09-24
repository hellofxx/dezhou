import { describe, it, expect } from 'vitest';
import {
  buildGtoReviewItemInput,
  gtoReviewBackKey,
  GTO_REVIEW_FRONT_KEY,
  GTO_REVIEW_LABEL_KEY,
  GTO_REVIEW_BACK_UNAVAILABLE_KEY,
} from './gtoSrs';
import type { Scenario } from '../types';
import type { Card } from '@/shared/types/poker';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import zhGto from '@/i18n/locales/zh/gto.json';
import enGto from '@/i18n/locales/en/gto.json';

/**
 * GTO 复习项载荷守卫。
 *
 * GTO 场景由 scenarioGenerator 运行时生成，**没有现成 locale key**：历史实现把
 * `scenario.description` 与拼接出的最优动作文案直接写进复习项，而复习项存 localStorage，
 * 切到英文界面时 i18next 无法翻译已存原文 —— 英文用户的复习卡片会直接显示中文。
 *
 * 本守卫锁死「静态 key + metadata.params」方案：载荷里不允许出现任何运行时文本
 * （以 CJK 检测代理：GTO 数据层文案均为中文），且每个 key 必须在双语包中都能解析。
 */

const CJK = /[㐀-鿿]/;

const ACE_OF_SPADES: Card = { suit: Suit.Spades, rank: Rank.Ace };
const KING_OF_SPADES: Card = { suit: Suit.Spades, rank: Rank.King };

/** 构造测试场景：name / description 故意用中文运行时文本，用于验证它们不会泄漏进载荷 */
function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's-test',
    name: '按钮开局场景',
    description: 'BTN 持 AKs，前面玩家全部弃牌，底池 1.5 BB',
    gameType: 'cash',
    stakes: { small: 0.5, big: 1 },
    effectiveStack: 100,
    position: Position.BTN,
    playerCount: 6,
    street: 'preflop',
    potSize: 1.5,
    previousActions: [],
    heroHand: [ACE_OF_SPADES, KING_OF_SPADES],
    difficulty: 'intermediate',
    ...overrides,
  } as unknown as Scenario;
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

describe('buildGtoReviewItemInput（GTO 复习项载荷）', () => {
  it('id 使用 gto: 命名空间且对同一 spot+手牌稳定', () => {
    const a = buildGtoReviewItemInput(scenario(), null);
    const b = buildGtoReviewItemInput(scenario(), null);
    expect(a.id).toBe(b.id);
    expect(a.id.startsWith('gto:')).toBe(true);
  });

  it('label / front 为常量 key，back 随最优动作分键', () => {
    const withRaise = buildGtoReviewItemInput(scenario(), {
      action: ActionType.Raise,
      amount: 2.5,
    });
    expect(withRaise.label).toBe(GTO_REVIEW_LABEL_KEY);
    expect(withRaise.metadata.front).toBe(GTO_REVIEW_FRONT_KEY);
    expect(withRaise.metadata.back).toBe('gto.review.back.raise');

    const withFold = buildGtoReviewItemInput(scenario(), { action: ActionType.Fold });
    expect(withFold.metadata.back).toBe('gto.review.back.fold');
  });

  it('无最优动作时 back 回退到 unavailable 键，不写入硬编码文案', () => {
    const noOptimal = buildGtoReviewItemInput(scenario(), null);
    expect(noOptimal.metadata.back).toBe(GTO_REVIEW_BACK_UNAVAILABLE_KEY);
    expect(CJK.test(noOptimal.metadata.back)).toBe(false);
  });

  it('载荷内不含任何运行时文本（CJK 检测）：场景描述不得泄漏进持久化数据', () => {
    const { label, metadata } = buildGtoReviewItemInput(scenario(), {
      action: ActionType.Raise,
      amount: 3,
    });
    const serialized = JSON.stringify({ label, metadata });
    expect(CJK.test(serialized)).toBe(false);
    expect(serialized).not.toContain('按钮开局场景');
    expect(serialized).not.toContain('前面玩家全部弃牌');
  });

  it('params 为结构化数值，供渲染层 t(key, params) 插值', () => {
    const { metadata } = buildGtoReviewItemInput(scenario(), {
      action: ActionType.Raise,
      amount: 2.5,
    });
    expect(metadata.params).toMatchObject({
      position: Position.BTN,
      players: 6,
      pot: 1.5,
      stack: 100,
      amount: 2.5,
    });
    expect(typeof metadata.params.hand).toBe('string');
  });

  it('每个载荷 key 在 zh 与 en 的 gto 包中均能解析到非空译文', () => {
    const { label, metadata } = buildGtoReviewItemInput(scenario(), {
      action: ActionType.Raise,
      amount: 2.5,
    });
    for (const key of [label, metadata.front, metadata.back]) {
      const path = key.replace(/^gto\./, '');
      expect(getByPath(zhGto, path), `zh 缺失 ${key}`).toBeTruthy();
      expect(getByPath(enGto, path), `en 缺失 ${key}`).toBeTruthy();
    }
  });

  it('全部动作枚举都有对应的 back 译文（含双语）', () => {
    for (const action of Object.values(ActionType)) {
      const key = gtoReviewBackKey(action);
      const path = key.replace(/^gto\./, '');
      expect(getByPath(zhGto, path), `zh 缺失 ${key}`).toBeTruthy();
      expect(getByPath(enGto, path), `en 缺失 ${key}`).toBeTruthy();
    }
  });
});
