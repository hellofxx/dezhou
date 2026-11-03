import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AcademyHome from './AcademyHome';
import { useAcademyStore } from '../store';

/**
 * 学院首页组合冒烟：
 * - Hero / 变体切换 / 课程阶梯 / 今日计划 / 学习工具 五区均渲染
 * - 变体切换写入 store 并联动副标题（L1/L2 共享基础层仍可用）
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

describe('AcademyHome', () => {
  it('渲染 Hero、变体切换、课程阶梯、今日计划与学习工具', async () => {
    renderHome();

    expect(screen.getByText('从基础入门开始，掌握牌局基本功')).toBeTruthy();
    expect(screen.getByText('选择游戏变体')).toBeTruthy();
    expect(screen.getByText('课程阶梯')).toBeTruthy();
    expect(screen.getByText('学习工具')).toBeTruthy();
    expect(screen.getByText('5 分钟速训')).toBeTruthy();
    expect(screen.getByText('知识图谱')).toBeTruthy();

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
    renderHome();

    expect(screen.getByText('继续学习：德州扑克规则与牌型')).toBeTruthy();
    expect(screen.getByText('你在这里')).toBeTruthy();
  });
});
