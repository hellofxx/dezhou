import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { registerAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import { registerTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { AcademyLearningStage } from '@/shared/types/academyDataSource';
import type { PokerVariant } from '@/shared/types/elo';
import { useAcademyStore } from '../store';
import CourseHub from './CourseHub';

const STAGES: AcademyLearningStage[] = [
  {
    id: 'l1',
    level: 1,
    title: 'L1',
    description: '',
    icon: '',
    unlockRequirement: '',
    prerequisiteStageIds: [],
    lessonIds: ['l1-basics'],
    theoryChapterIds: ['t1-combinatorics'],
  },
  {
    id: 'l5',
    level: 5,
    title: 'L5',
    description: '',
    icon: '',
    unlockRequirement: '',
    prerequisiteStageIds: ['l1'],
    lessonIds: ['l5-bankroll'],
    theoryChapterIds: ['t1-variance'],
  },
];

const ACADEMY_PROGRESS = { completedLessons: [] as string[] };
const ACADEMY_ATTEMPTS = {};
const ACADEMY_STAGES = { stages: STAGES };
const THEORY_PROGRESS = {
  completedChapters: [] as string[],
  chapterAttempts: {},
  quizScores: {},
};
const THEORY_CATALOG = [
  { chapterId: 't1-combinatorics', levelId: 't1' },
  { chapterId: 't1-variance', levelId: 't1' },
  { chapterId: 't3-extra', levelId: 't3' },
];

/** 理论 store 的变体可见状态（模拟 theory bootstrap 的读写两侧） */
let theoryVariant: PokerVariant = 'standard';
const theorySwitchVariant = vi.fn((variant: PokerVariant) => {
  theoryVariant = variant;
});

function registerSources(): void {
  registerAcademyDataSource({
    findNextLesson: () => null,
    getLessonMeta: (id) => ({ id, title: id, level: 1 }),
    getAcademyProgressSnapshot: () => ACADEMY_PROGRESS,
    getLessonAttemptsSnapshot: () => ACADEMY_ATTEMPTS,
    getLearningStagesSnapshot: () => ACADEMY_STAGES,
    subscribe: () => () => {},
  });
  registerTheoryDataSource({
    findNextChapter: () => null,
    getLearningSnapshot: () => THEORY_PROGRESS,
    getChapterCatalog: () => THEORY_CATALOG,
    getActiveVariant: () => theoryVariant,
    switchVariant: theorySwitchVariant,
    subscribe: () => () => {},
  });
}

function setBasics(completed: boolean, variant: 'standard' | 'short-deck' = 'standard'): void {
  const state = useAcademyStore.getState();
  useAcademyStore.setState({
    basicsProgress: { ...state.basicsProgress, completed },
    activeVariant: variant,
  });
}

function renderHub(hash?: string) {
  return render(
    <MemoryRouter initialEntries={[hash ? `/lesson${hash}` : '/lesson']}>
      <CourseHub />
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">
      {JSON.stringify({ path: location.pathname, state: location.state })}
    </div>
  );
}

/** 带路由落点的渲染：点击链接后可断言目标路径与来源 state */
function renderHubWithProbe() {
  return render(
    <MemoryRouter initialEntries={['/lesson']}>
      <Routes>
        <Route path="/lesson" element={<CourseHub />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

type ScrollCall = { el: Element; options?: ScrollIntoViewOptions | boolean };

// jsdom 未实现 scrollIntoView，注入记录桩以断言阶段锚点的滚动目标
let scrollCalls: ScrollCall[];
let originalScrollIntoView: Element['scrollIntoView'] | undefined;

beforeEach(() => {
  scrollCalls = [];
  originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (
    this: Element,
    options?: boolean | ScrollIntoViewOptions,
  ) {
    scrollCalls.push({ el: this, options });
  };
  theoryVariant = 'standard';
  theorySwitchVariant.mockClear();
  registerSources();
  setBasics(true);
});

afterEach(() => {
  cleanup();
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  }
});

describe('CourseHub', () => {
  it('渲染阶段路径与双泳道链接', () => {
    const { container } = renderHub();

    expect(screen.getByText('阶段路径')).toBeTruthy();
    expect(container.querySelector('a[href="/theory/chapter/t1-combinatorics"]')).toBeTruthy();
    expect(container.querySelector('a[href="/lesson/l1-basics"]')).toBeTruthy();
    expect(container.querySelector('a[href="/academy"]')).toBeTruthy();
    expect(container.querySelector('a[href="/theory"]')).toBeTruthy();
    // 阶段卡带 #hub-stage-N 锚点（返回枢纽时 scrollIntoView 的目标）
    expect(container.querySelector('#hub-stage-1')).toBeTruthy();
    expect(container.querySelector('#hub-stage-4')).toBeTruthy();
  });

  it('覆盖报告卡展示理论章节与课时映射概览', () => {
    renderHub();

    expect(screen.getByRole('heading', { name: '理论 · 实战覆盖' })).toBeTruthy();
    expect(screen.getByText('章已关联实战')).toBeTruthy();
    expect(screen.getByText('课有理论锚点')).toBeTruthy();
  });

  it('带 #hub-stage-N 进入时滚动到对应阶段卡', async () => {
    const { container } = renderHub('#hub-stage-4');
    const target = container.querySelector('#hub-stage-4');
    expect(target).toBeTruthy();

    await waitFor(() => expect(scrollCalls.length).toBeGreaterThan(0));
    expect(scrollCalls[0]!.el).toBe(target);
    expect(scrollCalls[0]!.options).toMatchObject({ behavior: 'smooth', block: 'start' });
  });

  it('阶段泳道链接携带 hub 来源与阶段序号', () => {
    const { container } = renderHubWithProbe();

    fireEvent.click(container.querySelector('#hub-stage-1 a[href="/theory/chapter/t1-combinatorics"]')!);

    expect(JSON.parse(screen.getByTestId('location').textContent ?? '{}')).toEqual({
      path: '/theory/chapter/t1-combinatorics',
      state: { courseFrom: { source: 'hub', stageIndex: 1 } },
    });
  });

  it('下一步 CTA 携带所属阶段序号', () => {
    const { container } = renderHubWithProbe();

    fireEvent.click(container.querySelector('[data-hub-action="next"]')!);

    expect(JSON.parse(screen.getByTestId('location').textContent ?? '{}')).toEqual({
      path: '/lesson/l1-basics',
      state: { courseFrom: { source: 'hub', stageIndex: 1 } },
    });
  });

  it('基础未完成时给出基础入门入口并锁定阶段', () => {
    setBasics(false);
    const { container } = renderHub();

    expect(screen.getByText('先完成基础入门')).toBeTruthy();
    expect(container.querySelector('a[href="/academy/basics"]')).toBeTruthy();
    expect(screen.getAllByText('锁定').length).toBeGreaterThan(0);
  });

  it('枢纽变体切换一次同时驱动策略与理论', () => {
    renderHub();

    fireEvent.click(screen.getByRole('button', { name: /单挑/ }));
    const headsUp = useAcademyStore.getState().activeVariant;
    expect(headsUp).toBe('heads-up');
    expect(theorySwitchVariant).toHaveBeenCalledTimes(1);
    expect(theorySwitchVariant.mock.calls[0]?.[0]).toBe(headsUp);

    fireEvent.click(screen.getByRole('button', { name: /短牌德州/ }));
    const shortDeck = useAcademyStore.getState().activeVariant;
    expect(shortDeck).toBe('short-deck');
    expect(theorySwitchVariant).toHaveBeenCalledTimes(2);
    expect(theorySwitchVariant.mock.calls[1]?.[0]).toBe(shortDeck);
  });

  it('冷启动时理论变体落后于策略，挂载后对齐一次', () => {
    theoryVariant = 'short-deck';
    renderHub();

    expect(useAcademyStore.getState().activeVariant).toBe('standard');
    expect(theorySwitchVariant).toHaveBeenCalledTimes(1);
    expect(theorySwitchVariant).toHaveBeenCalledWith('standard');
    expect(theoryVariant).toBe('standard');
  });

  it('标准变体阶段卡呈闭环步骤：01 概念 / 02 实战 / 03 自查，自查链接评估区锚点', () => {
    const { container } = renderHub();

    const stage1 = container.querySelector('#hub-stage-1');
    expect(stage1).toBeTruthy();
    expect(stage1!.textContent).toContain('01');
    expect(stage1!.textContent).toContain('02');
    expect(stage1!.textContent).toContain('03');
    expect(stage1!.textContent).toContain('自查与认证');
    const checkLink = stage1!.querySelector('a[href="/academy#assessment"]');
    expect(checkLink).toBeTruthy();
  });

  it('阶段卡双环分别播报理论 / 实战完成度', () => {
    renderHub();

    expect(screen.getAllByRole('img', { name: '概念 0/1' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('img', { name: '实战 0/1' }).length).toBeGreaterThan(0);
  });

  it('实战 chip 展示首个理论锚点的前置概念', () => {
    const { container } = renderHub();

    const stage1 = container.querySelector('#hub-stage-1');
    expect(stage1!.textContent).toContain('前置概念');
  });

  it('短牌没有理论锚点时显示概念待补充，实战仍在', () => {
    const original = STAGES.map((item) => item.theoryChapterIds);
    STAGES.forEach((item) => {
      item.theoryChapterIds = [];
    });
    setBasics(true, 'short-deck');
    const { container } = renderHub();

    expect(screen.getAllByText(/概念关联待补充/).length).toBeGreaterThan(0);
    expect(container.querySelector('a[href="/lesson/l1-basics"]')).toBeTruthy();
    // 非标准变体不呈自查步骤（检查点 / 认证只对标准开放）
    expect(container.querySelector('a[href="/academy#assessment"]')).toBeNull();
    STAGES.forEach((item, index) => {
      item.theoryChapterIds = original[index] ?? [];
    });
  });
});