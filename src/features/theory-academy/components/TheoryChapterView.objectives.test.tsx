/**
 * 学习目标卡渲染回归（第四批 objectives 回填的验收面）。
 *
 * 覆盖：① 卡片条目数与数据层 `chapter.objectives` 长度一致（下标错位会让某条目标静默回退原文）；
 * ② zh 侧逐字镜像数据原文；③ en 侧取到译文、无汉字、不泄漏 `theory.chapterObjectives.` 键面字；
 * ④ 跨段抽样（数学 / 心理 / 收官章）都真的渲染出卡片。
 * 未覆盖：真实浏览器下的卡片排版与折叠交互。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useTheoryStore } from '../store';
import { findChapterById } from '../utils/theoryProgress';
import TheoryChapterView from './TheoryChapterView';

MotionGlobalConfig.skipAnimations = true;

const HAN = /[㐀-鿿]/;
/** 跨段抽样：T2 数学章、T8 心理章、T9 本批新增收官章 */
const CHAPTERS = ['t2-pot-odds', 't8-tilt', 't9-cash-vs-mtt'];

let container: HTMLDivElement | undefined;
let root: Root | undefined;

/** 每个章节用全新容器挂载，避免同一 Router 实例复用 initialEntries */
async function mount(chapterId: string) {
  if (root) {
    act(() => root!.unmount());
    container?.remove();
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => {
    root!.render(
      <MemoryRouter initialEntries={[`/theory/chapter/${chapterId}`]}>
        <Routes>
          <Route path="/theory/chapter/:chapterId" element={<TheoryChapterView />} />
        </Routes>
      </MemoryRouter>,
    );
  });
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  useDebugModeStore.setState({ unlockAll: false });
  void i18n.changeLanguage('zh');
});

/** 目标卡的 li 内含一个「•」前缀 span，取文本节点才是译文 */
function objectiveItems(): string[] {
  const card = Array.from(container!.querySelectorAll('div')).find((el) =>
    (el.textContent ?? '').includes(i18n.t('theory.objectives')),
  );
  const list = card?.querySelector('ul');
  expect(list, '目标卡的 ul 必须存在').not.toBeNull();
  return Array.from(list!.querySelectorAll('li')).map((li) =>
    (li.textContent ?? '').replace(/^•\s*/, '').trim(),
  );
}

function declaredObjectives(chapterId: string): string[] {
  const chapter = findChapterById(chapterId);
  expect(chapter, `章节 ${chapterId} 存在`).toBeDefined();
  const declared = chapter!.objectives ?? [];
  expect(declared.length, `${chapterId} 应声明至少 3 条目标`).toBeGreaterThanOrEqual(3);
  return declared;
}

describe('TheoryChapterView 学习目标卡', () => {
  it('zh 侧逐条渲染数据原文，条目数一致且不泄漏 key', async () => {
    useTheoryStore.getState().resetProgress();
    useDebugModeStore.setState({ unlockAll: true });
    for (const chapterId of CHAPTERS) {
      const declared = declaredObjectives(chapterId);
      await mount(chapterId);
      const items = objectiveItems();
      expect(items, `${chapterId} 条目数应与数据层一致`).toHaveLength(declared.length);
      items.forEach((text, i) => {
        expect(text, `${chapterId} 第 ${i} 条`).toBe(declared[i]);
      });
      expect(container!.textContent).not.toContain('theory.chapterObjectives.');
    }
  });

  it('en 侧全部条目为译文：无汉字、非原文回退、无键面字', async () => {
    useTheoryStore.getState().resetProgress();
    useDebugModeStore.setState({ unlockAll: true });
    await preloadI18n(['theory'], 'en');
    await i18n.changeLanguage('en');
    for (const chapterId of CHAPTERS) {
      const declared = declaredObjectives(chapterId);
      await mount(chapterId);
      const items = objectiveItems();
      expect(items).toHaveLength(declared.length);
      const joined = items.join(' | ');
      expect(HAN.test(joined), `${chapterId} en 目标含汉字: ${joined.slice(0, 60)}`).toBe(false);
      // key 缺失时 resolveTheoryObjectives 会回退成中文原文，已由上一条断言抓住；
      // 这里再逐条确认没有一条与数据原文相同（防 en 被误填成 zh 同文）
      items.forEach((item, i) => expect(item).not.toBe(declared[i]));
    }
  });
});
