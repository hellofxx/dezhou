/**
 * 变体章节级桥接卡渲染回归（第五批 44 章 chapterPracticeMap 的验收面）。
 *
 * 上游两道守卫各自证明了一半：data/levels/variants/theoryIntegrity.test.ts 证明每章都带
 * 非空推荐、strategy-academy/data/theoryVariantBridgeIntegrity.test.ts 证明被引 id 真实存在。
 * 都测不到渲染这一步：课时标题实际取的是 i18n 权威值还是 map 里的回退字面量（回退静默生效
 * = lessonTitle key 缺失，双语数据变了也发现不了），以及跳转目标路由是否按 id 拼装。
 *
 * 覆盖面是全部变体章节而非抽样——本组件是纯展示件，逐个挂载成本极低。
 * 未覆盖：桥接卡在章节页的出现时机（属小测结算阶段，见 TheoryChapterView 的 done 分支）
 * 与真实浏览器下的排版。
 */
import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import type { PracticeRecommendation } from '../types';
import { PracticeBridgeCard } from './PracticeBridgeCard';

MotionGlobalConfig.skipAnimations = true;

const HAN = /[㐀-鿿]/;

/** 变体章节的章节级推荐（Level 级推荐不在本文件对象内） */
const variantBridges = ALL_VARIANT_THEORY_LEVELS.filter((level) => level.variant !== 'standard')
  .flatMap((level) => level.chapters)
  .map((chapter) => ({ chapterId: chapter.id, rec: chapter.practiceRecommendations }))
  .filter((item): item is { chapterId: string; rec: PracticeRecommendation } => !!item.rec);

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function mountBridge(rec: PracticeRecommendation) {
  if (root) {
    act(() => root!.unmount());
    container?.remove();
  }
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root!.render(
      <MemoryRouter initialEntries={['/theory']}>
        <LocationProbe />
        <PracticeBridgeCard recommendations={rec} subtitleKey="theory.bridge.chapterSubtitle" />
      </MemoryRouter>,
    );
  });
}

/** 目标路由用 /academy/lesson/:id 通配捕获，读 location.pathname 即为跳转证据 */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="path">{location.pathname}</div>;
}

function lessonButtons(): HTMLButtonElement[] {
  const prefix = i18n.t('theory.bridge.gotoLesson', { title: '' }).split(/[：:]/)[0] ?? '';
  return Array.from(container!.querySelectorAll('button')).filter((b) =>
    (b.getAttribute('aria-label') ?? '').startsWith(prefix),
  ) as HTMLButtonElement[];
}

function path(): string {
  return container!.querySelector('[data-testid="path"]')?.textContent ?? '';
}

/**
 * 与组件同一条解析路径取权威标题。t() 不带 defaultValue 时，key 缺失会原样返回 key，
 * 据此把"回退字面量静默生效"（= lessonTitle key 缺失）显式判红。
 */
function lessonTitleOf(id: string): string {
  const key = `academy.lessonTitle.${id}`;
  const value = i18n.t(key);
  expect(value, `${key} 在当前语言缺失`).not.toBe(key);
  return value;
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  void i18n.changeLanguage('zh');
});

describe('PracticeBridgeCard 变体章节级桥接', () => {
  it('变体章节桥接面非空（防聚合链变更后本测试空跑）', () => {
    // 下限而非等值：补深批次会新增变体章节，届时数据层"每章必带推荐"守卫会先拦住漏登记的章，
    // 这里只需保证渲染面不为零。当前实为 44（单挑 22 + 短牌 22）。
    expect(variantBridges.length).toBeGreaterThanOrEqual(44);
  });

  it('zh：每张课时卡数量与数据一致、标题取 academy 权威值、点击进入对应课时', async () => {
    await preloadI18n(['theory', 'academy'], 'zh');

    for (const { chapterId, rec } of variantBridges) {
      mountBridge(rec);
      const buttons = lessonButtons();
      expect(buttons.length, `${chapterId} 课时卡数`).toBe(rec.lessons.length);
      rec.lessons.forEach((lesson, i) => {
        const authority = lessonTitleOf(lesson.id);
        expect(buttons[i]!.getAttribute('aria-label')).toBe(
          i18n.t('theory.bridge.gotoLesson', { title: authority }),
        );
        expect(buttons[i]!.textContent).toContain(authority);
        act(() => buttons[i]!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        expect(path(), `${chapterId} → ${lesson.id} 跳转`).toBe(`/academy/lesson/${lesson.id}`);
      });
    }
  });

  it('en：变体桥接标题全部取到译文，无汉字、无键面字泄漏', async () => {
    await preloadI18n(['theory', 'academy'], 'en');
    await i18n.changeLanguage('en');

    for (const { chapterId, rec } of variantBridges) {
      mountBridge(rec);
      const text = container!.textContent ?? '';
      expect(HAN.test(text), `${chapterId} en 桥接卡含汉字：${text.slice(0, 60)}`).toBe(false);
      expect(text).not.toContain('academy.lessonTitle.');
      rec.lessons.forEach((lesson) => expect(text).toContain(lessonTitleOf(lesson.id)));
    }
  });
});
