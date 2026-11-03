import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * 音效管理器契约（Web Audio API 静默降级）：
 * - init 幂等，且 AudioContext 不可用时静默失败（不阻断训练）
 * - setEnabled(false) 后所有播放方法不创建音频节点
 * - 播放链路只在初始化后生效；suspended 状态会 resume
 * - 节点创建异常被吞掉（音效永远不应打断答题）
 *
 * 单例在模块加载时创建：每例 resetModules + 动态 import，避免状态串扰。
 */

class MockAudioParam {
  value = 0;
  exponentialRampToValueAtTime = vi.fn();
}

class MockOscillator {
  frequency = new MockAudioParam();
  type = 'sine';
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockGain {
  gain = new MockAudioParam();
  connect = vi.fn();
}

class MockBuffer {
  data: Float32Array;
  constructor(length: number) {
    this.data = new Float32Array(length);
  }
  getChannelData = () => this.data;
}

class MockBufferSource {
  buffer: MockBuffer | null = null;
  connect = vi.fn();
  start = vi.fn();
}

class MockAudioContext {
  static instances = 0;
  static last: MockAudioContext | null = null;
  state: 'running' | 'suspended' | 'closed' = 'running';
  currentTime = 0;
  sampleRate = 48_000;
  destination = {};
  oscillators: MockOscillator[] = [];
  buffers: MockBuffer[] = [];
  sources: MockBufferSource[] = [];
  resume = vi.fn();
  createOscillator = vi.fn(() => {
    const osc = new MockOscillator();
    this.oscillators.push(osc);
    return osc;
  });
  createGain = vi.fn(() => new MockGain());
  createBuffer = vi.fn((_channels: number, length: number) => {
    const buffer = new MockBuffer(length);
    this.buffers.push(buffer);
    return buffer;
  });
  createBufferSource = vi.fn(() => {
    const source = new MockBufferSource();
    this.sources.push(source);
    return source;
  });
  constructor() {
    MockAudioContext.instances += 1;
    MockAudioContext.last = this;
  }
}

function lastContext(): MockAudioContext {
  const ctx = MockAudioContext.last;
  if (!ctx) throw new Error('AudioContext 尚未创建');
  return ctx;
}

async function importSoundManager(): Promise<typeof import('./soundManager').soundManager> {
  const mod = await import('./soundManager');
  return mod.soundManager;
}

describe('soundManager：初始化', () => {
  beforeEach(() => {
    vi.resetModules();
    MockAudioContext.instances = 0;
    MockAudioContext.last = null;
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('init 幂等：重复调用只创建一次 AudioContext', async () => {
    const manager = await importSoundManager();
    manager.init();
    manager.init();
    manager.init();
    expect(MockAudioContext.instances).toBe(1);
  });

  it('AudioContext 构造抛错时静默失败，且下次 init 可重试', async () => {
    let attempts = 0;
    class ThrowingAudioContext {
      constructor() {
        attempts += 1;
        throw new Error('Web Audio unavailable');
      }
    }
    vi.stubGlobal('AudioContext', ThrowingAudioContext);

    const manager = await importSoundManager();
    expect(() => manager.init()).not.toThrow();
    expect(attempts).toBe(1);
    manager.init();
    expect(attempts).toBe(2);
  });

  it('未初始化时播放不抛错且不创建节点', async () => {
    const manager = await importSoundManager();
    expect(() => manager.playCorrect()).not.toThrow();
    expect(() => manager.playDeal()).not.toThrow();
    expect(() => manager.playTick()).not.toThrow();
    expect(MockAudioContext.instances).toBe(0);
  });
});

describe('soundManager：开关与播放', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    MockAudioContext.instances = 0;
    MockAudioContext.last = null;
    vi.stubGlobal('AudioContext', MockAudioContext);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('默认开启；setEnabled(false) 后播放不创建振荡器', async () => {
    const manager = await importSoundManager();
    expect(manager.isEnabled()).toBe(true);
    manager.init();
    manager.setEnabled(false);
    expect(manager.isEnabled()).toBe(false);

    manager.playCorrect();
    vi.runAllTimers();
    expect(lastContext().createOscillator).not.toHaveBeenCalled();
  });

  it('playCorrect 依次播放两个音（C5 → E5）', async () => {
    const manager = await importSoundManager();
    manager.init();
    manager.playCorrect();
    expect(lastContext().oscillators).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(lastContext().oscillators).toHaveLength(2);
  });

  it('playWrong 第二个音在 150ms 后播放', async () => {
    const manager = await importSoundManager();
    manager.init();
    manager.playWrong();
    expect(lastContext().oscillators).toHaveLength(1);
    vi.advanceTimersByTime(149);
    expect(lastContext().oscillators).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(lastContext().oscillators).toHaveLength(2);
  });

  it('playDeal 生成白噪声 buffer 并启动 source', async () => {
    const manager = await importSoundManager();
    manager.init();
    manager.playDeal();
    const ctx = lastContext();
    expect(ctx.createBuffer).toHaveBeenCalledTimes(1);
    expect(ctx.buffers[0]!.data).toHaveLength(Math.floor(ctx.sampleRate * 0.05));
    expect(ctx.sources[0]!.start).toHaveBeenCalledTimes(1);
  });

  it('suspended 状态的 context 在播放时 resume', async () => {
    const manager = await importSoundManager();
    manager.init();
    lastContext().state = 'suspended';
    manager.playTick();
    expect(lastContext().resume).toHaveBeenCalledTimes(1);
  });

  it('振荡器创建异常被吞掉（音效不阻断答题）', async () => {
    const manager = await importSoundManager();
    manager.init();
    lastContext().createOscillator = vi.fn(() => {
      throw new Error('node creation failed');
    });
    expect(() => manager.playTick()).not.toThrow();
  });
});
