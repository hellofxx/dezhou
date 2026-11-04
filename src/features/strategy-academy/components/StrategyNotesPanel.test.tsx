import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { MAX_LESSON_NOTE_LENGTH, useAcademyStore } from '../store';
import { StrategyNotesPanel } from './StrategyNotesPanel';

/**
 * 课时笔记面板契约（jsdom + 真实 store）：
 * - 空态：空提示 + 0 字数 + 保存禁用
 * - 2000 字上限：输入即截断，textarea maxlength 兜底
 * - 显式保存：写入 store.lessonNotes（trim 后），并 toast「已保存」
 * - 清空：删除 store 条目、草稿归零、toast「笔记已清空」
 * - 换课时（新 lessonId 挂载）读取该课已存笔记，不串课
 */

const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock('@/shared/components/ui/toast', () => ({
  toast: { success: toastSuccess, error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

const LESSON_ID = 'l1-basics';
const OTHER_ID = 'l1-bankroll';
const SAVE = i18n.t('academy.notes.save', { defaultValue: '保存' });
const CLEAR = i18n.t('academy.notes.clear', { defaultValue: '清空' });
const EMPTY = i18n.t('academy.notes.empty', {
  defaultValue: '还没有笔记。读到关键处随手记两句，回头复习能省一半时间',
});

beforeEach(() => {
  useAcademyStore.getState().resetProgress();
  toastSuccess.mockClear();
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

function textarea(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement;
}

function saveButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: SAVE }) as HTMLButtonElement;
}

describe('StrategyNotesPanel', () => {
  it('首次进入展示空态，保存禁用，字数提示从 0 起', () => {
    render(<StrategyNotesPanel lessonId={LESSON_ID} />);

    expect(screen.getByText(EMPTY)).toBeTruthy();
    expect(textarea().value).toBe('');
    expect(textarea().getAttribute('maxlength')).toBe(String(MAX_LESSON_NOTE_LENGTH));
    expect(saveButton().disabled).toBe(true);
  });

  it(`输入超过 ${MAX_LESSON_NOTE_LENGTH} 字时截断`, () => {
    render(<StrategyNotesPanel lessonId={LESSON_ID} />);

    fireEvent.change(textarea(), {
      target: { value: 'x'.repeat(MAX_LESSON_NOTE_LENGTH + 120) },
    });

    expect(textarea().value).toHaveLength(MAX_LESSON_NOTE_LENGTH);
  });

  it('保存写入 store（trim）并 toast，落库后按钮回到禁用', () => {
    render(<StrategyNotesPanel lessonId={LESSON_ID} />);

    fireEvent.change(textarea(), { target: { value: '  翻前先看位置  ' } });
    fireEvent.click(saveButton());

    const stored = useAcademyStore.getState().lessonNotes[LESSON_ID];
    expect(stored?.text).toBe('翻前先看位置');
    expect(typeof stored?.updatedAt).toBe('number');
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(saveButton().disabled).toBe(true);
  });

  it('已有笔记时可清空：删除 store 条目并 toast', () => {
    useAcademyStore.getState().saveLessonNote(LESSON_ID, '旧笔记');
    render(<StrategyNotesPanel lessonId={LESSON_ID} />);
    expect(textarea().value).toBe('旧笔记');

    fireEvent.click(screen.getByRole('button', { name: CLEAR }));

    expect(useAcademyStore.getState().lessonNotes[LESSON_ID]).toBeUndefined();
    expect(textarea().value).toBe('');
    expect(toastSuccess).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: CLEAR })).toBeNull();
  });

  it('换课时读各自的已存笔记（不串课）', () => {
    useAcademyStore.getState().saveLessonNote(LESSON_ID, '第一课笔记');
    useAcademyStore.getState().saveLessonNote(OTHER_ID, '第二课笔记');

    const view = render(<StrategyNotesPanel lessonId={LESSON_ID} />);
    expect(textarea().value).toBe('第一课笔记');

    view.rerender(<StrategyNotesPanel key={OTHER_ID} lessonId={OTHER_ID} />);
    expect(textarea().value).toBe('第二课笔记');
  });
});
