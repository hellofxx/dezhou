import type { HandHistory, Player } from '../types';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';
import type { HoleCards } from '@/shared/types/poker';
import { parseCardString, parseBoardCards, parseAmount, assignPositions, normalizeToAmounts } from './common';

/** Strip emoji from player names for consistent matching */
function stripEmoji(name: string): string {
  return name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu, '').trim();
}

function parseGGActionLine(line: string, playerNameToIndex: Map<string, number>): PlayerAction | null {
  const actionMatch = line.match(/^(.+?)\s*:\s*(folds|checks|calls|bets|raises|posts|shows|collected|is all-in)/i);
  if (!actionMatch) return null;

  const rawName = actionMatch[1]!.trim();
  const verb = actionMatch[2]!.toLowerCase();

  let playerIndex = playerNameToIndex.get(rawName);
  if (playerIndex === undefined) {
    const stripped = stripEmoji(rawName);
    playerIndex = playerNameToIndex.get(stripped);
  }
  if (playerIndex === undefined) return null;

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
      return { type: ActionType.Raise, amount: amt ? parseAmount(amt[1]!) : undefined, playerIndex };
    }
    case 'raises': {
      const amt = line.match(/to\s+\$?([\d,.]+)/);
      return { type: ActionType.Raise, amount: amt ? parseAmount(amt[1]!) : undefined, playerIndex };
    }
    case 'is all-in': {
      const amt = line.match(/all-in\s*\(?\$?([\d,.]+)\)?/i) ?? line.match(/\$([\d,.]+)/);
      return { type: ActionType.AllIn, amount: amt ? parseAmount(amt[1]!) : undefined, playerIndex };
    }
    case 'posts': {
      const amt = line.match(/\$?([\d,.]+)\s*$/);
      return { type: ActionType.Call, amount: amt ? parseAmount(amt[1]!) : undefined, playerIndex };
    }
    default:
      return null;
  }
}

