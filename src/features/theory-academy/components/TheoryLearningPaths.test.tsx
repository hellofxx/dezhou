/**
 * 学习路径区冒烟（jsdom）。
 * 覆盖：仅标准变体渲染、x/y 进度文案、下一章未解锁时的锁定提示、全部完成的完成态。
 * 未覆盖：真实浏览器排版与窄屏堆叠；路径成员与 pathTags 的一致性由
 * data/theoryPaths.integrity.test.ts 守卫（本文件只测渲染与门禁口径的对接）。
 *
 * 解锁判定复用 theoryMeta（不新增门禁），因此测试用「完成前序 Level 全部章节」来开锁，
 * 与真实学习路径一致；调试解锁默认为关。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { useTheoryStore } from '../store';
import { getLevelSummariesByVariant } from '../utils/theoryMeta';
import { THEORY_PATHS } from '../data/theoryPaths';
import { TheoryLearningPaths } from './TheoryLearningPaths';

MotionGlobalConfig.skipAnimations = true;

let container: HTMLDivElement;
let root: Root;
const originalProgress = useTheoryStore.getState().progress;
const standardLevels = getLevelSummariesByVariant('standard');
const sixMaxPath = THEORY_PATHS.find((path) => path.id === 'sixmax-cash-core')!;

function seed(patch: Partial<typeof originalProgress>) {
  useTheoryStore.setState({ progress: { ...originalProgress, ...patch } });
}

/** 指定 Level 的全部章节 id（含增补章，作为「该级已读完」的最强种子） */
function chapterIdsOfLevels(levelIds: string[]): string[] {
  return standardLevels
    .filter((level) => levelIds.includes(level.id))
    .flatMap((level) => level.chapters.map((chapter) => chapter.id));
}

function mount() {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/theory']}>
        <TheoryLearningPaths />
      </MemoryRouter>,
    );
  });
}

function card(pathId: string): HTMLElement {
  const el = container.querySelector(`[data-path-id="${pathId}"]`);
  expect(el, `缺少路径卡 ${pathId}`).not.toBeNull();
  return el as HTMLElement;
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
});

describe('TheoryLearningPaths', () => {
  it('非标准变体下不渲染任何路径卡', () => {
    seed({ completedChapters: [], activeVariant: 'heads-up' });
    mount();

    expect(container.querySelectorAll('[data-path-id]').length).toBe(0);
  });

  it('标准变体下渲染三条路径；首个成员所在 Level 未解锁时显示锁定提示', () => {
    seed({ completedChapters: [], activeVariant: 'standard' });
    mount();

    expect(container.querySelectorAll('[data-path-id]').length).toBe(THEORY_PATHS.length);

    // 6-max 主线首章在 T1（恒解锁）→ 可开始；翻后/锦标赛路径首章在 T4（未解锁）→ 锁定
    const sixMax = card('sixmax-cash-core');
    expect(sixMax.getAttribute('data-path-state')).toBe('open');
    expect(sixMax.textContent).toContain(i18n.t('theory.paths.start'));

    for (const pathId of ['postflop-deep', 'mtt-bridge']) {
      const locked = card(pathId);
      expect(locked.getAttribute('data-path-state')).toBe('locked');
      expect(locked.textContent).toContain(i18n.t('theory.paths.locked'));
      expect(locked.querySelector('a[href^="/theory/chapter/"]')).toBeNull();
    }
  });

  it('显示 x/y 进度，CTA 指向首个未完成且已解锁的成员章', () => {
    // 读完 T1–T3 后 T4 解锁：6-max 路径已完成 2 章（t1-sixmax-table / t3-blind-battle）
    seed({ completedChapters: chapterIdsOfLevels(['t1', 't2', 't3']), activeVariant: 'standard' });
    mount();

    const sixMax = card('sixmax-cash-core');
    expect(sixMax.textContent).toContain(
      i18n.t('theory.paths.progress', { done: 2, total: sixMaxPath.chapterIds.length }),
    );
    expect(sixMax.getAttribute('data-path-state')).toBe('open');
    expect(sixMax.textContent).toContain(i18n.t('theory.paths.continue'));

    const link = sixMax.querySelector('a[href^="/theory/chapter/"]') as HTMLAnchorElement | null;
    expect(link, '缺少继续 CTA').not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/theory/chapter/t4-sixmax-ranges');
  });

  it('路径成员全部完成时显示完成态且不再提供 CTA', () => {
    seed({ completedChapters: [...sixMaxPath.chapterIds], activeVariant: 'standard' });
    mount();

    const sixMax = card('sixmax-cash-core');
    expect(sixMax.getAttribute('data-path-state')).toBe('done');
    expect(sixMax.textContent).toContain(
      i18n.t('theory.paths.progress', { done: sixMaxPath.chapterIds.length, total: sixMaxPath.chapterIds.length }),
    );
    expect(sixMax.textContent).toContain(i18n.t('theory.paths.done'));
    expect(sixMax.querySelector('a[href^="/theory/chapter/"]')).toBeNull();
  });
});
