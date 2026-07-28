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

export function useTimer({ timeLimit, onTimeUp, autoStart = true }: UseTimerOptions): UseTimerReturn {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  const hasTriggeredRef = useRef(false);

  // Keep callback ref fresh
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setElapsed(0);
    hasTriggeredRef.current = false;
    setIsRunning(true);
  }, []);

  // Reset elapsed when timeLimit changes (new question)
  useEffect(() => {
    setElapsed(0);
    hasTriggeredRef.current = false;
  }, [timeLimit]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.1;

        // Check time up
        if (timeLimit > 0 && next >= timeLimit && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          setIsRunning(false);
          // Use setTimeout to avoid setState inside setState
          setTimeout(() => onTimeUpRef.current(), 0);
          return timeLimit;
        }

        return next;
      });
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLimit]);

  const timeRemaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : elapsed;

  return { timeRemaining, elapsed, isRunning, start, pause, reset };
}
