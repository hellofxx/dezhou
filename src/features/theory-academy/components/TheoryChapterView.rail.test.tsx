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
import { useTheoryStore } from '../store';
import TheoryChapterView from './TheoryChapterView';

MotionGlobalConfig.skipAnimations = true;

let container: HTMLDivElement | undefined;
let root: Root | undefined;

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
    useTheoryStore.getState().resetProgress();
    useDebugModeStore.setState({ unlockAll: true });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
      root!.render(
        <MemoryRouter initialEntries={['/theory/chapter/t1-outs']}>
          <Routes>
            <Route path="/theory/chapter/:chapterId" element={<TheoryChapterView />} />
          </Routes>
        </MemoryRouter>,
      );
    });

    const rail = container.querySelector(
      `aside[aria-label="${i18n.t('theory.chapterView.railTitle')}"]`,
    );
    expect(rail, '学习导轨（aside）必须挂载').not.toBeNull();
    const hrefs = Array.from(rail!.querySelectorAll('a')).map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toContain('/theory/chapter/t1-combinatorics');
    expect(hrefs).toContain('/theory/chapter/t1-outs');
  });
});
