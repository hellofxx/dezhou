import { useMemo } from 'react';
import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionStandard } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { HandExample as HandExampleType } from '../types';
import { PokerCard } from '@/shared/components/poker/Card';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { Position } from '@/shared/types/position';
import { stringToCard } from '@/shared/utils/deck';
import { formatBB } from '@/shared/utils/formatters';
import { resolveHandExample, resolveOpponent } from '../utils/contentKeys';
import { PredictionPrompt } from './PredictionPrompt';

interface HandExampleProps {
  example: HandExampleType;
  index: number;
  /** P2: 互动示例（预测暂停 checkpoint），默认 false 保持静态行为（QuickDrill 等调用方不受影响） */
  interactive?: boolean;
  /** 已答状态（父层按 unitId 维护，受控传入 PredictionPrompt） */
  answered?: boolean;
  onAnswered?: (answered: boolean) => void;
}

export function HandExampleComponent({
  example,
  index,
  interactive = false,
  answered,
  onAnswered,
}: HandExampleProps) {
  const { t } = useTranslation();
  // 渲染层 key 覆盖：解析后对象为唯一渲染源（key 缺失时回退数据层中文）
  const resolvedExample = useMemo(() => resolveHandExample(t, example), [example, t]);
  const resolvedOpponent = useMemo(
    () => (resolvedExample.opponent ? resolveOpponent(t, resolvedExample.opponent) : undefined),
    [resolvedExample.opponent, t],
  );
  // 交互模式传入 PredictionPrompt 的 example 也须为解析后对象：
  // PredictionPrompt 直接消费 correctDecision.reasoning 与 opponent.exploitableBy 等
  // 数据层硬编码中文字段，父层不 resolve 会导致英文界面回退中文。
  const resolvedExampleWithOpponent = useMemo(
    () =>
      resolvedExample.opponent && resolvedOpponent
        ? { ...resolvedExample, opponent: resolvedOpponent }
        : resolvedExample,
    [resolvedExample, resolvedOpponent],
  );
  const heroCards = resolvedExample.heroHand.map(stringToCard);
  const boardCards = resolvedExample.board?.map(stringToCard) ?? [];

  return (
    <motion.div
      /* P2-05: 入场仅淡入（去掉 y 位移——transform 偏移不参与布局，滚动时视觉覆盖下方元素产生重叠） */
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ ...transitionStandard, delay: Math.min(index * 0.08, 0.3) }}
      className="space-y-5 max-w-full overflow-x-hidden"
    >
      {/* Title 行：序号徽章 + 标题 + 黄铜发线 */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded bg-[var(--brass)]/15 text-[var(--brass-bright)] border border-[var(--brass)]/30 font-numeric">
          {t('academy.content.exampleLabel', { n: index + 1 })}
        </span>
        <h3 className="font-display text-[16px] text-[var(--ivory)] tracking-wide">
          {resolvedExample.title}
        </h3>
        <div className="flex-1 h-px bg-[var(--walnut-border)] opacity-40" />
      </div>

      {/* Opponent Profile Card */}
      {resolvedOpponent && (
        <div className="flex items-center gap-3 bg-[var(--surface)] rounded-lg p-3 border border-[var(--walnut-border)]">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
            style={{ backgroundColor: resolvedOpponent.color + '20', border: `2px solid ${resolvedOpponent.color}` }}
          >
            {resolvedOpponent.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-[var(--ivory)]">
              {resolvedOpponent.name}
            </div>
            <div className="text-xs text-[var(--ivory-muted)]">
              VPIP {resolvedOpponent.stats.vpip}% | PFR {resolvedOpponent.stats.pfr}% | AF {resolvedOpponent.stats.af}
            </div>
          </div>
        </div>
      )}

      {/* Game Context Tags */}
      {resolvedExample.gameContext && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="px-2 py-0.5 rounded text-xs bg-[var(--poker-indigo)]/25 text-[var(--poker-indigo-bright)]">
            {resolvedExample.gameContext.gameType === 'cash'
              ? t('academy.gameContext.cash')
              : resolvedExample.gameContext.gameType === 'mtt'
                ? t('academy.gameContext.mtt')
                : t('academy.gameContext.sng')}
          </span>
          {resolvedExample.gameContext.icmPressure && resolvedExample.gameContext.icmPressure !== 'low' && (
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--poker-danger)]/20 text-[var(--poker-danger)]">
              {t('academy.gameContext.icmPressure')}
              {resolvedExample.gameContext.icmPressure === 'high' ? t('academy.gameContext.icmHigh') : t('academy.gameContext.icmMedium')}
            </span>
          )}
          {resolvedExample.gameContext.bubbleFactor && (
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--poker-terra)]/25 text-[var(--poker-terra-bright)]">
              {t('academy.gameContext.bubble')}
            </span>
          )}
          {resolvedExample.gameContext.tableDescription && (
            <span className="text-xs text-[var(--ivory-dim)]">
              "{resolvedExample.gameContext.tableDescription}"
            </span>
          )}
        </div>
      )}

      {/* Poker Table（P2-05: 复用 .scenario-card 发牌员虚线圈，与实战场景卡同语言） */}
      <div className="scenario-card p-5 md:p-8">
        <div className="relative z-10 flex flex-col items-center gap-4">
          {/* Pot size indicator */}
          <div className="bg-black/40 px-4 py-1.5 rounded-full">
            <span className="text-[var(--brass)] font-mono text-xs md:text-sm font-bold">Pot: {formatBB(resolvedExample.potSize)}</span>
          </div>

          {/* Board cards */}
          {boardCards.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-[var(--ivory-muted)]">{t('academy.content.handExample.community')}</span>
              <div className="flex gap-2">
                {boardCards.map((card, i) => (
                  <PokerCard key={i} card={card} size="sm" animationDelay={0.2 + i * 0.1} />
                ))}
              </div>
            </div>
          )}

          {/* Previous actions */}
          {resolvedExample.previousActions.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2 py-1">
              {resolvedExample.previousActions.map((act, i) => (
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
            <PositionBadge position={resolvedExample.heroPosition as Position} active />
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
            <span>{t('academy.content.handExample.stack', { value: formatBB(resolvedExample.effectiveStack) })}</span>
            {resolvedExample.betSize && (
              <span>{t('academy.content.handExample.bet', { value: formatBB(resolvedExample.betSize) })}</span>
            )}
          </div>

          {/* Street indicator */}
          <span className="text-[10px] uppercase tracking-widest text-[var(--ivory-muted)] mt-1">
            {resolvedExample.street === 'preflop'
              ? t('academy.content.handExample.streetPreflop')
              : resolvedExample.street === 'flop'
                ? t('academy.content.handExample.streetFlop')
                : resolvedExample.street === 'turn'
                  ? t('academy.content.handExample.streetTurn')
                  : t('academy.content.handExample.streetRiver')}
          </span>
        </div>
      </div>

      {/* Decision Analysis：静态模式双栏；互动模式替换为预测暂停（PredictionPrompt） */}
      {interactive ? (
        <PredictionPrompt
          example={resolvedExampleWithOpponent}
          answered={answered ?? false}
          onAnswered={onAnswered ?? (() => {})}
        />
      ) : (
      <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-full">
        {/* Correct Decision */}
        <div className="rounded-lg border-l-4 border-[var(--success)] bg-[var(--success)]/5 p-4 overflow-hidden break-words">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
            <span className="text-sm font-semibold text-[var(--success)]">{t('academy.content.handExample.correctDecision')}</span>
          </div>
          <p className="text-sm font-bold text-[var(--ivory)] mb-2">
            {resolvedExample.correctDecision.action}
            {resolvedExample.correctDecision.amount && (
              <span className="ml-1.5 text-[var(--success)] font-mono">{resolvedExample.correctDecision.amount}</span>
            )}
          </p>
          <ol className="space-y-1.5">
            {resolvedExample.correctDecision.reasoning.map((step, i) => (
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
            <span className="text-sm font-semibold text-[var(--danger)]">{t('academy.content.handExample.commonMistake')}</span>
          </div>
          <p className="text-sm font-bold text-[var(--ivory)] mb-2">
            {resolvedExample.commonMistake.action}
          </p>
          <p className="text-xs text-[var(--ivory-dim)] leading-relaxed mb-2">
            {resolvedExample.commonMistake.reasoning}
          </p>
          <span className="inline-block rounded bg-[var(--danger)]/15 px-2 py-0.5 text-xs font-mono text-[var(--danger)]">
            EV: {resolvedExample.commonMistake.evLoss}
          </span>
        </div>
      </div>

      {/* Opponent Strategy Tip（静态模式保留；互动模式由 PredictionPrompt 揭示区承载） */}
      {resolvedOpponent && (
        <div className="mt-1 pt-3 border-t border-[var(--walnut-border)]">
          <p className="text-xs text-[var(--ivory-dim)]">
            💡 {t('academy.checkpoint.opponentHint', { shortName: resolvedOpponent.shortName, tip: resolvedOpponent.exploitableBy[0] })}
          </p>
        </div>
      )}
      </>
      )}
    </motion.div>
  );
}
