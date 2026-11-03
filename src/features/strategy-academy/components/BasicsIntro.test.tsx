import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BasicsIntro from './BasicsIntro';
import { useAcademyStore } from '../store';
import { BASICS_STEPS } from '../data/basicsContent';

/**
 * 基础入门契约：
 * - 步骤推进 / 回退写入 store（updateBasicsStep）
 * - 词汇表步骤可搜索（中英文）与按分类筛选，无结果显示空态
 * - 最后一步「完成入门」写 completeBasics 并展示完成遮罩，倒计时后跳转首课
 */

const FIRST_LESSON_PROBE = 'lesson-l1-basics-probe';

function renderBasics() {
  return render(
    <MemoryRouter initialEntries={['/academy/basics']}>
      <Routes>
        <Route path="/academy/basics" element={<BasicsIntro />} />
        <Route path="/academy/lesson/l1-basics" element={<div>{FIRST_LESSON_PROBE}</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function stepDot(container: HTMLElement, title: string): HTMLButtonElement {
  const button = [...container.querySelectorAll('button')].find((b) =>
    b.textContent?.includes(title),
  );
  if (!button) throw new Error(`未找到步骤按钮：${title}`);
  return button as HTMLButtonElement;
}

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
  vi.useRealTimers();
});

describe('BasicsIntro：步骤导航', () => {
  it('渲染首步与步骤计数，下一步/上一步同步 store', () => {
    const { container } = renderBasics();
    expect(screen.getByText('德州扑克基础入门')).toBeTruthy();
    expect(container.textContent).toContain(`Step 1 / ${BASICS_STEPS.length}`);
    // 步骤圆点与正文标题各渲染一次
    expect(screen.getAllByText(BASICS_STEPS[0]!.title).length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByText('下一步'));
    expect(container.textContent).toContain(`Step 2 / ${BASICS_STEPS.length}`);
    expect(useAcademyStore.getState().basicsProgress.currentStep).toBe(1);

    fireEvent.click(screen.getByText('上一步'));
    expect(container.textContent).toContain(`Step 1 / ${BASICS_STEPS.length}`);
    expect(useAcademyStore.getState().basicsProgress.currentStep).toBe(0);
    // 首步「上一步」禁用
    expect(screen.getByText('上一步').closest('button')?.disabled).toBe(true);
  });

  it('点击步骤圆点直达对应步骤', () => {
    const { container } = renderBasics();
    const target = BASICS_STEPS[3]!;
    fireEvent.click(stepDot(container, target.title));
    expect(container.textContent).toContain(`Step 4 / ${BASICS_STEPS.length}`);
    expect(useAcademyStore.getState().basicsProgress.currentStep).toBe(3);
  });
});

describe('BasicsIntro：词汇表', () => {
  it('词汇表步骤展示搜索框、分类标签与默认分类术语', async () => {
    const { container } = renderBasics();
    fireEvent.click(stepDot(container, BASICS_STEPS.at(-1)!.title));

    // AnimatePresence mode="wait"：等待上一步退出动画完成
    const search = await screen.findByPlaceholderText('搜索术语（中英文）...');
    expect(search).toBeTruthy();
    expect(screen.getByText('基础')).toBeTruthy();
    expect(screen.getByText('手牌')).toBeTruthy();
    expect(screen.getByText('行动')).toBeTruthy();
    expect(screen.getByText('策略')).toBeTruthy();
    expect(screen.getByText('Pot')).toBeTruthy();
    expect(screen.getByText('底池')).toBeTruthy();
  });

  it('分类标签切换后展示对应类别术语', async () => {
    const { container } = renderBasics();
    fireEvent.click(stepDot(container, BASICS_STEPS.at(-1)!.title));
    await screen.findByPlaceholderText('搜索术语（中英文）...');

    fireEvent.click(screen.getByText('手牌'));
    expect(screen.getByText('Suited')).toBeTruthy();
    expect(screen.queryByText('Pot')).toBeNull();
  });

  it('搜索中英文术语并按关键词过滤', async () => {
    const { container } = renderBasics();
    fireEvent.click(stepDot(container, BASICS_STEPS.at(-1)!.title));

    const search = await screen.findByPlaceholderText('搜索术语（中英文）...');
    fireEvent.change(search, { target: { value: 'EV' } });
    expect(screen.getByText('EV (Expected Value)')).toBeTruthy();
    expect(screen.queryByText('Pot')).toBeNull();
  });

  it('无匹配结果时显示空态', async () => {
    const { container } = renderBasics();
    fireEvent.click(stepDot(container, BASICS_STEPS.at(-1)!.title));

    const search = await screen.findByPlaceholderText('搜索术语（中英文）...');
    fireEvent.change(search, {
      target: { value: 'zzzz-no-term' },
    });
    expect(screen.getByText('未找到匹配的术语')).toBeTruthy();
  });
});

describe('BasicsIntro：完成流程', () => {
  it('最后一步完成入门写入 store、展示遮罩并在倒计时后跳转首课', () => {
    vi.useFakeTimers();
    const { container } = renderBasics();
    fireEvent.click(stepDot(container, BASICS_STEPS.at(-1)!.title));

    fireEvent.click(screen.getByText('完成入门'));
    expect(useAcademyStore.getState().basicsProgress.completed).toBe(true);
    expect(screen.getByText('基础入门完成！')).toBeTruthy();
    expect(container.textContent).toContain('即将跳转到第一课... 3s');

    // 每次 tick 后 React 才重新调度下一轮 setTimeout，需逐秒推进
    for (let i = 0; i < 4; i += 1) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    expect(screen.getByText(FIRST_LESSON_PROBE)).toBeTruthy();
  });
});
