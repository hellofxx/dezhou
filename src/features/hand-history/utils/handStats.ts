import type { HandHistory } from '../types';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';

export interface HeroStats {
  totalHands: number;
  vpip: number;              // 自愿入池率
  pfr: number;               // 翻前加注率
  threeBetPercent: number;   // 3-bet 频率
  afq: number;               // 激进度频率
  cbetFrequency: number;     // C-bet 频率
  wtsd: number;              // 摊牌率
  wsd: number;               // 摊牌胜率

  // 按位置统计
  byPosition: Record<string, { hands: number; vpip: number; pfr: number }>;
}

interface HandAnalysis {
  heroVPIP: boolean;
  heroPFR: boolean;
  heroThreeBet: boolean;
  facedRaise: boolean;
  heroSawFlop: boolean;
  heroWasPreflopRaiser: boolean;
  heroCBetFlop: boolean;
  heroWentToShowdown: boolean;
  heroWonShowdown: boolean;
  aggressiveActions: number; // bet + raise
  passiveActions: number;     // call
  position: string;
}

function getHeroIndex(hand: HandHistory, heroName: string): number {
  return hand.players.findIndex(p => p.name === heroName);
}

function analyzeHand(hand: HandHistory, heroName: string): HandAnalysis | null {
  const heroIdx = getHeroIndex(hand, heroName);
  if (heroIdx === -1) return null;

  const hero = hand.players[heroIdx]!;
  const preflop = hand.streets.preflop;
  const flopActions = hand.streets.flop.actions;

  // Determine if hero voluntarily put money in (VPIP)
  // Exclude forced blinds (posts) when no other action taken
  let heroVPIP = false;
  let heroPFR = false;
  let heroThreeBet = false;
  let facedRaise = false;
  let raiseCount = 0;
  let heroWasPreflopRaiser = false;

  // Track raises before hero's action for 3-bet detection
  let raisesBeforeHero = 0;
  let heroActed = false;

  for (const action of preflop) {
    if (action.playerIndex === heroIdx) {
      heroActed = true;
      if (action.type === ActionType.Call) {
        // Check if this is a forced blind (amount equals BB or SB and no prior raise)
        const isForcedBlind = raisesBeforeHero === 0 &&
          (action.amount === hand.stakes.bigBlind || action.amount === hand.stakes.smallBlind);
        if (!isForcedBlind) {
          heroVPIP = true;
        }
      } else if (action.type === ActionType.Raise || action.type === ActionType.AllIn) {
        heroVPIP = true;
        heroPFR = true;
        heroWasPreflopRaiser = true;
        if (raisesBeforeHero >= 1) {
          heroThreeBet = true;
        }
      }
      if (action.type === ActionType.Call || action.type === ActionType.Raise || action.type === ActionType.AllIn) {
        facedRaise = raisesBeforeHero > 0;
      }
    } else {
      if (action.type === ActionType.Raise || action.type === ActionType.AllIn) {
        raiseCount++;
        if (!heroActed) {
          raisesBeforeHero++;
        }
      }
    }
  }

  // If hero never acted (folded before action or was BB and everyone folded)
  if (!heroActed) {
    // Check if hero is BB and everyone folded
    const heroIsBB = hero.position === 'BB';
    if (heroIsBB && raiseCount === 0) {
      // BB option not exercised - not VPIP
    }
  }

  // Did hero see the flop?
  const heroFoldedPreflop = preflop.some(a => a.playerIndex === heroIdx && a.type === ActionType.Fold);
  const heroSawFlop = !heroFoldedPreflop && hand.streets.flop.cards.length > 0;

  // C-bet: hero was preflop raiser and bet on flop
  let heroCBetFlop = false;
  if (heroWasPreflopRaiser && heroSawFlop) {
    // First aggressive action on flop by hero
    const heroFlopAction = flopActions.find(a => a.playerIndex === heroIdx);
    if (heroFlopAction && (heroFlopAction.type === ActionType.Raise || heroFlopAction.type === ActionType.AllIn)) {
      heroCBetFlop = true;
    }
  }

  // Showdown detection
  const heroWentToShowdown = hand.winner !== undefined &&
    hand.streets.flop.cards.length > 0 &&
    !heroFoldedPreflop &&
    !hand.streets.flop.actions.some(a => a.playerIndex === heroIdx && a.type === ActionType.Fold) &&
    !hand.streets.turn.actions.some(a => a.playerIndex === heroIdx && a.type === ActionType.Fold) &&
    !hand.streets.river.actions.some(a => a.playerIndex === heroIdx && a.type === ActionType.Fold);

  const heroWonShowdown = heroWentToShowdown && hand.winner?.playerId === heroIdx;

  // Aggression: count all bet/raise vs call across all streets
  let aggressiveActions = 0;
  let passiveActions = 0;
  const allActions: PlayerAction[] = [
    ...preflop,
    ...flopActions,
    ...hand.streets.turn.actions,
    ...hand.streets.river.actions,
  ];
  for (const a of allActions) {
    if (a.playerIndex === heroIdx) {
      if (a.type === ActionType.Raise || a.type === ActionType.AllIn) aggressiveActions++;
      else if (a.type === ActionType.Call) passiveActions++;
    }
  }

  return {
    heroVPIP,
    heroPFR,
    heroThreeBet,
    facedRaise,
    heroSawFlop,
    heroWasPreflopRaiser,
    heroCBetFlop,
    heroWentToShowdown,
    heroWonShowdown,
    aggressiveActions,
    passiveActions,
    position: hero.position,
  };
}

