import { describe, it, expect, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { PokerVariant } from '@/shared/types/elo';

/**
 * PRG-010 回归：成就 elo 判定不再随 activeVariant 漂移，而是按各变体 overall 最高分判定
 * （成就反映用户达过的最高水平）。修复前以 `activeVariant` 为判定源，切换到未训练变体
 * （overall=500 继承值）时 elo-beginner 立即解锁，standard 高分用户切走后反而不解锁。
 */
describe('progress store 成就 elo 口径稳定性（PRG-010）', () => {
  const stub = () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  };

  const variant = (overall: number): typeof DEFAULT_ELO => ({
    ...DEFAULT_ELO,
    overall,
    gamesPlayed: overall > 500 ? 50 : 0,
  });

  it('切到低分变体后 elo 成就仍按各变体最高分达成（不同 activeVariant 漂移）', async () => {
    stub();
    const { useProgressStore } = await import('./store');

    useProgressStore.setState({
      activeVariant: 'standard' as PokerVariant,
      eloByVariant: {
        standard: variant(1500),
        'short-deck': variant(500),
        'heads-up': variant(500),
      },
      unlockedAchievements: [],
      achievementUnlockDates: {},
    });

    // 直接调用公开 action：应解锁 minScore=800 的 elo-intermediate（standard 1500 达标），
    // 而不解锁 minScore=2000 的 elo-expert
    useProgressStore.getState().checkAchievements();

    // checkAchievements 为 async，等待微任务完成
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(useProgressStore.getState().unlockedAchievements).toContain('elo-intermediate');
    expect(useProgressStore.getState().unlockedAchievements).not.toContain('elo-expert');

    // 切到低分变体 short-deck（overall=500）：成就状态不倒退
    const unlockedBefore = [...useProgressStore.getState().unlockedAchievements];
    useProgressStore.getState().switchActiveVariant('short-deck' as PokerVariant);
    expect(useProgressStore.getState().activeVariant).toBe('short-deck');
    useProgressStore.getState().checkAchievements();
    await new Promise((resolve) => setTimeout(resolve, 20));
    // 已解锁成就不因切变体消失
    for (const id of unlockedBefore) {
      expect(useProgressStore.getState().unlockedAchievements).toContain(id);
    }
  });
});
