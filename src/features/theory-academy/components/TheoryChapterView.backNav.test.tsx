/**
 * 理论章节页来源感知返回回归（B1-1）。
 *
 * 覆盖：① 无 state（本波 origin 未附）兜底课程目录 /lesson + nav.backToCourseHub；
 * ② theory-map → /theory + nav.backToTheoryMap；③ academy-map → /academy；
 * ④ hub + stageIndex → /lesson#hub-stage-N；⑤ 面包屑与阅读页返回同源解析。
 * 门禁 `<Navigate to="/theory">`（非法 / 未解锁弹回地图）不属用户返回，本文件不覆盖。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { academyMapFrom, hubFrom, theoryMapFrom } from '@/shared/utils/courseBack';
import { useTheoryStore } from '../store';
import TheoryChapterView from './TheoryChapterView';

MotionGlobalConfig.skipAnimations = true;

const CHAPTER_ID = 't1-combinatorics';

let container: HTMLDivElement;
let root: Root;

function Probe() {
  const location = useLocation();
  return <div data-testid="probe">{`${location.pathname}${location.hash}`}</div>;
}

function probeText(): string {
  return container.querySelector('[data-testid="probe"]')?.textContent ?? '';
}

async function mount(state?: unknown) {
  const entry =
    state === undefined
      ? `/theory/chapter/${CHAPTER_ID}`
      : { pathname: `/theory/chapter/${CHAPTER_ID}`, state };
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/theory/chapter/:chapterId" element={<TheoryChapterView />} />
          <Route path="/lesson" element={<Probe />} />
          <Route path="/theory" element={<Probe />} />
          <Route path="/academy" element={<Probe />} />
        </Routes>
      </MemoryRouter>,
    );
  });
}

function buttonByAriaLabel(label: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find(
    (b) => b.getAttribute('aria-label') === label,
  );
}

async function click(el: Element | undefined) {
  expect(el).toBeDefined();
  await act(async () => {
    (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** 已完成章节的阅读页才会渲染「返回」按钮（免重考导航区） */
function markChapterCompleted() {
  useTheoryStore.setState((state) => ({
    progress: { ...state.progress, completedChapters: [CHAPTER_ID] },
  }));
}

function backButtonTexts(): string[] {
  return Array.from(container.querySelectorAll('button')).map((b) => b.textContent ?? '');
}

beforeEach(() => {
  useTheoryStore.getState().resetProgress();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  useTheoryStore.getState().resetProgress();
  void i18n.changeLanguage('zh');
});

describe('TheoryChapterView 来源感知返回', () => {
  it('无 state：面包屑与阅读页返回都兜底 /lesson（返回课程目录）', async () => {
    markChapterCompleted();
    await mount();
    expect(backButtonTexts().some((text) => text.includes(i18n.t('nav.backToCourseHub')))).toBe(
      true,
    );
    await click(buttonByAriaLabel(i18n.t('nav.backToCourseHub')));
    expect(probeText()).toBe('/lesson');
  });

  it('theory-map：走 /theory + 返回理论地图', async () => {
    markChapterCompleted();
    await mount(theoryMapFrom());
    expect(backButtonTexts().some((text) => text.includes(i18n.t('nav.backToTheoryMap')))).toBe(
      true,
    );
    await click(buttonByAriaLabel(i18n.t('nav.backToTheoryMap')));
    expect(probeText()).toBe('/theory');
  });

  it('academy-map：走 /academy + 返回实战地图', async () => {
    markChapterCompleted();
    await mount(academyMapFrom());
    expect(backButtonTexts().some((text) => text.includes(i18n.t('nav.backToAcademyMap')))).toBe(
      true,
    );
    await click(buttonByAriaLabel(i18n.t('nav.backToAcademyMap')));
    expect(probeText()).toBe('/academy');
  });

  it('hub + stageIndex：带阶段锚点回课程枢纽', async () => {
    markChapterCompleted();
    await mount(hubFrom(3));
    expect(backButtonTexts().some((text) => text.includes(i18n.t('nav.backToCourseHub')))).toBe(
      true,
    );
    await click(buttonByAriaLabel(i18n.t('nav.backToCourseHub')));
    expect(probeText()).toBe('/lesson#hub-stage-3');
  });
});