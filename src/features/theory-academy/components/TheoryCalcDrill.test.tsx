/**
 * TheoryCalcDrill 组件冒烟（jsdom）。
 * 覆盖：有/无演练槽位的渲染分支、判分三态、零持久、换题保持公式族、英文无残留中文、a11y 关联。
 * 未覆盖（无法在 jsdom 断言）：真实浏览器下 <768px 布局、数字输入键盘体验、屏幕阅读器朗读顺序。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import { buildCalcDrill, CHAPTER_DRILL_SLOTS } from '../utils/theoryCalcDrills';
import { TheoryCalcDrill } from './TheoryCalcDrill';

MotionGlobalConfig.skipAnimations = true;

const HAN = /[㐀-鿿]/;
const DRILLED_CHAPTER = 't5-mdf-alpha';
const PLAIN_CHAPTER = 't1-combinatorics';

let container: HTMLDivElement;
let root: Root;

async function mount(chapterId: string) {
  await act(async () => {
    root.render(
      <MemoryRouter>
        <TheoryCalcDrill chapterId={chapterId} />
      </MemoryRouter>
    );
  });
}

function input(index = 0): HTMLInputElement {
  return container.querySelectorAll('input')[index] as HTMLInputElement;
}

function buttonByText(text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((b) => (b.textContent ?? '').includes(text));
}

/** 每个槽位（li）自带一组按钮，顺序固定为「判定 / 换一题」，跨槽位作答须按 li 取 */
function submitButton(slotIndex: number): HTMLButtonElement | undefined {
  return container.querySelectorAll('li')[slotIndex]?.querySelector('button') ?? undefined;
}

