/**
 * AcademySearchShell 契约（jsdom）：
 * - 受控输入回调 onQueryChange，可访问名缺省回落到 placeholder
 * - 分区按传入顺序渲染，空分区自动隐藏
 * - 结果行回调 onNavigate，resultAriaLabel 可覆盖可访问名
 * - 全部为空且已输入关键词时展示空态；空查询不误报"无结果"
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { AcademySearchSection } from '@/shared/types/academy';
import { AcademySearchShell, type AcademySearchShellProps } from './AcademySearchShell';

const sections: AcademySearchSection[] = [
  {
    id: 'lessons',
    title: '课程',
    items: [
      { id: 'l1', title: '翻前开池', subtitle: '范围与位置', route: '/academy/lesson/l1' },
      { id: 'l2', title: '持续下注', route: '/academy/lesson/l2' },
    ],
  },
  {
    id: 'terms',
    title: '术语',
    items: [{ id: 't1', title: 'MDF', subtitle: '最小防守频率', route: '/theory/glossary' }],
  },
];

function mount(overrides: Partial<AcademySearchShellProps> = {}) {
  const onQueryChange = vi.fn();
  const onNavigate = vi.fn();
  const result = render(
    <AcademySearchShell
      query=""
      onQueryChange={onQueryChange}
      placeholder="搜索课程与术语"
      sections={sections}
      emptyTitle="没有匹配结果"
      emptyHint="换个关键词试试"
      onNavigate={onNavigate}
      {...overrides}
    />
  );
  return { ...result, onQueryChange, onNavigate };
}

afterEach(cleanup);

describe('AcademySearchShell', () => {
  it('输入框为 searchbox，可访问名缺省回落到 placeholder', () => {
    mount();

    const input = screen.getByRole('searchbox');
    expect(input.getAttribute('type')).toBe('search');
    expect(input.getAttribute('aria-label')).toBe('搜索课程与术语');
    expect(input.getAttribute('placeholder')).toBe('搜索课程与术语');
  });

  it('输入变化回调 onQueryChange', () => {
    const { onQueryChange } = mount();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '开池' } });
    expect(onQueryChange).toHaveBeenCalledWith('开池');
  });

  it('按传入顺序渲染分区，并显示分区条数', () => {
    mount();

    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(['课程2', '术语1']);
    expect(screen.getByRole('button', { name: '翻前开池' })).toBeTruthy();
    expect(screen.getByText('范围与位置')).toBeTruthy();
  });

  it('空分区自动隐藏', () => {
    mount({
      sections: [...sections, { id: 'books', title: '书目', items: [] }],
    });

    expect(screen.queryByText('书目')).toBeNull();
  });

  it('点击结果回调该结果的路由', () => {
    const { onNavigate } = mount();

    fireEvent.click(screen.getByRole('button', { name: 'MDF' }));
    expect(onNavigate).toHaveBeenCalledWith('/theory/glossary');
  });

  it('resultAriaLabel 覆盖结果行可访问名', () => {
    mount({ resultAriaLabel: (item) => `打开 ${item.title}` });

    expect(screen.getByRole('button', { name: '打开 翻前开池' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '打开 MDF' })).toBeTruthy();
  });

  it('无副标题的条目只渲染标题', () => {
    mount();

    const row = screen.getByRole('button', { name: '持续下注' });
    expect(row.textContent).toBe('持续下注');
  });

  it('全部为空且已输入关键词时显示空态与提示', () => {
    mount({ query: 'zzz', sections: [] });

    const status = screen.getByRole('status');
    expect(status.textContent).toContain('没有匹配结果');
    expect(status.textContent).toContain('换个关键词试试');
  });

  it('空查询 + 无结果时不显示空态（避免误报无结果）', () => {
    mount({ query: '', sections: [] });

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByText('没有匹配结果')).toBeNull();
  });

  it('section 可访问名可用 ariaLabel 覆盖', () => {
    mount({ ariaLabel: '学院检索' });

    expect(screen.getByRole('region', { name: '学院检索' })).toBeTruthy();
  });
});
