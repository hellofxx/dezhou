import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TheoryReferenceBlock } from './TheoryReferenceBlock';
import type { LessonSection } from '../../types';

/**
 * 「理论支撑」块可点击性守卫（jsdom 组件环境）。
 *
 * 背景：课时数据的 theory-reference 段落携带的是 data.theoryChapterId（而非 data.lessonId），
 * 早期 resolveLink 只认 lessonId，导致全部引用退化为不可点击的纯文本标签。
 * 本测试断言 DOM 中确实渲染出带正确 href 的 <a>（可点击），并覆盖 lessonId 回退与无引用降级。
 */

function makeSection(data?: Record<string, unknown>): LessonSection {
  return { type: 'theory-reference', content: '理论内容', data };
}

describe('TheoryReferenceBlock 跳转链接', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function render(data?: Record<string, unknown>) {
    act(() => {
      root.render(<TheoryReferenceBlock section={makeSection(data)} />);
    });
    return container.querySelector('a');
  }

  it('data.theoryChapterId 存在时渲染指向理论章节的可点击 <a>', () => {
    const link = render({ theoryChapterId: 't3-c-bet-frequency' });
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/theory/chapter/t3-c-bet-frequency');
    expect(link!.textContent).toContain('理论支撑');
  });

  it('theoryChapterId 优先于 lessonId（两者并存时走理论章节）', () => {
    const link = render({ theoryChapterId: 't2-equity', lessonId: 'l3-cbet' });
    expect(link!.getAttribute('href')).toBe('/theory/chapter/t2-equity');
  });

  it('仅有 lessonId 时保持向后兼容：默认学院课程路径 / target=theory 时理论路径', () => {
    expect(render({ lessonId: 'l3-cbet' })!.getAttribute('href')).toBe('/academy/lesson/l3-cbet');
    expect(render({ lessonId: 't4-x', target: 'theory' })!.getAttribute('href')).toBe('/theory/chapter/t4-x');
  });

  it('id 为空白字符串或缺失时降级为纯文本标签（无 <a>）', () => {
    expect(render({ theoryChapterId: '   ' })).toBeNull();
    expect(render({ lessonId: '' })).toBeNull();
    expect(render(undefined)).toBeNull();
    expect(container.textContent).toContain('理论支撑');
  });
});
