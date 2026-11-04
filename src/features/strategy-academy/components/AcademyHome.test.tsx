import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AcademyHome from './AcademyHome';
import { useAcademyStore } from '../store';
import { getLevelSummariesByVariant, getTotalLessonCount } from '../utils/academyMeta';

/**
 * 学院首页组合冒烟：
 * - 零状态（无课程进度且未完成基础入门）：首屏单一「从第一课开始」路径卡，零值指标（0% 环 / 课时 / 认证）不渲染
 * - 课程阶梯保留，首个 Level 呈现为「起点」而非一片锁定死路（不改 gating）
 * - 有进度后恢复 Hero 完整布局
 * - 变体切换写入 store 并联动副标题
 */

function renderHome() {
  return render(
    <MemoryRouter>
      <AcademyHome />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

describe('AcademyHome：零状态渐进披露', () => {
  it('零状态首屏只给单一入口路径卡，CTA 指向基础入门', async () => {
    const { container } = renderHome();
    const totalLessons = getTotalLessonCount();

    expect(screen.getByText('从第一课开始')).toBeTruthy();
    const cta = screen.getByRole('link', { name: /开始基础入门/ });
    expect(cta.getAttribute('href')).toBe('/academy/basics');

    // 零值指标被隐藏：无 0% 进度环，也无「课时 / 认证」统计
    expect(container.querySelector('.academy-hero-stats')).toBeNull();
    expect(screen.queryByText('0%')).toBeNull();
    expect(screen.queryByText(`${totalLessons} 课时`)).toBeNull();
    expect(screen.queryByText('0 级认证')).toBeNull();

    // 工具入口与今日计划仍在（非首屏主焦点，但保留可达性）
    expect(screen.getByText('学习工具')).toBeTruthy();
    expect(screen.getByText('5 分钟速训')).toBeTruthy();
    expect(screen.getByText('知识图谱')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('今日计划')).toBeTruthy());
  });

  it('零状态保留课程阶梯，首个 Level 呈现为起点并给出入口提示', () => {
    const { container } = renderHome();

    expect(screen.getByText('课程阶梯')).toBeTruthy();

    const startRow = container.querySelector('[data-start="true"]');
    expect(startRow).toBeTruthy();
    expect(startRow?.textContent).toContain('起点');
    expect(startRow?.textContent).toContain('先完成基础入门，即可进入 Level 1');
    // 起点行仍按 gating 判定（未完成基础入门时不可展开）
    expect(startRow?.querySelector('button')?.hasAttribute('disabled')).toBe(true);
  });
});

describe('AcademyHome：有进度后恢复完整布局', () => {
  it('渲染 Hero、变体切换、课程阶梯、今日计划与学习工具', async () => {
    useAcademyStore.getState().completeBasics();
    renderHome();

    expect(screen.getByText('继续学习：德州扑克规则与牌型')).toBeTruthy();
    expect(screen.getByText('选择游戏变体')).toBeTruthy();
    expect(screen.getByText('课程阶梯')).toBeTruthy();
    expect(screen.getByText('学习工具')).toBeTruthy();
    expect(screen.getByText('5 分钟速训')).toBeTruthy();
    expect(screen.getByText('知识图谱')).toBeTruthy();
    // 零状态路径卡退出
    expect(screen.queryByText('从第一课开始')).toBeNull();

    // DailyPlanCard 挂载 effect 惰性生成今日计划
    await waitFor(() => expect(screen.getByText('今日计划')).toBeTruthy());
  });

  it('切换变体写入 store，副标题联动；切回标准变体', () => {
    renderHome();

    fireEvent.click(screen.getByText('短牌德州'));
    expect(useAcademyStore.getState().activeVariant).toBe('short-deck');

    fireEvent.click(screen.getByText('标准德州'));
    expect(useAcademyStore.getState().activeVariant).toBe('standard');
  });

  it('基础入门完成后 Hero 进入学习中态，阶梯不再全部锁定', () => {
    useAcademyStore.getState().completeBasics();
    const { container } = renderHome();

    expect(screen.getByText('继续学习：德州扑克规则与牌型')).toBeTruthy();
    expect(screen.getByText('你在这里')).toBeTruthy();
    // 有进度态下不再渲染零状态起点标记
    expect(container.querySelector('[data-start="true"]')).toBeNull();
  });
});

describe('AcademyHome：学习工具与检查点入口', () => {
  it('工具格提供定位测评、我的收藏与参考书目入口', () => {
    renderHome();

    expect(screen.getByText('定位测评')).toBeTruthy();
    expect(screen.getByText('我的收藏')).toBeTruthy();
    expect(screen.getByText('参考书目')).toBeTruthy();
  });

  it('已完成 Level 优先成为检查点入口，并切换为可自查文案', () => {
    useAcademyStore.getState().completeBasics();
    const level1 = getLevelSummariesByVariant('standard')[0];
    expect(level1).toBeTruthy();
    for (const lesson of level1?.lessons ?? []) {
      useAcademyStore.getState().completeLesson(lesson.id);
    }
    renderHome();

    const entry = screen.getByRole('link', { name: /L1 检查点/ });
    expect(entry.getAttribute('href')).toBe('/academy/checkpoint/1');
    expect(screen.getByText('12 题混合自查，只看成绩不发证')).toBeTruthy();
  });

  it('侧栏检查点入口指向当前 Level，本级未完成时给出锁定提示', () => {
    useAcademyStore.getState().completeBasics();
    renderHome();

    const entry = screen.getByRole('link', { name: /L1 检查点/ });
    expect(entry.getAttribute('href')).toBe('/academy/checkpoint/1');
    expect(screen.getByText('完成本级全部课程后开放')).toBeTruthy();
  });
});
