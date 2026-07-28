import { useRef, useEffect, useCallback } from 'react';

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
 */
export function useGTOWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<number, (result: unknown) => void>>(new Map());

  useEffect(() => {
    let worker: Worker | null = null;
    try {
      // Create worker from the bundled worker file
      worker = new Worker(new URL('../workers/gtoWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const { id, result } = e.data;
        const resolve = pendingRef.current.get(id);
        if (resolve) {
          resolve(result);
          pendingRef.current.delete(id);
        }
      };
      workerRef.current = worker;
    } catch {
      // Worker not available, will use fallback
      workerRef.current = null;
    }

    return () => {
      worker?.terminate();
      pendingRef.current.clear();
    };
  }, []);

  const sendMessage = useCallback(<T>(type: string, payload: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      const id = ++workerIdCounter;

      if (workerRef.current) {
        pendingRef.current.set(id, resolve as (result: unknown) => void);
        const msg: WorkerMessage = { type, payload, id };
        workerRef.current.postMessage(msg);

        // Timeout after 10s
        setTimeout(() => {
          if (pendingRef.current.has(id)) {
            pendingRef.current.delete(id);
            reject(new Error('Worker timeout'));
          }
        }, 10000);
      } else {
        // Fallback: compute on main thread (simplified)
        resolve(computeFallback(type, payload) as T);
      }
    });
  }, []);

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
    isWorkerAvailable: workerRef.current !== null,
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
