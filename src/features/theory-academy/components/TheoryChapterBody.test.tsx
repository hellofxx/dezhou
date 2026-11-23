/**
 * TheoryChapterBody 装配回归（Fix 2 / Fix 4 / Fix 5 的 theory 落点）。
 * 覆盖：① 渐进披露（初始仅首组、继续下一节递增、折叠头逐组展开、展开全部逃生口）；
 * ② 自动要点卡（无显式 takeaway 出卡、有显式不双卡、en 走 key 无汉字）；
 * ③ 主 CTA 金属件（btn-brass + min-h-11，srs 测试同口径）与已完成章免重考导航。
 * 披露为本地 state：不触碰 theory store（零 persist 契约）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { loadAllTheoryContent, preloadI18n } from '@/i18n/preload';
import { useTheoryStore } from '../store';
import { findChapterById } from '../utils/theoryProgress';
import { TheoryChapterBody } from './TheoryChapterBody';
import type { TheoryChapter } from '../types';

MotionGlobalConfig.skipAnimations = true;

const HAN = /[㐀-鿿]/;
/** 标准章：4 个 heading、无显式 takeaway、无演练槽（h2 计数不受 CalcDrill 干扰） */
const AUTO_CHAPTER = 't1-combinatorics';
/** 单挑变体章：含显式 takeaway 块（自动卡须短路不双卡） */
const EXPLICIT_CHAPTER = 't4hu-preflop-structure';

let container: HTMLDivElement;
let root: Root;

function chapter(id: string): TheoryChapter {
  const found = findChapterById(id);
  expect(found, `章节 ${id} 存在`).toBeDefined();
  return found!;
}

async function mount(
  id: string,
  overrides: {
    chapterCompleted?: boolean;
    onStartQuiz?: () => void;
    onBackToChapters?: () => void;
    backLabel?: string;
  } = {},
) {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <TheoryChapterBody
          chapter={chapter(id)}
          attempt={undefined}
          chapterCompleted={overrides.chapterCompleted ?? false}
          nextChapter={undefined}
          nextChapterUnlocked={false}
          onStartQuiz={overrides.onStartQuiz ?? (() => {})}
          onBackToChapters={overrides.onBackToChapters ?? (() => {})}
          {...(overrides.backLabel === undefined ? {} : { backLabel: overrides.backLabel })}
        />
      </MemoryRouter>,
    );
  });
}

function buttonByText(text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(text),
  );
}

