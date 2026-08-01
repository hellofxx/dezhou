import type { HandHistory, Player } from '../types';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';
import type { HoleCards } from '@/shared/types/poker';
import { parseCardString, parseBoardCards, parseAmount } from './common';

// Position assignment for 6-max and full ring
function assignPositions(playerCount: number, buttonSeat: number, seats: number[]): Position[] {
  // Order: starting from left of button (SB, BB, UTG...)
  const positions6: Position[] = [Position.BTN, Position.SB, Position.BB, Position.UTG, Position.HJ, Position.CO];
  // 9-max: BTN, SB, BB, UTG, UTG+1, MP, MP+1(LJ), HJ, CO
  const positions9: Position[] = [
    Position.BTN, Position.SB, Position.BB,
    Position.UTG, Position.UTG1, Position.MP, Position.MP, Position.HJ, Position.CO
  ];

  // Build ordered list starting from button
  const ordered = [...seats];
  const btnIdx = ordered.indexOf(buttonSeat);
  if (btnIdx >= 0) {
    const reordered = [...ordered.slice(btnIdx), ...ordered.slice(0, btnIdx)];
    ordered.length = 0;
    ordered.push(...reordered);
  }

  const posMap = new Map<number, Position>();
  const posList = playerCount <= 6 ? positions6 : positions9;

  // BTN is first in ordered (seat at button)
  // Then SB, BB, UTG... follow
  for (let i = 0; i < ordered.length; i++) {
    const pos = posList[i % posList.length] ?? Position.MP;
    posMap.set(ordered[i]!, pos);
  }

  return seats.map(s => posMap.get(s) ?? Position.MP);
}

function parseActionLine(line: string, playerNameToIndex: Map<string, number>): PlayerAction | null {
  // "PlayerName: folds"
  // "PlayerName: calls $2"
  // "PlayerName: raises $6 to $8"
  // "PlayerName: bets $10"
  // "PlayerName: checks"
  // "PlayerName: posts small blind $1"
  // "PlayerName: posts big blind $2"

  // Check for "is all-in" first (may appear after other verbs like "raises ... and is all-in")
  const isAllIn = /\bis\s+all-in\b/i.test(line);

  const actionMatch = line.match(/^(.+?):\s+(folds|checks|calls|bets|raises|posts|shows|collected|is all-in)/i);
  if (!actionMatch) return null;

  const name = actionMatch[1]!.trim();
  const verb = actionMatch[2]!.toLowerCase();
  const playerIndex = playerNameToIndex.get(name);
  if (playerIndex === undefined) return null;

  const extractAmount = (): number | undefined => {
    const amt = line.match(/to\s+\$?([\d,.]+)/);
    if (amt) return parseAmount(amt[1]!);
    const amt2 = line.match(/\$?([\d,.]+)\s*$/);
    if (amt2) return parseAmount(amt2[1]!);
    return undefined;
  };

  // If the line contains "is all-in", return AllIn regardless of verb
  if (isAllIn) {
    return { type: ActionType.AllIn, amount: extractAmount(), playerIndex };
  }

  switch (verb) {
    case 'folds':
      return { type: ActionType.Fold, playerIndex };
    case 'checks':
      return { type: ActionType.Check, playerIndex };
    case 'calls': {
      const amt = line.match(/calls\s+\$?([\d,.]+)/);
      return { type: ActionType.Call, amount: amt ? parseAmount(amt[1]!) : undefined, playerIndex };
    }
    case 'bets': {
      const amt = line.match(/bets\s+\$?([\d,.]+)/);
      const amount = amt ? parseAmount(amt[1]!) : undefined;
      return { type: ActionType.Raise, amount, playerIndex };
    }
    case 'raises': {
      const amt = line.match(/to\s+\$?([\d,.]+)/);
      return { type: ActionType.Raise, amount: amt ? parseAmount(amt[1]!) : undefined, playerIndex };
    }
    case 'posts': {
      const amt = line.match(/\$?([\d,.]+)\s*$/);
      return { type: ActionType.Call, amount: amt ? parseAmount(amt[1]!) : undefined, playerIndex };
    }
    default:
      return null;
  }
}