export function parseGGPokerHand(text: string): HandHistory {
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
  let pot = 0;
  let heroPlayerId: number | undefined;
  let currentStreet: 'header' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'summary' = 'header';
  const seatNumbers: number[] = [];

  for (const line of lines) {
    // GGPoker Hand #HD-123456789 or Hand #HD-123456789
    if (/^(GGPoker\s+)?Hand\s+#/i.test(line)) {
      const handMatch = line.match(/Hand\s+#(?:HD-)?(\w+)/i);
      if (handMatch) handNumber = handMatch[1]!;

      const dateMatch = line.match(/(\d{4})[\/\-](\d{2})[\/\-](\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (dateMatch) {
        timestamp = new Date(
          parseInt(dateMatch[1]!), parseInt(dateMatch[2]!) - 1, parseInt(dateMatch[3]!),
          parseInt(dateMatch[4]!), parseInt(dateMatch[5]!), parseInt(dateMatch[6]!)
        ).getTime();
      }
      continue;
    }

    // Table info with button
    const tableMatch = line.match(/Table\s+.*Seat\s*#?(\d+)\s+is\s+the\s+button/i);
    if (tableMatch) {
      buttonSeat = parseInt(tableMatch[1]!);
      continue;
    }

    // Stakes
    const stakesMatch = line.match(/\$?([\d,.]+)\/\$?([\d,.]+)/);
    if (stakesMatch && smallBlind === 0) {
      smallBlind = parseAmount(stakesMatch[1]!);
      bigBlind = parseAmount(stakesMatch[2]!);
    }

    // Seat info - handle emoji in names
    const seatMatch = line.match(/^Seat\s+(\d+):\s+(.+?)\s+\(\$?([\d,.]+)\)/);
    if (seatMatch && !line.includes('collected')) {
      const seatNum = parseInt(seatMatch[1]!);
      const name = seatMatch[2]!.trim();
      const stack = parseAmount(seatMatch[3]!);
      const idx = players.length;
      players.push({
        id: idx,
        name,
        position: Position.MP,
        seatNumber: seatNum,
        stack,
      });
      playerNameToIndex.set(name, idx);
      const stripped = stripEmoji(name);
      if (stripped !== name) {
        playerNameToIndex.set(stripped, idx);
      }
      seatNumbers.push(seatNum);
      continue;
    }

    // Street markers
    if (/\*{3}\s*HOLE CARDS\s*\*{3}/.test(line)) {
      if (currentStreet === 'header') {
        currentStreet = 'preflop';
        const positions = assignPositions(players.length, buttonSeat, seatNumbers);
        for (let i = 0; i < players.length; i++) {
          players[i]!.position = positions[i]!;
        }
      }
      continue;
    }

    if (/^\*{3}\s*FLOP\s*\*{3}/.test(line)) {
      currentStreet = 'flop';
      const cardsMatch = line.match(/\[([^\]]+)\]/);
      if (cardsMatch) {
        flopCards = parseBoardCards(cardsMatch[1]!);
        board.push(...flopCards);
      }
      continue;
    }

    if (/^\*{3}\s*TURN\s*\*{3}/.test(line)) {
      currentStreet = 'turn';
      const matches = [...line.matchAll(/\[([^\]]+)\]/g)];
      if (matches.length >= 2) {
        turnCards = parseBoardCards(matches[1]![1]!);
        board.push(...turnCards);
      }
      continue;
    }

    if (/^\*{3}\s*RIVER\s*\*{3}/.test(line)) {
      currentStreet = 'river';
      const matches = [...line.matchAll(/\[([^\]]+)\]/g)];
      if (matches.length >= 2) {
        riverCards = parseBoardCards(matches[1]![1]!);
        board.push(...riverCards);
      }
      continue;
    }

    if (/^\*{3}\s*SHOWDOWN\s*\*{3}/.test(line)) {
      currentStreet = 'showdown';
      continue;
    }

    if (/^\*{3}\s*SUMMARY\s*\*{3}/.test(line)) {
      currentStreet = 'summary';
      continue;
    }

    // "All-in before showdown" marker
    if (/all-in before showdown/i.test(line)) {
      continue;
    }

    // Hero cards
    const dealtMatch = line.match(/Dealt to\s+(.+?)\s+\[([^\]]+)\]/);
    if (dealtMatch) {
      heroName = dealtMatch[1]!.trim();
      const cards = dealtMatch[2]!.trim().split(/\s+/);
      if (cards.length >= 2) {
        heroCards = [parseCardString(cards[0]!), parseCardString(cards[1]!)];
      }
      if (currentStreet === 'header') {
        currentStreet = 'preflop';
        const positions = assignPositions(players.length, buttonSeat, seatNumbers);
        for (let i = 0; i < players.length; i++) {
          players[i]!.position = positions[i]!;
        }
      }
      continue;
    }

    // Parse actions
    if (currentStreet === 'preflop') {
      const action = parseGGActionLine(line, playerNameToIndex);
      if (action) preflopActions.push(action);
    } else if (currentStreet === 'flop') {
      const action = parseGGActionLine(line, playerNameToIndex);
      if (action) flopActions.push(action);
    } else if (currentStreet === 'turn') {
      const action = parseGGActionLine(line, playerNameToIndex);
      if (action) turnActions.push(action);
    } else if (currentStreet === 'river') {
      const action = parseGGActionLine(line, playerNameToIndex);
      if (action) riverActions.push(action);
    } else if (currentStreet === 'showdown') {
      let showMatch = line.match(/^(.+?):\s+shows\s+\[([^\]]+)\]/);
      if (!showMatch) showMatch = line.match(/^(?:Seat\s+\d+:\s*)?(.+?)\s+shows\s+\[([^\]]+)\]/);
      if (showMatch) {
        const name = showMatch[1]!.trim();
        let idx = playerNameToIndex.get(name);
        if (idx === undefined) idx = playerNameToIndex.get(stripEmoji(name));
        if (idx !== undefined) {
          const cards = showMatch[2]!.trim().split(/\s+/);
          if (cards.length >= 2) {
            players[idx]!.holeCards = [parseCardString(cards[0]!), parseCardString(cards[1]!)];
          }
        }
      }
      const collectMatch = line.match(/^(?:Seat\s+\d+:\s*)?(.+?)\s+collected\s+\$?([\d,.]+)/);
      if (collectMatch) {
        const name = collectMatch[1]!.trim();
        let idx = playerNameToIndex.get(name);
        if (idx === undefined) idx = playerNameToIndex.get(stripEmoji(name));
        if (idx !== undefined) {
          winnerId = idx;
          winnerAmount = parseAmount(collectMatch[2]!);
        }
      }
    } else if (currentStreet === 'summary') {
      const potMatch = line.match(/Total pot\s+\$?([\d,.]+)/);
      if (potMatch) pot = parseAmount(potMatch[1]!);
      // 收池局（bet&fold，无 SHOW DOWN 段）的 collected 行出现在 SUMMARY：
      // 此前仅在 showdown 段解析导致大部分手牌 winner 丢失
      const collectMatch = line.match(/^(?:Seat\s+\d+:\s*)?(.+?)\s+collected\s+\$?([\d,.]+)/);
      if (collectMatch) {
        const name = collectMatch[1]!.trim();
        let idx = playerNameToIndex.get(name);
        if (idx === undefined) idx = playerNameToIndex.get(stripEmoji(name));
        if (idx !== undefined) {
          winnerId = idx;
          winnerAmount = parseAmount(collectMatch[2]!);
        }
      }
    }
  }

  if (heroName) {
    let heroIdx = playerNameToIndex.get(heroName);
    if (heroIdx === undefined) heroIdx = playerNameToIndex.get(stripEmoji(heroName));
    if (heroIdx !== undefined) {
      heroPlayerId = heroIdx;
      if (heroCards) {
        players[heroIdx]!.holeCards = heroCards;
      }
    }
  }

  if (!pot) pot = winnerAmount;

  const id = `gg-${handNumber}-${timestamp}`;

  return {
    id,
    site: 'ggpoker',
    handNumber,
    timestamp,
    gameType,
    stakes: { smallBlind, bigBlind },
    players,
    board,
    streets: {
      preflop: normalizeToAmounts(preflopActions),
      flop: { cards: flopCards, actions: normalizeToAmounts(flopActions) },
      turn: { cards: turnCards, actions: normalizeToAmounts(turnActions) },
      river: { cards: riverCards, actions: normalizeToAmounts(riverActions) },
    },
    pot,
    winner: winnerAmount > 0 ? { playerId: winnerId, amount: winnerAmount } : undefined,
    heroPlayerId,
    annotations: {},
  };
}

export function parseGGPokerMultiple(text: string): HandHistory[] {
  const parts = text.split(/(?=(?:GGPoker\s+)?Hand\s+#(?:HD-)?)/i);
  const hands: HandHistory[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || !/^(?:GGPoker\s+)?Hand\s+#/i.test(trimmed)) continue;
    try {
      hands.push(parseGGPokerHand(trimmed));
    } catch {
      // Skip unparseable
    }
  }
  return hands;
}
