import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  timeLimit: number;      // 秒，0=无限
  onTimeUp: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeRemaining: number;  // 剩余秒数（timeLimit=0 时为已用秒数）
  elapsed: number;        // 已用秒数
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
}

/**
 * elapsed 以 Date.now() 时间戳为基准计算，100ms tick 只负责刷新 UI。
 * 超时回调延迟到下一个宏任务执行；暂停、reset、换题与卸载都会取消待执行句柄。
 */
export function useTimer({ timeLimit, onTimeUp, autoStart = true }: UseTimerOptions): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeUpTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const hasTriggeredRef = useRef(false);
  // 已完成运行段的累计秒数 + 当前运行段起点时间戳（null=未在运行段中）
  const accumulatedRef = useRef(0);
  const segmentStartRef = useRef<number | null>(null);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const clearTimeUpTimeout = useCallback(() => {
    if (timeUpTimeoutRef.current !== null) {
      clearTimeout(timeUpTimeoutRef.current);
      timeUpTimeoutRef.current = null;
    }
  }, []);

  const scheduleTimeUp = useCallback(() => {
    if (timeLimit <= 0 || hasTriggeredRef.current || timeUpTimeoutRef.current !== null) return;
    timeUpTimeoutRef.current = setTimeout(() => {
      timeUpTimeoutRef.current = null;
      if (hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;
      onTimeUpRef.current();
    }, 0);
  }, [timeLimit]);

  const checkTimeUp = useCallback(() => {
    const segStart = segmentStartRef.current;
    const next = accumulatedRef.current + (segStart !== null ? (Date.now() - segStart) / 1000 : 0);
    if (timeLimit <= 0 || next < timeLimit || hasTriggeredRef.current || timeUpTimeoutRef.current !== null) {
      return false;
    }
    accumulatedRef.current = timeLimit;
    segmentStartRef.current = null;
    setElapsed(timeLimit);
    setIsRunning(false);
    scheduleTimeUp();
    return true;
  }, [timeLimit, scheduleTimeUp]);

  const start = useCallback(() => {
    if (hasTriggeredRef.current || timeUpTimeoutRef.current !== null) return;
    if (segmentStartRef.current === null) segmentStartRef.current = Date.now();
    if (!checkTimeUp()) setIsRunning(true);
  }, [checkTimeUp]);

  const pause = useCallback(() => {
    if (segmentStartRef.current !== null) {
      accumulatedRef.current += (Date.now() - segmentStartRef.current) / 1000;
      segmentStartRef.current = null;
    }
    clearTimeUpTimeout();
    setElapsed(accumulatedRef.current);
    setIsRunning(false);
  }, [clearTimeUpTimeout]);

  const reset = useCallback(() => {
    clearTimeUpTimeout();
    accumulatedRef.current = 0;
    // reset 总会恢复运行；同步重建段起点，覆盖停止态尚未提交时的同 tick 竞态。
    segmentStartRef.current = Date.now();
    hasTriggeredRef.current = false;
    setElapsed(0);
    setIsRunning(true);
  }, [clearTimeUpTimeout]);

  // timeLimit 变化代表新题：旧待执行超时不得落入新题。
  useEffect(() => {
    clearTimeUpTimeout();
    accumulatedRef.current = 0;
    segmentStartRef.current = segmentStartRef.current !== null ? Date.now() : null;
    hasTriggeredRef.current = false;
    setElapsed(0);
  }, [timeLimit, clearTimeUpTimeout]);

  useEffect(() => {
    if (!isRunning || hasTriggeredRef.current) return;

    segmentStartRef.current = Date.now();
    // 恢复时可能已经达到时限，立即检查，不等待下一个 100ms tick。
    if (checkTimeUp()) return;
    intervalRef.current = setInterval(() => {
      if (checkTimeUp()) return;
      const segStart = segmentStartRef.current;
      setElapsed(accumulatedRef.current + (segStart !== null ? (Date.now() - segStart) / 1000 : 0));
    }, 100);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLimit, checkTimeUp]);

  useEffect(() => {
    return clearTimeUpTimeout;
  }, [clearTimeUpTimeout]);

  const timeRemaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : elapsed;

  return { timeRemaining, elapsed, isRunning, start, pause, reset };
}
