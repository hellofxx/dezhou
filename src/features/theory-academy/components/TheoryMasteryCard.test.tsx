/**
 * 掌握度卡冒烟（jsdom）。
 * 覆盖：四项计数渲染、有分时「复习最弱一章」指向最低分章、无分时空态与「继续学习」首章入口、
 * 增补章不进入核心掌握度统计、共享卡口径（合计行 + 最弱项 CTA 为按钮且回调路由）。
 * 未覆盖（jsdom 无法判定）：真实浏览器排版、<768px 布局。
 *
 * 本卡只读 props（chapters / quizScores），不触 store、不调门禁，因此测试直接传参即可。
 * 最弱项 CTA 由共享 `AcademyMasteryCard` 渲染为 `<button>`（共享壳不持有路由），
 * 故跳转断言走 useLocation 探针而不是 href。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { TheoryChapterSummary } from '../types';
import { TheoryMasteryCard } from './TheoryMasteryCard';

MotionGlobalConfig.skipAnimations = true;

let container: HTMLDivElement;
let root: Root;

function chapter(id: string, order: number, supplemental = false): TheoryChapterSummary {
  return {
    id,
    level: 1,
    order,
    title: id,
    subtitle: '',
    duration: '10 min',
    variant: 'standard',
    ...(supplemental ? { supplemental: true } : {}),
  };
}

const chapters = [chapter('c1', 1), chapter('c2', 2), chapter('c3', 3), chapter('c4', 4), chapter('c5', 5)];

/** 跳转探针：读 location.pathname 即为 CTA 落地证据 */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

function mount(quizScores: Record<string, number>, list: TheoryChapterSummary[] = chapters) {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/theory']}>
        <LocationProbe />
        <TheoryMasteryCard chapters={list} quizScores={quizScores} />
      </MemoryRouter>,
    );
  });
}

/** 读取某一档的行计数器（行内最后一个数值节点） */
function countOf(state: string): string {
  const row = container.querySelector(`[data-mastery-state="${state}"]`);
  expect(row, `缺少 ${state} 行`).not.toBeNull();
  return row!.querySelector('.font-numeric')?.textContent?.trim() ?? '';
}

/** 最弱项 CTA（共享卡的 weakest 按钮，可访问名形如「复习最弱一章 · 章节名」） */
function cta(): HTMLButtonElement | null {
  const prefixes = [i18n.t('theory.mastery.reviewWeakest'), i18n.t('theory.mastery.continue')];
  const buttons = Array.from(container.querySelectorAll('button'));
  return (
    (buttons.find((button) =>
      prefixes.some((prefix) => (button.getAttribute('aria-label') ?? '').startsWith(prefix)),
    ) as HTMLButtonElement | undefined) ?? null
  );
}

function pathOf(): string {
  return container.querySelector('[data-testid="path"]')?.textContent ?? '';
}

function clickCta(): string {
  const button = cta();
  expect(button, '缺少最弱项 CTA').not.toBeNull();
  act(() => {
    button!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  return pathOf();
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('TheoryMasteryCard', () => {
  it('按 80 / 60 阈值渲染四项计数', () => {
    // 2 已掌握（95 / 80）、1 通过（60）、1 待复习（59）、1 未测
    mount({ c1: 95, c2: 80, c3: 60, c4: 59 });

    expect(countOf('mastered')).toBe('2');
    expect(countOf('passing')).toBe('1');
    expect(countOf('needsReview')).toBe('1');
    expect(countOf('untested')).toBe('1');
    // 标签取真实译文，不是 key 字面量
    const masteredRow = container.querySelector('[data-mastery-state="mastered"]');
    expect(masteredRow!.textContent).toContain(i18n.t('theory.mastery.mastered'));
    expect(masteredRow!.textContent).not.toContain('theory.mastery');
  });

  it('有已测章节时 CTA 为「复习最弱一章」并指向最低分章', () => {
    mount({ c1: 90, c2: 42, c3: 71, c4: 66 });

    const button = cta();
    expect(button, '缺少复习 CTA').not.toBeNull();
    expect(button!.textContent).toContain(i18n.t('theory.mastery.reviewWeakest'));
    // 可访问名同时带上章节名（共享卡的 weakest.label）
    expect(button!.getAttribute('aria-label')).toContain(i18n.t('theory.mastery.reviewWeakest'));
    expect(clickCta()).toBe('/theory/chapter/c2');
    // 有分时不显示空态提示
    expect(container.textContent).not.toContain(i18n.t('theory.mastery.empty'));
  });

  it('无任何分数时显示空态，CTA 改为「继续学习」并指向首个未测章', () => {
    mount({});

    expect(countOf('untested')).toBe('5');
    expect(container.textContent).toContain(i18n.t('theory.mastery.empty'));

    const button = cta();
    expect(button, '缺少继续学习 CTA').not.toBeNull();
    expect(button!.textContent).toContain(i18n.t('theory.mastery.continue'));
    expect(clickCta()).toBe('/theory/chapter/c1');
  });

  it('增补章不计入核心掌握度，也不会成为「最弱一章」的目标', () => {
    // s1 是 6-max 补强章且分数最低；若误入统计，待复习计数与被指向的章节都会变
    mount(
      { c1: 90, c2: 88, s1: 10 },
      [...chapters, chapter('s1', 6, true)],
    );

    expect(countOf('mastered')).toBe('2');
    expect(countOf('needsReview')).toBe('0');
    expect(countOf('untested')).toBe('3');
    expect(clickCta()).toBe('/theory/chapter/c2');
  });

  it('共享卡口径：合计行恒在，且最弱项 CTA 为按钮（不再是 href 链接）', () => {
    mount({ c1: 90, c2: 42, c3: 71, c4: 66 });

    // 共享 AcademyMasteryCard 独立渲染 total 行（合计 = 参与统计的核心章数）
    const totalRow = Array.from(container.querySelectorAll('.panel > div')).find((row) =>
      (row.textContent ?? '').includes(i18n.t('theory.mastery.total')),
    );
    expect(totalRow, '缺少合计行').toBeTruthy();
    expect(totalRow!.querySelector('.font-numeric')?.textContent).toBe('5');

    // weakest CTA 走回调路由：无 href，点击后 location 变化
    const button = cta();
    expect(button!.getAttribute('href')).toBeNull();
    expect(clickCta()).toBe('/theory/chapter/c2');
    // 章节页链接只出现在检查点 footer（本用例无 levels，故不渲染）
    expect(container.querySelector('a[href^="/theory/chapter/"]')).toBeNull();
  });
});
