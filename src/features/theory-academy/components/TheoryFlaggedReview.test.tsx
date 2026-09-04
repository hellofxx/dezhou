/**
 * TheoryFlaggedReview 组件冒烟（jsdom）：疑难标记复习出口。
 * 覆盖简报要求的四条行为 —— 有标记时列出、空态引导、取消标记后条目消失、脏 id 被安全跳过，
 * 外加一条「已在 SRS 队列」的只读状态展示（本页不得重复入队）。
 *
 * 未覆盖（无法在 jsdom 断言）：真实浏览器路由可达性、<768px 布局、屏幕阅读器朗读顺序。
 * 不引入 testing-library，直接用 react-dom/client + act（对齐 TheoryQuiz.test.tsx 模式）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import { theoryReviewItemId } from '../utils/theorySrs';
import { theoryQuizQuestionKey } from '../utils/contentKeys';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import TheoryFlaggedReview from './TheoryFlaggedReview';

MotionGlobalConfig.skipAnimations = true;

/** 真实题库首个含 ≥2 题的章节（题 id / 章节 id 均为真值，保证 key 命中 zh 资源） */
const realChapter = ALL_VARIANT_THEORY_LEVELS.flatMap((l) => l.chapters).find(
  (c) => c.quiz.length >= 2,
)!;
const realQuestion = realChapter.quiz[0]!;
const secondQuestion = realChapter.quiz[1]!;

const EMPTY_FLAGGED: string[] = [];

let container: HTMLDivElement;
let root: Root;
const originalTheoryProgress = useTheoryStore.getState().progress;
const originalReviewItems = useProgressStore.getState().reviewItems;

function seedFlagged(ids: string[]) {
  useTheoryStore.setState({
    progress: { ...originalTheoryProgress, flaggedQuestions: ids },
  });
}

function mount() {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/theory/review']}>
        <TheoryFlaggedReview />
      </MemoryRouter>,
    );
  });
}

function rows() {
  return Array.from(container.querySelectorAll('article'));
}

function buttonByText(text: string) {
  return Array.from(container.querySelectorAll('button')).find((b) =>
    (b.textContent ?? '').includes(text),
  );
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  seedFlagged(EMPTY_FLAGGED);
  useProgressStore.setState({ reviewItems: [] });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  useTheoryStore.setState({ progress: originalTheoryProgress });
  useProgressStore.setState({ reviewItems: originalReviewItems });
});

describe('TheoryFlaggedReview 复习清单', () => {
  it('有标记时列出题干与所属章节，并给出跳转与取消标记两个可聚焦操作', () => {
    seedFlagged([realQuestion.id]);
    mount();

    expect(rows()).toHaveLength(1);
    const stem = i18n.t(theoryQuizQuestionKey(realQuestion.id)) as string;
    const row = rows()[0]!;
    expect(row.textContent).toContain(stem);
    // 关键防呆：不得把 i18n key 字面量渲染给用户（翻译包缺失时的故障形态）
    expect(row.textContent).not.toContain(theoryQuizQuestionKey(realQuestion.id));

    const link = row.querySelector('a');
    expect(link?.getAttribute('href')).toBe(`/theory/chapter/${realChapter.id}`);
    expect(row.textContent).toContain(i18n.t(`theory.chapterTitle.${realChapter.id}`) as string);
    expect(row.textContent).toContain(i18n.t(`variant.name.${realChapter.variant}`) as string);
    expect(row.textContent).not.toContain('variant.name.');
    expect(buttonByText('取消标记')).toBeTruthy();
  });

  it('多条标记逐条渲染，取消标记走幂等 toggle 且条目即时消失', () => {
    seedFlagged([realQuestion.id, secondQuestion.id]);
    mount();
    expect(rows()).toHaveLength(2);

    const unflag = rows()[0]!.querySelector('button');
    expect(unflag).toBeTruthy();
    act(() => {
      unflag!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useTheoryStore.getState().progress.flaggedQuestions).not.toContain(realQuestion.id);
    expect(rows()).toHaveLength(1);
    expect(rows()[0]!.textContent).toContain(
      i18n.t(theoryQuizQuestionKey(secondQuestion.id)) as string,
    );
  });

  it('全部取消后落到空态并给出引导（标题/说明/回到 /theory 的 CTA）', () => {
    seedFlagged([realQuestion.id]);
    mount();
    const unflag = rows()[0]!.querySelector('button');
    act(() => {
      unflag!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain(i18n.t('theory.flagged.emptyTitle') as string);
    expect(container.textContent).toContain(i18n.t('theory.flagged.emptyDescription') as string);
    expect(buttonByText(i18n.t('theory.flagged.emptyCta') as string)).toBeTruthy();
    expect(container.querySelector('ul')).toBeNull();
    expect(rows()).toHaveLength(0);
  });

  it('脏 id（已删题 / 未知章节 / 无后缀）被静默跳过，页面不崩且仍渲染可解析项', () => {
    seedFlagged(['ghost-chapter-q1', `${realChapter.id}-q999`, 'no-suffix', realQuestion.id]);
    expect(() => mount()).not.toThrow();

    expect(rows()).toHaveLength(1);
    expect(container.textContent).toContain(i18n.t('theory.flagged.count', { count: 1 }) as string);
  });

  it('已在 SRS 队列的题只读展示复习状态，本页不新增复习项', () => {
    const before = useProgressStore.getState().reviewItems.length;
    useProgressStore.setState({
      reviewItems: [
        createReviewItem(
          theoryReviewItemId(realQuestion.id),
          theoryQuizQuestionKey(realQuestion.id),
          'theory',
          { source: 'theory' },
        ),
      ],
    });
    seedFlagged([realQuestion.id]);
    mount();

    expect(rows()[0]!.textContent).toContain(i18n.t('theory.flagged.srsInQueue') as string);
    expect(useProgressStore.getState().reviewItems).toHaveLength(before + 1);
  });
});
