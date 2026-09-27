/**
 * TheoryHome 先修引导卡冒烟（jsdom）。
 * 覆盖：无进度时出现且链向策略学院入门向导、已有进度时不再打扰、en 下渲染英文而非中文/键面。
 * 未覆盖（无法在 jsdom 断言）：真实浏览器路由可达性、<768px 布局、卡片视觉质感。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { useTheoryStore } from '../store';
import { THEORY_LEVELS } from '../data/levels';
import TheoryHome from './TheoryHome';

MotionGlobalConfig.skipAnimations = true;

const HAN = /[㐀-鿿]/;
const firstChapter = THEORY_LEVELS[0]!.chapters[0]!;

let container: HTMLDivElement;
let root: Root;
const originalProgress = useTheoryStore.getState().progress;

function seed(completedChapters: string[]) {
  useTheoryStore.setState({ progress: { ...originalProgress, completedChapters } });
}

async function mount() {
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={['/theory']}>
        <TheoryHome />
      </MemoryRouter>,
    );
  });
}

function basicsLink(): HTMLAnchorElement | null {
  return container.querySelector('a[href="/academy/basics"]');
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
  useTheoryStore.setState({ progress: originalProgress });
  void i18n.changeLanguage('zh');
});

describe('TheoryHome 先修引导卡', () => {
  it('当前变体尚无已完成章节时出现，并链到策略学院入门向导', async () => {
    seed([]);
    await mount();

    const link = basicsLink();
    expect(link, '先修卡应提供 /academy/basics 入口').not.toBeNull();
    expect(link!.textContent).toContain(i18n.t('theory.basicsGuide.cta'));
    const headings = Array.from(container.querySelectorAll('h2'));
    expect(headings.some((h) => (h.textContent ?? '').includes(i18n.t('theory.basicsGuide.title')))).toBe(true);
  });

  it('已有章节进度后不再打扰', async () => {
    seed([firstChapter.id]);
    await mount();

    expect(basicsLink()).toBeNull();
  });

  it('英文界面渲染英文文案，不回显中文原文或 key 字面量', async () => {
    await preloadI18n(['theory'], 'en');
    await i18n.changeLanguage('en');
    seed([]);
    await mount();

    const link = basicsLink();
    expect(link, 'en 下先修卡仍应出现').not.toBeNull();
    expect(link!.textContent).toContain('basics wizard');
    expect(link!.textContent).not.toContain('theory.basicsGuide');
    expect(HAN.test(link!.textContent ?? '')).toBe(false);
  });
});
