/**
 * 掌握度卡冒烟（jsdom）。
 * 覆盖：四项计数渲染、有分时「复习最弱一章」指向最低分章、无分时空态与「继续学习」首章入口、
 * 增补章不进入核心掌握度统计。
 * 未覆盖（jsdom 无法判定）：真实浏览器排版、<768px 布局、CTA 点击后的路由落地。
 *
 * 本卡只读 props（chapters / quizScores），不触 store、不调门禁，因此测试直接传参即可。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
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

function mount(quizScores: Record<string, number>, list: TheoryChapterSummary[] = chapters) {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/theory']}>
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

function cta(): HTMLAnchorElement | null {
  return container.querySelector('a[href^="/theory/chapter/"]');
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

    const link = cta();
    expect(link, '缺少复习 CTA').not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/theory/chapter/c2');
    expect(link!.textContent).toContain(i18n.t('theory.mastery.reviewWeakest'));
    // 有分时不显示空态提示
    expect(container.textContent).not.toContain(i18n.t('theory.mastery.empty'));
  });

  it('无任何分数时显示空态，CTA 改为「继续学习」并指向首个未测章', () => {
    mount({});

    expect(countOf('untested')).toBe('5');
    expect(container.textContent).toContain(i18n.t('theory.mastery.empty'));

    const link = cta();
    expect(link, '缺少继续学习 CTA').not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/theory/chapter/c1');
    expect(link!.textContent).toContain(i18n.t('theory.mastery.continue'));
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
    expect(cta()!.getAttribute('href')).toBe('/theory/chapter/c2');
  });
});
