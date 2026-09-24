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
 * P1A-12 修复：
 * - elapsed 以 Date.now() 时间戳为基准计算（累计段起点 + 段内墙钟差），
 *   不再依赖 100ms tick 累加，消除后台节流导致的计时误差；
 * - onTimeUp 的 setTimeout 句柄存入 ref，暂停/卸载时统一清理，避免泄漏。
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

  // Keep callback ref fresh
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    // 结算当前运行段到累计值（暂停期间不计时）
    if (segmentStartRef.current !== null) {
      accumulatedRef.current += (Date.now() - segmentStartRef.current) / 1000;
      segmentStartRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    accumulatedRef.current = 0;
    // 若当前正处于运行段（isRunning 不变、effect 不重跑），需就地重置段起点；
    // 否则置 null，由 start 后的 effect 重新开段
    segmentStartRef.current = segmentStartRef.current !== null ? Date.now() : null;
    hasTriggeredRef.current = false;
    setElapsed(0);
    setIsRunning(true);
  }, []);

  // Reset elapsed when timeLimit changes (new question)
  useEffect(() => {
    accumulatedRef.current = 0;
    segmentStartRef.current = segmentStartRef.current !== null ? Date.now() : null;
    hasTriggeredRef.current = false;
    setElapsed(0);
  }, [timeLimit]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // 开启新运行段：以 Date.now() 为基准，tick 只负责刷新 UI
    segmentStartRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const segStart = segmentStartRef.current;
      const next =
        accumulatedRef.current + (segStart !== null ? (Date.now() - segStart) / 1000 : 0);

      if (timeLimit > 0 && next >= timeLimit && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        accumulatedRef.current = timeLimit;
        segmentStartRef.current = null;
        setElapsed(timeLimit);
        setIsRunning(false);
        // Use setTimeout to avoid setState inside setState; 句柄入 ref 以便清理
        timeUpTimeoutRef.current = setTimeout(() => onTimeUpRef.current(), 0);
        return;
      }
      setElapsed(next);
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLimit]);

  // 卸载时清理 onTimeUp 的延迟句柄
  useEffect(() => {
    return () => {
      if (timeUpTimeoutRef.current) {
        clearTimeout(timeUpTimeoutRef.current);
        timeUpTimeoutRef.current = null;
      }
    };
  }, []);

  const timeRemaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : elapsed;

  return { timeRemaining, elapsed, isRunning, start, pause, reset };
}
