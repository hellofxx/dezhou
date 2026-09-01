import { useTranslation } from 'react-i18next';
import type { PreviousAction, DecisionNode } from '../types';
import type { Board } from '@/shared/types/poker';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { ActionType } from '@/shared/types/action';
import type { Position } from '@/shared/types/position';
import { cn } from '@/shared/utils';
import { actionLabel } from '../utils/actionTerms';

interface DecisionTreeProps {
  actions?: PreviousAction[];
  heroPosition?: Position;
  potSize?: number;
  nodes?: DecisionNode[];
  currentNodeIndex?: number;
  userDecisions?: Array<{ nodeIndex: number; action: string }>;
  className?: string;
}

function actionColor(action: ActionType): string {
  switch (action) {
    case ActionType.Fold: return 'text-[var(--clay)]';
    case ActionType.Check: return 'text-[var(--ivory-muted)]';
    case ActionType.Call: return 'text-[var(--sage)]';
    case ActionType.Raise: return 'text-[var(--brass-bright)]';
    case ActionType.AllIn: return 'text-[var(--brass)]';
  }
}

// 存 i18n key（gto.session.street*），MultiStepTree 渲染时经 t() 解析
const STREET_LABEL: Record<string, string> = {
  preflop: 'gto.session.streetPreflop', flop: 'gto.session.streetFlop', turn: 'gto.session.streetTurn', river: 'gto.session.streetRiver',
};

function boardCards(board?: Board) {
  if (!board) return [];
  const cards = [...board.flop];
  if (board.turn) cards.push(board.turn);
  if (board.river) cards.push(board.river);
  return cards;
}

const SUIT_SYMBOL: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠',
};
const RANK_CHAR: Record<number, string> = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
};

function MiniCard({ suit, rank }: { suit: string; rank: number }) {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-5 h-6 rounded text-[10px] font-bold border font-numeric',
        isRed
          ? 'text-[var(--suit-heart)] bg-[var(--walnut-raised)] border-[var(--walnut-border)]'
          : 'text-[var(--ivory)] bg-[var(--walnut-raised)] border-[var(--walnut-border)]'
      )}
    >
      {RANK_CHAR[rank]}{SUIT_SYMBOL[suit]}
    </span>
  );
}

// ─── 多步决策树 ─────────────────────────────────

function MultiStepTree({
  nodes,
  currentNodeIndex,
  userDecisions,
}: {
  nodes: DecisionNode[];
  currentNodeIndex: number;
  userDecisions: Array<{ nodeIndex: number; action: string }>;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-0">
      {nodes.map((node, idx) => {
        const isCompleted = idx < currentNodeIndex;
        const isCurrent = idx === currentNodeIndex;
        const decision = userDecisions.find((d) => d.nodeIndex === idx);
        const cards = boardCards(node.board);

        return (
          <div key={node.id}>
            {idx > 0 && (
              <div className="flex justify-center py-0.5">
                <div className={cn('w-px h-4', isCompleted ? 'bg-[var(--sage)]' : 'bg-[var(--walnut-border)]')} />
              </div>
            )}

            <div
              className={cn(
                'rounded-lg border p-3 transition-all',
                isCompleted && 'border-[var(--sage)]/50 bg-[var(--sage)]/8',
                isCurrent && 'border-[var(--brass-bright)]/70 bg-[var(--brass)]/10 shadow-[0_0_8px_var(--brass)]/20',
                !isCompleted && !isCurrent && 'border-dashed border-[var(--walnut-border)]/60 bg-transparent opacity-50'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'text-[10px] font-display font-bold uppercase tracking-widest',
                    isCompleted && 'text-[var(--sage)]',
                    isCurrent && 'text-[var(--brass-bright)]',
                    !isCompleted && !isCurrent && 'text-[var(--ivory-muted)]'
                  )}
                >
                  {t(STREET_LABEL[node.street] ?? node.street)}
                </span>
                <span className="text-[10px] font-numeric text-[var(--ivory-muted)]">
                  {node.potSize.toFixed(1)} BB
                </span>
              </div>

              {/* P1C-17: 未来节点牌面隐藏（仅已完成和当前节点显示） */}
              {cards.length > 0 && (isCompleted || isCurrent) && (
                <div className="flex gap-0.5 mb-1">
                  {cards.map((c, i) => (
                    <MiniCard key={i} suit={c.suit} rank={c.rank} />
                  ))}
                </div>
              )}
              {cards.length > 0 && !isCompleted && !isCurrent && (
                <div className="flex gap-0.5 mb-1">
                  {cards.map((_, i) => (
                    <span key={i} className="inline-flex items-center justify-center w-5 h-6 rounded text-[10px] font-bold border font-numeric bg-[var(--walnut-raised)] border-[var(--walnut-border)] text-[var(--ivory-muted)]">
                      ?
                    </span>
                  ))}
                </div>
              )}

              <div className="text-xs text-[var(--ivory-dim)]">
                {node.descriptionKey ? t(node.descriptionKey, node.descriptionParams) : node.description}
              </div>

              {isCompleted && decision && (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-[var(--sage)] text-xs font-bold">✓</span>
                  <span className="text-xs text-[var(--sage)] font-display">{decision.action}</span>
                </div>
              )}
              {isCurrent && (
                <div className="mt-1 text-[10px] text-[var(--brass-bright)] font-display animate-pulse">
                  ● {t('gto.tree.waitingDecision')}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 单步行动历史 ───────────────────────────────

function SingleStepHistory({
  actions,
  heroPosition,
  potSize,
}: {
  actions: PreviousAction[];
  heroPosition: Position;
  potSize: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[var(--ivory-muted)]">
        <span className="font-display tracking-wide">{t('gto.tree.history')}</span>
        <span className="font-numeric">
          {t('gto.feedback.pot')}: <span className="text-[var(--brass-bright)] font-bold">{potSize.toFixed(1)} BB</span>
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="text-xs text-[var(--ivory-muted)]">{t('gto.tree.emptyHeroTurn')}</div>
      ) : (
        <div className="flex items-center gap-1 flex-wrap">
          {actions.map((action, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)]/60">
                <PositionBadge position={action.position} />
                <span className={cn('text-xs font-display font-medium', actionColor(action.action))}>
                  {actionLabel(action.action, action.amount)}
                </span>
              </div>
              {idx < actions.length - 1 && <span className="text-[var(--ivory-muted)] text-xs">→</span>}
            </div>
          ))}
          <span className="text-[var(--ivory-muted)] text-xs">→</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--sage)]/15 border border-[var(--sage)]/40">
            <PositionBadge position={heroPosition} active />
            <span className="text-xs font-display font-bold text-[var(--sage)]">Hero</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-[var(--walnut-raised)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--brass)] rounded-full transition-all"
            style={{ width: `${Math.min((potSize / 30) * 100, 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-[var(--ivory-muted)] font-numeric">{potSize.toFixed(1)}BB</span>
      </div>
    </div>
  );
}

// ─── 主组件 ─────────────────────────────────────

export function DecisionTree({
  actions = [],
  heroPosition,
  potSize = 1.5,
  nodes,
  currentNodeIndex = 0,
  userDecisions = [],
  className,
}: DecisionTreeProps) {
  if (nodes && nodes.length > 0) {
    return (
      <div className={className}>
        <MultiStepTree nodes={nodes} currentNodeIndex={currentNodeIndex} userDecisions={userDecisions} />
      </div>
    );
  }

  return (
    <div className={className}>
      <SingleStepHistory
        actions={actions}
        heroPosition={heroPosition ?? ('BTN' as Position)}
        potSize={potSize}
      />
    </div>
  );
}
