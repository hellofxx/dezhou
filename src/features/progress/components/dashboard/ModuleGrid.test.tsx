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
import ModuleGrid, { NewbiePathCard } from './ModuleGrid';
import { useProgressStore } from '../../store';
import type { TrainingRecord } from '../../types';
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

/* ===== TrainingGrounds 训练场模块网格（§13.5.2 最近训练标记 / §13.6.2 学习焦点模式） ===== */

const DAY = 24 * 60 * 60 * 1000;

function buildGridRecord(module: TrainingRecord['module'], createdAt: number): TrainingRecord {
  return {
    id: `${module}-${createdAt}`,
    module,
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: `${module}-${createdAt}`,
      module,
      totalQuestions: 10,
      correctAnswers: 7,
      accuracy: 0.7,
      averageTime: 4000,
      timestamp: createdAt,
      details: [],
    },
  };
}

describe('TrainingGrounds 训练场模块网格', () => {
  function renderGrid() {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <ModuleGrid />
          <LocationProbe />
        </MemoryRouter>,
      );
    });
  }

  afterEach(() => {
    act(() => {
      useProgressStore.setState({ records: [], focusModule: null });
    });
  });

  it('渲染六大模块入口与各自的说明文案', () => {
    renderGrid();
    const text = container.textContent ?? '';

    for (const label of ['手牌范围训练', '赔率计算器', 'GTO 模拟器', '策略学院', '扑克谜题', '牌局复盘']) {
      expect(text).toContain(label);
    }
    expect(text).toContain('各位置开牌范围记忆与测试');
    expect(text).toContain('赔率、期望值与补牌速算');
    expect(container.querySelectorAll('button.module-card')).toHaveLength(6);
    // 从未训练 → 不展示最近训练标记
    expect(container.querySelectorAll('.last-training-badge')).toHaveLength(0);
  });

  it('点击模块卡跳转到对应路由', () => {
    renderGrid();

    const potOdds = Array.from(container.querySelectorAll('.module-card')).find((el) =>
      el.textContent?.includes('赔率计算器'),
    );
    expect(potOdds).toBeTruthy();
    act(() => {
      potOdds!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-probe]')?.textContent).toBe('/pot-odds');
  });

  it('最近训练标记：今日已练 / N 天前，仅在对应模块卡上出现', () => {
    const now = Date.now();
    act(() => {
      useProgressStore.setState({
        records: [
          buildGridRecord('range-trainer', now - 60 * 1000),
          buildGridRecord('pot-odds', now - 3 * DAY),
        ],
      });
    });
    renderGrid();

    const badges = Array.from(container.querySelectorAll('.last-training-badge'));
    expect(badges).toHaveLength(2);
    const labels = badges.map((b) => b.textContent);
    expect(labels).toContain('今日已练');
    expect(labels).toContain('3天前');
    // 今日标记带 today 修饰类（供样式区分）
    const todayBadge = badges.find((b) => b.textContent === '今日已练');
    expect(todayBadge!.className).toContain('today');
  });

  it('聚焦按钮写入 focusModule 且不触发卡片跳转，其余卡片变暗', () => {
    renderGrid();

    const cards = Array.from(container.querySelectorAll('.module-card'));
    const firstCard = cards[0]!;
    const pin = firstCard.querySelector('[role="button"][aria-label="聚焦此模块"]');
    expect(pin).toBeTruthy();

    act(() => {
      pin!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(useProgressStore.getState().focusModule).toBe('range-trainer');
    expect(pin!.getAttribute('aria-pressed')).toBe('true');
    // 焦点模式下其他模块卡片降透明度
    expect((cards[1] as HTMLElement).style.opacity).toBe('0.4');
    // 聚焦按钮 stopPropagation：未发生路由跳转
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/dashboard');
  });

  it('聚焦按钮支持键盘 Enter 切换，再按一次取消聚焦', () => {
    renderGrid();

    const pin = container.querySelector('[role="button"][aria-label="聚焦此模块"]')!;
    act(() => {
      pin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(useProgressStore.getState().focusModule).toBe('range-trainer');

    act(() => {
      pin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });
    expect(useProgressStore.getState().focusModule).toBeNull();
  });
});
