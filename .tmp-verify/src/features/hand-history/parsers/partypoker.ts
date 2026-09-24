import type { HandHistory, Player } from '../types';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';
import type { HoleCards } from '@/shared/types/poker';
import {
  parseCardString,
  parseBoardCards,
  parseAmount,
  assignPositions,
  normalizeToAmounts,
  parseShowCards,
  parseCollected,
} from './common';

function parsePartyActionLine(line: string, playerNameToIndex: Map<string, number>): PlayerAction | null {
  // partypoker formats:
  // "Player3 folds"
  // "Player4 raises [$6.00 USD]"
  // "Player1 calls [$2.00 USD]"
  // "Player2 checks"
  // "Player5 bets [$10.00 USD]"
  // "Player1 is all-In [$50.00 USD]"

  // Try "PlayerName <verb>" pattern (no colon in partypoker)
  const actionMatch = line.match(/^(.+?)\s+(folds|checks|calls|bets|raises|is all-[Ii]n|posts small blind|posts big blind|posts ante)/i);
  if (!actionMatch) return null;

  const name = actionMatch[1]!.trim();
  const verb = actionMatch[2]!.toLowerCase();
  const playerIndex = playerNameToIndex.get(name);
  if (playerIndex === undefined) return null;

  const extractAmount = (): number | undefined => {
    const amt = line.match(/\[\$?([\d,.]+)\s*(?:USD)?\]/);
    if (amt) return parseAmount(amt[1]!);
    const amt2 = line.match(/\$([\d,.]+)/);
    if (amt2) return parseAmount(amt2[1]!);
    return undefined;
  };

  switch (verb) {
    case 'folds':
      return { type: ActionType.Fold, playerIndex };
    case 'checks':
      return { type: ActionType.Check, playerIndex };
    case 'calls':
      return { type: ActionType.Call, amount: extractAmount(), playerIndex };
    case 'bets':
      // partypoker "bets [$10]"：从 0 起下注，增量 = to = 10（存入 to 总额，normalize 内作为 to 处理）
      return { type: ActionType.Raise, amount: extractAmount(), playerIndex };
    case 'raises':
      // HH-020：partypoker "raises [$X]" 的括号金额按「to 总额」解读（与 pokerstars/gg 的 to 口径对齐），
      // 避免增量/to 口径分裂；该解读按导出惯例实现，未经真实样例回归验证。
      return { type: ActionType.Raise, amount: extractAmount(), playerIndex };
    case 'is all-in':
      return { type: ActionType.AllIn, amount: extractAmount(), playerIndex };
    case 'posts small blind':
      return { type: ActionType.Call, amount: extractAmount(), playerIndex };
    case 'posts big blind':
      return { type: ActionType.Call, amount: extractAmount(), playerIndex };
    case 'posts ante':
      return { type: ActionType.Call, amount: extractAmount(), playerIndex };
    default:
      return null;
  }
}

