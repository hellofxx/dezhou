import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContentBlock } from './ContentBlock';
import type { LessonSection } from '../../types';

/**
 * 内容块分发契约（LessonContent 正文渲染的单一出口）：
 * - 每种 LessonSectionType 都命中自己的视觉语义（标题段落 / 提示块 / 标签块 / 公式 / 总结卡 /
 *   示例 / 理论支撑 / 示意图 / 手牌示例），不落入兜底分支
 * - 未知 type 兜底为正文段落（老数据不炸页面）
 * - contentKey 命中取译文覆盖数据层原文
 */

afterEach(() => cleanup());

function renderBlock(section: LessonSection, contentKey?: string) {
  return render(
    <MemoryRouter>
      <ContentBlock section={section} contentKey={contentKey} />
    </MemoryRouter>,
  );
}

function cssClassOf(el: Element | null): string {
  return el instanceof HTMLElement ? el.className : '';
}

describe('ContentBlock：按 section.type 分发', () => {
  it('heading 渲染为二级标题', () => {
    const { container } = renderBlock({ type: 'heading', content: '为什么资金管理重要' });
    const heading = container.querySelector('h2');
    expect(heading?.textContent).toBe('为什么资金管理重要');
    expect(container.querySelector('p')).toBeNull();
  });

  it('text 渲染为限宽正文段落', () => {
    const { container } = renderBlock({ type: 'text', content: '正文段落内容' });
    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent).toBe('正文段落内容');
    expect(cssClassOf(paragraph)).toContain('max-w-3xl');
  });

  it('highlight 渲染警示样式容器（非正文段落）', () => {
    const { container } = renderBlock({ type: 'highlight', content: '别用生活费打牌' });
    expect(screen.getByText('别用生活费打牌')).toBeTruthy();
    expect(cssClassOf(container.firstElementChild)).toContain('var(--warning)');
  });

  it('key-point / pro-tip / counter-intuitive 分别渲染对应标签', () => {
    const keyPoint = renderBlock({ type: 'key-point', content: '黄金法则内容' });
    expect(screen.getByText('关键要点')).toBeTruthy();
    expect(screen.getByText('黄金法则内容')).toBeTruthy();
    keyPoint.unmount();

    const proTip = renderBlock({ type: 'pro-tip', content: '职业牌手建议' });
    expect(screen.getByText('职业牌手说')).toBeTruthy();
    expect(screen.getByText('职业牌手建议')).toBeTruthy();
    proTip.unmount();

    renderBlock({ type: 'counter-intuitive', content: '反直觉内容' });
    expect(screen.getByText('反直觉点')).toBeTruthy();
    expect(screen.getByText('反直觉内容')).toBeTruthy();
  });

  it('formula 渲染公式展示块并高亮关键变量', () => {
    const { container } = renderBlock({
      type: 'formula',
      content: 'EV = P(win) × Pot - P(lose) × Bet',
    });
    const formula = container.querySelector('.formula-display');
    expect(formula).not.toBeNull();
    const highlighted = [...formula!.querySelectorAll('span')].filter((span) =>
      cssClassOf(span).includes('var(--brass-bright)'),
    );
    expect(highlighted.map((span) => span.textContent)).toEqual(
      expect.arrayContaining(['EV', 'P(win)', 'Pot', 'P(lose)']),
    );
  });

  it('takeaway 渲染要点总结卡，按换行拆分并过滤空行', () => {
    const { container } = renderBlock({ type: 'takeaway', content: '第一条要点\n\n  第二条要点  \n' });
    expect(screen.getByText('要点总结')).toBeTruthy();
    const items = [...container.querySelectorAll('li')].map((li) => li.textContent?.trim());
    expect(items).toEqual(['第一条要点', '第二条要点']);
  });

  it('example 渲染等宽示例文本块', () => {
    const { container } = renderBlock({ type: 'example', content: 'BTN 加注 2.5BB' });
    expect(container.querySelector('.font-mono')?.textContent).toContain('BTN');
    expect(screen.getByText(/BTN 加注 2\.5BB/)).toBeTruthy();
  });

  it('diagram 分发到表格块，hand-example 分发到手牌示例块', () => {
    const diagram = renderBlock({
      type: 'diagram',
      content: '回退文本',
      data: { headers: ['位置'], rows: [['BTN']] },
    });
    expect(diagram.container.querySelector('table')).not.toBeNull();
    expect(screen.queryByText('回退文本')).toBeNull();
    diagram.unmount();

    renderBlock({ type: 'hand-example', content: '手持 AKo 翻前加注' });
    expect(screen.getByText('手持 AKo 翻前加注')).toBeTruthy();
  });

  it('theory-reference 分发到理论支撑块（带章节链接）', () => {
    const { container } = renderBlock({
      type: 'theory-reference',
      content: '理论内容',
      data: { theoryChapterId: 't3-c-bet-frequency' },
    });
    expect(screen.getByText('理论支撑')).toBeTruthy();
    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/theory/chapter/t3-c-bet-frequency',
    );
  });

  it('未知 type 兜底为正文段落（老数据不炸页面）', () => {
    const legacy = { type: 'legacy-unknown' as LessonSection['type'], content: '历史段落内容' };
    const { container } = renderBlock(legacy);
    const paragraph = container.querySelector('p');
    expect(paragraph?.textContent).toBe('历史段落内容');
    expect(cssClassOf(paragraph)).toContain('max-w-3xl');
  });

  it('contentKey 命中时覆盖数据层原文（heading 与 text 均生效）', () => {
    const heading = render(
      <MemoryRouter>
        <ContentBlock
          section={{ type: 'heading', content: '数据层标题' }}
          contentKey="academy.courseView.backToAcademy"
        />
      </MemoryRouter>,
    );
    const headingText = heading.container.querySelector('h2')?.textContent;
    expect(headingText).toBe('返回学院');
    expect(headingText).not.toBe('数据层标题');
    heading.unmount();

    renderBlock({ type: 'text', content: '数据层正文' }, 'academy.courseView.notFound');
    expect(screen.getByText('课程未找到')).toBeTruthy();
    expect(screen.queryByText('数据层正文')).toBeNull();
  });
});