export function parsePokerStarsHand(text: string): HandHistory {
  if (!text || !text.trim()) throw new Error('Empty hand history text');
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  let handNumber = '';
  let timestamp = Date.now();
  let gameType = "No Limit Hold'em";
  let smallBlind = 0;
  let bigBlind = 0;
  let buttonSeat = 1;
  const players: Player[] = [];
  const playerNameToIndex = new Map<string, number>();
  const board: import('@/shared/types/poker').Card[] = [];
  let heroCards: HoleCards | undefined;
  let heroName = '';

  const preflopActions: PlayerAction[] = [];
  const flopActions: PlayerAction[] = [];
  const turnActions: PlayerAction[] = [];
  const riverActions: PlayerAction[] = [];

  let flopCards: import('@/shared/types/poker').Card[] = [];
  let turnCards: import('@/shared/types/poker').Card[] = [];
  let riverCards: import('@/shared/types/poker').Card[] = [];

  let winnerId = 0;
  let winnerAmount = 0;
  let winnerHand: string | undefined;
  let pot = 0;

  let currentStreet: 'header' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'summary' = 'header';
  const seatNumbers: number[] = [];

  for (const line of lines) {
    // Header: PokerStars Hand #123456789: Hold'em No Limit ($1/$2 USD) - 2024/01/15 20:30:00 ET
    if (line.startsWith('PokerStars Hand #')) {
      const handMatch = line.match(/Hand #(\d+)/);
      if (handMatch) handNumber = handMatch[1]!;

      const stakesMatch = line.match(/\(\$?([\d,.]+)\/\$?([\d,.]+)/);
      if (stakesMatch) {
        smallBlind = parseAmount(stakesMatch[1]!);
        bigBlind = parseAmount(stakesMatch[2]!);
      }

      const dateMatch = line.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (dateMatch) {
        timestamp = new Date(
          parseInt(dateMatch[1]!), parseInt(dateMatch[2]!) - 1, parseInt(dateMatch[3]!),
          parseInt(dateMatch[4]!), parseInt(dateMatch[5]!), parseInt(dateMatch[6]!)
        ).getTime();
      }

      if (line.includes('No Limit')) gameType = "No Limit Hold'em";
      else if (line.includes('Limit')) gameType = "Limit Hold'em";
      else if (line.includes('Pot Limit')) gameType = "Pot Limit Hold'em";

      continue;
    }

    // Table info: Table 'Name' 6-max Seat #1 is the button
    if (line.startsWith('Table ')) {
      const btnMatch = line.match(/Seat #(\d+) is the button/);
      if (btnMatch) buttonSeat = parseInt(btnMatch[1]!);
      continue;
    }

    // Seat: Seat 1: Player1 ($200 in chips)
    const seatMatch = line.match(/^Seat\s+(\d+):\s+(.+?)\s+\(\$?([\d,.]+)\s+in\s+chips\)/);
    if (seatMatch) {
      const seatNum = parseInt(seatMatch[1]!);
      const name = seatMatch[2]!.trim();
      const stack = parseAmount(seatMatch[3]!);
      const idx = players.length;
      players.push({
        id: idx,
        name,
        position: Position.MP, // will be reassigned
        seatNumber: seatNum,
        stack,
      });
      playerNameToIndex.set(name, idx);
      seatNumbers.push(seatNum);
      continue;
    }

    // Street markers
    if (line === '*** HOLE CARDS ***') {
      currentStreet = 'preflop';
      // Assign positions now that we know all seats
      const positions = assignPositions(players.length, buttonSeat, seatNumbers);
      for (let i = 0; i < players.length; i++) {
        players[i]!.position = positions[i]!;
      }
      continue;
    }

    if (line.startsWith('*** FLOP ***')) {
      currentStreet = 'flop';
      const cardsMatch = line.match(/\[([^\]]+)\]/);
      if (cardsMatch) {
        flopCards = parseBoardCards(cardsMatch[1]!);
        board.push(...flopCards);
      }
      continue;
    }

    if (line.startsWith('*** TURN ***')) {
      currentStreet = 'turn';
      const matches = [...line.matchAll(/\[([^\]]+)\]/g)];
      if (matches.length >= 2) {
        turnCards = parseBoardCards(matches[1]![1]!);
        board.push(...turnCards);
      }
      continue;
    }

    if (line.startsWith('*** RIVER ***')) {
      currentStreet = 'river';
      const matches = [...line.matchAll(/\[([^\]]+)\]/g)];
      if (matches.length >= 2) {
        riverCards = parseBoardCards(matches[1]![1]!);
        board.push(...riverCards);
      }
      continue;
    }

    if (line === '*** SHOWDOWN ***') {
      currentStreet = 'showdown';
      continue;
    }

    if (line === '*** SUMMARY ***') {
      currentStreet = 'summary';
      continue;
    }

    // Dealt to Hero
    if (line.startsWith('Dealt to')) {
      const dealtMatch = line.match(/Dealt to\s+(.+?)\s+\[([^\]]+)\]/);
      if (dealtMatch) {
        heroName = dealtMatch[1]!.trim();
        const cards = dealtMatch[2]!.trim().split(/\s+/);
        if (cards.length >= 2) {
          heroCards = [parseCardString(cards[0]!), parseCardString(cards[1]!)];
        }
      }
      continue;
    }

    // Parse actions based on current street
    if (currentStreet === 'preflop' || currentStreet === 'header') {
      const action = parseActionLine(line, playerNameToIndex);
      if (action && currentStreet === 'preflop') {
        preflopActions.push(action);
      }
    } else if (currentStreet === 'flop') {
      const action = parseActionLine(line, playerNameToIndex);
      if (action) flopActions.push(action);
    } else if (currentStreet === 'turn') {
      const action = parseActionLine(line, playerNameToIndex);
      if (action) turnActions.push(action);
    } else if (currentStreet === 'river') {
      const action = parseActionLine(line, playerNameToIndex);
      if (action) riverActions.push(action);
    } else if (currentStreet === 'showdown') {
      // "Player4: shows [As Qd] (a pair of Queens)"
      const showMatch = line.match(/^(.+?):\s+shows\s+\[([^\]]+)\]/);
      if (showMatch) {
        const name = showMatch[1]!.trim();
        const idx = playerNameToIndex.get(name);
        if (idx !== undefined) {
          const cards = showMatch[2]!.trim().split(/\s+/);
          if (cards.length >= 2) {
            players[idx]!.holeCards = [parseCardString(cards[0]!), parseCardString(cards[1]!)];
          }
        }
      }
      // "Player4 collected $45 from pot"
      const collectMatch = line.match(/^(.+?)\s+collected\s+\$?([\d,.]+)\s+from\s+pot/);
      if (collectMatch) {
        const name = collectMatch[1]!.trim();
        const idx = playerNameToIndex.get(name);
        if (idx !== undefined) {
          winnerId = idx;
          winnerAmount = parseAmount(collectMatch[2]!);
        }
      }
    } else if (currentStreet === 'summary') {
      // Total pot
      const potMatch = line.match(/Total pot\s+\$?([\d,.]+)/);
      if (potMatch) pot = parseAmount(potMatch[1]!);
    }
  }

  // Set hero cards on the player
  if (heroName) {
    const heroIdx = playerNameToIndex.get(heroName);
    if (heroIdx !== undefined && heroCards) {
      players[heroIdx]!.holeCards = heroCards;
    }
  }

  // Try to extract winning hand description
  const showdownLine = lines.find(l => l.match(/shows.*\((.+)\)/));
  if (showdownLine) {
    const handMatch = showdownLine.match(/\(([^)]+)\)/);
    if (handMatch) winnerHand = handMatch[1]!.trim();
  }

  if (!pot) pot = winnerAmount;

  const id = `ps-${handNumber}-${timestamp}`;

  return {
    id,
    site: 'pokerstars',
    handNumber,
    timestamp,
    gameType,
    stakes: { smallBlind, bigBlind },
    players,
    board,
    streets: {
      preflop: preflopActions,
      flop: { cards: flopCards, actions: flopActions },
      turn: { cards: turnCards, actions: turnActions },
      river: { cards: riverCards, actions: riverActions },
    },
    pot,
    winner: winnerAmount > 0 ? { playerId: winnerId, amount: winnerAmount, hand: winnerHand } : undefined,
    annotations: {},
  };
}

export function parsePokerStarsMultiple(text: string): HandHistory[] {
  // Split by "PokerStars Hand #"
  const parts = text.split(/(?=PokerStars Hand #)/);
  const hands: HandHistory[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || !trimmed.startsWith('PokerStars Hand #')) continue;
    try {
      hands.push(parsePokerStarsHand(trimmed));
    } catch {
      // Skip unparseable hands
    }
  }
  return hands;
}
