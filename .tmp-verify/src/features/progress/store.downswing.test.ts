import { describe, it, expect, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import { DEFAULT_EMOTION_STATE } from './types';

/**
 * PRG-006 回归：checkDownswing 必须要求"最近 3 个自然日（日期相邻）均有训练记录"，
 * 且正确率单调下降才判定下风期。修复前 `history.slice(-3)` 取最近 3 个有记录的天，
 * 间隔多日归来的非连续日期下降会被误报为下风期。
 */
describe('progress store checkDownswing 连续自然日语义（PRG-006）', () => {
  const stub = () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  };

  /** 以相邻日期构造 emotion 状态并返回 store 后调用 checkDownswing */
  async function run(history: { date: string; accuracy: number }[], dailyAnswered: number) {
    stub();
    const { useProgressStore } = await import('./store');
    useProgressStore.setState({
      emotion: {
        ...DEFAULT_EMOTION_STATE,
        dailyQuestionsAnswered: dailyAnswered,
        accuracyHistory: history,
      },
    });
    return useProgressStore.getState().checkDownswing();
  }

  it('连续 3 个自然日正确率单调下降 → 判定下风期（true）', async () => {
    const result = await run(
      [
        { date: '2026-08-25', accuracy: 0.8 },
        { date: '2026-08-26', accuracy: 0.7 },
        { date: '2026-08-27', accuracy: 0.6 },
      ],
      10,
    );
    expect(result).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('连续 3 天但无单调下降 → 不下风期（false）', async () => {
    const result = await run(
      [
        { date: '2026-08-25', accuracy: 0.6 },
        { date: '2026-08-26', accuracy: 0.8 },
        { date: '2026-08-27', accuracy: 0.7 },
      ],
      10,
    );
    expect(result).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('日期不相邻（间隔缺练）→ 不下风期（false），即使数值单调下降（PRG-006 核心修复）', async () => {
    const result = await run(
      [
        { date: '2026-08-20', accuracy: 0.8 },
        { date: '2026-08-23', accuracy: 0.7 },
        { date: '2026-08-27', accuracy: 0.6 },
      ],
      10,
    );
    expect(result).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('跨月相邻日期仍判定连续（8/30→8/31→9/1）', async () => {
    const result = await run(
      [
        { date: '2026-08-30', accuracy: 0.85 },
        { date: '2026-08-31', accuracy: 0.75 },
        { date: '2026-09-01', accuracy: 0.65 },
      ],
      10,
    );
    expect(result).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('数据不足 3 天 → 不下风期（false）', async () => {
    const result = await run(
      [
        { date: '2026-08-25', accuracy: 0.8 },
        { date: '2026-08-26', accuracy: 0.7 },
      ],
      10,
    );
    expect(result).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('当日答题数过少（<3）→ 跳过判定，保持现值', async () => {
    stub();
    const { useProgressStore } = await import('./store');
    useProgressStore.setState({
      emotion: {
        ...DEFAULT_EMOTION_STATE,
        dailyQuestionsAnswered: 2,
        isDownswing: true,
        accuracyHistory: [
          { date: '2026-08-25', accuracy: 0.8 },
          { date: '2026-08-26', accuracy: 0.7 },
          { date: '2026-08-27', accuracy: 0.6 },
        ],
      },
    });
    const result = useProgressStore.getState().checkDownswing();
    expect(result).toBe(true); // 保持现值
  });
});
