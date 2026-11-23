import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseStageCard from './CourseStageCard';
import type { HubStage } from '../../utils/hubStages';

afterEach(() => cleanup());

function makeStage(overrides: Partial<HubStage> = {}): HubStage {
  return {
    id: 'journey-stage-1',
    index: 1,
    level: 1,
    titleKey: 'dashboard.path.stage1',
    subtitleKey: 'dashboard.path.stage1Sub',
    lessonIds: ['l1-basics'],
    theoryChapterIds: ['t1-combinatorics'],
    supplementalChapterIds: [],
    doneLessons: 0,
    totalLessons: 1,
    doneChapters: 0,
    totalChapters: 1,
    unlocked: true,
    current: true,
    complete: false,
    theoryKnown: true,
    theoryUnavailable: false,
    ...overrides,
  };
}

const CHAPTER_LABELS = { 't1-combinatorics': '组合数学基础' };

function renderCard(stage: HubStage, showCheckStep = true) {
  return render(
    <MemoryRouter>
      <CourseStageCard
        stage={stage}
        chapterLabels={CHAPTER_LABELS}
        lessonLabels={{ 'l1-basics': '基础导入', 'unknown-lesson': '未登记课' }}
        completedLessonIds={new Set()}
        completedChapterIds={new Set()}
        drillLessonIds={new Set()}
        showCheckStep={showCheckStep}
      />
    </MemoryRouter>,
  );
}

describe('CourseStageCard 学习闭环呈现', () => {
  it('标准变体显示 01 概念 / 02 实战 / 03 自查，自查链接评估区锚点', () => {
    const { container } = renderCard(makeStage());

    expect(container.textContent).toContain('01');
    expect(container.textContent).toContain('02');
    expect(container.textContent).toContain('03');
    expect(container.textContent).toContain('自查与认证');
    expect(container.querySelector('a[href="/academy#assessment"]')).toBeTruthy();
  });

  it('非标准变体隐藏自查步骤（两步闭环）', () => {
    const { container } = renderCard(makeStage(), false);

    expect(container.textContent).toContain('01');
    expect(container.textContent).toContain('02');
    expect(container.textContent).not.toContain('03');
    expect(container.querySelector('a[href="/academy#assessment"]')).toBeNull();
  });

  it('双环分别播报理论与实战完成度', () => {
    renderCard(makeStage({ doneLessons: 1 }));

    expect(screen.getByRole('img', { name: '概念 0/1' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '实战 1/1' })).toBeTruthy();
  });

  it('理论不可用时双环占位，不伪造数据', () => {
    renderCard(makeStage({ theoryChapterIds: [], totalChapters: 0, theoryUnavailable: true }));

    expect(screen.getByRole('img', { name: '概念暂无数据' })).toBeTruthy();
    expect(screen.getByRole('img', { name: '实战 0/1' })).toBeTruthy();
  });

  it('有锚点的实战 chip 显示前置概念，无锚点课时降级不显示', () => {
    const { container } = renderCard(
      makeStage({ lessonIds: ['l1-basics', 'unknown-lesson'], totalLessons: 2 }),
    );

    const anchors = container.querySelectorAll('a[href^="/lesson/"]');
    expect(anchors.length).toBe(2);
    expect(container.textContent).toContain('前置概念：组合数学基础');
    expect(container.textContent).not.toContain('前置概念：undefined');
    expect(container.querySelector('a[href="/lesson/unknown-lesson"]')!.textContent).not.toContain(
      '前置概念',
    );
  });
});