import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import type { TheoryGlossaryTerm } from '../types';
import { TheoryGlossary, resolveGlossaryCategory } from './TheoryGlossary';

/**
 * 术语表面板契约（jsdom）。
 * 覆盖：术语卡渲染（名称 / 别名 / 释义 / 相关章节链接）、搜索过滤（名称或释义命中）、
 * 类别页签过滤（按相关章节所属 Level 推导类别）、空态文案、类别推导纯函数。
 *
 * 数据层目前没有 category 字段，类别由 relatedChapterIds 推导——本测试即该推导的回归锁；
 * 若内容侧后续在 TheoryGlossaryTerm 上补 category，替换推导函数并同步本文件即可。
 */

afterEach(() => cleanup());

const terms: TheoryGlossaryTerm[] = [
  {
    id: 'term-math',
    termKey: 'theory.mastery.title',
    definitionKey: 'theory.mastery.subtitle',
    aliases: ['theory.bookmarks.title'],
    relatedChapterIds: ['t1-combinatorics'],
  },
  {
    id: 'term-mind',
    termKey: 'theory.search.title',
    definitionKey: 'theory.bibliography.subtitle',
    relatedChapterIds: ['t8-tilt'],
  },
  {
    id: 'term-orphan',
    termKey: 'theory.notes.title',
    definitionKey: 'theory.notes.empty',
  },
];

function mount(list: TheoryGlossaryTerm[] = terms) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryGlossary terms={list} />
    </MemoryRouter>,
  );
}

describe('类别推导', () => {
  it('按首个相关章节所属 Level 归类', () => {
    expect(resolveGlossaryCategory(terms[0]!)).toBe('math');
    expect(resolveGlossaryCategory(terms[1]!)).toBe('psychology');
    expect(resolveGlossaryCategory(terms[2]!)).toBe('other');
    // T7（读牌）与 T9（综合）不在四个具名类别内
    expect(resolveGlossaryCategory({ ...terms[0]!, relatedChapterIds: ['t7-stats'] })).toBe('other');
    expect(resolveGlossaryCategory({ ...terms[0]!, relatedChapterIds: ['t9-mop'] })).toBe('other');
    expect(resolveGlossaryCategory({ ...terms[0]!, relatedChapterIds: ['t5-mdf-alpha'] })).toBe('postflop');
    expect(resolveGlossaryCategory({ ...terms[0]!, relatedChapterIds: ['t3-position-value'] })).toBe('preflop');
  });
});

describe('TheoryGlossary', () => {
  it('渲染术语、别名与相关章节链接', () => {
    mount();
    expect(screen.getByText(i18n.t('theory.mastery.title'))).toBeTruthy();
    expect(screen.getByText(i18n.t('theory.mastery.subtitle'))).toBeTruthy();
    expect(screen.getByText(i18n.t('theory.bookmarks.title'))).toBeTruthy();

    const link = screen.getByRole('link', { name: /组合计数/ });
    expect(link.getAttribute('href')).toBe('/theory/chapter/t1-combinatorics');
  });

  it('搜索框按名称或释义过滤', () => {
    mount();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: i18n.t('theory.bibliography.subtitle') } });
    expect(screen.getByText(i18n.t('theory.search.title'))).toBeTruthy();
    expect(screen.queryByText(i18n.t('theory.mastery.title'))).toBeNull();
  });

  it('类别页签过滤只看该类别术语', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: i18n.t('theory.glossary.categories.math') }));
    expect(screen.getByText(i18n.t('theory.mastery.title'))).toBeTruthy();
    expect(screen.queryByText(i18n.t('theory.search.title'))).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: i18n.t('theory.glossary.categories.psychology') }));
    expect(screen.getByText(i18n.t('theory.search.title'))).toBeTruthy();
    expect(screen.queryByText(i18n.t('theory.mastery.title'))).toBeNull();
  });

  it('无匹配时显示空态', () => {
    mount();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-no-hit' } });
    expect(screen.getByText(i18n.t('theory.glossary.empty'))).toBeTruthy();
  });

  it('数据为空时展示空态而非崩溃', () => {
    mount([]);
    expect(screen.getByText(i18n.t('theory.glossary.empty'))).toBeTruthy();
  });
});
