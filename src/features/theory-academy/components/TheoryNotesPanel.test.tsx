import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { MAX_CHAPTER_NOTE_LENGTH, useTheoryStore } from '../store';
import { TheoryNotesPanel } from './TheoryNotesPanel';

/**
 * 章节笔记面板契约（jsdom + 真实 store）。
 * 覆盖：空态文案、字数上限截断（2000）、显式保存后落库（store.chapterNotes）、
 * 清空写回空串、保存成功 toast。
 * 未覆盖：真实浏览器排版与 toast 视觉（sonner 在测试中被替换为 mock）。
 */

const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock('@/shared/components/ui/toast', () => ({
  toast: { success: toastSuccess, error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const CHAPTER_ID = 't1-combinatorics';
const originalProgress = useTheoryStore.getState().progress;

function resetStore() {
  useTheoryStore.setState({
    progress: { ...originalProgress, chapterNotes: {}, bookmarkedChapters: [] },
  });
}

beforeEach(() => {
  resetStore();
  toastSuccess.mockClear();
});

afterEach(() => cleanup());

function textarea(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement;
}

function saveButton(): HTMLButtonElement {
  return screen.getByRole('button', {
    name: i18n.t('theory.notes.save'),
  }) as HTMLButtonElement;
}

describe('TheoryNotesPanel', () => {
  it('首次进入显示空态与 0 字数计数，保存按钮禁用', () => {
    render(<TheoryNotesPanel chapterId={CHAPTER_ID} />);
    expect(screen.getByText(i18n.t('theory.notes.empty'))).toBeTruthy();
    expect(
      screen.getByText(i18n.t('theory.notes.charCount', { count: 0, max: MAX_CHAPTER_NOTE_LENGTH })),
    ).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it('输入超过上限时按 2000 字截断', () => {
    render(<TheoryNotesPanel chapterId={CHAPTER_ID} />);
    fireEvent.change(textarea(), { target: { value: 'a'.repeat(MAX_CHAPTER_NOTE_LENGTH + 200) } });
    expect(textarea().value).toHaveLength(MAX_CHAPTER_NOTE_LENGTH);
  });

  it('显式保存后写入 store 并提示成功', () => {
    render(<TheoryNotesPanel chapterId={CHAPTER_ID} />);
    fireEvent.change(textarea(), { target: { value: '  组合数先算 1326  ' } });
    fireEvent.click(saveButton());
    expect(useTheoryStore.getState().progress.chapterNotes?.[CHAPTER_ID]?.text).toBe(
      '组合数先算 1326',
    );
    expect(toastSuccess).toHaveBeenCalledWith(i18n.t('theory.notes.saved'));
  });

  it('已有笔记时清空按钮写回空串并提示', () => {
    useTheoryStore.setState({
      progress: {
        ...originalProgress,
        chapterNotes: { [CHAPTER_ID]: { text: '旧笔记', updatedAt: 1 } },
      },
    });
    render(<TheoryNotesPanel chapterId={CHAPTER_ID} />);
    fireEvent.click(screen.getByRole('button', { name: i18n.t('theory.notes.clear') }));
    expect(useTheoryStore.getState().progress.chapterNotes?.[CHAPTER_ID]?.text).toBe('');
    expect(toastSuccess).toHaveBeenCalledWith(i18n.t('theory.notes.cleared'));
  });

  it('未改动时保存按钮保持禁用（避免空写）', () => {
    useTheoryStore.setState({
      progress: {
        ...originalProgress,
        chapterNotes: { [CHAPTER_ID]: { text: '已有内容', updatedAt: 1 } },
      },
    });
    render(<TheoryNotesPanel chapterId={CHAPTER_ID} />);
    expect(saveButton().disabled).toBe(true);
    fireEvent.change(textarea(), { target: { value: '已有内容' } });
    expect(saveButton().disabled).toBe(true);
    fireEvent.change(textarea(), { target: { value: '已有内容（补充）' } });
    expect(saveButton().disabled).toBe(false);
  });
});
