/**
 * 课时页学习导轨契约（jsdom）：
 * - 本 Level 课程按数据顺序全量渲染为真实路由链接
 * - 当前课时带 aria-current="page"，其余不带
 * - 进度按本级已完成课时计算，课程元信息（时长 / 题量）可见
 * - 学习导轨不含返回入口（返回由页头来源感知提供）
 */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import type { Lesson, LevelSummary } from '../types';
import { CourseStudyRail } from './CourseStudyRail';

afterEach(cleanup);

function makeLesson(order: number, id: string, title: string): Lesson {
  return {
    id,
    level: 1,
    order,
    title,
    subtitle: `${title}副标题`,
    duration: '12 min',
    content: [{ type: 'text', content: '正文' }],
    quiz: [],
  };
}

const lessons = [
  makeLesson(1, 'l1-rules', '规则与牌型'),
  makeLesson(2, 'l1-positions', '位置基础'),
  makeLesson(3, 'l1-betsizing', '下注尺度'),
];

const levelEntry: LevelSummary = {
  id: 'l1',
  level: 1,
  title: '入门地基',
  description: '规则与位置',
  icon: '🎯',
  lessons,
  unlockRequirement: '无',
};

function mount(lesson: Lesson, completedLessons: string[] = []) {
  return render(
    <MemoryRouter>
      <CourseStudyRail
        lesson={lesson}
        levelEntry={levelEntry}
        completedLessons={completedLessons}
      />
    </MemoryRouter>,
  );
}

describe('CourseStudyRail', () => {
  it('本级课程全量渲染为课时链接，当前课时标记 aria-current', () => {
    mount(lessons[1]!, ['l1-rules']);

    const links = screen.getAllByRole('link', { name: /规则与牌型|位置基础|下注尺度/ });
    expect(links).toHaveLength(lessons.length);
    links.forEach((link) => {
      expect(link.getAttribute('href')).toMatch(/^\/lesson\/l1-/);
    });
    expect(screen.getByRole('link', { name: /位置基础/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /下注尺度/ }).getAttribute('aria-current')).toBeNull();
  });

  it('进度按本级完成课时计算，课时元信息可见', () => {
    mount(lessons[1]!, ['l1-rules', 'l1-positions']);

    const progress = screen.getByRole('progressbar', { name: i18n.t('academy.courseView.railTitle') });
    expect(progress.getAttribute('aria-valuenow')).toBe('67');
    expect(screen.getByText(lessons[1]!.duration)).toBeTruthy();
    expect(
      screen.getByText(i18n.t('academy.courseView.quizCount', { count: lessons[1]!.quiz.length })),
    ).toBeTruthy();
  });
});
