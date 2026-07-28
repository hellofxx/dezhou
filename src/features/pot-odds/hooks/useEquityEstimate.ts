import { useMemo } from 'react';
import { estimateEquity } from '@/shared/utils/pokerMath';

export function useEquityEstimate(outs: number, street: 'flop' | 'turn') {
  return useMemo(() => {
    const equity = estimateEquity(outs, street) * 100;
    // Rule of 2 and 4 is an approximation
    const confidence = street === 'flop' ? '约' : '较精确';
    return { equity, confidence };
  }, [outs, street]);
}
