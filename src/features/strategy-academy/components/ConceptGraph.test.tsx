import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ConceptGraph } from './ConceptGraph';
import { useAcademyStore } from '../store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { getAllLessonSummaries, getTotalLessonCount } from '../utils/academyMeta';

/**
 * 概念图谱契约：
 * - 桌面端 SVG 渲染全量节点 + 图例；点击 / Enter 触发 onNodeClick
 * - 完成态 / 进行中 / 未解锁状态随 academy store 实时反映（并按 LevelInfo 条目判定）
 * - 移动端降级为分组卡片列表，点击课程仍可跳转
 * - 调试解锁旁路本土课/Level 节点门禁
 */

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
}

function nodeGroups(container: HTMLElement): SVGGElement[] {
  return [...container.querySelectorAll<SVGGElement>('g[role="button"]')];
}

afterEach(() => {
  cleanup();
  setViewportWidth(1024);
  useAcademyStore.getState().resetProgress();
  useDebugModeStore.getState().deactivate();
});

describe('ConceptGraph：桌面 SVG', () => {
  it('渲染全量 Lesson 节点与图例', () => {
    setViewportWidth(1200);
    const onNodeClick = vi.fn();
    const { container } = render(<ConceptGraph onNodeClick={onNodeClick} />);

    expect(container.querySelector('svg')).not.toBeNull();
    expect(nodeGroups(container)).toHaveLength(getTotalLessonCount());
    expect(screen.getByText('已完成')).toBeTruthy();
    expect(screen.getByText('进行中')).toBeTruthy();
    expect(screen.getByText('未解锁')).toBeTruthy();
    expect(screen.getByText('适应屏幕')).toBeTruthy();
  });

  it('点击节点回调 onNodeClick；Enter 键等价触发', () => {
    setViewportWidth(1200);
    const onNodeClick = vi.fn();
    const { container } = render(<ConceptGraph onNodeClick={onNodeClick} />);
    const nodes = nodeGroups(container);
    const lessons = getAllLessonSummaries();

    fireEvent.click(nodes[0]!);
    expect(onNodeClick).toHaveBeenCalledWith(lessons[0]!.id);

    // roving tabindex：先用方向键把 active 移到第二项，Enter 触发当前 active
    fireEvent.keyDown(nodes[0]!, { key: 'ArrowRight' });
    fireEvent.keyDown(nodes[0]!, { key: 'Enter' });
    expect(onNodeClick).toHaveBeenCalledWith(lessons[1]!.id);
  });

  it('节点状态随进度变化：completed / current 在 hover tooltip 中标注', async () => {
    setViewportWidth(1200);
    useAcademyStore.getState().completeBasics();
    useAcademyStore.getState().completeLesson('l1-basics');

    const { container } = render(<ConceptGraph onNodeClick={() => {}} />);
    const nodes = nodeGroups(container);

    fireEvent.mouseEnter(nodes[0]!);
    // 图例本身也含「已完成」，tooltip 出现后匹配数增加
    await waitFor(() => expect(screen.getAllByText(/已完成/).length).toBeGreaterThan(1));

    fireEvent.mouseLeave(nodes[0]!);
    fireEvent.mouseEnter(nodes[1]!);
    await waitFor(() => expect(screen.getAllByText(/进行中/).length).toBeGreaterThan(1));
  });

  it('L4 拆分为 4A/4B 时 level 行 key 不重复（无 React 重复 key 警告）', () => {
    setViewportWidth(1200);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ConceptGraph onNodeClick={() => {}} />);
    const duplicateKeyWarnings = errorSpy.mock.calls.filter((args) =>
      String(args[0]).includes('same key'),
    );
    errorSpy.mockRestore();
    expect(duplicateKeyWarnings).toEqual([]);
  });

  it('未完成基础入门时 L1 节点为未解锁状态', () => {
    setViewportWidth(1200);
    const { container } = render(<ConceptGraph onNodeClick={() => {}} />);
    fireEvent.mouseEnter(nodeGroups(container)[0]!);
    expect(screen.getAllByText(/未解锁/).length).toBeGreaterThan(1);
  });
});

describe('ConceptGraph：移动端卡片列表', () => {
  it('窄屏渲染课程按钮列表，点击课程回调', async () => {
    setViewportWidth(375);
    const onNodeClick = vi.fn();
    const { container } = render(<ConceptGraph onNodeClick={onNodeClick} />);

    // 等待响应式检测切换到移动端卡片视图（SVG 卸载）
    await waitFor(() => expect(container.querySelector('svg')).toBeNull());
    const lessons = getAllLessonSummaries();
    const buttons = [...container.querySelectorAll('button')];
    expect(buttons.length).toBeGreaterThanOrEqual(lessons.length);

    fireEvent.click(buttons[0]!);
    expect(onNodeClick).toHaveBeenCalledWith(lessons[0]!.id);
    // 未解锁 Level 显示锁标记
    expect(container.textContent).toContain('🔒');
  });

  it('调试解锁激活时全部 Level 解锁（无锁标记）', async () => {
    setViewportWidth(375);
    useDebugModeStore.getState().activateWithCode('1337');
    const { container } = render(<ConceptGraph onNodeClick={() => {}} />);

    await waitFor(() => expect(container.querySelector('svg')).toBeNull());
    expect(container.textContent).not.toContain('🔒');
  });
});
