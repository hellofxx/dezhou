/**
 * DailyTrainingPlan 复习项 i18n key 渲染守卫（jsdom，中英双语）。
 *
 * 浏览器实测缺陷（PRD §12.4.3「复习态存 i18n key 必须配对按需加载来源包」）：
 * 复习项 label 是跨模块 i18n key（theory.quiz.*），descReview 模板为 "{{items}}"。
 * i18next 不递归翻译插值值，插值前必须逐条 t()，否则 key 字面量直接裸露给用户。
 * 本文件锁定「今日训练计划卡」这条渲染路径。
 *
 * 理论学院整改后：到期理论复习项不再进入通用复习卡，改由 theory-review 卡承载
 * （路由 /theory/review、标题「复习 N 个理论知识点」、不出题干预览）。因此这里锁三件事：
 * 1. theory-review 卡只用条数与理由标签，不泄露 theory.quiz.* 裸键；
 * 2. 通用复习卡对 i18n key label 仍逐条 t()（fixture 借用 theory.quiz.* key，
 *    它是测试环境唯一「双语均预加载」的跨模块复习 label，见 reviewLeakFixture）；
 * 3. theory-chapter 卡标题回落数据层中文，不泄露 theory.chapterTitle.* 裸键。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DailyTrainingPlan from './DailyTrainingPlan';
import { generateCrossModuleDailyPlan } from '../../utils/dailyTrainingPlan';
import type { DailyRecommendation } from '../../utils/dailyTrainingPlan';
import { createReviewItem, toLocalDateString } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import { registerTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import {
  buildTheoryReviewFixture,
  setLanguage,
  THEORY_QUESTION_TEXT,
  theoryQuestionKey,
} from '../dashboard/reviewLeakFixture';

/**
 * 非理论复习项，但 label 故意是跨模块 i18n key：
 * 这是历史上裸键泄漏的形态（持久化载荷语言中立），也是通用复习卡逐条 t() 的守卫对象。
 */
function keyLabelReviewItem(id: string): ReviewItem {
  const item = createReviewItem(`strategy:${id}`, theoryQuestionKey('t1-combinatorics-q1'), 'strategy', {
    source: 'strategy',
  });
  item.nextReviewDate = toLocalDateString();
  return item;
}

/** 到期理论复习项 → theory-review 卡 */
function planWithTheoryReview(): DailyRecommendation[] {
  return generateCrossModuleDailyPlan([], [], [buildTheoryReviewFixture()], 0);
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  act(() => root.unmount());
  container.remove();
  await setLanguage('zh'); // 复位默认语言，避免 'en' 泄漏到后续用例/文件
});

function renderPlan(recommendations: DailyRecommendation[]) {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DailyTrainingPlan recommendations={recommendations} onDismiss={() => {}} />
      </MemoryRouter>,
    );
  });
}

describe.each([
  { lng: 'zh' as const, title: /复习 1 个理论知识点/, reason: '理论复习' },
  { lng: 'en' as const, title: /Review 1 theory concepts/, reason: 'Theory review' },
])('理论复习卡（$lng）', ({ lng, title, reason }) => {
  it('走 titleTheoryReview 译文与 theoryReview 理由标签，且不泄露理论题库裸键', async () => {
    await setLanguage(lng);
    renderPlan(planWithTheoryReview());
    const text = container.textContent ?? '';
    expect(text).not.toContain('theory.quiz.');
    expect(text).not.toContain('dashboard.dataPlan.');
    expect(text).toMatch(title);
    expect(text).toContain(reason);
  });

  it('通用复习卡对 i18n key label 逐条 t()', async () => {
    await setLanguage(lng);
    renderPlan(generateCrossModuleDailyPlan([], [], [keyLabelReviewItem('a')], 0));
    const text = container.textContent ?? '';
    expect(text).not.toContain('theory.quiz.');
    expect(text).toContain(THEORY_QUESTION_TEXT[lng]);
  });
});

/**
 * 到期复习 > 3 项走另一条模板 descReviewMore（"{{items}} and {{count}} more"），
 * 是独立的插值点，同样必须逐条 t() 后才拼接 items。
 */
describe('每日计划卡（到期通用复习 4 项 / descReviewMore 分支）', () => {
  it('预览拼接与条数后缀均不裸露 i18n key', async () => {
    await setLanguage('en');
    const items = ['a', 'b', 'c', 'd'].map(keyLabelReviewItem);
    renderPlan(generateCrossModuleDailyPlan([], [], items, 0));
    const text = container.textContent ?? '';
    expect(text).not.toContain('theory.quiz.');
    expect(text).toContain(THEORY_QUESTION_TEXT.en);
  });
});

describe('理论下一章卡（数据源注册后）', () => {
  it('章节标题回落数据层中文、reason 走词典，不裸露 theory.chapterTitle.* 键', async () => {
    await setLanguage('zh');
    registerTheoryDataSource({
      findNextChapter: () => ({
        chapterId: 'fixture-chapter-a',
        levelId: 't1',
        title: '组合学与起手牌计数',
        titleKey: 'theory.chapterTitle.fixture-chapter-a',
        route: '/theory/chapter/fixture-chapter-a',
        estimatedMinutes: 12,
      }),
    });
    renderPlan(generateCrossModuleDailyPlan([], [], [], 0));
    const text = container.textContent ?? '';
    expect(text).toContain('组合学与起手牌计数');
    expect(text).toContain('理论章节');
    expect(text).not.toContain('theory.chapterTitle.');
    expect(text).not.toContain('dashboard.dataPlan.');
  });
});
