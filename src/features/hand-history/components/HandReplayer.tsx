import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useHandReplay } from '../hooks/useHandReplay';
import { BoardDisplay } from './BoardDisplay';
import { PlayerSeats } from './PlayerSeats';
import { StreetTimeline } from './StreetTimeline';
import { ActionLog } from './ActionLog';
import { AnnotationPanel } from './AnnotationPanel';
import { GtoDeviationPanel } from './GtoDeviationPanel';
import { formatDate } from '../utils/handNotation';
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronsLeft, ChevronsRight, Zap,
} from 'lucide-react';

const SPEEDS = [0.5, 1, 2, 4];

export function HandReplayer() {
  const { t, i18n } = useTranslation();
  const {
    hand,
    state,
    activePlayerIndex,
    foldedPlayers,
    togglePlay,
    nextAction,
    prevAction,
    skipToNextStreet,
    skipToPrevStreet,
    jumpToStreet,
    jumpToAction,
    setPlaybackSpeed,
  } = useHandReplay();

  // hero 优先用解析器记录的 heroPlayerId（"Dealt to" 玩家）；
  // 旧数据无该字段时回退「第一个有底牌的玩家」启发式（hero 弃牌局可能选中对手）
  const heroName = useMemo(() => {
    if (!hand) return '';
    if (hand.heroPlayerId !== undefined) {
      return hand.players[hand.heroPlayerId]?.name ?? '';
    }
    const hero = hand.players.find(p => p.holeCards);
    return hero?.name ?? '';
  }, [hand]);

  if (!hand) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--ivory-muted)] text-sm font-display">
        {t('handHistory.replay.noHandLoaded')}
      </div>
    );
  }

  const isShowdown = state.currentStreet === 'showdown';

  return (
    <div className="flex h-full">
      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--walnut-border)]">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-sm font-display font-semibold text-[var(--ivory)] tracking-wide">
                {t('handHistory.list.handNumber', { number: hand.handNumber })}
              </h2>
              <p className="text-xs text-[var(--ivory-muted)] font-numeric">
                {hand.gameType} · ${hand.stakes.smallBlind}/${hand.stakes.bigBlind} · {formatDate(hand.timestamp, i18n.language)}
              </p>
            </div>
          </div>

          {/* Pot display */}
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)]">
              <span className="text-xs text-[var(--ivory-muted)]">{t('handHistory.replay.pot')}: </span>
              <span className="text-sm font-bold text-[var(--brass-bright)] font-numeric">${state.currentPot.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Street timeline */}
        <div className="flex justify-center py-3 border-b border-[var(--walnut-border)]">
          <StreetTimeline
            hand={hand}
            currentStreet={state.currentStreet}
            onJump={jumpToStreet}
          />
        </div>

        {/* Table area — bottle-green felt with walnut rail */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          <div className="relative w-full max-w-[700px] min-h-[320px] h-[min(48vh,400px)] rounded-[50%] bg-gradient-to-b from-[var(--felt)] to-[var(--felt-deep)] border-4 border-[var(--walnut)] shadow-[inset_0_0_60px_rgba(0,0,0,0.3)]">
            {/* Board cards in center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <BoardDisplay
                cards={state.visibleCards}
                totalBoard={hand.board}
              />
            </div>

            {/* Player seats around table */}
            <PlayerSeats
              players={hand.players}
              activePlayerIndex={activePlayerIndex}
              foldedPlayers={foldedPlayers}
              playerStacks={state.playerStacks}
              showCards={isShowdown}
            />
          </div>
        </div>

        {/* Control bar */}
        <div className="flex flex-wrap items-center justify-center gap-3 px-6 py-4 border-t border-[var(--walnut-border)] bg-[var(--walnut-raised)]/20">
          {/* Prev street */}
          <button
            onClick={skipToPrevStreet}
            aria-label={t('handHistory.replay.prevStreet')}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
            title={t('handHistory.replay.prevStreet')}
          >
            <ChevronsLeft size={18} />
          </button>

          {/* Prev action */}
          <button
            onClick={prevAction}
            aria-label={t('handHistory.replay.prevAction')}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
            title={t('handHistory.replay.prevAction')}
          >
            <SkipBack size={18} />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            aria-label={state.isPlaying ? t('handHistory.replay.pause') : t('handHistory.replay.play')}
            className="min-h-12 min-w-12 flex items-center justify-center rounded-full bg-[var(--brass)] text-[var(--primary-foreground)] hover:bg-[var(--brass-bright)] transition-colors shadow-lg"
            title={state.isPlaying ? t('handHistory.replay.pause') : t('handHistory.replay.play')}
          >
            {state.isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Next action */}
          <button
            onClick={nextAction}
            aria-label={t('handHistory.replay.nextAction')}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
            title={t('handHistory.replay.nextAction')}
          >
            <SkipForward size={18} />
          </button>

          {/* Next street */}
          <button
            onClick={skipToNextStreet}
            aria-label={t('handHistory.replay.nextStreet')}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
            title={t('handHistory.replay.nextStreet')}
          >
            <ChevronsRight size={18} />
          </button>

          {/* Speed control */}
          <div className="flex items-center gap-1 ml-4 pl-4 border-l border-[var(--walnut-border)]">
            <Zap size={14} className="text-[var(--ivory-muted)]" />
            {SPEEDS.map(speed => (
              <button
                key={speed}
                onClick={() => setPlaybackSpeed(speed)}
                className={`px-2 py-1 text-xs rounded font-numeric transition-colors ${
                  state.playbackSpeed === speed
                    ? 'bg-[var(--brass)]/15 text-[var(--brass-bright)] border border-[var(--brass)]/40'
                    : 'text-[var(--ivory-muted)] hover:text-[var(--ivory-dim)]'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel: Action log + Annotations + GTO Deviation */}
      <div className="w-56 lg:w-64 border-l border-[var(--walnut-border)] flex flex-col bg-[var(--walnut-raised)]/15">
        <div className="flex-1 overflow-hidden">
          <ActionLog
            hand={hand}
            currentStreet={state.currentStreet}
            currentActionIndex={state.currentActionIndex}
            onJumpToAction={jumpToAction}
          />
        </div>
        <div className="border-t border-[var(--walnut-border)]">
          {/* key 随手牌与街道变化：AnnotationPanel 内部的 note state 仅在 mount 时取初值，
              不加 key 会在切街后残留上一街的编辑内容并误写入新街道批注 */}
          <AnnotationPanel key={`${hand.id}-${state.currentStreet}`} hand={hand} currentStreet={state.currentStreet} />
        </div>
        {heroName && (
          <div className="border-t border-[var(--walnut-border)] p-3 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--walnut-border)]">
            <GtoDeviationPanel hand={hand} heroName={heroName} />
          </div>
        )}
      </div>
    </div>
  );
}
