/**
 * DailyTrainingPlan 复习项 i18n key 渲染守卫（jsdom，中英双语）。
 *
 * 浏览器实测缺陷（PRD §12.4.3「复习态存 i18n key 必须配对按需加载来源包」）：
 * 复习项 label 是跨模块 i18n key（theory.quiz.<id>.question），而 descReview 模板为
 * "{{items}}"。i18next 不递归翻译插值值，插值前必须逐条 t()，否则 key 字面量直接裸露给用户。
 * 本文件锁定「今日训练计划卡」这条渲染路径的正确行为；曾漏接 t() 的另一条路径
 * （新手学习路径卡）见 dashboard/ModuleGrid.test.tsx。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DailyTrainingPlan from './DailyTrainingPlan';
import { generateCrossModuleDailyPlan } from '../../utils/dailyTrainingPlan';
import {
  buildTheoryReviewFixture,
  setLanguage,
  THEORY_QUESTION_TEXT,
} from '../dashboard/reviewLeakFixture';

/** 真实生成链路：含 1 条到期理论复习项的每日计划 */
function planWithTheoryReview() {
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

function renderPlan() {
  act(() => {
    root.render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DailyTrainingPlan recommendations={planWithTheoryReview()} onDismiss={() => {}} />
      </MemoryRouter>,
    );
  });
}

describe.each([
  { lng: 'zh' as const, title: /复习 1 个知识点/ },
  { lng: 'en' as const, title: /Review 1 knowledge points/ },
])('每日计划卡（$lng）', ({ lng, title }) => {
  const question = THEORY_QUESTION_TEXT[lng];

  it('复习项渲染题干译文而非裸 i18n key', async () => {
    await setLanguage(lng);
    renderPlan();
    const text = container.textContent ?? '';
    expect(text).not.toContain('theory.quiz.');
    expect(text).toContain(question);
  });

  it('标题/描述模板自身也不裸露 key', async () => {
    await setLanguage(lng);
    renderPlan();
    const text = container.textContent ?? '';
    expect(text).not.toContain('dashboard.dataPlan.');
    expect(text).toMatch(title);
  });
});

/**
 * 到期复习 > 3 项走另一条模板 descReviewMore（"{{items}} and {{count}} more"），
 * 是独立的插值点，同样必须逐条 t() 后才拼接 items。
 */
describe('每日计划卡（到期复习 4 项 / descReviewMore 分支）', () => {
  it('预览拼接与条数后缀均不裸露 i18n key', async () => {
    await setLanguage('en');
    const items = ['q1', 'q2', 'q3', 'q4'].map((n) =>
      buildTheoryReviewFixture(`t1-combinatorics-${n}`),
    );
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <DailyTrainingPlan
            recommendations={generateCrossModuleDailyPlan([], [], items, 0)}
            onDismiss={() => {}}
          />
        </MemoryRouter>,
      );
    });
    const text = container.textContent ?? '';
    expect(text).not.toContain('theory.quiz.');
    expect(text).toContain(THEORY_QUESTION_TEXT.en);
  });
});