async function click(el: Element | undefined) {
  expect(el).toBeDefined();
  await act(async () => {
    (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** 折叠头：aria-expanded=false 的分组按钮 */
function collapsedHeads(): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button[aria-expanded="false"]'));
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
  void i18n.changeLanguage('zh');
});

describe('TheoryChapterBody 渐进披露', () => {
  it('初始仅首组可见：未来组只留折叠头，正文不渲染', async () => {
    await mount(AUTO_CHAPTER);
    const headings = chapter(AUTO_CHAPTER).content.filter((s) => s.type === 'heading');
    expect(headings.length).toBeGreaterThan(2);
    // 首组 heading 已渲染，其余组只有折叠头（h2 计数 = 1）
    expect(container.querySelectorAll('h2')).toHaveLength(1);
    expect(collapsedHeads()).toHaveLength(headings.length - 1);
    // 第二组正文（text 段，不会出现在要点卡里）缺席
    expect(container.textContent).not.toContain('总组合数为 C(52,2)');
    // 披露不阻塞小测：CTA 恒在底部
    expect(buttonByText(i18n.t('theory.chapterView.startQuiz'))).toBeDefined();
  });

  it('「继续下一节」递增披露，「展开全部」一次释放所有组', async () => {
    await mount(AUTO_CHAPTER);
    const headings = chapter(AUTO_CHAPTER).content.filter((s) => s.type === 'heading');

    await click(buttonByText(i18n.t('theory.chapterView.continueNext')));
    expect(container.querySelectorAll('h2')).toHaveLength(2);
    expect(container.textContent).toContain('总组合数为 C(52,2)');

    await click(buttonByText(i18n.t('theory.chapterView.expandAll')));
    expect(container.querySelectorAll('h2')).toHaveLength(headings.length);
    expect(collapsedHeads()).toHaveLength(0);
    expect(buttonByText(i18n.t('theory.chapterView.expandAll'))).toBeUndefined();
  });

  it('折叠头可单独展开对应组（不推进 revealedCount）', async () => {
    await mount(AUTO_CHAPTER);
    const heads = collapsedHeads();
    expect(heads.length).toBeGreaterThan(1);
    // 展开最后一个折叠头：末组正文出现，但第二组仍折叠
    await click(heads[heads.length - 1]);
    expect(container.querySelectorAll('h2')).toHaveLength(2);
    expect(container.textContent).not.toContain('总组合数为 C(52,2)');
    expect(buttonByText(i18n.t('theory.chapterView.continueNext'))).toBeDefined();
  });

  it('披露全程不写 theory store（零 persist）', async () => {
    const before = JSON.stringify(useTheoryStore.getState().progress);
    await mount(AUTO_CHAPTER);
    await click(collapsedHeads()[0]);
    await click(buttonByText(i18n.t('theory.chapterView.expandAll')));
    expect(JSON.stringify(useTheoryStore.getState().progress)).toBe(before);
  });
});

describe('TheoryChapterBody 章末要点卡', () => {
  it('无显式 takeaway 的章节自动装配要点卡（objectives 在前）', async () => {
    const data = chapter(AUTO_CHAPTER);
    expect(data.content.some((s) => s.type === 'takeaway')).toBe(false);
    await mount(AUTO_CHAPTER);
    const cards = container.querySelectorAll('.lesson-takeaway');
    expect(cards).toHaveLength(1);
    const items = Array.from(cards[0]!.querySelectorAll('li')).map((li) => li.textContent ?? '');
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items[0]).toContain(data.objectives![0]);
  });

  it('有显式 takeaway 的变体章节不双卡（展开全部后仍只有一张）', async () => {
    const data = chapter(EXPLICIT_CHAPTER);
    expect(data.content.some((s) => s.type === 'takeaway')).toBe(true);
    await mount(EXPLICIT_CHAPTER);
    // 该章可能只有单组（无披露控件）：有「展开全部」才点，确保显式卡所在组可见
    const expand = buttonByText(i18n.t('theory.chapterView.expandAll'));
    if (expand) await click(expand);
    expect(container.querySelectorAll('.lesson-takeaway')).toHaveLength(1);
  });

  it('en 下自动要点卡全译文：无汉字、不泄漏 content key', async () => {
    // 与路由 '/theory/chapter/:chapterId' 的 i18n 分组一致：要点卡标题走 academy 命名空间
    await Promise.all([preloadI18n(['theory', 'academy'], 'en'), loadAllTheoryContent('en')]);
    await i18n.changeLanguage('en');
    await mount(AUTO_CHAPTER);
    const card = container.querySelector('.lesson-takeaway');
    expect(card).not.toBeNull();
    const text = card!.textContent ?? '';
    expect(HAN.test(text), `en 要点卡含汉字: ${text.slice(0, 80)}`).toBe(false);
    expect(text).not.toContain('theory.chapterObjectives.');
    expect(text).not.toContain('theory.content.');
  });
});

describe('TheoryChapterBody CTA 与导航', () => {
  it('主 CTA 走 Button default（btn-brass + min-h-11），点击进入小测', async () => {
    let started = 0;
    await mount(AUTO_CHAPTER, { onStartQuiz: () => { started += 1; } });
    const cta = buttonByText(i18n.t('theory.chapterView.startQuiz'));
    expect(cta?.className).toContain('btn-brass');
    expect(cta?.className).toContain('min-h-11');
    expect(cta?.className).not.toContain('bg-[var(--brass-fill)]');
    await click(cta);
    expect(started).toBe(1);
  });

  it('已完成章节：免重考导航（返回目录 + 重考小测），重考同样进入小测', async () => {
    let started = 0;
    let backed = 0;
    await mount(AUTO_CHAPTER, {
      chapterCompleted: true,
      onStartQuiz: () => { started += 1; },
      onBackToChapters: () => { backed += 1; },
    });
    expect(buttonByText(i18n.t('theory.chapterView.startQuiz'))).toBeUndefined();
    await click(buttonByText(i18n.t('theory.chapterView.backToChapters')));
    expect(backed).toBe(1);
    await click(buttonByText(i18n.t('theory.chapterView.retryQuiz')));
    expect(started).toBe(1);
  });

  it('返回按钮文案可由 backLabel 覆盖（来源感知），缺省仍为章节目录文案', async () => {
    await mount(AUTO_CHAPTER, { chapterCompleted: true, backLabel: '返回课程目录' });
    expect(buttonByText('返回课程目录')).toBeDefined();
    expect(buttonByText(i18n.t('theory.chapterView.backToChapters'))).toBeUndefined();

    await act(async () => root.unmount());
    root = createRoot(container);
    await mount(AUTO_CHAPTER, { chapterCompleted: true });
    expect(buttonByText(i18n.t('theory.chapterView.backToChapters'))).toBeDefined();
  });
});