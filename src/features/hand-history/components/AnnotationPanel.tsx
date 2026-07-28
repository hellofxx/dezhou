import { useState, useRef, useEffect } from 'react';
import type { HandHistory, ReplayState } from '../types';
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

function formatActions(hand: HandHistory): string {
  let md = '';
  const actionTypeLabel: Record<string, string> = {
    fold: 'folds',
    check: 'checks',
    call: 'calls',
    raise: 'raises',
    'all-in': 'is all-in',
  };

  md += `### Preflop\n`;
  for (const a of hand.streets.preflop) {
    const player = hand.players[a.playerIndex];
    const label = actionTypeLabel[a.type] ?? a.type;
    md += `- ${player?.name ?? `Player ${a.playerIndex}`} ${label}${a.amount ? ` $${a.amount}` : ''}\n`;
  }

  if (hand.streets.flop.cards.length > 0) {
    md += `\n### Flop\n`;
    for (const a of hand.streets.flop.actions) {
      const player = hand.players[a.playerIndex];
      const label = actionTypeLabel[a.type] ?? a.type;
      md += `- ${player?.name ?? `Player ${a.playerIndex}`} ${label}${a.amount ? ` $${a.amount}` : ''}\n`;
    }
  }

  if (hand.streets.turn.cards.length > 0) {
    md += `\n### Turn\n`;
    for (const a of hand.streets.turn.actions) {
      const player = hand.players[a.playerIndex];
      const label = actionTypeLabel[a.type] ?? a.type;
      md += `- ${player?.name ?? `Player ${a.playerIndex}`} ${label}${a.amount ? ` $${a.amount}` : ''}\n`;
    }
  }

  if (hand.streets.river.cards.length > 0) {
    md += `\n### River\n`;
    for (const a of hand.streets.river.actions) {
      const player = hand.players[a.playerIndex];
      const label = actionTypeLabel[a.type] ?? a.type;
      md += `- ${player?.name ?? `Player ${a.playerIndex}`} ${label}${a.amount ? ` $${a.amount}` : ''}\n`;
    }
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
    if (note.trim()) {
      addAnnotation(hand.id, annotationKey, note.trim());
    }
  };

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-display font-semibold text-[var(--ivory-dim)] tracking-wide">
        <MessageSquare size={14} />
        <span>Notes - {currentStreet}</span>
      </div>

      {existingNote && (
        <div className="text-xs bg-[var(--brass)]/10 border border-[var(--brass)]/25 rounded-lg p-2 text-[var(--ivory-dim)]">
          {existingNote}
        </div>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={`Add notes for ${currentStreet}...`}
        className="w-full h-24 bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] rounded-lg p-2 text-xs text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] resize-none focus:outline-none focus:border-[var(--brass)]/50"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!note.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-[var(--brass)] text-[var(--primary-foreground)] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brass-bright)] transition-colors"
        >
          <Save size={12} />
          Save
        </button>

        {/* Export dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-lg border border-[var(--walnut-border)] text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60 transition-colors"
          >
            <Download size={12} />
            导出
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
