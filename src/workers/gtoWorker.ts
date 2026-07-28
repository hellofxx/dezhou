// Web Worker for GTO strategy lookup and EV calculations

const _self = self as unknown as {
  onmessage: ((e: MessageEvent) => void) | null;
  postMessage: (msg: unknown) => void;
};

interface HandStrategy {
  hand: string;
  action: 'fold' | 'call' | 'raise' | 'all-in';
  frequency: { fold: number; call: number; raise: number };
  ev: number;
}

interface StrategyPayload {
  hand: string;
  position: string;
  scenario?: string;
}

interface BatchAnalyzeHand {
  id: string;
  hand: string;        // e.g. "AKs", "QQ"
  position: string;
  board?: string[];
  action: string;      // user's actual action
  street: string;
}

interface BatchAnalyzeResult {
  id: string;
  gtoAction: string;
  evLoss: number;
  grade: string;
}

interface EVPayload {
  potSize: number;
  betSize: number;
  equity: number;
}

/**
 * Simplified GTO strategy lookup based on hand and position.
 * In production this would use precomputed solver data.
 */
function lookupStrategy(payload: StrategyPayload): HandStrategy {
  const { hand, position } = payload;

  // Determine hand strength (simplified)
  const rank1 = hand[0];
  const rank2 = hand[1];
  const suited = hand.length > 2 && hand[2] === 's';

  const highCardValue = getRankValue(rank1!);
  const lowCardValue = getRankValue(rank2!);
  const pair = rank1 === rank2;
  const strength = calculateHandStrength(highCardValue, lowCardValue, pair, suited, position);

  let action: HandStrategy['action'];
  let foldFreq: number;
  let callFreq: number;
  let raiseFreq: number;

  if (strength > 0.75) {
    action = 'raise';
    raiseFreq = 0.85;
    callFreq = 0.12;
    foldFreq = 0.03;
  } else if (strength > 0.5) {
    action = 'raise';
    raiseFreq = 0.55;
    callFreq = 0.35;
    foldFreq = 0.10;
  } else if (strength > 0.3) {
    action = 'call';
    raiseFreq = 0.15;
    callFreq = 0.60;
    foldFreq = 0.25;
  } else {
    action = 'fold';
    raiseFreq = 0.05;
    callFreq = 0.15;
    foldFreq = 0.80;
  }

  const ev = strength * 2 - 0.5;

  return {
    hand,
    action,
    frequency: { fold: foldFreq, call: callFreq, raise: raiseFreq },
    ev: Math.round(ev * 100) / 100,
  };
}

/**
 * Calculate Expected Value for a call decision.
 */
function calculateEV(payload: EVPayload): { ev: number; profitable: boolean } {
  const { potSize, betSize, equity } = payload;
  const totalPot = potSize + betSize;
  const ev = equity * totalPot - (1 - equity) * betSize;
  return {
    ev: Math.round(ev * 100) / 100,
    profitable: ev > 0,
  };
}

function getRankValue(rank: string): number {
  const values: Record<string, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
  };
  return values[rank] ?? 7;
}

function calculateHandStrength(
  high: number,
  low: number,
  pair: boolean,
  suited: boolean,
  position: string
): number {
  let base = (high + low) / 28;

  if (pair) base += 0.25;
  if (suited) base += 0.08;
  if (high - low <= 4 && !pair) base += 0.05; // connectors

  // Position bonus
  const posBonus: Record<string, number> = {
    'BTN': 0.1, 'CO': 0.07, 'HJ': 0.04, 'UTG': -0.05, 'BB': 0.02, 'SB': -0.03,
  };
  base += posBonus[position] ?? 0;

  return Math.max(0, Math.min(1, base));
}

/**
 * Grade a decision by comparing user action to GTO recommendation.
 */
function gradeDecision(userAction: string, gtoAction: string, _gtoEv: number): { gtoAction: string; evLoss: number; grade: string } {
  const normalizedUser = userAction.toLowerCase();
  const normalizedGto = gtoAction.toLowerCase();

  let evLoss = 0;
  let grade: string;

  if (normalizedUser === normalizedGto) {
    evLoss = 0;
    grade = 'optimal';
  } else {
    // Estimate EV loss based on action mismatch severity
    const actionRank: Record<string, number> = { fold: 0, check: 1, call: 2, raise: 3, 'all-in': 4 };
    const userRank = actionRank[normalizedUser] ?? 1;
    const gtoRank = actionRank[normalizedGto] ?? 1;
    const diff = Math.abs(userRank - gtoRank);

    if (diff === 1) {
      // Minor deviation (e.g., call instead of raise)
      evLoss = Math.round((0.5 + Math.random() * 1.0) * 100) / 100;
      grade = 'minor_mistake';
    } else if (diff === 2) {
      // Moderate deviation
      evLoss = Math.round((1.5 + Math.random() * 2.0) * 100) / 100;
      grade = 'mistake';
    } else {
      // Major deviation (e.g., fold instead of raise)
      evLoss = Math.round((3.0 + Math.random() * 3.0) * 100) / 100;
      grade = 'blunder';
    }
  }

  return { gtoAction, evLoss, grade };
}

function batchAnalyze(hands: BatchAnalyzeHand[]): BatchAnalyzeResult[] {
  return hands.map((h) => {
    const strategy = lookupStrategy({ hand: h.hand, position: h.position });
    const { gtoAction, evLoss, grade } = gradeDecision(h.action, strategy.action, strategy.ev);
    return { id: h.id, gtoAction, evLoss, grade };
  });
}

// Worker message handler
_self.onmessage = function (e: MessageEvent) {
  const { type, payload, id } = e.data as { type: string; payload: unknown; id: number };

  let result: unknown;

  switch (type) {
    case 'lookupStrategy':
      result = lookupStrategy(payload as StrategyPayload);
      break;
    case 'calculateEV':
      result = calculateEV(payload as EVPayload);
      break;
    case 'batchAnalyze':
      result = batchAnalyze(payload as BatchAnalyzeHand[]);
      break;
    default:
      result = { error: `Unknown message type: ${type}` };
  }

  _self.postMessage({ type, result, id });
};
