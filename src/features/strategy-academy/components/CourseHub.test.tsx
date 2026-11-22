import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { registerAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import { registerTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { AcademyLearningStage } from '@/shared/types/academyDataSource';
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
  { chapterId: 't1-combinatorics', levelId: 't1', tier: 'basic' as const },
  { chapterId: 't1-variance', levelId: 't1', tier: 'basic' as const },
  { chapterId: 't3-extra', levelId: 't3', tier: 'basic' as const },
];

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

function renderHub() {
  return render(
    <MemoryRouter>
      <CourseHub />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  registerSources();
  setBasics(true);
});

afterEach(cleanup);

describe('CourseHub', () => {
  it('渲染阶段路径与双泳道链接', () => {
    const { container } = renderHub();

    expect(screen.getByText('阶段路径')).toBeTruthy();
    expect(container.querySelector('a[href="/theory/chapter/t1-combinatorics"]')).toBeTruthy();
    expect(container.querySelector('a[href="/lesson/l1-basics"]')).toBeTruthy();
    expect(container.querySelector('a[href="/academy"]')).toBeTruthy();
    expect(container.querySelector('a[href="/theory"]')).toBeTruthy();
  });

  it('基础未完成时给出基础入门入口并锁定阶段', () => {
    setBasics(false);
    const { container } = renderHub();

    expect(screen.getByText('先完成基础入门')).toBeTruthy();
    expect(container.querySelector('a[href="/academy/basics"]')).toBeTruthy();
    expect(screen.getAllByText('锁定').length).toBeGreaterThan(0);
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
    STAGES.forEach((item, index) => {
      item.theoryChapterIds = original[index] ?? [];
    });
  });
});