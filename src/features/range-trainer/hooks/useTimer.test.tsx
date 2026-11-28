import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useTimer } from './useTimer';

/** 推进到阈值 tick，但不继续执行该 tick 新排的 0ms 超时回调。 */
function advanceToTimeUpTick(): void {
  act(() => vi.advanceTimersByTime(900));
  act(() => vi.advanceTimersToNextTimer());
}

describe('useTimer 超时竞态', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('暂停清理已排超时；恢复时已到时限则立即且只触发一次', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ timeLimit: 1, onTimeUp }));

    advanceToTimeUpTick();
    expect(onTimeUp).not.toHaveBeenCalled();

    act(() => result.current.pause());
    act(() => vi.advanceTimersByTime(1));
    expect(onTimeUp).not.toHaveBeenCalled();

    act(() => result.current.start());
    expect(onTimeUp).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onTimeUp).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(1000));
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('reset 清理上一题待执行超时，并从零重新计时', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ timeLimit: 1, onTimeUp }));

    advanceToTimeUpTick();
    act(() => result.current.reset());
    act(() => vi.advanceTimersByTime(1));

    expect(onTimeUp).not.toHaveBeenCalled();
    expect(result.current.elapsed).toBe(0);
    act(() => vi.advanceTimersByTime(1000));
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('阈值 tick 同一 tick reset 时取消旧超时并续跑新计时', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ timeLimit: 1, onTimeUp }));

    act(() => vi.advanceTimersByTime(900));
    act(() => {
      vi.advanceTimersToNextTimer();
      result.current.reset();
    });
    act(() => vi.advanceTimersByTime(1));
    expect(onTimeUp).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1100));
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('已到时限后同一 tick pause/start 仍立即补触发一次', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ timeLimit: 1, onTimeUp }));

    act(() => vi.setSystemTime(Date.now() + 1000));
    act(() => {
      result.current.pause();
      result.current.start();
    });
    expect(onTimeUp).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('timeLimit 变化清理旧待执行超时，新时限从零计时', () => {
    const onTimeUp = vi.fn();
    const { result, rerender } = renderHook(
      ({ timeLimit }) => useTimer({ timeLimit, onTimeUp }),
      { initialProps: { timeLimit: 1 } },
    );

    advanceToTimeUpTick();
    rerender({ timeLimit: 2 });
    act(() => vi.advanceTimersByTime(1));

    expect(onTimeUp).not.toHaveBeenCalled();
    expect(result.current.elapsed).toBe(0);
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2100));
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('卸载清理待执行超时', () => {
    const onTimeUp = vi.fn();
    const { unmount } = renderHook(() => useTimer({ timeLimit: 1, onTimeUp }));

    advanceToTimeUpTick();
    unmount();
    act(() => vi.advanceTimersByTime(1));

    expect(onTimeUp).not.toHaveBeenCalled();
  });

  it('墙钟已超过时限时恢复，不等待下一个 100ms tick', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ timeLimit: 1, onTimeUp }));

    act(() => vi.setSystemTime(Date.now() + 1000));
    act(() => result.current.pause());
    act(() => result.current.start());

    expect(onTimeUp).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('超时回调已执行后重复 start 不再次触发', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ timeLimit: 1, onTimeUp }));

    act(() => vi.advanceTimersByTime(1100));
    expect(onTimeUp).toHaveBeenCalledTimes(1);

    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });
});
