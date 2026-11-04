/**
 * AcademyNotesPanel 契约（jsdom）：
 * - 纯受控：value/onChange 由调用方持有，输入超过 maxLength 时组件先截断再回调
 * - 字数提示走 labels.charCount，按钮文案走 labels，clear 仅在已有落库笔记时出现
 * - 保存禁用条件：空白草稿恒禁用；saveDisabled 追加禁用（如草稿未变化）
 * - 空态提示仅在「无落库笔记且未输入」时出现
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AcademyNotesPanel, type AcademyNotesPanelProps } from './AcademyNotesPanel';

const labels = {
  title: '课时笔记',
  placeholder: '记下要点',
  charCount: (count: number, max: number) => `${count} / ${max}`,
  save: '保存',
  clear: '清空',
  empty: '还没有笔记',
  saved: '已保存',
  cleared: '笔记已清空',
};

function mount(overrides: Partial<AcademyNotesPanelProps> = {}) {
  const onChange = vi.fn();
  const onSave = vi.fn();
  const onClear = vi.fn();
  const result = render(
    <AcademyNotesPanel
      value=""
      onChange={onChange}
      onSave={onSave}
      onClear={onClear}
      maxLength={2000}
      hasStoredNote={false}
      labels={labels}
      {...overrides}
    />
  );
  return { ...result, onChange, onSave, onClear };
}

function textarea(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement;
}

function saveButton(): HTMLButtonElement {
  return screen.getByRole('button', { name: labels.save }) as HTMLButtonElement;
}

afterEach(cleanup);

describe('AcademyNotesPanel', () => {
  it('渲染标题、受控值与字数提示', () => {
    mount({ value: '翻前先看位置' });

    expect(screen.getByRole('region', { name: labels.title })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(labels.title);
    expect(textarea().value).toBe('翻前先看位置');
    expect(screen.getByText('6 / 2000')).toBeTruthy();
    expect(textarea().getAttribute('maxlength')).toBe('2000');
    expect(textarea().getAttribute('placeholder')).toBe(labels.placeholder);
  });

  it('输入超过上限时先截断再回调 onChange', () => {
    const { onChange } = mount();

    fireEvent.change(textarea(), { target: { value: 'a'.repeat(2020) } });
    expect(onChange).toHaveBeenCalledWith('a'.repeat(2000));
  });

  it('空白草稿禁用保存，非空可用并回调 onSave', () => {
    mount({ value: '   ' });
    expect(saveButton().disabled).toBe(true);
    cleanup();

    const { onSave } = mount({ value: '记录一条' });
    expect(saveButton().disabled).toBe(false);
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('saveDisabled 追加禁用（草稿未变化时不空写）', () => {
    mount({ value: '已有内容', saveDisabled: true });

    expect(saveButton().disabled).toBe(true);
  });

  it('clear 仅在已有落库笔记时出现，点击回调 onClear', () => {
    mount({ value: '' });
    expect(screen.queryByRole('button', { name: labels.clear })).toBeNull();
    cleanup();

    const { onClear } = mount({ value: '旧笔记', hasStoredNote: true });
    fireEvent.click(screen.getByRole('button', { name: labels.clear }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('空态提示仅在无落库笔记且未输入时出现', () => {
    mount({ value: '' });
    expect(screen.getByText(labels.empty)).toBeTruthy();
    cleanup();

    mount({ value: '写了点东西' });
    expect(screen.queryByText(labels.empty)).toBeNull();
    cleanup();

    mount({ value: '', hasStoredNote: true });
    expect(screen.queryByText(labels.empty)).toBeNull();
  });

  it('className 透传到面板容器', () => {
    mount({ className: 'mt-4' });

    expect(screen.getByRole('region', { name: labels.title }).className).toContain('mt-4');
  });
});
