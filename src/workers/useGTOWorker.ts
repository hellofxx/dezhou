import { useRef, useEffect, useCallback, useState } from 'react';

interface WorkerMessage {
  type: string;
  payload: unknown;
  id: number;
}

interface WorkerResponse {
  type: string;
  result: unknown;
  id: number;
}

interface HandStrategy {
  hand: string;
  action: 'fold' | 'call' | 'raise' | 'all-in';
  frequency: { fold: number; call: number; raise: number };
  ev: number;
}

interface EVResult {
  ev: number;
  profitable: boolean;
}

interface BatchAnalyzeHand {
  id: string;
  hand: string;
  position: string;
  board?: string[];
  action: string;
  street: string;
}

interface BatchAnalyzeResult {
  id: string;
  gtoAction: string;
  evLoss: number;
  grade: string;
}

let workerIdCounter = 0;

/**
 * Hook to use GTO Web Worker with async API.
 * Falls back to main-thread computation if Worker is unavailable.
 *
 * Health check:
 * - Worker `onerror` marks it as dead → subsequent calls use fallback.
 * - 10 s timeout also marks it dead and attempts a one-time rebuild.
 * - If rebuild also fails, fallback is used permanently for this mount.
 */
export function useGTOWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<number, (result: unknown) => void>>(new Map());
  const workerDeadRef = useRef(false);
  const rebuildAttemptedRef = useRef(false);
  const [isWorkerAvailable, setIsWorkerAvailable] = useState(true);

  /** Terminate current worker (if any) and null out the ref. */
  const terminateWorker = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
  }, []);

  /** Mark worker as dead, update reactive state. */
  const markDead = useCallback(() => {
    if (!workerDeadRef.current) {
      workerDeadRef.current = true;
      setIsWorkerAvailable(false);
    }
  }, []);

  /** Try to rebuild the worker after a failure. Returns true on success. */
  const rebuildWorker = useCallback(() => {
    if (rebuildAttemptedRef.current) return false;
    rebuildAttemptedRef.current = true;
    terminateWorker();

    try {
      const worker = new Worker(new URL('../workers/gtoWorker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, result } = e.data;
        const resolve = pendingRef.current.get(id);
        if (resolve) {
          resolve(result);
          pendingRef.current.delete(id);
        }
      };

      worker.onerror = () => {
        markDead();
        terminateWorker();
      };

      workerRef.current = worker;
      workerDeadRef.current = false;
      setIsWorkerAvailable(true);
      return true;
    } catch {
      return false;
    }
  }, [markDead, terminateWorker]);

  useEffect(() => {
    try {
      const worker = new Worker(new URL('../workers/gtoWorker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, result } = e.data;
        const resolve = pendingRef.current.get(id);
        if (resolve) {
          resolve(result);
          pendingRef.current.delete(id);
        }
      };

      worker.onerror = () => {
        markDead();
        terminateWorker();
      };

      workerRef.current = worker;
    } catch {
      // Worker not available at all — mark dead immediately
      markDead();
    }

    return () => {
      terminateWorker();
      pendingRef.current.clear();
    };
  }, [markDead, terminateWorker]);

  const sendMessage = useCallback(<T>(type: string, payload: unknown): Promise<T> => {
    return new Promise<T>((resolve) => {
      const id = ++workerIdCounter;

      if (workerRef.current && !workerDeadRef.current) {
        pendingRef.current.set(id, resolve as (result: unknown) => void);
        const msg: WorkerMessage = { type, payload, id };
        workerRef.current.postMessage(msg);

        // Timeout after 10 s → mark dead, try rebuild, fallback for this request
        setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            markDead();
            terminateWorker();

            // Attempt one-time rebuild for future requests
            rebuildWorker();

            // This request is lost on the worker — resolve via fallback
            resolve(computeFallback(type, payload) as T);
          }
        }, 10000);
      } else {
        // Fallback: compute on main thread (simplified)
        resolve(computeFallback(type, payload) as T);
      }
    });
  }, [markDead, terminateWorker, rebuildWorker]);

  const lookupStrategy = useCallback((hand: string, position: string, scenario?: string): Promise<HandStrategy> => {
    return sendMessage<HandStrategy>('lookupStrategy', { hand, position, scenario });
  }, [sendMessage]);

  const calculateEV = useCallback((potSize: number, betSize: number, equity: number): Promise<EVResult> => {
    return sendMessage<EVResult>('calculateEV', { potSize, betSize, equity });
  }, [sendMessage]);

  const batchAnalyze = useCallback((hands: BatchAnalyzeHand[]): Promise<BatchAnalyzeResult[]> => {
    return sendMessage<BatchAnalyzeResult[]>('batchAnalyze', hands);
  }, [sendMessage]);

  return {
    lookupStrategy,
    calculateEV,
    batchAnalyze,
    isWorkerAvailable,
  };
}

/** Synchronous fallback computation */
function computeFallback(type: string, payload: unknown): unknown {
  if (type === 'calculateEV') {
    const { potSize, betSize, equity } = payload as { potSize: number; betSize: number; equity: number };
    const totalPot = potSize + betSize;
    const ev = equity * totalPot - (1 - equity) * betSize;
    return { ev: Math.round(ev * 100) / 100, profitable: ev > 0 };
  }

  if (type === 'lookupStrategy') {
    const { hand } = payload as { hand: string; position: string };
    return {
      hand,
      action: 'call' as const,
      frequency: { fold: 0.2, call: 0.5, raise: 0.3 },
      ev: 0.1,
    };
  }

  if (type === 'batchAnalyze') {
    const hands = payload as BatchAnalyzeHand[];
    return hands.map((h) => ({
      id: h.id,
      gtoAction: 'call',
      evLoss: 0,
      grade: 'optimal',
    }));
  }

  return { error: 'Unknown type' };
}
