import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AcademyNotesPanel } from '@/shared/components/academy';
import { toast } from '@/shared/components/ui/toast';
import { MAX_LESSON_NOTE_LENGTH, useAcademyStore } from '../store';

interface StrategyNotesPanelProps {
  lessonId: string;
  /**
   * 调用方以 key={lessonId} 挂载：换课时强制重挂载，草稿初值随课更新
   * （不在 Effect 里回写派生值）。
   */
  className?: string;
}

/**
 * 策略学院课时笔记面板（共享 AcademyNotesPanel 的薄包装）。
 *
 * 本层负责：读 store、持有草稿、显式保存路径与 toast。
 * 写入唯一路径：显式点击「保存」才调用 store.saveLessonNote（不做输入即存，避免写放大）；
 * store 侧负责 trim + 2000 字截断，共享面板负责字数提示、输入截断与禁用态。
 * 笔记是阅读辅助：不参与门禁、不影响掌握度与能力分。
 */
export function StrategyNotesPanel({ lessonId, className }: StrategyNotesPanelProps) {
  const { t } = useTranslation();
  const storedNote = useAcademyStore((s) => s.lessonNotes[lessonId]);
  const saveLessonNote = useAcademyStore((s) => s.saveLessonNote);
  const [draft, setDraft] = useState(storedNote?.text ?? '');

  const storedText = storedNote?.text ?? '';
  const unchanged = draft.trim() === storedText.trim();

  const handleSave = () => {
    saveLessonNote(lessonId, draft);
    toast.success(t('academy.notes.saved', { defaultValue: '笔记已保存' }));
  };

  const handleClear = () => {
    saveLessonNote(lessonId, '');
    setDraft('');
    toast.success(t('academy.notes.cleared', { defaultValue: '笔记已清空' }));
  };

  return (
    <AcademyNotesPanel
      value={draft}
      onChange={setDraft}
      onSave={handleSave}
      onClear={handleClear}
      maxLength={MAX_LESSON_NOTE_LENGTH}
      hasStoredNote={storedText.length > 0}
      saveDisabled={unchanged}
      labels={{
        title: t('academy.notes.title', { defaultValue: '课时笔记' }),
        placeholder: t('academy.notes.placeholder', {
          defaultValue: '记下要点、你自己的例子，或者还没想通的问题',
        }),
        charCount: (count, max) =>
          t('academy.notes.charCount', { count, max, defaultValue: '{{count}} / {{max}} 字' }),
        save: t('academy.notes.save', { defaultValue: '保存' }),
        clear: t('academy.notes.clear', { defaultValue: '清空' }),
        empty: t('academy.notes.empty', {
          defaultValue: '还没有笔记。读到关键处随手记两句，回头复习能省一半时间',
        }),
        saved: t('academy.notes.saved', { defaultValue: '笔记已保存' }),
        cleared: t('academy.notes.cleared', { defaultValue: '笔记已清空' }),
      }}
      className={className}
    />
  );
}