export function parsePartyPokerHand(text: string): HandHistory {
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

  // HH-021：增加 showdown 街（涉及对手 shows 手牌解析）
  let currentStreet: 'header' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | 'summary' = 'header';
  const seatNumbers: number[] = [];

  for (const line of lines) {
    // Header: ***** Hand History for Game 12345678 *****
    const headerMatch = line.match(/Hand History for Game\s+(\d+)/i);
    if (headerMatch) {
      handNumber = headerMatch[1]!;
      continue;
    }

    // Stakes line: $1/$2 USD NL Texas Hold'em - Monday, January 15, 20:30:00 EST 2024
    const stakesMatch = line.match(/\$([\d,.]+)\/\$([\d,.]+)\s+USD\s+(NL|PL|Limit)?\s*Texas Hold'?em/i);
    if (stakesMatch) {
      smallBlind = parseAmount(stakesMatch[1]!);
      bigBlind = parseAmount(stakesMatch[2]!);
      const limitType = stakesMatch[3]?.toUpperCase();
      if (limitType === 'NL') gameType = "No Limit Hold'em";
      else if (limitType === 'PL') gameType = "Pot Limit Hold'em";
      else if (limitType === 'LIMIT') gameType = "Limit Hold'em";
      else gameType = "No Limit Hold'em";

      // Try to parse date: "Monday, January 15, 20:30:00 EST 2024"
      const dateMatch = line.match(/(\w+)\s+(\d{1,2}),\s+(\d{2}):(\d{2}):(\d{2})\s+\w+\s+(\d{4})/);
      if (dateMatch) {
        const monthNames: Record<string, number> = {
          january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
          july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
        };
        const month = monthNames[dateMatch[1]!.toLowerCase()];
        if (month !== undefined) {
          timestamp = new Date(
            parseInt(dateMatch[6]!), month, parseInt(dateMatch[2]!),
            parseInt(dateMatch[3]!), parseInt(dateMatch[4]!), parseInt(dateMatch[5]!)
          ).getTime();
        }
      }
      continue;
    }

    // Table info: Table Table Name (Real Money) -- Seat 3 is the button
    const tableMatch = line.match(/Seat\s+(\d+)\s+is\s+the\s+button/i);
    if (tableMatch) {
      buttonSeat = parseInt(tableMatch[1]!);
      continue;
    }

    // Seat info: Seat 1: Player1 ( $200.00 USD )
    const seatMatch = line.match(/^Seat\s+(\d+):\s+(.+?)\s+\(\s*\$?([\d,.]+)\s*(?:USD)?\s*\)/);
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
      seatNumbers.push(seatNum);
      continue;
    }

    // Street markers
    if (/\*\*\s*Dealing down cards\s*\*\*/i.test(line)) {
      currentStreet = 'preflop';
      const positions = assignPositions(players.length, buttonSeat, seatNumbers);
      for (let i = 0; i < players.length; i++) {
        players[i]!.position = positions[i]!;
      }
      continue;
    }

    if (/\*\*\s*Dealing flop\s*\*\*/i.test(line)) {
      currentStreet = 'flop';
      const cardsMatch = line.match(/\[([^\]]+)\]/);
      if (cardsMatch) {
        // partypoker uses comma-separated: [ Qs, Jh, 2c ]
        const cardsStr = cardsMatch[1]!.replace(/,/g, ' ').trim();
        flopCards = parseBoardCards(cardsStr);
        board.push(...flopCards);
      }
      continue;
    }

    if (/\*\*\s*Dealing turn\s*\*\*/i.test(line)) {
      currentStreet = 'turn';
      const cardsMatch = line.match(/\[([^\]]+)\]/);
      if (cardsMatch) {
        const cardsStr = cardsMatch[1]!.replace(/,/g, ' ').trim();
        turnCards = parseBoardCards(cardsStr);
        board.push(...turnCards);
      }
      continue;
    }

    if (/\*\*\s*Dealing river\s*\*\*/i.test(line)) {
      currentStreet = 'river';
      const cardsMatch = line.match(/\[([^\]]+)\]/);
      if (cardsMatch) {
        const cardsStr = cardsMatch[1]!.replace(/,/g, ' ').trim();
        riverCards = parseBoardCards(cardsStr);
        board.push(...riverCards);
      }
      continue;
    }

    // HH-021：partypoker 摊牌段标记（SHOW DOWN / SHOWDOWN 两种写法，容错空白与大小写）
    if (/^\*{2,3}\s*SHOW\s*DOWN\s*\*{2,3}/i.test(line) || /^\*{2,3}\s*SHOWDOWN\s*\*{2,3}/i.test(line)) {
      currentStreet = 'showdown';
      continue;
    }

    if (/\*\*\s*Summary\s*\*\*/i.test(line)) {
      currentStreet = 'summary';
      continue;
    }

    // Dealt to Hero [ Ah, Kd ] (comma-separated in partypoker)
    const dealtMatch = line.match(/Dealt to\s+(.+?)\s+\[([^\]]+)\]/);
    if (dealtMatch) {
      heroName = dealtMatch[1]!.trim();
      const cardsStr = dealtMatch[2]!.replace(/,/g, ' ').trim();
      const cards = cardsStr.split(/\s+/).filter(Boolean);
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

    // Parse actions based on current street
    if (currentStreet === 'preflop') {
      const action = parsePartyActionLine(line, playerNameToIndex);
      if (action) preflopActions.push(action);
    } else if (currentStreet === 'flop') {
      const action = parsePartyActionLine(line, playerNameToIndex);
      if (action) flopActions.push(action);
    } else if (currentStreet === 'turn') {
      const action = parsePartyActionLine(line, playerNameToIndex);
      if (action) turnActions.push(action);
    } else if (currentStreet === 'river') {
      const action = parsePartyActionLine(line, playerNameToIndex);
      if (action) riverActions.push(action);
    } else if (currentStreet === 'showdown') {
      // HH-021：复用 common 的摊牌解析（shows 手牌 + collected 赢家），不再写重复实现
      parseShowCards(line, playerNameToIndex, players);
      const collected = parseCollected(line, playerNameToIndex);
      if (collected) {
        winnerId = collected.playerId;
        winnerAmount = collected.amount;
      }
    } else if (currentStreet === 'summary') {
      const collected = parseCollected(line, playerNameToIndex);
      if (collected) {
        winnerId = collected.playerId;
        winnerAmount = collected.amount;
      }
      // Total pot line: "Total Pot: $45.00"
      const potMatch = line.match(/Total Pot[:\s]+\$?([\d,.]+)/i);
      if (potMatch) pot = parseAmount(potMatch[1]!);
    }
  }

  // Set hero cards on the player
  let heroPlayerId: number | undefined;
  if (heroName) {
    const heroIdx = playerNameToIndex.get(heroName);
    if (heroIdx !== undefined) {
      heroPlayerId = heroIdx;
      if (heroCards) {
        players[heroIdx]!.holeCards = heroCards;
      }
    }
  }

  if (!pot) pot = winnerAmount;

  const id = `party-${handNumber}-${timestamp}`;

  return {
    id,
    site: 'partypoker',
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

export function parsePartyPokerMultiple(text: string): HandHistory[] {
  const parts = text.split(/(?=\*{5}\s*Hand History for Game)/i);
  const hands: HandHistory[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed || !/Hand History for Game/i.test(trimmed)) continue;
    try {
      hands.push(parsePartyPokerHand(trimmed));
    } catch {
      // Skip unparseable hands
    }
  }
  return hands;
}
