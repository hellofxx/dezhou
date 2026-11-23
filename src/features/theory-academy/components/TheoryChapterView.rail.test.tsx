/**
 * 章节页学习导轨接入回归：
 * 宽屏双栏骨架必须真的挂载本级目录（aside landmark + 同级章节链接），
 * 防止后续布局重构只剩正文列而悄悄丢掉导轨。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { theoryMapFrom } from '@/shared/utils/courseBack';
import { useTheoryStore } from '../store';
import TheoryChapterView from './TheoryChapterView';

MotionGlobalConfig.skipAnimations = true;

let container: HTMLDivElement | undefined;
let root: Root | undefined;

async function mountChapter(state?: unknown) {
  useTheoryStore.getState().resetProgress();
  useDebugModeStore.setState({ unlockAll: true });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <MemoryRouter
        initialEntries={[
          state === undefined
            ? '/theory/chapter/t1-outs'
            : { pathname: '/theory/chapter/t1-outs', state },
        ]}
      >
        <Routes>
          <Route path="/theory/chapter/:chapterId" element={<TheoryChapterView />} />
        </Routes>
      </MemoryRouter>,
    );
  });

  return container.querySelector(
    `aside[aria-label="${i18n.t('theory.chapterView.railTitle')}"]`,
  );
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  useDebugModeStore.setState({ unlockAll: false });
  void i18n.changeLanguage('zh');
});

describe('TheoryChapterView 学习导轨', () => {
  it('挂载本级目录导轨，含同级章节路由链接', async () => {
    const rail = await mountChapter();

    expect(rail, '学习导轨（aside）必须挂载').not.toBeNull();
    const hrefs = Array.from(rail!.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toContain('/theory/chapter/t1-combinatorics');
    expect(hrefs).toContain('/theory/chapter/t1-outs');
  });

  it('导轨返回入口按进入来源注入：深链兜底课程枢纽，理论地图来源回到 /theory', async () => {
    const hubRail = await mountChapter();
    const hubBack = hubRail!.querySelector<HTMLAnchorElement>(
      `a[href="/lesson"]`,
    );
    expect(hubBack, '无来源 state 时应兜底 /lesson').not.toBeNull();
    expect(hubBack!.textContent).toContain(i18n.t('nav.backToCourseHub'));

    act(() => root!.unmount());
    container?.remove();
    const mapRail = await mountChapter(theoryMapFrom());
    const mapBack = mapRail!.querySelector<HTMLAnchorElement>(`a[href="/theory"]`);
    expect(mapBack, '理论地图来源时返回 /theory').not.toBeNull();
    expect(mapBack!.textContent).toContain(i18n.t('nav.backToTheoryMap'));
  });
});
