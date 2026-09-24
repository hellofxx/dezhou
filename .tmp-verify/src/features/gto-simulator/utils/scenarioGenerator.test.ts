import { describe, it, expect } from 'vitest';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import { generatePreviousActions } from './scenarioGenerator';

// 回归（BUG-GTO-006）：postflop 故事线中 hero 为翻前首个行动位（如 UTG）时，
// 旧实现取 heroIdx-1=hero 自己作为 aggressor，生成 [hero raise, hero call] 的
// 自相矛盾序列（hero 先加注再跟注自己）。修复后应为 [hero open, 下家 call]。
describe('generatePreviousActions postflop 故事线（首位行动位回归）', () => {
  it('hero=UTG：hero 只有一个动作（open），且存在下家 call', () => {
    for (let i = 0; i < 30; i++) {
      const actions = generatePreviousActions('flop', Position.UTG, 6, 'intermediate');
      const heroActions = actions.filter((a) => a.position === Position.UTG);
      expect(heroActions).toHaveLength(1);
      expect(heroActions[0]!.action).toBe(ActionType.Raise);

      const raiseIdx = actions.findIndex((a) => a.action === ActionType.Raise);
      const callIdx = actions.findIndex((a) => a.action === ActionType.Call);
      expect(raiseIdx).toBe(0);
      expect(callIdx).toBeGreaterThan(raiseIdx);
      expect(actions[callIdx]!.position).not.toBe(Position.UTG);
    }
  });

  it('hero=BTN（非首位）：保持"前位 open + hero call"结构', () => {
    for (let i = 0; i < 30; i++) {
      const actions = generatePreviousActions('flop', Position.BTN, 6, 'intermediate');
      const heroRaises = actions.filter(
        (a) => a.position === Position.BTN && a.action === ActionType.Raise
      );
      expect(heroRaises).toHaveLength(0);

      const raiseActions = actions.filter((a) => a.action === ActionType.Raise);
      expect(raiseActions).toHaveLength(1);
      expect(raiseActions[0]!.position).not.toBe(Position.BTN);
    }
  });

  it('hero=UTG preflop 不受影响（前面无行动 → 空序列 open 场景）', () => {
    for (let i = 0; i < 30; i++) {
      const actions = generatePreviousActions('preflop', Position.UTG, 6, 'intermediate');
      expect(actions).toHaveLength(0);
    }
  });
});
