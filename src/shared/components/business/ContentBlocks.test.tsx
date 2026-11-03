/**
 * ContentBlocks 契约（theory-academy / strategy-academy 课程内容块共用视觉件）：
 * - LabeledBlock：图标 + 标签 + 正文，保留换行（whitespace-pre-line）
 * - AsciiMonoText：仅含 ASCII 字母/数字的行使用等宽字体，中文行保持无衬线；换行不丢
 * - FormulaBlock：带"公式推导"标签，内部复用 AsciiMonoText
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Sigma } from 'lucide-react';
import { AsciiMonoText, FormulaBlock, LabeledBlock } from './ContentBlocks';

describe('ContentBlocks', () => {
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

  const render = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  describe('LabeledBlock', () => {
    it('渲染图标 + 标签 + 正文，并应用调用方传入的样式类', () => {
      render(
        <LabeledBlock
          icon={Sigma}
          iconClass="text-[var(--brass)]"
          label="关键点"
          labelClass="text-[var(--brass-bright)]"
          wrapClass="bg-[var(--felt-deep)]"
          content={'第一行\n第二行'}
        />,
      );

      const wrap = container.querySelector('div.rounded-lg');
      expect(wrap?.classList.contains('bg-[var(--felt-deep)]')).toBe(true);
      expect(container.querySelector('svg')?.getAttribute('class')).toContain('text-[var(--brass)]');
      expect(container.textContent).toContain('关键点');
      // 换行内容原样保留（CSS 负责折行）
      expect(container.textContent).toContain('第一行\n第二行');
    });
  });

  describe('AsciiMonoText', () => {
    it('含 ASCII 的行使用等宽字体，纯中文行不使用', () => {
      render(<AsciiMonoText content={'底池赔率 = 2.5 : 1\n纯中文说明'} />);

      const spans = Array.from(container.querySelectorAll('span'));
      expect(spans).toHaveLength(2);
      expect(spans[0]?.classList.contains('font-mono')).toBe(true);
      expect(spans[1]?.classList.contains('font-mono')).toBe(false);
    });

    it('行间换行符保留，末行不追加多余换行', () => {
      render(<AsciiMonoText content={'A\nB\nC'} />);

      const spans = Array.from(container.querySelectorAll('span'));
      expect(spans.map((span) => span.textContent)).toEqual(['A\n', 'B\n', 'C']);
    });

    it('单行内容不需要额外换行符', () => {
      render(<AsciiMonoText content={'EV = 1.2'} />);
      expect(container.querySelectorAll('span')).toHaveLength(1);
      expect(container.textContent).toBe('EV = 1.2');
    });
  });

  describe('FormulaBlock', () => {
    it('渲染"公式推导"标签并复用等宽正文', () => {
      render(<FormulaBlock content={'MDF = pot / (pot + bet)'} />);

      expect(container.textContent).toContain('公式推导');
      expect(container.querySelector('.font-mono')?.textContent).toBe('MDF = pot / (pot + bet)');
    });
  });
});
