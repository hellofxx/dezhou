/**
 * Textarea 组件契约（jsdom）：与 Input 同 token 体系的基础字段件。
 * - aria-label / 受控 props 直通（label 关联方式由消费方决定，组件不自造）
 * - disabled 态走 token 类（cursor-not-allowed + opacity）
 * - min-h-24 默认高度 + 焦点环引用 focusRing 单源
 * - 表面色与尺寸由消费方 className 覆盖（结构批次保持原视觉）
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { Textarea } from './textarea';

afterEach(cleanup);

describe('Textarea', () => {
  it('aria-label 直通，默认渲染为 textarea', () => {
    render(<Textarea aria-label="报告说明" />);

    const field = screen.getByRole('textbox', { name: '报告说明' });
    expect(field.tagName).toBe('TEXTAREA');
    expect(field.getAttribute('aria-label')).toBe('报告说明');
  });

  it('受控 props 与原生属性直通', () => {
    render(
      <Textarea
        aria-label="笔记"
        value="翻前先看位置"
        onChange={() => {}}
        rows={4}
        maxLength={2000}
        placeholder="记下要点"
        aria-describedby="char-count"
      />
    );

    const field = screen.getByRole('textbox', { name: '笔记' }) as HTMLTextAreaElement;
    expect(field.value).toBe('翻前先看位置');
    expect(field.getAttribute('rows')).toBe('4');
    expect(field.getAttribute('maxlength')).toBe('2000');
    expect(field.getAttribute('placeholder')).toBe('记下要点');
    expect(field.getAttribute('aria-describedby')).toBe('char-count');
  });

  it('disabled 走 token 态：disabled 属性 + cursor-not-allowed / opacity 类', () => {
    render(<Textarea aria-label="禁用字段" disabled />);

    const field = screen.getByRole('textbox', { name: '禁用字段' }) as HTMLTextAreaElement;
    expect(field.disabled).toBe(true);
    expect(field.classList.contains('disabled:cursor-not-allowed')).toBe(true);
    expect(field.classList.contains('disabled:opacity-50')).toBe(true);
  });

  it('默认 min-h-24，并与 Input 共用字段 token（border-input / bg-background）', () => {
    render(<Textarea aria-label="字段" />);

    const field = screen.getByRole('textbox', { name: '字段' });
    expect(field.classList.contains('min-h-24')).toBe(true);
    expect(field.classList.contains('w-full')).toBe(true);
    expect(field.classList.contains('border-input')).toBe(true);
    expect(field.classList.contains('bg-background')).toBe(true);
    expect(field.classList.contains('placeholder:text-muted-foreground')).toBe(true);
  });

  it('焦点环引用 focusRing 单源常量（FOCUS_RING）', () => {
    render(<Textarea aria-label="字段" />);

    const field = screen.getByRole('textbox', { name: '字段' });
    for (const cls of FOCUS_RING.split(' ')) {
      expect(field.classList.contains(cls), `缺少焦点环类 ${cls}`).toBe(true);
    }
  });

  it('className 覆盖字段表面：后来的表面色替换默认 token', () => {
    render(
      <Textarea
        aria-label="字段"
        className="bg-[var(--felt)] border-[var(--walnut-border)] rounded-lg p-2.5 text-sm"
      />
    );

    const field = screen.getByRole('textbox', { name: '字段' });
    expect(field.classList.contains('bg-[var(--felt)]')).toBe(true);
    expect(field.classList.contains('bg-background')).toBe(false);
    expect(field.classList.contains('border-[var(--walnut-border)]')).toBe(true);
    expect(field.classList.contains('border-input')).toBe(false);
    expect(field.classList.contains('min-h-24')).toBe(true);
  });
});
