import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Lesson } from '../types';
import { useAcademyStore } from '../store';
import { resetLessonSearchIndexCache } from '../utils/searchIndex';
import StrategySearchPage from './StrategySearchPage';

/**
 * 搜索页（P5）契约：
 * - 空查询 / 1 字符查询不触发全量正文加载
 * - 标题即时结果来自 manifest；正文/小测命中在全文加载完成后异步补充分区
 * - 同一索引只加载一次（跨查询复用缓存）
 * - 加载失败降级标题结果并可重试；查询切换时丢弃过期结果
 */

vi.mock('../data/lessons/loaders', () => ({
  loadAcademyLessonsForQuickDrill: vi.fn(),
}));

import { loadAcademyLessonsForQuickDrill } from '../data/lessons/loaders';

const loadMock = vi.mocked(loadAcademyLessonsForQuickDrill);

function makeLesson(id: string, content: string, question = '此处是题库题目吗？'): Lesson {
  return {
    id,
    level: 1,
    order: 1,
    title: '夹具课时',
    subtitle: '夹具副标题',
    duration: '5 分钟',
    content: [{ type: 'text', content }],
    quiz: [
      {
        id: `${id}-q1`,
        question,
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
        explanation: '夹具解析',
      },
    ],
  };
}

const fixtureLessons: Lesson[] = [
  makeLesson('l1-basics', '翻前率先加注前先清点筹码。BluffCatchToken 是夹具正文标记。'),
  makeLesson(
    'l1-position',
    '后位行动的力量不可低估：位置的力量优先于牌力。RangeCalibrationToken 是第二个夹具标记。',
  ),
];

function renderPage() {
  return render(
    <MemoryRouter>
      <StrategySearchPage />
    </MemoryRouter>,
  );
}

function typeQuery(value: string) {
  fireEvent.change(screen.getByRole('searchbox'), { target: { value } });
}

function searchBoxValue(): string {
  return (screen.getByRole('searchbox') as HTMLInputElement).value;
}

beforeEach(() => {
  resetLessonSearchIndexCache();
  loadMock.mockReset();
  useAcademyStore.getState().switchVariant('standard');
});

afterEach(() => {
  cleanup();
  resetLessonSearchIndexCache();
});

describe('StrategySearchPage：加载时机', () => {
  it('空查询与 1 字符查询不加载全文索引', () => {
    renderPage();
    expect(loadMock).not.toHaveBeenCalled();

    typeQuery('位');
    expect(searchBoxValue()).toBe('位');
    expect(loadMock).not.toHaveBeenCalled();
  });

  it('2 字符查询触发一次全量加载', async () => {
    loadMock.mockResolvedValue(fixtureLessons);
    renderPage();

    typeQuery('位置');

    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(1));
  });
});

describe('StrategySearchPage：结果', () => {
  it('标题命中即时出现，且不在正文分区重复', async () => {
    loadMock.mockResolvedValue(fixtureLessons);
    renderPage();

    typeQuery('位置的力量');

    const titleHits = await screen.findAllByRole('button', { name: '位置的力量' });
    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(1));
    expect(titleHits).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '位置的力量' })).toHaveLength(1);
  });

  it('正文命中异步补充分区，摘要围绕命中词', async () => {
    loadMock.mockResolvedValue(fixtureLessons);
    renderPage();

    typeQuery('BluffCatchToken');

    const hit = await screen.findByRole('button', { name: '德州扑克规则与牌型' });
    expect(hit.textContent).toContain('BluffCatchToken');
  });

  it('小测题干命中也能检索到', async () => {
    loadMock.mockResolvedValue([
      makeLesson('l1-basics', '普通正文。', 'QuizTokenMarker 何时弃牌？'),
    ]);
    renderPage();

    typeQuery('QuizTokenMarker');

    const hit = await screen.findByRole('button', { name: '德州扑克规则与牌型' });
    expect(hit.textContent).toContain('QuizTokenMarker');
  });

  it('同一索引跨查询复用缓存，只加载一次', async () => {
    loadMock.mockResolvedValue(fixtureLessons);
    renderPage();

    typeQuery('BluffCatchToken');
    await screen.findByRole('button', { name: '德州扑克规则与牌型' });

    typeQuery('RangeCalibrationToken');
    expect(await screen.findByText(/RangeCalibrationToken/)).toBeTruthy();
    expect(loadMock).toHaveBeenCalledTimes(1);
  });

  it('英文查询大小写不敏感', async () => {
    loadMock.mockResolvedValue(fixtureLessons);
    renderPage();

    typeQuery('bluffcatchtoken');

    expect(await screen.findByText(/BluffCatchToken/)).toBeTruthy();
  });

  it('无命中时展示空态', async () => {
    loadMock.mockResolvedValue(fixtureLessons);
    renderPage();

    typeQuery('zzz-not-exist');

    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByText(/BluffCatchToken/)).toBeNull();
  });
});

describe('StrategySearchPage：失败降级与竞态', () => {
  it('全文加载失败时保留标题结果并给出重试入口', async () => {
    loadMock.mockRejectedValueOnce(new Error('chunk load failed'));
    renderPage();

    typeQuery('位置');

    await waitFor(() => expect(screen.getByTestId('academy-search-retry')).toBeTruthy());
    expect(loadMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '位置的力量' })).toBeTruthy();

    loadMock.mockResolvedValueOnce(fixtureLessons);
    fireEvent.click(screen.getByTestId('academy-search-retry'));

    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(2));
  });

  it('重试成功后补上正文命中分区', async () => {
    loadMock.mockRejectedValueOnce(new Error('chunk load failed'));
    renderPage();

    typeQuery('RangeCalibrationToken');
    await waitFor(() => expect(screen.getByTestId('academy-search-retry')).toBeTruthy());

    loadMock.mockResolvedValueOnce(fixtureLessons);
    fireEvent.click(screen.getByTestId('academy-search-retry'));

    expect(await screen.findByText(/RangeCalibrationToken/)).toBeTruthy();
  });

  it('查询变化后丢弃过期结果', async () => {
    let release: (lessons: Lesson[]) => void = () => {};
    loadMock.mockReturnValue(
      new Promise<Lesson[]>((resolve) => {
        release = resolve;
      }),
    );
    renderPage();

    typeQuery('BluffCatchToken');
    await waitFor(() => expect(loadMock).toHaveBeenCalledTimes(1));

    typeQuery('RangeCalibrationToken');
    expect(searchBoxValue()).toBe('RangeCalibrationToken');

    release(fixtureLessons);

    expect(await screen.findByText(/RangeCalibrationToken/)).toBeTruthy();
    expect(screen.queryByText(/BluffCatchToken/)).toBeNull();
  });
});
