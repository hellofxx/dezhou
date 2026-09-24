/**
 * 理论复习项的双语渲染测试（jsdom，理论侧集成验收）。
 *
 * 锁定契约：理论复习项持久化载荷只存 i18n key（语言中立，见 utils/theorySrs.ts），
 * 渲染层（progress 的复习队列 / 复习会话）必须解析出**当前语言**的题干与解析。
 * 修复前 metadata/label 存的是数据层中文原文，英文界面直接回显中文（违反 PRD 5.20.3）。
 *
 * 三条断言共同成立才算修好：
 * 1. 渲染文本 = en 资源值（证明确实随语言切换）；
 * 2. 渲染文本不含汉字（英文界面不得出现中文题干/解析）；
 * 3. 渲染文本不含 key 字面量（否则是「翻译包缺失」的新故障，见 useEnsureReviewSourceI18n）。
 *
 * 本文件放在 theory-academy 下：须由理论侧引用真实题库与 key 生成函数，
 * 而 features 间单向依赖只允许 theory-academy → progress（见 eslint.config.js）。
 */
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import SpacedRepetitionPanel from '@/features/progress/components/srs/SpacedRepetitionPanel';
import ReviewSession from '@/features/progress/components/srs/ReviewSession';
import { buildTheoryReviewItems } from '../utils/theorySrs';
import { theoryQuizExplanationKey, theoryQuizQuestionKey } from '../utils/contentKeys';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

const HAN = /[\u4e00-\u9fff]/;

/** 取真实题库首个含题的章节，保证 key 必然命中双语资源 */
const levelChapter = ALL_VARIANT_THEORY_LEVELS.flatMap((level) => level.chapters).find(
  (chapter) => chapter.quiz.length > 0,
)!;
const firstQuestion = levelChapter.quiz[0]!;
const questionKey = theoryQuizQuestionKey(firstQuestion.id);
const explanationKey = theoryQuizExplanationKey(firstQuestion.id);

/** 以真实构造函数产出的理论复习项（label / front / back 均为 key） */
function realTheoryItem(): ReviewItem {
  return buildTheoryReviewItems(levelChapter, [firstQuestion.id])[0]!;
}

function textOf(lng: 'zh' | 'en', key: string): string {
  return i18n.t(key, { lng }) as string;
}

let container: HTMLDivElement;
let root: Root;

async function mount(tree: React.ReactElement) {
  await act(async () => {
    root.render(tree);
  });
}

beforeAll(async () => {
  // 组件 setup 仅按当前语言（zh）预加载全部模块；en 侧须显式补加载，模拟真实路由的按需注入
  await preloadI18n(['theory', 'review', 'spacedRepetition', 'dashboard', 'common', 'nav'], 'en');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  void i18n.changeLanguage('zh');
});

function setup() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
}

describe('复习队列（SpacedRepetitionPanel）渲染理论复习项', () => {
  it('en 语言下列表 label 解析为英文题干，既非中文原文也非 key 字面量', async () => {
    setup();
    await i18n.changeLanguage('en');

    await mount(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SpacedRepetitionPanel
          reviewItems={[realTheoryItem()]}
          todayItems={[realTheoryItem()]}
        />
      </MemoryRouter>,
    );

    const enQuestion = textOf('en', questionKey);
    expect(enQuestion.length).toBeGreaterThan(0);
    // 前置校验：en 与 zh 资源确有差异，否则本断言无意义
    expect(textOf('zh', questionKey)).not.toBe(enQuestion);

    const rendered = container.querySelector('[class*="truncate"]')?.textContent ?? '';
    expect(rendered.trim()).toBe(enQuestion.trim());
    expect(rendered).not.toContain(questionKey);
    expect(HAN.test(rendered)).toBe(false);
  });

  it('zh 语言下同一复习项解析为中文（回切不残留英文）', async () => {
    setup();

    await mount(
      <MemoryRouter initialEntries={['/dashboard']}>
        <SpacedRepetitionPanel
          reviewItems={[realTheoryItem()]}
          todayItems={[realTheoryItem()]}
        />
      </MemoryRouter>,
    );

    const rendered = container.querySelector('[class*="truncate"]')?.textContent ?? '';
    expect(rendered.trim()).toBe(textOf('zh', questionKey).trim());
    expect(rendered).not.toContain(questionKey);
  });
});

describe('复习会话（ReviewSession）渲染理论复习项', () => {
  it('en 语言下自评卡片题干与答案均为英文，无中文原文回显', async () => {
    setup();
    await i18n.changeLanguage('en');

    await mount(
      <MemoryRouter>
        <ReviewSession open onOpenChange={() => {}} initialItems={[realTheoryItem()]} />
      </MemoryRouter>,
    );

    // Radix Dialog 挂在 body 门户上，按 role 定位会话内容
    const dialog = () => document.querySelector('[role="dialog"]');
    expect(dialog()).toBeTruthy();

    // 断言题干（metadata.front）
    const frontText = dialog()!.textContent ?? '';
    expect(frontText).toContain(textOf('en', questionKey).trim());
    expect(frontText).not.toContain(questionKey);
    expect(HAN.test(frontText)).toBe(false);

    // 断言点开「显示答案」后的解析（metadata.back）同样为英文
    const showBtn = Array.from(dialog()!.querySelectorAll('button')).find((b) =>
      (b.textContent ?? '').includes('Show Answer'),
    );
    expect(showBtn).toBeTruthy();
    await act(async () => {
      showBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const backText = dialog()!.textContent ?? '';
    expect(backText).toContain(textOf('en', explanationKey).trim());
    expect(backText).not.toContain(explanationKey);
    expect(HAN.test(backText)).toBe(false);
  });
});
