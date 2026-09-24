import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import CourseDoneView from './CourseDoneView';
import type { LearningTrack } from '../types';

// P3: 完成页按钮组测试 — hasPractice 控制「重新实战」按钮渲染，onRestart 携带 target 回调
describe('CourseDoneView 完成页按钮组', () => {
  let container: HTMLDivElement;
  let root: Root;

  const baseProps = {
    isDrill: false,
    quizScore: 80,
    drillResult: null,
    nextLesson: undefined,
    relatedTracks: [] as LearningTrack[],
    completedLessons: [] as string[],
    onBack: () => {},
    onNext: () => {},
    onRestart: () => {},
    onNavigateToTrack: () => {},
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('hasPractice=true 渲染「重新实战」按钮，点击回调 onRestart(\'practice\')', () => {
    const onRestart = vi.fn();
    act(() => {
      root.render(<CourseDoneView {...baseProps} hasPractice onRestart={onRestart} />);
    });

    const practiceButtons = [...container.querySelectorAll('button')].filter((b) =>
      b.textContent?.includes('重新实战'),
    );
    expect(practiceButtons).toHaveLength(1);
    expect(practiceButtons[0]!.textContent).toContain('重新实战');

    act(() => {
      practiceButtons[0]!.click();
    });
    expect(onRestart).toHaveBeenCalledWith('practice');
  });

  it('hasPractice=false 不渲染「重新实战」按钮，仅保留「重学本课」', () => {
    const onRestart = vi.fn();
    act(() => {
      root.render(<CourseDoneView {...baseProps} onRestart={onRestart} />);
    });

    const practiceButtons = [...container.querySelectorAll('button')].filter((b) =>
      b.textContent?.includes('重新实战'),
    );
    expect(practiceButtons).toHaveLength(0);

    const restartButtons = [...container.querySelectorAll('button')].filter((b) =>
      b.textContent?.includes('重学本课'),
    );
    expect(restartButtons).toHaveLength(1);

    act(() => {
      restartButtons[0]!.click();
    });
    expect(onRestart).toHaveBeenCalledWith('units');
  });

  it('hasPractice=true 时「重学本课」点击回调 onRestart(\'units\')', () => {
    const onRestart = vi.fn();
    act(() => {
      root.render(<CourseDoneView {...baseProps} hasPractice onRestart={onRestart} />);
    });

    const restartButtons = [...container.querySelectorAll('button')].filter((b) =>
      b.textContent?.includes('重学本课'),
    );
    expect(restartButtons).toHaveLength(1);

    act(() => {
      restartButtons[0]!.click();
    });
    expect(onRestart).toHaveBeenCalledWith('units');
  });
});
