import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AcademyResume } from './AcademyResume';
import type { LevelSummary } from '../types';

/**
 * 首屏「继续学习」三态契约：
 * - fresh（未完成基础入门）：CTA 去基础入门
 * - continue（有活跃等级）：主 CTA 直达下一课，标题带课程名
 * - allDone（无活跃等级）：CTA 去速训，展示全部完成文案
 * - 三项统计（等级 / 课时 / 认证）与进度环取值来自 props
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function makeLevel(): LevelSummary {
  return {
    id: 'resume-l1',
    level: 1,
    title: '起始等级',
    description: '起始描述',
    icon: '🌱',
    unlockRequirement: '无',
    lessons: [
      {
        id: 'resume-lesson-a',
        level: 1,
        order: 1,
        title: '第一课',
        subtitle: '',
        duration: '5 min',
      },
      {
        id: 'resume-lesson-b',
        level: 1,
        order: 2,
        title: '第二课',
        subtitle: '',
        duration: '5 min',
      },
    ],
  };
}

function renderResume(overrides: Partial<Parameters<typeof AcademyResume>[0]> = {}) {
  return render(
    <MemoryRouter>
      <AcademyResume
        activeLevel={makeLevel()}
        completedLessons={[]}
        totalProgress={25}
        completedCount={10}
        totalLessons={36}
        levelsDoneCount={2}
        certifiedCount={3}
        basicsCompleted
        {...overrides}
      />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => cleanup());

describe('AcademyResume：三态主 CTA', () => {
  it('fresh：未完成基础入门时引导去基础入门', () => {
    renderResume({ basicsCompleted: false });
    expect(screen.getByText('从基础入门开始，掌握牌局基本功')).toBeTruthy();
    expect(screen.getByText('开始基础入门')).toBeTruthy();

    fireEvent.click(screen.getByText('开始基础入门'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/basics');
  });

  it('continue：展示下一课标题并直达课程页', () => {
    renderResume({ completedLessons: ['resume-lesson-a'] });
    expect(screen.getByText('继续学习：第二课')).toBeTruthy();
    expect(screen.getByText('继续学习')).toBeTruthy();

    fireEvent.click(screen.getByText('继续学习'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/resume-lesson-b');
  });

  it('allDone：无活跃等级时展示全部完成并引导速训', () => {
    renderResume({ activeLevel: null, totalProgress: 100, completedCount: 36 });
    expect(screen.getByText('恭喜，全部课程已学完！')).toBeTruthy();
    expect(screen.getByText('5 分钟速训')).toBeTruthy();

    fireEvent.click(screen.getByText('5 分钟速训'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/quick-drill');
  });
});

describe('AcademyResume：统计与进度环', () => {
  it('展示等级 / 课时 / 认证三项统计与进度环百分比', () => {
    const { container } = renderResume();
    expect(screen.getByText('已完成 2 级')).toBeTruthy();
    expect(screen.getByText('36 课时')).toBeTruthy();
    expect(screen.getByText('3 级认证')).toBeTruthy();
    expect(container.textContent).toContain('10/36');
    expect(screen.getByRole('img', { name: '25%' })).toBeTruthy();
  });

  it('继续态无副标题（不回退到提示文案）', () => {
    const { container } = renderResume();
    expect(container.textContent).not.toContain('完成全部课程后');
  });
});
