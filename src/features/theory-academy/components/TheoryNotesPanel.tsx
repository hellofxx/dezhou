import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NotebookPen, Save, Trash2 } from 'lucide-react';
import { toast } from '@/shared/components/ui/toast';
import { cn } from '@/shared/utils/cn';
import { MAX_CHAPTER_NOTE_LENGTH, useTheoryStore } from '../store';

interface TheoryNotesPanelProps {
  chapterId: string;
  /**
   * 挂载键：章节切换时由调用方用 key={chapterId} 强制重挂载，
   * 使草稿初值随章更新（不在 Effect 里回写派生值）。
   */
  className?: string;
}

/**
 * 章节笔记面板（纯文本，上限 MAX_CHAPTER_NOTE_LENGTH = 2000）。
 *
 * 写入路径唯一：显式点击「保存」才调用 store.saveChapterNote（不做输入即存，避免写放大）。
 * store 侧负责 trim + 截断；本组件只做即时字数提示与禁用态判定。
 * 不做任何门禁 / 掌握度联动（笔记是阅读辅助，不参与进度判定）。
 */
export function TheoryNotesPanel({ chapterId, className }: TheoryNotesPanelProps) {
  const { t } = useTranslation();
  const storedNote = useTheoryStore((s) => s.progress.chapterNotes?.[chapterId]);
  const saveChapterNote = useTheoryStore((s) => s.saveChapterNote);
  const [draft, setDraft] = useState(storedNote?.text ?? '');

  const storedText = storedNote?.text ?? '';
  const hasNote = storedText.length > 0;
  const unchanged = draft.trim() === storedText.trim();
  const canSave = !unchanged && draft.trim().length > 0;
  const countId = `theory-note-count-${chapterId}`;

  const handleSave = () => {
    saveChapterNote(chapterId, draft);
    toast.success(t('theory.notes.saved'));
  };

  const handleClear = () => {
    saveChapterNote(chapterId, '');
    setDraft('');
    toast.success(t('theory.notes.cleared'));
  };

  return (
    <section aria-label={t('theory.notes.title')} className={cn('panel space-y-2.5', className)}>
      <div className="flex items-center gap-2">
        <NotebookPen className="w-4 h-4 text-[var(--brass-bright)] shrink-0" aria-hidden="true" />
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold">
          {t('theory.notes.title')}
        </h2>
      </div>

      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHAPTER_NOTE_LENGTH))}
        maxLength={MAX_CHAPTER_NOTE_LENGTH}
        rows={4}
        aria-describedby={countId}
        placeholder={t('theory.notes.placeholder')}
        className="w-full min-h-24 bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] rounded-lg p-2.5 text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={countId} className="font-numeric text-[11px] text-[var(--ivory-muted)]">
          {t('theory.notes.charCount', { count: draft.length, max: MAX_CHAPTER_NOTE_LENGTH })}
        </p>
        <div className="flex items-center gap-2">
          {hasNote && (
            <button
              type="button"
              onClick={handleClear}
              aria-label={t('theory.notes.clear')}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              {t('theory.notes.clear')}
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-[var(--brass-fill)] px-3 py-1.5 text-xs font-semibold text-[var(--brass-fill-ink)] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            {t('theory.notes.save')}
          </button>
        </div>
      </div>

      {!hasNote && unchanged && (
        <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed">
          {t('theory.notes.empty')}
        </p>
      )}
    </section>
  );
}
