/**
 * FormulaDerivation 契约（jsdom）：
 * - 非结构化（单/双行）：与策略原 FormulaDisplay 逐 DOM 等价（div > div.mt-1.5 > 高亮 spans）
 * - 结构化：①②③ 编号徽章（超出 ⑳ 回退 n.）/ 公式居中 mono / 散文左对齐 / 引文注脚
 * - 变量高亮：EV / P(win) / Pot / P(lose) / P(胜) / P(负) 走 brass span（类名不变）
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FormulaDerivation, HighlightFormulaLine } from './FormulaDerivation';

afterEach(cleanup);

const EV_DERIVATION =
  'EV 完整推导链（含弃牌权益分支）：\n' +
  '跟注 EV = P(胜) × (当前底池 + 对手下注) - P(负) × 跟注额\n' +
  '弃牌 EV = 0（基准）\n' +
  '下注 EV = 弃牌率 × 底池 + (1-弃牌率) × [胜率 × (底池+下注) - 败率 × 下注额]\n\n' +
  '常用盈亏平衡点：\n' +
  '纯诈唬所需弃牌率 = 下注额 ÷ (底池 + 下注额)\n' +
  '下注 2/3 池时，弃牌率 > 40% 即可盈利';

const STEP_FLOW =
  '读牌四步法公式化流程：\n' +
  'Step 1: 构建初始范围（基于位置 + 翻前动作）\n' +
  'Step 2: 逐街过滤（每个动作排除一部分组合）\n' +
  'Step 3: 计算价值:诈唬比（组合数 ÷ 组合数）\n' +
  'Step 4: 比较所需胜率与诈唬占比';

/** brass 高亮 span 的文本集合（类名契约：text-[var(--brass-bright)] font-semibold） */
function highlightedTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('span'))
    .filter((span) => span.className.includes('text-[var(--brass-bright)]'))
    .map((span) => span.textContent ?? '');
}

describe('FormulaDerivation · 非结构化 legacy DOM 等价', () => {
  it('单行公式：.formula-display 直挂行 div，无标签无编号，变量高亮', () => {
    const content = 'EV = P(win) × Pot - P(lose) × bet';
    const { container } = render(<FormulaDerivation content={content} />);

    const outer = container.querySelector('.formula-display');
    expect(outer).not.toBeNull();
    expect(outer?.classList.contains('formula-display--structured')).toBe(false);
    expect(screen.queryByText('①')).toBeNull();

    // 与旧 FormulaDisplay 逐 DOM 等价：div > div（首行无类）> HighlightLine spans
    const expected = renderToStaticMarkup(
      <div className="formula-display">
        <div className="">
          <HighlightFormulaLine line={content} />
        </div>
      </div>,
    );
    expect(container.innerHTML).toBe(expected);
    expect(highlightedTexts(container)).toEqual(
      expect.arrayContaining(['EV', 'P(win)', 'Pot', 'P(lose)']),
    );
  });

  it('双行公式：第二行 div.mt-1.5，逐 DOM 等价', () => {
    const content = 'MDF = pot / (pot + bet)\nSPR = 有效筹码 / 底池';
    const { container } = render(<FormulaDerivation content={content} />);

    const expected = renderToStaticMarkup(
      <div className="formula-display">
        {content.split('\n').map((line, i) => (
          <div key={i} className={i > 0 ? 'mt-1.5' : ''}>
            <HighlightFormulaLine line={line} />
          </div>
        ))}
      </div>,
    );
    expect(container.innerHTML).toBe(expected);
    expect(container.querySelector('.formula-display--structured')).toBeNull();
  });
});

describe('FormulaDerivation · 结构化推导', () => {
  it('中文方程：①②③④ 编号 + 公式居中 mono + 散文左对齐 + P(胜)/P(负) 高亮', () => {
    const { container } = render(<FormulaDerivation content={EV_DERIVATION} />);

    expect(container.querySelector('.formula-display--structured')).not.toBeNull();
    for (const badge of ['①', '②', '③', '④']) {
      const node = screen.getByText(badge);
      expect(node.getAttribute('aria-hidden')).toBe('true');
      expect(node.className).toContain('font-numeric');
      expect(node.className).toContain('text-[var(--brass-bright)]');
    }

    const formulaLines = container.querySelectorAll('.formula-line');
    expect(formulaLines).toHaveLength(4);
    expect(formulaLines[0]?.classList.contains('font-mono')).toBe(true);
    expect(formulaLines[0]?.classList.contains('text-center')).toBe(true);
    expect(formulaLines[0]?.textContent).toContain('P(胜)');

    const prose = screen.getByText('下注 2/3 池时，弃牌率 > 40% 即可盈利').closest('p');
    expect(prose?.classList.contains('text-left')).toBe(true);
    expect(prose?.classList.contains('text-[13px]')).toBe(true);
    expect(prose?.classList.contains('leading-[1.7]')).toBe(true);

    const title = screen.getByText('EV 完整推导链（含弃牌权益分支）：');
    expect(title.classList.contains('text-left')).toBe(true);
    expect(title.classList.contains('text-[12px]')).toBe(true);

    expect(highlightedTexts(container)).toEqual(expect.arrayContaining(['P(胜)', 'P(负)', 'EV']));
  });

  it('Step 前缀流程：剥离前缀后编号 ①–④', () => {
    const { container } = render(<FormulaDerivation content={STEP_FLOW} />);

    expect(container.querySelector('.formula-display--structured')).not.toBeNull();
    for (const badge of ['①', '②', '③', '④']) {
      expect(screen.getByText(badge)).toBeTruthy();
    }
    const formulaLines = container.querySelectorAll('.formula-line');
    expect(formulaLines[0]?.textContent).toBe('构建初始范围（基于位置 + 翻前动作）');
    expect(formulaLines[3]?.textContent).toBe('比较所需胜率与诈唬占比');
  });

  it('尾部引文渲染为 11px 左对齐注脚（不编号）', () => {
    const content = `A = 1\nB = 2\nC = 3\n（概念源自：The Mathematics of Poker Ch.1-3）`;
    render(<FormulaDerivation content={content} />);

    const note = screen.getByText('（概念源自：The Mathematics of Poker Ch.1-3）');
    expect(note.classList.contains('text-[11px]')).toBe(true);
    expect(note.classList.contains('text-left')).toBe(true);
    expect(screen.getByText('③')).toBeTruthy();
    expect(screen.queryByText('④')).toBeNull();
  });

  it('超过 ⑳ 的编号回退 n.', () => {
    const content = Array.from({ length: 21 }, (_, i) => `L${i + 1} = ${i + 1}`).join('\n');
    render(<FormulaDerivation content={content} />);

    expect(screen.getByText('⑳')).toBeTruthy();
    expect(screen.getByText('21.')).toBeTruthy();
  });
});