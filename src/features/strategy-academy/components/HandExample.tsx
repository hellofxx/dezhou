import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { HandExample as HandExampleType } from '../types';
import { PokerCard } from '@/shared/components/poker/Card';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { Position } from '@/shared/types/position';
import { stringToCard } from '@/shared/utils/deck';
import { formatBB } from '@/shared/utils/formatters';

interface HandExampleProps {
  example: HandExampleType;
  index: number;
}

export function HandExampleComponent({ example, index }: HandExampleProps) {
  const heroCards = example.heroHand.map(stringToCard);
  const boardCards = example.board?.map(stringToCard) ?? [];

  return (
    <motion.div
      /* P2-05: 入场仅淡入（去掉 y 位移——transform 偏移不参与布局，滚动时视觉覆盖下方元素产生重叠） */
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.08, 0.3) }}
      className="space-y-5 max-w-full overflow-x-hidden"
    >
      {/* Title 行：序号徽章 + 标题 + 黄铜发线 */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--brass)]/15 text-[var(--brass-bright)] border border-[var(--brass)]/30 font-numeric">
          示例 {index + 1}
        </span>
        <h3 className="font-display text-[16px] text-[var(--ivory)] tracking-wide">
          {example.title}
        </h3>
        <div className="flex-1 h-px bg-[var(--walnut-border)] opacity-40" />
      </div>

      {/* Opponent Profile Card */}
      {example.opponent && (
        <div className="flex items-center gap-3 bg-[var(--surface)] rounded-lg p-3 border border-[var(--walnut-border)]">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: example.opponent.color + '20', border: `2px solid ${example.opponent.color}` }}
          >
            {example.opponent.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--ivory)]">
              {example.opponent.name}
            </div>
            <div className="text-xs text-[var(--ivory-muted)]">
              VPIP {example.opponent.stats.vpip}% | PFR {example.opponent.stats.pfr}% | AF {example.opponent.stats.af}
            </div>
          </div>
        </div>
      )}

      {/* Game Context Tags */}
      {example.gameContext && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="px-2 py-0.5 rounded text-xs bg-[var(--poker-indigo)]/25 text-[var(--poker-indigo-bright)]">
            {example.gameContext.gameType === 'cash' ? '💰 现金桌' : example.gameContext.gameType === 'mtt' ? '🏆 锦标赛' : '🎰 SNG'}
          </span>
          {example.gameContext.icmPressure && example.gameContext.icmPressure !== 'low' && (
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--poker-danger)]/20 text-[var(--poker-danger)]">
              ICM压力: {example.gameContext.icmPressure === 'high' ? '高' : '中'}
            </span>
          )}
          {example.gameContext.bubbleFactor && (
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--poker-terra)]/25 text-[var(--poker-terra-bright)]">
              🫧 泡沫期
            </span>
          )}
          {example.gameContext.tableDescription && (
            <span className="text-xs text-[var(--ivory-dim)]">
              "{example.gameContext.tableDescription}"
            </span>
          )}
        </div>
      )}

      {/* Poker Table（P2-05: 复用 .scenario-card 发牌员虚线圈，与实战场景卡同语言） */}
      <div className="scenario-card p-5 md:p-8">
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Pot size indicator */}
          <div className="bg-black/40 px-4 py-1.5 rounded-full">
            <span className="text-[var(--brass)] font-mono text-xs md:text-sm font-bold">Pot: {formatBB(example.potSize)}</span>
          </div>

          {/* Board cards */}
          {boardCards.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[var(--ivory-muted)]">公共牌</span>
              <div className="flex gap-2">
                {boardCards.map((card, i) => (
                  <PokerCard key={i} card={card} size="sm" animationDelay={0.2 + i * 0.1} />
                ))}
              </div>
            </div>
          )}

          {/* Previous actions */}
          {example.previousActions.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-1">
              {example.previousActions.map((act, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-black/30 px-2.5 py-1 text-[11px] md:text-xs text-[var(--ivory-dim)]"
                >
                  <PositionBadge position={act.player as Position} className="!text-[10px] !px-1.5 !py-0" />
                  <span className="font-mono">{act.action}</span>
                </span>
              ))}
            </div>
          )}

          {/* Separator */}
          <div className="w-3/4 h-px bg-[var(--walnut-border)] opacity-40 my-1" />

          {/* Hero info: position + stack */}
          <div className="flex items-center gap-2.5">
            <PositionBadge position={example.heroPosition as Position} active />
            <span className="text-xs md:text-sm font-medium text-[var(--ivory)]">HERO</span>
          </div>

          {/* Hero hand */}
          <div className="flex gap-3 py-1">
            {heroCards.map((card, i) => (
              <PokerCard key={i} card={card} size="md" animationDelay={i * 0.15} />
            ))}
          </div>

          {/* Stack + Bet info */}
          <div className="flex items-center gap-4 text-xs text-[var(--ivory-muted)]">
            <span>筹码: <b className="text-[var(--ivory)] font-mono">{formatBB(example.effectiveStack)}</b></span>
            {example.betSize && (
              <span>下注: <b className="text-[var(--success)] font-mono">{formatBB(example.betSize)}</b></span>
            )}
          </div>

          {/* Street indicator */}
          <span className="text-[10px] uppercase tracking-widest text-[var(--ivory-muted)] mt-1">
            {example.street === 'preflop' ? '翻前' : example.street === 'flop' ? '翻牌' : example.street === 'turn' ? '转牌' : '河牌'}
          </span>
        </div>
      </div>

      {/* Decision Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        {/* Correct Decision */}
        <div className="rounded-lg border-l-4 border-[var(--success)] bg-[var(--success)]/5 p-4 overflow-hidden break-words">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
            <span className="text-sm font-semibold text-[var(--success)]">正确决策</span>
          </div>
          <p className="text-sm font-bold text-[var(--ivory)] mb-2">
            {example.correctDecision.action}
            {example.correctDecision.amount && (
              <span className="ml-1.5 text-[var(--success)] font-mono">{example.correctDecision.amount}</span>
            )}
          </p>
          <ol className="space-y-1.5">
            {example.correctDecision.reasoning.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-[var(--ivory-dim)] leading-relaxed">
                <span className="shrink-0 w-4 h-4 rounded-full bg-[var(--success)]/20 text-[var(--success)] flex items-center justify-center text-[10px] font-bold mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Common Mistake */}
        <div className="rounded-lg border-l-4 border-[var(--danger)] bg-[var(--danger)]/5 p-4 overflow-hidden break-words">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-[var(--danger)]" />
            <span className="text-sm font-semibold text-[var(--danger)]">常见错误</span>
          </div>
          <p className="text-sm font-bold text-[var(--ivory)] mb-2">
            {example.commonMistake.action}
          </p>
          <p className="text-xs text-[var(--ivory-dim)] leading-relaxed mb-2">
            {example.commonMistake.reasoning}
          </p>
          <span className="inline-block rounded bg-[var(--danger)]/15 px-2 py-0.5 text-xs font-mono text-[var(--danger)]">
            EV: {example.commonMistake.evLoss}
          </span>
        </div>
      </div>

      {/* Opponent Strategy Tip */}
      {example.opponent && (
        <div className="mt-1 pt-3 border-t border-[var(--walnut-border)]">
          <p className="text-xs text-[var(--ivory-dim)]">
            💡 面对 {example.opponent.shortName} 类型对手，{example.opponent.exploitableBy[0]}
          </p>
        </div>
      )}
    </motion.div>
  );
}
