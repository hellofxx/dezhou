import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import LearningTracksView from './LearningTracksView';
import { useAcademyStore } from '../store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { LEARNING_TRACKS } from '../data/learningTracks';

/**
 * 学习轨道契约：
 * - 轨道按顺序引用现有课程；进度 / 继续学习入口按完成情况派生
 * - 前置未满足的轨道禁用「选择此轨道」，并提供「去学习」跳首个缺失前置课程
 * - ?track= 参数高亮目标轨道
 * - 调试解锁解除轨道前置
 */

// jsdom 未实现 scrollIntoView；?track= 高亮会滚动到目标卡片
const originalScrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  }
});

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderAt(path = '/academy/tracks') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LearningTracksView />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

function selectButtons(): HTMLButtonElement[] {
  return [...document.querySelectorAll<HTMLButtonElement>('button')].filter((button) =>
    ['选择此轨道', '取消选择'].includes(button.textContent?.trim() ?? ''),
  );
}

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
  useDebugModeStore.getState().deactivate();
});

describe('LearningTracksView：轨道选择与进度', () => {
  it('渲染全部轨道，未满足前置的轨道禁用选择并提示去学习', () => {
    renderAt();
    expect(screen.getByText('学习轨道')).toBeTruthy();

    const selectable = selectButtons();
    expect(selectable).toHaveLength(LEARNING_TRACKS.length);
    const disabled = selectable.filter((button) => button.disabled);
    expect(disabled).toHaveLength(1); // 仅本土化路径有 prerequisiteLevelIds
    expect(disabled[0]!.textContent).toContain('选择此轨道');

    expect(screen.getAllByText(/建议先完成/).length).toBe(1);
    expect(screen.getByText('去学习 →')).toBeTruthy();
  });

  it('选择 / 取消选择轨道写入 store', () => {
    renderAt();
    const firstEnabled = selectButtons().find((button) => !button.disabled)!;
    fireEvent.click(firstEnabled);
    expect(useAcademyStore.getState().activeTrackId).toBe('track-beginner');
    expect(screen.getByText('取消选择')).toBeTruthy();

    fireEvent.click(screen.getByText('取消选择'));
    expect(useAcademyStore.getState().activeTrackId).toBeNull();
  });

  it('前置未满足时「去学习」跳转首个缺失的前置课程', () => {
    renderAt();
    fireEvent.click(screen.getByText('去学习 →'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-basics');
  });

  it('「继续学习」跳转轨道内下一门未完成课程', () => {
    renderAt();
    const continueButtons = screen.getAllByText('继续学习');
    expect(continueButtons.length).toBeGreaterThan(0);
    fireEvent.click(continueButtons[0]!);
    expect(screen.getByTestId('location').textContent).toBe(
      `/academy/lesson/${LEARNING_TRACKS[0]!.lessonIds[0]}`,
    );
  });

  it('完成轨道内全部课程后显示 100% 与完成标记', () => {
    for (const lessonId of LEARNING_TRACKS[0]!.lessonIds) {
      useAcademyStore.getState().completeLesson(lessonId);
    }
    renderAt();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getAllByText('10/10 课时').length).toBeGreaterThan(0);
  });
});

describe('LearningTracksView：高亮与调试解锁', () => {
  it('?track= 参数高亮目标轨道', () => {
    const { container } = renderAt('/academy/tracks?track=track-beginner');
    expect(container.querySelector('.ring-1')).not.toBeNull();
  });

  it('调试解锁后无禁用轨道', () => {
    useDebugModeStore.getState().activateWithCode('1337');
    renderAt();
    const disabled = selectButtons().filter((button) => button.disabled);
    expect(disabled).toHaveLength(0);
    expect(screen.queryAllByText('去学习 →')).toHaveLength(0);
  });
});
