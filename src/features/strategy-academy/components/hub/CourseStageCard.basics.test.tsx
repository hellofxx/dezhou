import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CourseStageCard from './CourseStageCard';
import type { HubStage } from '../../utils/hubStages';

const STAGE: HubStage = {
  id: 'journey-stage-2',
  index: 2,
  level: 3,
  titleKey: 'dashboard.path.stage2',
  subtitleKey: 'dashboard.path.stage2Sub',
  lessonIds: ['l3sd-intro'],
  theoryChapterIds: ['t3sd-rankings'],
  basicsChapterIds: ['t1sd-outs'],
  supplementalChapterIds: ['t4sd-range-advantage'],
  doneLessons: 0,
  totalLessons: 1,
  doneChapters: 0,
  totalChapters: 1,
  unlocked: true,
  current: true,
  complete: false,
  theoryKnown: true,
  theoryUnavailable: false,
};

const LABELS: Record<string, string> = {
  't3sd-rankings': '牌力重排',
  't1sd-outs': '短牌 Outs',
  't4sd-range-advantage': '范围优势',
};

function renderCard() {
  return render(
    <MemoryRouter>
      <CourseStageCard
        stage={STAGE}
        chapterLabels={LABELS}
        lessonLabels={{ 'l3sd-intro': '短牌德州入门' }}
        completedLessonIds={new Set()}
        completedChapterIds={new Set()}
        drillLessonIds={new Set()}
      />
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('CourseStageCard 基础必读', () => {
  it('基础章常驻展示，不进入折叠的补充阅读', () => {
    const { container } = renderCard();
    const basicsLink = container.querySelector('a[href="/theory/chapter/t1sd-outs"]');
    const supplementalLink = container.querySelector(
      'a[href="/theory/chapter/t4sd-range-advantage"]',
    );

    expect(screen.getByText('基础必读')).toBeTruthy();
    expect(basicsLink).toBeTruthy();
    expect(basicsLink?.closest('details')).toBeNull();
    expect(supplementalLink?.closest('details')).toBeTruthy();
  });
});