export function calculateHeroStats(hands: HandHistory[], heroName: string): HeroStats {
  const analyses: HandAnalysis[] = [];

  for (const hand of hands) {
    const analysis = analyzeHand(hand, heroName);
    if (analysis) analyses.push(analysis);
  }

  const totalHands = analyses.length;
  if (totalHands === 0) {
    return {
      totalHands: 0,
      vpip: 0,
      pfr: 0,
      threeBetPercent: 0,
      afq: 0,
      cbetFrequency: 0,
      wtsd: 0,
      wsd: 0,
      byPosition: {},
    };
  }

  const vpipCount = analyses.filter(a => a.heroVPIP).length;
  const pfrCount = analyses.filter(a => a.heroPFR).length;
  const facedRaiseCount = analyses.filter(a => a.facedRaise).length;
  const threeBetCount = analyses.filter(a => a.heroThreeBet).length;

  const totalAggressive = analyses.reduce((sum, a) => sum + a.aggressiveActions, 0);
  const totalPassive = analyses.reduce((sum, a) => sum + a.passiveActions, 0);

  const preflopRaiserHands = analyses.filter(a => a.heroWasPreflopRaiser && a.heroSawFlop);
  const cbetCount = analyses.filter(a => a.heroCBetFlop).length;

  const showdownHands = analyses.filter(a => a.heroWentToShowdown);
  const showdownWins = analyses.filter(a => a.heroWonShowdown).length;

  // By position
  const byPosition: Record<string, { hands: number; vpip: number; pfr: number }> = {};
  const positionGroups: Record<string, HandAnalysis[]> = {};
  for (const a of analyses) {
    if (!positionGroups[a.position]) positionGroups[a.position] = [];
    positionGroups[a.position]!.push(a);
  }
  for (const [pos, group] of Object.entries(positionGroups)) {
    const posVpip = group.filter(a => a.heroVPIP).length;
    const posPfr = group.filter(a => a.heroPFR).length;
    byPosition[pos] = {
      hands: group.length,
      vpip: Math.round((posVpip / group.length) * 100),
      pfr: Math.round((posPfr / group.length) * 100),
    };
  }

  return {
    totalHands,
    vpip: Math.round((vpipCount / totalHands) * 100),
    pfr: Math.round((pfrCount / totalHands) * 100),
    threeBetPercent: facedRaiseCount > 0 ? Math.round((threeBetCount / facedRaiseCount) * 100) : 0,
    afq: (totalAggressive + totalPassive) > 0
      ? Math.round((totalAggressive / (totalAggressive + totalPassive)) * 100)
      : 0,
    cbetFrequency: preflopRaiserHands.length > 0
      ? Math.round((cbetCount / preflopRaiserHands.length) * 100)
      : 0,
    wtsd: totalHands > 0 ? Math.round((showdownHands.length / totalHands) * 100) : 0,
    wsd: showdownHands.length > 0 ? Math.round((showdownWins / showdownHands.length) * 100) : 0,
    byPosition,
  };
}

export function getPositionStats(
  hands: HandHistory[],
  position: string,
  heroName: string
): { vpip: number; pfr: number } {
  const analyses: HandAnalysis[] = [];
  for (const hand of hands) {
    const analysis = analyzeHand(hand, heroName);
    if (analysis && analysis.position === position) {
      analyses.push(analysis);
    }
  }

  if (analyses.length === 0) return { vpip: 0, pfr: 0 };

  const vpipCount = analyses.filter(a => a.heroVPIP).length;
  const pfrCount = analyses.filter(a => a.heroPFR).length;

  return {
    vpip: Math.round((vpipCount / analyses.length) * 100),
    pfr: Math.round((pfrCount / analyses.length) * 100),
  };
}

export function calculateCBetFrequency(hands: HandHistory[], heroName: string): number {
  const analyses: HandAnalysis[] = [];
  for (const hand of hands) {
    const analysis = analyzeHand(hand, heroName);
    if (analysis) analyses.push(analysis);
  }

  const preflopRaiserHands = analyses.filter(a => a.heroWasPreflopRaiser && a.heroSawFlop);
  if (preflopRaiserHands.length === 0) return 0;

  const cbetCount = analyses.filter(a => a.heroCBetFlop).length;
  return Math.round((cbetCount / preflopRaiserHands.length) * 100);
}
