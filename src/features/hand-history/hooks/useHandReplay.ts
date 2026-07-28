import { useEffect, useRef, useCallback } from 'react';
import { useHandHistoryStore } from '../store';
import type { ReplayState } from '../types';

export function useHandReplay() {
  const {
    currentHand,
    replayState,
    nextAction,
    prevAction,
    startReplay,
    pauseReplay,
    jumpToStreet,
    setPlaybackSpeed,
  } = useHandHistoryStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (replayState.isPlaying && currentHand) {
      const baseDelay = 1000;
      const delay = baseDelay / replayState.playbackSpeed;

      intervalRef.current = setInterval(() => {
        nextAction();
      }, delay);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [replayState.isPlaying, replayState.playbackSpeed, currentHand, nextAction]);

  // Stop at showdown
  useEffect(() => {
    if (replayState.currentStreet === 'showdown' && replayState.isPlaying) {
      pauseReplay();
    }
  }, [replayState.currentStreet, replayState.isPlaying, pauseReplay]);

  const togglePlay = useCallback(() => {
    if (replayState.isPlaying) {
      pauseReplay();
    } else {
      startReplay();
    }
  }, [replayState.isPlaying, startReplay, pauseReplay]);

  const skipToNextStreet = useCallback(() => {
    const streets: ReplayState['currentStreet'][] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
    const idx = streets.indexOf(replayState.currentStreet);
    if (idx < streets.length - 1) {
      jumpToStreet(streets[idx + 1]!);
    }
  }, [replayState.currentStreet, jumpToStreet]);

  const skipToPrevStreet = useCallback(() => {
    const streets: ReplayState['currentStreet'][] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
    const idx = streets.indexOf(replayState.currentStreet);
    if (idx > 0) {
      jumpToStreet(streets[idx - 1]!);
    }
  }, [replayState.currentStreet, jumpToStreet]);

  // Get current active player index
  const activePlayerIndex = (() => {
    if (!currentHand) return -1;
    const street = replayState.currentStreet;
    const actionIdx = replayState.currentActionIndex;

    let actions;
    if (street === 'preflop') {
      actions = currentHand.streets.preflop;
    } else if (street === 'flop') {
      actions = currentHand.streets.flop.actions;
    } else if (street === 'turn') {
      actions = currentHand.streets.turn.actions;
    } else if (street === 'river') {
      actions = currentHand.streets.river.actions;
    } else {
      return -1;
    }

    if (actionIdx > 0 && actionIdx <= actions.length) {
      return actions[actionIdx - 1]?.playerIndex ?? -1;
    }
    return -1;
  })();

  // Determine folded players up to current point
  const foldedPlayers = new Set<number>();
  if (currentHand) {
    const streets: Array<{ actions: typeof currentHand.streets.preflop }> = [
      { actions: currentHand.streets.preflop },
      { actions: currentHand.streets.flop.actions },
      { actions: currentHand.streets.turn.actions },
      { actions: currentHand.streets.river.actions },
    ];
    const streetKeys: ReplayState['currentStreet'][] = ['preflop', 'flop', 'turn', 'river'];
    const currentIdx = streetKeys.indexOf(replayState.currentStreet);

    for (let s = 0; s <= currentIdx; s++) {
      const streetActions = streets[s]!.actions;
      const limit = s < currentIdx ? streetActions.length : replayState.currentActionIndex;
      for (let i = 0; i < limit; i++) {
        const a = streetActions[i]!;
        if (a.type === 'fold') {
          foldedPlayers.add(a.playerIndex);
        }
      }
    }
  }

  return {
    hand: currentHand,
    state: replayState,
    activePlayerIndex,
    foldedPlayers,
    togglePlay,
    nextAction,
    prevAction,
    skipToNextStreet,
    skipToPrevStreet,
    jumpToStreet,
    setPlaybackSpeed,
  };
}
