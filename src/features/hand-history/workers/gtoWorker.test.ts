import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

/**
 * gtoWorker 消息处理入口测试（L1）。
 *
 * Worker 在独立执行上下文中以 module 形式加载，入口把 `self.onmessage` 赋值为消息处理器，
 * 因此测试在 import 前用 vi.stubGlobal('self', ...) 伪造 worker 全局，然后直接投递消息验证
 * lookupStrategy / calculateEV / batchAnalyze 三条通道与未知类型兜底。
 * 阈值 parity 由 gtoWorkerThresholds.test.ts 守护，本文件不重复。
 */

interface FakeWorkerScope {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (msg: unknown) => void;
}

let scope: FakeWorkerScope;
let postMessage: Mock<(msg: unknown) => void>;

function dispatch(type: string, payload: unknown, id = 1): void {
  expect(scope.onmessage, 'worker 未注册 onmessage').not.toBeNull();
  scope.onmessage!({ data: { type, payload, id } } as MessageEvent);
}

function lastResult<T>(): T {
  const call = postMessage.mock.calls.at(-1);
  expect(call, 'worker 未回传消息').toBeDefined();
  return (call![0] as { result: T }).result;
}

beforeEach(() => {
  postMessage = vi.fn<(msg: unknown) => void>();
  scope = { onmessage: null, postMessage };
  vi.stubGlobal('self', scope);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

async function loadWorker(): Promise<void> {
  const mod = await import('./gtoWorker');
  // 确保加载的是新实例（每个用例独立 stub 的 self）
  expect(typeof mod.calculateGrade).toBe('function');
}

describe('gtoWorker lookupStrategy', () => {
  it('强牌（对子 AA）返回 raise，频率之和为 1', async () => {
    await loadWorker();
    dispatch('lookupStrategy', { hand: 'AA', position: 'BTN' });

    const result = lastResult<{ hand: string; action: string; frequency: Record<string, number>; ev: number }>();
    expect(result.hand).toBe('AA');
    expect(result.action).toBe('raise');
    const freq = result.frequency;
    expect(freq.fold! + freq.call! + freq.raise!).toBeCloseTo(1, 10);
    expect(result.ev).toBeGreaterThan(0.75);
  });

  it('垃圾牌（72o）在 UTG 返回 fold', async () => {
    await loadWorker();
    dispatch('lookupStrategy', { hand: '72o', position: 'UTG' });

    const result = lastResult<{ action: string }>();
    expect(result.action).toBe('fold');
  });

  it('位置加成影响激进度：同一手牌 BTN 的 raise 频率高于 UTG', async () => {
    await loadWorker();

    dispatch('lookupStrategy', { hand: 'T8s', position: 'UTG' });
    const utg = lastResult<{ frequency: { raise: number } }>();
    dispatch('lookupStrategy', { hand: 'T8s', position: 'BTN' });
    const btn = lastResult<{ frequency: { raise: number } }>();

    expect(btn.frequency.raise).toBeGreaterThan(utg.frequency.raise);
  });

  it('未知位置不抛错（位置加成缺省 0）', async () => {
    await loadWorker();
    dispatch('lookupStrategy', { hand: 'KQo', position: 'NOWHERE' });
    expect(lastResult<{ action: string }>().action).toBeDefined();
  });
});

describe('gtoWorker calculateEV', () => {
  it('equity 50% / pot 100 / bet 50 → EV +50 且可跟注', async () => {
    await loadWorker();
    dispatch('calculateEV', { potSize: 100, betSize: 50, equity: 0.5 });

    expect(lastResult<{ ev: number; profitable: boolean }>()).toEqual({ ev: 50, profitable: true });
  });

  it('equity 20% 时 EV 为负 → 不可跟注', async () => {
    await loadWorker();
    dispatch('calculateEV', { potSize: 100, betSize: 50, equity: 0.2 });

    const result = lastResult<{ ev: number; profitable: boolean }>();
    expect(result.ev).toBeCloseTo(-10, 10);
    expect(result.profitable).toBe(false);
  });
});

describe('gtoWorker batchAnalyze（五级评级链路）', () => {
  it('用户动作与 GTO 推荐一致 → evLoss 0 / grade best', async () => {
    await loadWorker();
    // AA 在 BTN 的推荐动作是 raise
    dispatch('batchAnalyze', [{ id: 'h1', hand: 'AA', position: 'BTN', action: 'raise', street: 'preflop' }]);

    const [result] = lastResult<Array<{ id: string; gtoAction: string; evLoss: number; grade: string }>>();
    expect(result!.id).toBe('h1');
    expect(result!.gtoAction).toBe('raise');
    expect(result!.evLoss).toBe(0);
    expect(result!.grade).toBe('best');
  });

  it('用户动作与推荐差异越大 evLoss 越高（同手牌对比相邻档与跨档）', async () => {
    await loadWorker();
    dispatch('batchAnalyze', [
      { id: 'near', hand: 'AA', position: 'BTN', action: 'call', street: 'preflop', handStrength: 0.9 },
      { id: 'far', hand: 'AA', position: 'BTN', action: 'fold', street: 'preflop', handStrength: 0.9 },
    ]);

    const [near, far] = lastResult<Array<{ evLoss: number; grade: string }>>();
    expect(near!.evLoss).toBeGreaterThan(0);
    expect(far!.evLoss).toBeGreaterThan(near!.evLoss);
  });

  it('大小写不敏感匹配动作；缺 handStrength 时以策略 EV 反推', async () => {
    await loadWorker();
    dispatch('batchAnalyze', [{ id: 'h2', hand: 'AA', position: 'BTN', action: 'RAISE', street: 'preflop' }]);

    const [result] = lastResult<Array<{ evLoss: number }>>();
    expect(result!.evLoss).toBe(0);
  });

  it('空批次返回空数组', async () => {
    await loadWorker();
    dispatch('batchAnalyze', []);
    expect(lastResult<unknown[]>()).toEqual([]);
  });
});

describe('gtoWorker 未知消息类型', () => {
  it('返回 error 字段并原样回传 type / id', async () => {
    await loadWorker();
    dispatch('nope', {}, 42);

    expect(postMessage).toHaveBeenCalledWith({
      type: 'nope',
      result: { error: 'Unknown message type: nope' },
      id: 42,
    });
  });
});
