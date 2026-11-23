import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '@/i18n/config';
import AcademyHome from './AcademyHome';
import { useAcademyStore } from '../store';
import { getLevelSummariesByVariant, getTotalLessonCount } from '../utils/academyMeta';

/**
 * 学院首页组合冒烟：
 * - 零状态（无课程进度且未完成基础入门）：首屏单一「从第一课开始」路径卡，零值指标（0% 环 / 课时 / 认证）不渲染
 * - 课程阶梯保留，首个 Level 呈现为「起点」而非一片锁定死路（不改 gating）
 * - 有进度后变体只读面板 / 课程阶梯 / 学习工具仍在（续学与每日计划已上收主线与首页，地图不再装配）
 * - 变体切换写入 store 并联动副标题
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderHome() {
  return render(
    <MemoryRouter>
      <AcademyHome />
      <LocationProbe />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

describe('AcademyHome：零状态渐进披露', () => {
  it('零状态首屏只给单一入口路径卡，CTA 指向基础入门', () => {
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

    // 工具入口仍在（非首屏主焦点，但保留可达性）
    expect(screen.getByText('学习工具')).toBeTruthy();
    expect(screen.getByText('5 分钟速训')).toBeTruthy();
    expect(screen.getByText('知识图谱')).toBeTruthy();
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

describe('AcademyHome：有进度后的地图装配', () => {
  it('渲染变体只读面板、课程阶梯与学习工具（不再重复续学 Hero / 每日计划）', () => {
    useAcademyStore.getState().completeBasics();
    renderHome();

    expect(screen.getByText('游戏变体')).toBeTruthy();
    expect(screen.getByText('课程阶梯')).toBeTruthy();
    expect(screen.getByText('学习工具')).toBeTruthy();
    expect(screen.getByText('5 分钟速训')).toBeTruthy();
    expect(screen.getByText('知识图谱')).toBeTruthy();
    // 零状态路径卡退出
    expect(screen.queryByText('从第一课开始')).toBeNull();
  });

  it('变体面板只读：展示当前变体，切换入口指向课程目录且无本地切换控件', () => {
    useAcademyStore.getState().switchVariant('short-deck');
    renderHome();

    expect(screen.getByText('短牌德州')).toBeTruthy();

    // 地图不再渲染分段切换控件（分组 aria-label 即「选择游戏变体」）
    expect(screen.queryByRole('group', { name: '选择游戏变体' })).toBeNull();

    const switchLink = screen.getByRole('link', { name: '在课程目录切换' });
    expect(switchLink.getAttribute('href')).toBe('/lesson');
    // 点击只导航，不改写 store 变体
    fireEvent.click(switchLink);
    expect(useAcademyStore.getState().activeVariant).toBe('short-deck');

    // 复位变体，避免污染同组后续用例（resetProgress 不重置 activeVariant）
    useAcademyStore.getState().switchVariant('standard');
  });

  it('基础入门完成后阶梯不再全部锁定并标出当前位置', () => {
    useAcademyStore.getState().completeBasics();
    const { container } = renderHome();

    expect(screen.getByText('你在这里')).toBeTruthy();
    // 有进度态下不再渲染零状态起点标记
    expect(container.querySelector('[data-start="true"]')).toBeNull();
  });
});

describe('AcademyHome：瘦身后地图主干', () => {
  it('评估区带 #assessment 锚点（枢纽闭环步骤③的落地目标）', () => {
    const { container } = renderHome();
    const anchor = container.querySelector('#assessment');
    expect(anchor).toBeTruthy();
    expect(anchor!.querySelector('[aria-label="评估"]')).toBeTruthy();
  });

  it('学习工具默认折叠（原生 details），标题入口仍可达', () => {
    const { container } = renderHome();
    const details = container.querySelector('#academy-tools') as HTMLDetailsElement | null;
    expect(details).toBeTruthy();
    expect(details!.open).toBe(false);
    expect(screen.getByText('学习工具')).toBeTruthy();
  });

  it('掌握度卡已上收课程枢纽，地图不再重复', () => {
    useAcademyStore.getState().completeBasics();
    renderHome();
    expect(screen.queryByText(i18n.t('academy.mastery.title'))).toBeNull();
  });
});

describe('AcademyHome：地图根返回与工具路由', () => {
  it('地图根顶部提供返回课程枢纽入口', () => {
    renderHome();

    const back = screen.getByRole('link', { name: /返回课程目录/ });
    expect(back.getAttribute('href')).toBe('/lesson');
  });

  it('速训工具直达 /quick（不再走 /academy/quick-drill 旧重定向源）', () => {
    renderHome();

    fireEvent.click(screen.getByText('5 分钟速训'));
    expect(screen.getByTestId('location').textContent).toBe('/quick');
  });
});

describe('AcademyHome：学习工具与评估区入口', () => {
  it('工具格提供速训、轨道、收藏与参考书目入口（定位测评已上收评估区）', () => {
    renderHome();

    expect(screen.getByText('学习轨道')).toBeTruthy();
    expect(screen.getByText('我的收藏')).toBeTruthy();
    expect(screen.getByText('参考书目')).toBeTruthy();
    // 定位测评不再作为工具格条目
    expect(screen.queryByText('16 道题找到合适起点')).toBeNull();
  });

  it('评估区聚合检查点、认证与定位测评三条入口', () => {
    useAcademyStore.getState().completeBasics();
    renderHome();

    expect(screen.getByRole('region', { name: '评估' })).toBeTruthy();
    expect(
      screen.getByRole('link', { name: '级别检查点' }).getAttribute('href'),
    ).toBe('/academy/checkpoint/1');
    expect(
      screen.getByRole('link', { name: '级别认证' }).getAttribute('href'),
    ).toBe('/academy/certification/1');
    expect(
      screen.getByRole('link', { name: '定位测评' }).getAttribute('href'),
    ).toBe('/academy/placement');
  });

  it('已完成 Level 优先成为检查点/认证锚点', () => {
    useAcademyStore.getState().completeBasics();
    const level1 = getLevelSummariesByVariant('standard')[0];
    expect(level1).toBeTruthy();
    for (const lesson of level1?.lessons ?? []) {
      useAcademyStore.getState().completeLesson(lesson.id);
    }
    renderHome();

    expect(
      screen.getByRole('link', { name: '级别检查点' }).getAttribute('href'),
    ).toBe('/academy/checkpoint/1');
    expect(
      screen.getByRole('link', { name: '级别认证' }).getAttribute('href'),
    ).toBe('/academy/certification/1');
  });

  it('非标准变体只保留定位测评入口', () => {
    useAcademyStore.getState().completeBasics();
    useAcademyStore.getState().switchVariant('short-deck');
    renderHome();

    expect(
      screen.getByRole('link', { name: '定位测评' }).getAttribute('href'),
    ).toBe('/academy/placement');
    expect(screen.queryByRole('link', { name: '级别检查点' })).toBeNull();
    expect(screen.queryByRole('link', { name: '级别认证' })).toBeNull();

    useAcademyStore.getState().switchVariant('standard');
  });
});
