import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { HandHistory, ReplayState } from '../types';
import type { PlayerAction } from '@/shared/types/action';
import { ActionType } from '@/shared/types/action';
import { useHandHistoryStore } from '../store';
import { MessageSquare, Save, Download } from 'lucide-react';

interface AnnotationPanelProps {
  hand: HandHistory;
  currentStreet: ReplayState['currentStreet'];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportAnnotationsJSON(hand: HandHistory) {
  const data = {
    handId: hand.id,
    site: hand.site,
    handNumber: hand.handNumber,
    date: new Date(hand.timestamp).toISOString(),
    stakes: hand.stakes,
    annotations: hand.annotations,
    actions: hand.streets,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `hand-${hand.handNumber}-annotations.json`);
}

// HH-020：amount 为「to 金额」，导出文本中 Call 显示增量、Raise 显示 to 总额，
// 保持与 formatAction 一致的可见语义。prior 计算该玩家在本街先前金额动作的最后 to 值。
function actionDeltaAmount(action: PlayerAction, actions: PlayerAction[], idx: number): number {
  if (action.type === ActionType.Raise || action.type === ActionType.AllIn) {
    return action.amount ?? 0;
  }
  let prior = 0;
  for (let j = 0; j < idx; j++) {
    const prev = actions[j]!;
    if (
      prev.playerIndex === action.playerIndex &&
      prev.amount !== undefined &&
      (prev.type === ActionType.Call || prev.type === ActionType.Raise || prev.type === ActionType.AllIn)
    ) {
      prior = prev.amount;
    }
  }
  return Math.max(0, (action.amount ?? 0) - prior);
}

function formatActions(hand: HandHistory): string {
  let md = '';
  const actionTypeLabel: Record<string, string> = {
    fold: 'folds',
    check: 'checks',
    call: 'calls',
    raise: 'raises',
    'all-in': 'is all-in',
  };

  const renderStreet = (title: string, actions: PlayerAction[]) => {
    if (actions.length === 0) return;
    md += `\n### ${title}\n`;
    actions.forEach((a, idx) => {
      const player = hand.players[a.playerIndex];
      const label = actionTypeLabel[a.type] ?? a.type;
      const amount = actionDeltaAmount(a, actions, idx);
      md += `- ${player?.name ?? `Player ${a.playerIndex}`} ${label}${amount ? ` $${amount}` : ''}\n`;
    });
  };

  md += `### Preflop\n`;
  if (hand.streets.preflop.length === 0) {
    md += '';
  } else {
    hand.streets.preflop.forEach((a, idx) => {
      const player = hand.players[a.playerIndex];
      const label = actionTypeLabel[a.type] ?? a.type;
      const amount = actionDeltaAmount(a, hand.streets.preflop, idx);
      md += `- ${player?.name ?? `Player ${a.playerIndex}`} ${label}${amount ? ` $${amount}` : ''}\n`;
    });
  }

  if (hand.streets.flop.cards.length > 0) {
    renderStreet('Flop', hand.streets.flop.actions);
  }
  if (hand.streets.turn.cards.length > 0) {
    renderStreet('Turn', hand.streets.turn.actions);
  }
  if (hand.streets.river.cards.length > 0) {
    renderStreet('River', hand.streets.river.actions);
  }

  return md;
}

function exportAnnotationsMarkdown(hand: HandHistory) {
  let md = `# Hand ${hand.handNumber}\n\n`;
  md += `**Site**: ${hand.site} | **Date**: ${new Date(hand.timestamp).toLocaleDateString()} | **Stakes**: $${hand.stakes.smallBlind}/$${hand.stakes.bigBlind}\n\n`;
  md += `## Actions\n\n`;
  md += formatActions(hand);
  md += `\n## Annotations\n\n`;

  const entries = Object.entries(hand.annotations);
  if (entries.length === 0) {
    md += `*No annotations*\n`;
  } else {
    for (const [key, note] of entries) {
      md += `### ${key}\n${note}\n\n`;
    }
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  downloadBlob(blob, `hand-${hand.handNumber}-annotations.md`);
}

export function AnnotationPanel({ hand, currentStreet }: AnnotationPanelProps) {
  const { t } = useTranslation();
  const addAnnotation = useHandHistoryStore(s => s.addAnnotation);
  const [note, setNote] = useState(hand.annotations[currentStreet] ?? '');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const annotationKey = currentStreet;
  const existingNote = hand.annotations[annotationKey];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

  const handleSave = () => {
    // 空 note 提交 = 删除该街道批注（store.addAnnotation 空值删 key）
    addAnnotation(hand.id, annotationKey, note.trim());
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-display font-semibold text-[var(--ivory-dim)] tracking-wide">
        <MessageSquare size={14} />
        <span>{t('handHistory.annotation.notes', { street: currentStreet })}</span>
      </div>

      {existingNote && (
        <div className="text-xs bg-[var(--brass)]/10 border border-[var(--brass)]/25 rounded-lg p-2 text-[var(--ivory-dim)]">
          {existingNote}
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('handHistory.annotation.placeholder', { street: currentStreet })}
        className="w-full h-24 bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] rounded-lg p-2 text-xs text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] resize-none focus:outline-none focus:border-[var(--brass)]/50"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!note.trim() && !existingNote}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-[var(--brass)] text-[var(--primary-foreground)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brass-bright)] transition-colors"
        >
          <Save size={12} />
          {t('handHistory.annotation.save')}
        </button>

        {/* Export dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-lg border border-[var(--walnut-border)] text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
          >
            <Download size={12} />
            {t('handHistory.annotation.export')}
          </button>
          {showExportMenu && (
            <div className="absolute bottom-full left-0 mb-1 w-36 rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] shadow-lg overflow-hidden z-10">
              <button
                onClick={() => { exportAnnotationsJSON(hand); setShowExportMenu(false); }}
                className="w-full px-3 py-2 text-left text-xs text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
              >
                JSON
              </button>
              <button
                onClick={() => { exportAnnotationsMarkdown(hand); setShowExportMenu(false); }}
                className="w-full px-3 py-2 text-left text-xs text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60 transition-colors border-t border-[var(--walnut-border)]/50"
              >
                Markdown
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