async function type(value: string, index = 0) {
  const el = input(index);
  // React 19 会缓存上一次的 value，直接赋值再派发 input 会被去重；必须走原生 setter
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  await act(async () => {
    setter?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function click(el: Element | undefined) {
  await act(async () => {
    (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
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

describe('TheoryCalcDrill', () => {
  it('登记了演练槽位的章节渲染题面、提示与输入框', async () => {
    await mount(DRILLED_CHAPTER);
    const slotCount = (CHAPTER_DRILL_SLOTS[DRILLED_CHAPTER] ?? []).length;

    expect(container.querySelectorAll('li')).toHaveLength(slotCount);
    expect(container.textContent).toContain(i18n.t('theory.drill.title'));
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(slotCount);
    // 题面必须已插值，不得把 i18n key 或 {{占位符}} 泄漏到界面
    expect(container.textContent).not.toContain('theory.drill.');
    expect(container.textContent).not.toContain('{{');
  });

  it('未登记槽位的章节整体缺席', async () => {
    await mount(PLAIN_CHAPTER);
    expect(container.querySelector('input')).toBeNull();
    expect(container.textContent).toBe('');
  });

  it('判分三态：命中容差、超容差、非数字；且全程不出现 EV 与五级字样', async () => {
    await mount(DRILLED_CHAPTER);
    const drill = buildCalcDrill(DRILLED_CHAPTER, 0, 0);
    expect(drill).not.toBeNull();

    await type(String(drill!.expected.toFixed(1)));
    await click(buttonByText(i18n.t('theory.drill.submit')));
    expect(container.textContent).toContain(i18n.t('theory.drill.correct'));

    await type(String(drill!.expected + 9));
    await click(buttonByText(i18n.t('theory.drill.submit')));
    expect(container.textContent).toContain(i18n.t('theory.drill.incorrect'));

    await type('abc');
    await click(buttonByText(i18n.t('theory.drill.submit')));
    expect(container.textContent).toContain(i18n.t('theory.drill.invalidInput'));

    // EV 标定诚实性：无标定依据不得渲染五级评级与 EV 数值
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/EV\s*[0-9-]+/);
    expect(text).not.toContain('Blunder');
    expect(text).not.toContain('重大失误');
  });

  it('零持久：混合作答不动任何进度、能力分与复习队列', async () => {
    const progressBefore = JSON.stringify(useTheoryStore.getState().progress);
    const before = useProgressStore.getState();
    const snapshot = JSON.stringify({
      records: before.records,
      eloByVariant: before.eloByVariant,
      emotion: before.emotion,
      reviewItems: before.reviewItems,
      streak: before.streak,
    });

    await mount(DRILLED_CHAPTER);
    const drill = buildCalcDrill(DRILLED_CHAPTER, 0, 0)!;
    await type(drill.expected.toFixed(1));
    await click(buttonByText(i18n.t('theory.drill.submit')));
    await type('nope');
    await click(buttonByText(i18n.t('theory.drill.submit')));
    await click(buttonByText(i18n.t('theory.drill.nextProblem')));

    expect(JSON.stringify(useTheoryStore.getState().progress)).toBe(progressBefore);
    const after = useProgressStore.getState();
    expect(
      JSON.stringify({
        records: after.records,
        eloByVariant: after.eloByVariant,
        emotion: after.emotion,
        reviewItems: after.reviewItems,
        streak: after.streak,
      })
    ).toBe(snapshot);
  });

  it('换一题改变参数题面，但仍属同一公式族', async () => {
    await mount(DRILLED_CHAPTER);
    const before = container.querySelectorAll('li')[0]?.textContent ?? '';
    await click(buttonByText(i18n.t('theory.drill.nextProblem')));
    const after = container.querySelectorAll('li')[0]?.textContent ?? '';

    expect(before).not.toBe('');
    const numbersOf = (s: string) => (s.match(/\d+/g) ?? []).join(',');
    expect(numbersOf(before)).not.toBe(numbersOf(after));
    // 仍是 α 题：提示公式未变
    expect(after).toContain(i18n.t('theory.drill.hint.alpha'));
  });

  it('英文界面下题面与反馈均为英文', async () => {
    await preloadI18n(['theory'], 'en');
    await i18n.changeLanguage('en');
    await mount(DRILLED_CHAPTER);

    const text = container.textContent ?? '';
    expect(text).not.toContain('{{');
    expect(text).not.toContain('theory.drill.');
    expect(HAN.test(text)).toBe(false);
    expect(text).toContain('Do the Math');
  });

  it('输入框有可访问名并与提示、反馈区域关联', async () => {
    await mount(DRILLED_CHAPTER);
    const el = input(0);
    const label = container.querySelector(`label[for="${el.id}"]`);

    expect(label, '输入框必须有配对的 label').not.toBeNull();
    expect(label!.textContent).toBe(i18n.t('theory.drill.answerLabel'));
    expect(el.getAttribute('aria-describedby')).toBeTruthy();
    const describedBy = (el.getAttribute('aria-describedby') ?? '').split(' ');
    for (const id of describedBy) {
      expect(document.getElementById(id), `aria-describedby 指向 ${id} 必须存在`).not.toBeNull();
    }
  });

  it('新单位渲染：AF 的 ratio 标签与判分、组合数的 count 精确容差', async () => {
    await mount('t7-stats');
    const statsText = container.textContent ?? '';
    expect(statsText).toContain(i18n.t('theory.drill.unit.ratio'));
    expect(statsText).not.toContain('theory.drill.');
    const afDrill = buildCalcDrill('t7-stats', 1, 0);
    expect(afDrill?.unit).toBe('ratio');
    await type(String(afDrill!.expected), 1);
    await click(submitButton(1));
    expect(container.textContent).toContain(i18n.t('theory.drill.correct'));
    expect(container.textContent).not.toMatch(/EV\s*[0-9-]+/);

    await mount('t4-combinatorics');
    const comboDrill = buildCalcDrill('t4-combinatorics', 0, 0);
    expect(comboDrill?.unit).toBe('count');
    const comboText = container.textContent ?? '';
    expect(comboText).toContain(i18n.t('theory.drill.unit.count'));
    expect(comboText).not.toContain('theory.drill.');
    // 组合数是整数计数，容差为 0：精确值判正确，±1 判错误
    await type(String(comboDrill!.expected));
    await click(submitButton(0));
    expect(container.textContent).toContain(i18n.t('theory.drill.correct'));
    await type(String(comboDrill!.expected + 1));
    await click(submitButton(0));
    expect(container.textContent).toContain(i18n.t('theory.drill.incorrect'));
  });

  it('英文界面下单位标签为英文且无汉字', async () => {
    await preloadI18n(['theory'], 'en');
    await i18n.changeLanguage('en');
    await mount('t4-combinatorics');
    const text = container.textContent ?? '';
    expect(text).toContain('combos');
    expect(HAN.test(text)).toBe(false);
    expect(text).not.toContain('theory.drill.');
  });

  it('t9-cash-vs-mtt 刻意不挂演练槽位，演练区整体缺席', async () => {
    expect(CHAPTER_DRILL_SLOTS['t9-cash-vs-mtt']).toBeUndefined();
    expect(buildCalcDrill('t9-cash-vs-mtt', 0)).toBeNull();
    await mount('t9-cash-vs-mtt');
    expect(container.querySelector('input')).toBeNull();
    expect(container.textContent).toBe('');
  });
});
