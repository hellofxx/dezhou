import { useState, useCallback, useRef } from 'react';
import { useHandHistoryStore } from '../store';
import { detectFormat } from '../parsers/common';
import { parsePokerStarsHand, parsePokerStarsMultiple } from '../parsers/pokerstars';
import { parseGGPokerHand, parseGGPokerMultiple } from '../parsers/gg-poker';
import { parsePartyPokerHand, parsePartyPokerMultiple } from '../parsers/partypoker';
import type { ImportResult } from '../types';
import { Upload, FileText, Check, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';

export function HandImporter() {
  const addHands = useHandHistoryStore(s => s.addHands);
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseHands = useCallback((content: string): ImportResult => {
    const format = detectFormat(content);
    const errors: string[] = [];
    const warnings: string[] = [];
    let hands: ImportResult['hands'] = [];

    try {
      if (format === 'pokerstars') {
        // Check if single or multiple
        const parts = content.split(/(?=PokerStars Hand #)/);
        const expectedCount = parts.filter(p => p.trim().startsWith('PokerStars Hand #')).length;
        if (expectedCount > 1) {
          hands = parsePokerStarsMultiple(content);
          if (hands.length < expectedCount) {
            warnings.push(`Skipped ${expectedCount - hands.length} unparseable hand(s) out of ${expectedCount}`);
          }
        } else {
          hands = [parsePokerStarsHand(content)];
        }
      } else if (format === 'ggpoker') {
        const parts = content.split(/(?=(?:GGPoker\s+)?Hand\s+#(?:HD-)?)/i);
        const expectedCount = parts.filter(p => /^(?:GGPoker\s+)?Hand\s+#/i.test(p.trim())).length;
        if (expectedCount > 1) {
          hands = parseGGPokerMultiple(content);
          if (hands.length < expectedCount) {
            warnings.push(`Skipped ${expectedCount - hands.length} unparseable hand(s) out of ${expectedCount}`);
          }
        } else {
          hands = [parseGGPokerHand(content)];
        }
      } else if (format === 'partypoker') {
        const parts = content.split(/(?=\*{5}\s*Hand History for Game)/i);
        const expectedCount = parts.filter(p => /Hand History for Game/i.test(p)).length;
        if (expectedCount > 1) {
          hands = parsePartyPokerMultiple(content);
          if (hands.length < expectedCount) {
            warnings.push(`Skipped ${expectedCount - hands.length} unparseable hand(s) out of ${expectedCount}`);
          }
        } else {
          hands = [parsePartyPokerHand(content)];
        }
      } else {
        errors.push('Unrecognized hand history format. Please paste PokerStars, GGPoker, or PartyPoker format.');
      }
    } catch (e) {
      errors.push(`Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return {
      success: hands.length > 0 && errors.length === 0,
      hands,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
      format: format !== 'unknown' ? format : undefined,
    };
  }, []);

  const handleImport = async () => {
    if (!text.trim()) return;
    setImporting(true);

    const res = parseHands(text);
    setResult(res);

    if (res.hands.length > 0) {
      await addHands(res.hands);
    }

    setImporting(false);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith('.txt')) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setText(content);
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
          ${dragOver ? 'border-[var(--brass)] bg-[var(--brass)]/5' : 'border-[var(--walnut-border)] hover:border-[var(--ivory-muted)]'}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload size={32} className="mx-auto mb-2 text-[var(--brass-bright)]" />
        <p className="text-sm text-[var(--ivory-dim)] font-display">
          Drop .txt file here or click to browse
        </p>
        <p className="text-xs text-[var(--ivory-muted)] mt-1">
          Supports PokerStars, GGPoker, and PartyPoker hand history formats
        </p>
      </div>

      {/* Text area */}
      <textarea
        value={text}
        onChange={(e) => { setText(e.target.value); setResult(null); }}
        placeholder="Or paste hand history text here..."
        className="w-full h-48 bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] rounded-xl p-4 text-xs font-numeric text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] resize-none focus:outline-none focus:border-[var(--brass)]/50"
      />

      {/* Preview */}
      {text && !result && (
        <div className="flex items-center gap-2 text-xs text-[var(--ivory-muted)] font-numeric">
          <FileText size={14} />
          <span>Format: {detectFormat(text) === 'unknown' ? 'Unknown' : detectFormat(text)}</span>
        </div>
      )}

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={!text.trim() || importing}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-display font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--brass-bright)] transition-colors"
      >
        {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        Import
      </button>

      {/* Result */}
      {result && (
        <div className={`p-3 rounded-lg border ${result.success ? (result.warnings ? 'bg-[var(--brass)]/10 border-[var(--brass)]/30' : 'bg-[var(--sage)]/10 border-[var(--sage)]/30') : 'bg-[var(--clay)]/10 border-[var(--clay)]/30'}`}>
          {result.success ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-[var(--sage)]">
                <Check size={16} />
                <span>Successfully imported {result.hands.length} hand{result.hands.length > 1 ? 's' : ''} ({result.format})</span>
              </div>
              {result.warnings?.map((w, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-[var(--brass-bright)]">
                  <AlertTriangle size={13} />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {result.errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[var(--clay)]">
                  <AlertCircle size={16} />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
