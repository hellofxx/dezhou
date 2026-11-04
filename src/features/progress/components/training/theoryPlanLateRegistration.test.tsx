/**
 * 理论卡晚注册自愈（jsdom）：Dashboard 先渲染、theory 数据源后注册的场景。
 *
 * 背景：theory-academy 的 bootstrap 可能在首页首帧之后才执行（懒加载 / 路由分包）。
 * 计划生成端经 theoryDataSourceRegistry 查询章节，首帧必然取不到 → 理论卡缺失。
 * Dashboard 通过 useTheoryPlanRevision 把注册表通知透传成 useMemo 依赖，
 * 注册完成即重算补齐。本文件锁定该链路（含既有订阅者退订后不泄漏监听）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, useMemo } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import DailyTrainingPlan from './DailyTrainingPlan';
import { generateCrossModuleDailyPlan } from '../../utils/dailyTrainingPlan';
import type { DailyRecommendation } from '../../utils/dailyTrainingPlan';
import { useTheoryPlanRevision } from '../../hooks/useTheoryPlanRevision';
import { registerTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { TheoryChapterMeta } from '@/shared/types/theoryDataSource';

const CHAPTER: TheoryChapterMeta = {
  chapterId: 'fixture-chapter-a',
  levelId: 't1',
  title: '组合学与起手牌计数',
  titleKey: 'theory.chapterTitle.fixture-chapter-a',
  route: '/theory/chapter/fixture-chapter-a',
  estimatedMinutes: 12,
};

/** 与 Dashboard 同构的接线：revision 作为计划 memo 的依赖 */
let lastPlan: DailyRecommendation[] = [];

function Harness() {
  const revision = useTheoryPlanRevision();
  const plan = useMemo(() => generateCrossModuleDailyPlan([], [], [], 0), [revision]);
  lastPlan = plan;
  return <DailyTrainingPlan recommendations={plan} onDismiss={() => {}} />;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  lastPlan = [];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('理论卡晚注册自愈', () => {
  it('首帧无理论卡 → 数据源注册后自动重算出现 theory-chapter 卡', () => {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Harness />
        </MemoryRouter>,
      );
    });
    expect(lastPlan.filter((rec) => rec.type === 'theory-chapter')).toHaveLength(0);

    act(() => {
      registerTheoryDataSource({ findNextChapter: () => CHAPTER });
    });

    const chapter = lastPlan.filter((rec) => rec.type === 'theory-chapter');
    expect(chapter).toHaveLength(1);
    expect(chapter[0]?.route).toBe('/theory/chapter/fixture-chapter-a');
  });

  it('注册后渲染：章节标题回落数据层中文、reason 标签走 dashboard 词典，均不裸露 i18n key', () => {
    act(() => {
      registerTheoryDataSource({ findNextChapter: () => CHAPTER });
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Harness />
        </MemoryRouter>,
      );
    });
    const text = container.textContent ?? '';
    expect(text).toContain('组合学与起手牌计数');
    expect(text).toContain('理论章节');
    expect(text).not.toContain('theory.chapterTitle.');
    expect(text).not.toContain('dashboard.dataPlan.');
  });
});
