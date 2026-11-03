import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { loadAcademyCoursesForLesson } from '@/i18n/academyCourse';
import { DiagramBlock, HandExampleBlock } from './DiagramBlock';
import type { LessonSection } from '../../types';

/**
 * 示意图块 / 手牌示例块契约（LessonContent → ContentBlock 的分发目标）：
 * - data.headers + data.rows 合法 → 渲染简化表格，多余单元格按表头列数截断
 * - headers / rows 缺失、空数组、元素类型不符 → 回退为 content 文本（不渲染半张表）
 * - caption 在表格与文本两个分支都渲染
 * - contentKey 命中取译文，缺省回退数据层原文
 * - HandExampleBlock：content 优先 → data.scenario → 占位说明
 */

beforeAll(async () => {
  await loadAcademyCoursesForLesson('l1-basics');
});

afterEach(() => cleanup());

function section(type: LessonSection['type'], content: string, data?: Record<string, unknown>): LessonSection {
  return { type, content, data };
}

function renderDiagram(content: string, data?: Record<string, unknown>, contentKey?: string) {
  return render(<DiagramBlock section={section('diagram', content, data)} contentKey={contentKey} />);
}

function renderHandExample(content: string, data?: Record<string, unknown>) {
  return render(<HandExampleBlock section={section('hand-example', content, data)} />);
}

function headerTexts(container: HTMLElement): Array<string | null> {
  return [...container.querySelectorAll('th')].map((th) => th.textContent);
}

describe('DiagramBlock：表格守卫', () => {
  it('合法 headers + rows 渲染表格，并按表头列数截断多余单元格', () => {
    const { container } = renderDiagram('回退文本', {
      headers: ['位置', '动作'],
      rows: [
        ['BTN', '加注', '超出列数的多余单元'],
        ['CO', '跟注'],
      ],
    });

    expect(container.querySelector('table')).not.toBeNull();
    expect(headerTexts(container)).toEqual(['位置', '动作']);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(container.querySelectorAll('tbody tr')[0]!.querySelectorAll('td')).toHaveLength(2);
    // 超列表格数据不渲染；表格分支不渲染 content 回退文本
    expect(container.textContent).not.toContain('超出列数的多余单元');
    expect(screen.queryByText('回退文本')).toBeNull();
  });

  it('headers 或 rows 缺失 / 为空 / 元素类型不符时回退为 content 文本', () => {
    const fallbacks: Array<Record<string, unknown> | undefined> = [
      undefined,
      {},
      { rows: [['BTN', '加注']] }, // 缺 headers
      { headers: ['位置'] }, // 缺 rows
      { headers: [], rows: [['BTN']] }, // headers 为空
      { headers: ['位置'], rows: [] }, // rows 为空
      { headers: [1, 2], rows: [['BTN']] }, // headers 元素非字符串（全部被过滤）
      { headers: ['位置'], rows: ['not-a-row'] }, // rows 元素非数组（全部被过滤）
    ];

    for (const data of fallbacks) {
      const { container, unmount } = renderDiagram('回退文本', data);
      expect(container.querySelector('table')).toBeNull();
      expect(screen.getByText('回退文本')).toBeTruthy();
      unmount();
    }
  });

  it('非数组行被过滤后仅保留合法行', () => {
    const { container } = renderDiagram('回退文本', {
      headers: ['位置', '动作'],
      rows: [['BTN', '加注'], 'oops', ['CO', '跟注']],
    });

    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('caption 在表格分支与文本分支都渲染', () => {
    const withTable = renderDiagram('正文', {
      headers: ['位置'],
      rows: [['BTN']],
      caption: '表格说明',
    });
    expect(screen.getByText('表格说明')).toBeTruthy();
    withTable.unmount();

    renderDiagram('正文', { caption: '文本说明' });
    expect(screen.getByText('文本说明')).toBeTruthy();
    expect(screen.getByText('正文')).toBeTruthy();
  });
});

describe('DiagramBlock：contentKey 译文覆盖', () => {
  it('contentKey 命中时取译文，不回退数据层原文', () => {
    const contentKey = 'academy.lessonContent.l1-basics.0';
    const translated = i18n.t(contentKey);
    // 前提自检：key 必须真实存在，否则“命中取译文”退化为回退断言
    expect(translated).not.toBe(contentKey);
    expect(translated.length).toBeGreaterThan(0);

    renderDiagram('数据层原文占位', undefined, contentKey);
    expect(screen.getByText(translated)).toBeTruthy();
    expect(screen.queryByText('数据层原文占位')).toBeNull();
  });

  it('contentKey 未命中时回退数据层原文', () => {
    renderDiagram('数据层原文占位', undefined, 'academy.lessonContent.not-a-lesson.99');
    expect(screen.getByText('数据层原文占位')).toBeTruthy();
  });
});

describe('HandExampleBlock：内容来源优先级', () => {
  it('content 非空时优先渲染 content，忽略 data.scenario', () => {
    const { container } = renderHandExample('翻牌前 BTN 手持 AKs 加注 2.5BB', {
      scenario: '场景说明',
    });

    expect(container.textContent).toContain('翻牌前 BTN 手持 AKs 加注 2.5BB');
    expect(container.textContent).not.toContain('场景说明');
  });

  it('content 为空时回退 data.scenario', () => {
    const { container } = renderHandExample('', { scenario: '场景：CO 加注后 BTN 冷跟' });
    expect(container.textContent).toContain('场景：CO 加注后 BTN 冷跟');
  });

  it('content 与 scenario 均缺失或空白时渲染占位说明', () => {
    const expected = i18n.t('academy.content.handExampleFallback');
    expect(expected).not.toBe('academy.content.handExampleFallback');

    for (const data of [undefined, { scenario: '   ' }]) {
      const { container, unmount } = renderHandExample('', data);
      expect(container.textContent).toContain(expected);
      unmount();
    }
  });
});
