import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type {
  TheoryDecisionTreeBlockData,
  TheoryRangeMatrixBlockData,
  TheoryTableBlockData,
} from '../types';
import { TheoryRichBlock } from './TheoryRichBlock';
import { TheorySectionRenderer } from './TheorySectionRenderer';

/**
 * 富文本块渲染契约（jsdom）。
 * 覆盖：表格原生语义（table / th[scope=col] / caption）、范围矩阵 13×13 全量单元格与
 * 每格「手牌 · 权重 · 动作」读屏文本、决策树嵌套列表与分支条件、数据回环不死循环、
 * 缺 key 动作的记号回退、段落渲染器把 data 挂在正文之后。
 *
 * 宽度契约：jsdom 无法测量真实溢出，因此锁定两条布局前提——
 * 表格容器带 overflow-x-auto（窄屏内滚动）、矩阵 table-fixed（13 列压缩不撑破页面）。
 */

MotionGlobalConfig.skipAnimations = true;

afterEach(() => cleanup());

const tableData: TheoryTableBlockData = {
  kind: 'table',
  headers: ['theory.block.table', 'bb'],
  rows: [
    ['1', '2'],
    ['3', '4'],
  ],
  captionKey: 'theory.block.caption',
};

const matrixData: TheoryRangeMatrixBlockData = {
  kind: 'range-matrix',
  cells: [
    { hand: 'AA', weight: 100, action: 'raise' },
    { hand: 'AKs', weight: 50, action: 'bet' },
    { hand: '72o', weight: 0, action: 'fold' },
  ],
};

const treeData: TheoryDecisionTreeBlockData = {
  kind: 'decision-tree',
  rootId: 'root',
  nodes: [
    { id: 'root', labelKey: '翻前面对加注' },
    { id: 'left', labelKey: '有位置' },
    { id: 'right', labelKey: '无位置' },
  ],
  edges: [
    { from: 'root', to: 'left', labelKey: 'IP' },
    { from: 'root', to: 'right', labelKey: 'OOP' },
  ],
};

describe('表格块', () => {
  it('渲染原生表格语义与图注', () => {
    const { container } = render(<TheoryRichBlock data={tableData} />);
    expect(screen.getByRole('table')).toBeTruthy();
    const headers = screen.getAllByRole('columnheader');
    expect(headers).toHaveLength(2);
    expect(headers[0]!.getAttribute('scope')).toBe('col');
    expect(container.querySelector('caption')?.textContent).toBe(
      i18n.t('theory.block.caption'),
    );
    expect(screen.getAllByRole('cell')).toHaveLength(4);
  });

  it('表格容器带 overflow-x-auto（窄屏内滚动，不撑破页面）', () => {
    const { container } = render(<TheoryRichBlock data={tableData} />);
    const scrollWrap = container.querySelector('table')?.parentElement;
    expect(scrollWrap?.className).toContain('overflow-x-auto');
  });

  it('无 captionKey 时不渲染 caption', () => {
    const { container } = render(
      <TheoryRichBlock data={{ ...tableData, captionKey: undefined }} />,
    );
    expect(container.querySelector('caption')).toBeNull();
  });
});

describe('范围矩阵块', () => {
  it('铺满 13×13 单元格并为每格提供读屏文本', () => {
    render(<TheoryRichBlock data={matrixData} />);
    expect(screen.getAllByRole('row')).toHaveLength(13);
    expect(screen.getAllByRole('cell')).toHaveLength(169);
    const raiseLabel = `${i18n.t('theory.block.action.raise')}`;
    const labels = screen.getAllByRole('cell').map((cell) => cell.textContent ?? '');
    expect(labels.some((label) => label.includes('AA') && label.includes('100%') && label.includes(raiseLabel))).toBe(true);
    // 未列出的组合按弃牌处理（权重 0）
    expect(labels.some((label) => label.includes('KK') && label.includes('0%'))).toBe(true);
  });

  it('矩阵用 table-fixed 压缩 13 列（375px 不产生横向溢出）', () => {
    const { container } = render(<TheoryRichBlock data={matrixData} />);
    expect(container.querySelector('table')?.className).toContain('table-fixed');
  });

  it('图例只列出现过的动作，并解析动作 key', () => {
    render(<TheoryRichBlock data={matrixData} />);
    const legend = screen.getByText(i18n.t('theory.block.legend')).parentElement!;
    expect(legend.textContent).toContain(i18n.t('theory.block.action.raise'));
    expect(legend.textContent).toContain(i18n.t('theory.block.action.bet'));
  });
});

describe('决策树块', () => {
  it('从根节点展开嵌套列表并渲染分支条件', () => {
    render(<TheoryRichBlock data={treeData} />);
    expect(screen.getByText('翻前面对加注')).toBeTruthy();
    expect(screen.getByText('有位置')).toBeTruthy();
    expect(screen.getByText('IP')).toBeTruthy();
    expect(screen.getByText('OOP')).toBeTruthy();
    expect(document.querySelectorAll('li')).toHaveLength(3);
  });


  it('数据回环时按深度上限终止，不无限递归', () => {
    render(
      <TheoryRichBlock
        data={{
          ...treeData,
          edges: [...treeData.edges, { from: 'right', to: 'root', labelKey: '回环' }],
        }}
      />,
    );
    const items = document.querySelectorAll('li');
    expect(items.length).toBeGreaterThan(3);
    expect(items.length).toBeLessThan(40);
  });

  it('根节点缺失时渲染空容器而不抛错', () => {
    render(
      <TheoryRichBlock
        data={{ ...treeData, rootId: 'missing' }}
      />,
    );
    expect(screen.getByText(i18n.t('theory.block.decisionTree'))).toBeTruthy();
  });
});

describe('段落渲染器集成', () => {
  it('data 存在时正文之后追加富文本块', () => {
    render(
      <TheorySectionRenderer
        section={{ type: 'text', content: '正文段落', data: tableData }}
        chapterOrder={1}
        sectionIndex={2}
      />,
    );
    expect(screen.getByText('正文段落')).toBeTruthy();
    expect(screen.getByRole('table')).toBeTruthy();
  });

  it('无 data 时不额外包裹容器（DOM 结构保持单一段落）', () => {
    const { container } = render(
      <TheorySectionRenderer section={{ type: 'text', content: '只有正文' }} />,
    );
    expect(container.querySelector('table')).toBeNull();
    expect(container.querySelector('div.space-y-3')).toBeNull();
  });
});
