/**
 * NewbiePathCard（§13.6.1 新手学习路径卡 / "YOUR LEARNING PATH"）i18n key 泄漏回归测试（jsdom）。
 *
 * 浏览器实测（语言 en，首页 '/'）：SRS 面板把到期复习项正确渲染成英文题干，
 * 但学习路径卡的 <p class="mt-1 text-xs text-[var(--poker-ivory-dim)]"> 把裸键
 * `theory.quiz.t1-combinatorics-q1.question` 当文本输出。
 * 根因：Dashboard 的 pathCard 派生直接 t(rec.description, rec.descParams)，而
 * descReview = "{{items}}"、items 为未解析的 key 拼接 —— i18next 不递归翻译插值值。
 * 修复：派生下移到本组件并复用共享解析器（渲染期直算，禁止固化进 useMemo）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { NewbiePathCard } from './ModuleGrid';
import { generateCrossModuleDailyPlan } from '../../utils/dailyTrainingPlan';
import {
  buildTheoryReviewFixture,
  setLanguage,
  THEORY_QUESTION_TEXT,
} from './reviewLeakFixture';

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

/** 真实生成链路：含 1 条到期理论复习项的每日计划首项（review 型） */
function firstRecommendation() {
  return generateCrossModuleDailyPlan([], [], [buildTheoryReviewFixture()], 0)[0] ?? null;
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

function renderCard() {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <NewbiePathCard recommendation={firstRecommendation()} />
        <LocationProbe />
      </MemoryRouter>,
    );
  });
}

describe.each([
  { lng: 'zh' as const, title: /复习 1 个知识点/ },
  { lng: 'en' as const, title: /Review 1 knowledge points/ },
])('学习路径卡（$lng）', ({ lng, title }) => {
  const question = THEORY_QUESTION_TEXT[lng];

  it('描述行渲染复习题干译文而非裸 i18n key', async () => {
    await setLanguage(lng);
    renderCard();
    const text = container.textContent ?? '';
    // 直接复刻浏览器症状：裸键字面量不得出现在任何可见文本中
    expect(text).not.toContain('theory.quiz.');
    // 修复前该卡对 review 推荐不渲染任何题干（派生未接 t()）
    expect(text).toContain(question);
  });

  it('标题走 titleReview 译文而非裸 key', async () => {
    await setLanguage(lng);
    renderCard();
    const text = container.textContent ?? '';
    expect(text).not.toContain('dashboard.dataPlan.');
    expect(text).toMatch(title);
  });

  it('CTA 跳到该推荐的 route', async () => {
    await setLanguage(lng);
    renderCard();
    const cta = Array.from(container.querySelectorAll('button')).at(-1);
    expect(cta).toBeTruthy();
    act(() => {
      cta!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[data-probe]')?.textContent).toBe(
      firstRecommendation()?.route,
    );
  });
});

describe('学习路径卡（无推荐兜底）', () => {
  it('recommendation 为 null 时不渲染描述行且不裸露 key', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <NewbiePathCard recommendation={null} />
        </MemoryRouter>,
      );
    });
    const text = container.textContent ?? '';
    expect(text).not.toContain('theory.quiz.');
    expect(text).not.toContain('dashboard.progressive.');
    expect(text).toContain('你的学习路径');
  });
});
