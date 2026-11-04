import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AcademyNotesPanel } from '@/shared/components/academy';
import { toast } from '@/shared/components/ui/toast';
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
 * 理论学院章节笔记面板（共享 AcademyNotesPanel 的薄包装）。
 *
 * 本层负责：读 store、持有草稿、显式保存路径与 toast。
 * 写入路径唯一：显式点击「保存」才调用 store.saveChapterNote（不做输入即存，避免写放大）。
 * store 侧负责 trim + 截断；共享面板负责字数提示、上限截断与禁用态。
 * 不做任何门禁 / 掌握度联动（笔记是阅读辅助，不参与进度判定）。
 */
export function TheoryNotesPanel({ chapterId, className }: TheoryNotesPanelProps) {
  const { t } = useTranslation();
  const storedNote = useTheoryStore((s) => s.progress.chapterNotes?.[chapterId]);
  const saveChapterNote = useTheoryStore((s) => s.saveChapterNote);
  const [draft, setDraft] = useState(storedNote?.text ?? '');

  const storedText = storedNote?.text ?? '';
  const unchanged = draft.trim() === storedText.trim();

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
    <AcademyNotesPanel
      value={draft}
      onChange={setDraft}
      onSave={handleSave}
      onClear={handleClear}
      maxLength={MAX_CHAPTER_NOTE_LENGTH}
      hasStoredNote={storedText.length > 0}
      saveDisabled={unchanged}
      labels={{
        title: t('theory.notes.title'),
        placeholder: t('theory.notes.placeholder'),
        charCount: (count, max) => t('theory.notes.charCount', { count, max }),
        save: t('theory.notes.save'),
        clear: t('theory.notes.clear'),
        empty: t('theory.notes.empty'),
        saved: t('theory.notes.saved'),
        cleared: t('theory.notes.cleared'),
      }}
      className={className}
    />
  );
}
