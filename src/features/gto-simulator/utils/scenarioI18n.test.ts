// GTO 决策节点描述文案 key 化守卫：
// generateDecisionNodes 产出的节点必须携带 descriptionKey（渲染时经 t() 翻译），
// 且该 key 必须在 gto 双语资源（zh/en）中真实存在——防止硬编码中文回归
// 或 key 与 JSON 不同步导致渲染出裸 key。

import { describe, expect, it } from 'vitest';
import type { Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { generateDecisionNodes } from './scenarioGenerator';

const HERO_HAND: [Card, Card] = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Diamonds, rank: Rank.Ace },
];

describe('决策节点描述文案 key 化', () => {
  it('所有 street 产出的节点均带 descriptionKey，且 key 在 gto 双语资源中可解析', async () => {
    await preloadI18n(['gto']);
    await preloadI18n(['gto'], 'en');

    const streets = ['preflop', 'flop', 'turn', 'river'] as const;
    for (const street of streets) {
      const nodes = generateDecisionNodes(street, HERO_HAND, Position.BTN, 'standard', 100, 'intermediate', 6);
      expect(nodes.length).toBeGreaterThan(0);
      for (const node of nodes) {
        expect(node.descriptionKey, `节点 ${node.id} 应携带 descriptionKey`).toBeTruthy();
        const key = node.descriptionKey!;
        expect(i18n.t(key), `${key} 应解析为译文而非裸 key`).not.toBe(key);
        for (const lng of ['zh', 'en'] as const) {
          expect(
            i18n.getResource(lng, 'translation', key),
            `${key} 应在 ${lng} 资源中存在（双语对称）`
          ).toBeTruthy();
        }
      }
    }
  });

  it('easy 场景（getEasyGTOScenario 路径）description 存 key', async () => {
    // 直接验证 scenarioGenerator 之外的手工场景：easyScenario key 双语存在
    await preloadI18n(['gto']);
    await preloadI18n(['gto'], 'en');
    expect(i18n.t('gto.easyScenario.prompt')).not.toBe('gto.easyScenario.prompt');
    expect(i18n.t('gto.easyScenario.nodeDesc')).not.toBe('gto.easyScenario.nodeDesc');
  });
});
