import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import type { TheoryChapterSummary, TheoryLevelSummary } from '../types';
import { TheoryResume } from './TheoryResume';

/**
 * 首屏「继续学习」三态契约（jsdom）。
 * - fresh（本变体一页未读）：引导开始第一课 → 首个等级首章
 * - continue（有活跃等级）：标题带下一章名称，CTA 直达首个未读章
 * - allDone（无活跃等级）：CTA 去策略学院
 * - 进度环与三项统计取值来自 props；无活跃等级时不触发预取
 *
 * 未覆盖（jsdom 无法判定）：<768px 布局、悬停预取的实际网络收益。
 */

MotionGlobalConfig.skipAnimations = true;

const loadSpy = vi.hoisted(() => vi.fn());

// 懒加载边界：记录预取调用，其余行为保持真实实现
vi.mock('../data/levels/loaders', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../data/levels/loaders')>();
  return {
    ...actual,
    loadTheoryLevelById: (levelId: string) => {
      loadSpy(levelId);
      return actual.loadTheoryLevelById(levelId);
    },
  };
});

function makeChapter(id: string, order: number): TheoryChapterSummary {
  return {
    id,
    level: 1,
    order,
    title: `${id} 标题`,
    subtitle: '',
    duration: '10 min',
    variant: 'standard',
  };
}

const chapters = [makeChapter('resume-c1', 1), makeChapter('resume-c2', 2)];

function makeLevel(): TheoryLevelSummary {
  return {
    id: 't1',
    level: 1,
    tier: 'basic',
    title: 'T1 标题',
    description: 'T1 描述',
    icon: '🎲',
    chapters,
    unlockRequirement: '无',
    practiceRecommendations: { lessons: [] },
    variant: 'standard',
  };
}

const baseProps: Parameters<typeof TheoryResume>[0] = {
  activeLevel: makeLevel(),
  completedChapters: [],
  totalProgress: 0,
  completedCount: 0,
  totalChapters: 10,
  levelsDoneCount: 0,
  avgScore: 0,
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderResume(overrides: Partial<Parameters<typeof TheoryResume>[0]> = {}) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryResume {...baseProps} {...overrides} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** 卡片内唯一的按钮即主 CTA */
function clickCta() {
  fireEvent.click(screen.getByRole('button'));
}

function location(): string {
  return screen.getByTestId('location').textContent ?? '';
}

beforeEach(() => {
  loadSpy.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('TheoryResume 三态主 CTA', () => {
  it('fresh：展示开启文案并直达首个等级首章', () => {
    renderResume();

    expect(screen.getByText(i18n.t('theory.resume.eyebrowFresh'))).toBeTruthy();
    expect(screen.getByText(i18n.t('theory.resume.freshHeadline'))).toBeTruthy();
    expect(screen.getByText(i18n.t('theory.resume.freshSub'))).toBeTruthy();
    expect(screen.getByRole('button').textContent).toContain(i18n.t('theory.resume.startChapter'));

    clickCta();
    expect(location()).toBe('/theory/chapter/resume-c1');
  });

  it('fresh 且无活跃等级时点击不跳转（无章节可开始）', () => {
    renderResume({ activeLevel: null });

    expect(screen.getByText(i18n.t('theory.resume.freshHeadline'))).toBeTruthy();
    clickCta();
    expect(location()).toBe('/theory');
  });

  it('continue：标题带首个未读章名称并直达该章', () => {
    renderResume({ completedChapters: ['resume-c1'], completedCount: 1, totalProgress: 50 });

    expect(
      screen.getByText(i18n.t('theory.resume.continueChapter', { title: 'resume-c2 标题' })),
    ).toBeTruthy();
    expect(screen.getByRole('button').textContent).toContain(i18n.t('theory.resume.continueCta'));
    // continue 态不渲染副标题
    expect(screen.queryByText(i18n.t('theory.resume.freshSub'))).toBeNull();

    clickCta();
    expect(location()).toBe('/theory/chapter/resume-c2');
  });

  it('continue 且本等级章节全读完时回退到首章（不跳空）', () => {
    renderResume({
      completedChapters: ['resume-c1', 'resume-c2'],
      completedCount: 2,
      totalProgress: 100,
    });

    clickCta();
    expect(location()).toBe('/theory/chapter/resume-c1');
  });

  it('allDone：无活跃等级时展示完成文案并去策略学院', () => {
    const { container } = renderResume({ activeLevel: null, completedCount: 10, totalProgress: 100 });

    // eyebrow 与主标题同文案，故两处命中
    expect(screen.getAllByText(i18n.t('theory.resume.allDone'))).toHaveLength(2);
    expect(container.querySelector('.section-eyebrow')?.textContent).toBe(
      i18n.t('theory.resume.allDone'),
    );
    expect(screen.getByText(i18n.t('theory.resume.allDoneSub'))).toBeTruthy();
    expect(screen.getByRole('button').textContent).toContain(i18n.t('theory.bridge.cta'));

    clickCta();
    expect(location()).toBe('/academy');
  });
});

describe('TheoryResume 统计与预取', () => {
  it('进度环与三项统计取自 props', () => {
    const { container } = renderResume({
      totalProgress: 40,
      completedCount: 4,
      totalChapters: 10,
      levelsDoneCount: 1,
      avgScore: 88,
    });

    expect(screen.getByRole('img', { name: '40%' })).toBeTruthy();
    expect(container.textContent).toContain('4/10');
    expect(container.textContent).toContain(i18n.t('theory.resume.levelsDoneLabel'));
    expect(container.textContent).toContain('88');
  });

  it('悬停/聚焦卡片时只预取当前活跃等级', () => {
    const { container } = renderResume();
    const section = container.querySelector('section');
    expect(section, '缺少 Hero 容器').not.toBeNull();

    fireEvent.pointerOver(section!);
    expect(loadSpy).toHaveBeenCalledWith('t1');

    loadSpy.mockClear();
    fireEvent.focus(section!);
    expect(loadSpy).toHaveBeenCalledWith('t1');
  });

  it('无活跃等级时预取为空操作', () => {
    const { container } = renderResume({ activeLevel: null });
    fireEvent.pointerOver(container.querySelector('section')!);
    expect(loadSpy).not.toHaveBeenCalled();
  });
});
