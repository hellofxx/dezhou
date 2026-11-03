/**
 * AppLayout 契约（全站壳层）：
 * - 导航分组：仪表盘置顶 + 01 训练 / 02 研习 / 03 数据 / 04 设置 四组
 * - 折叠：按钮标签在「收起/展开侧边栏」间切换，折叠后隐藏分组标题与文字标签（图标 + aria-label 保留）
 * - 语言切换：写入 progress store settings.language（跨刷新恢复的事实源）并切换 i18n 文案
 * - 顶栏：分组眉标 + 页名 h1 + document.title；连击徽标仅在 streak > 0 时出现
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n/config';
import { useProgressStore } from '@/features/progress/store';
import AppLayout from './AppLayout';

const resetStores = () => {
  useProgressStore.setState((state) => ({
    onboarding: { ...state.onboarding, completed: true },
    settings: { ...state.settings, language: 'zh' },
    streak: { ...state.streak, currentStreak: 0 },
    emotion: { ...state.emotion, consecutiveWrongCount: 0 },
    pendingMilestone: null,
  }));
};

const renderLayout = (initialPath = '/help') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<p>仪表盘内容</p>} />
          <Route path="help" element={<p>帮助内容</p>} />
          <Route path="settings" element={<p>设置内容</p>} />
          <Route path="academy/concept-graph" element={<p>概念图谱</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

const sidebarNav = () => screen.getByRole('navigation', { name: '主导航' });

describe('AppLayout', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('zh');
    resetStores();
  });

  afterEach(() => {
    cleanup();
    resetStores();
  });

  it('跳过导航链接与侧边栏导航语义齐备', () => {
    renderLayout();

    expect(screen.getByRole('link', { name: '跳到主内容' })).toBeTruthy();
    expect(sidebarNav()).toBeTruthy();
  });

  it('仪表盘置顶 + 四个分组序号与标题', () => {
    renderLayout();
    const nav = sidebarNav();

    expect(within(nav).getByRole('link', { name: '仪表盘' })).toBeTruthy();

    // 分组眉标 = 固定序号 + 分组标题（序号不随语言变化）
    const groupLabels = Array.from(nav.querySelectorAll('p')).map((paragraph) => paragraph.textContent);
    expect(groupLabels).toEqual(['01训练', '02研习', '03数据', '04设置']);

    // 分组内条目具备可访问名称
    for (const label of ['手牌范围训练', '赔率计算器', 'GTO 模拟器', '扑克谜题']) {
      expect(within(nav).getAllByRole('link', { name: label }).length).toBeGreaterThan(0);
    }
    for (const label of ['策略学院', '理论学院', '牌局复盘', '进度统计', '排行榜', '设置', '帮助中心']) {
      expect(within(nav).getAllByRole('link', { name: label }).length).toBeGreaterThan(0);
    }
  });

  it('当前路径的导航项标记 aria-current=page（含子路由）', () => {
    renderLayout('/help');

    const helpLink = within(sidebarNav()).getByRole('link', { name: '帮助中心' });
    expect(helpLink.getAttribute('aria-current')).toBe('page');
    expect(within(sidebarNav()).getByRole('link', { name: '仪表盘' }).getAttribute('aria-current')).toBeNull();
  });

  it('折叠后隐藏文字标签与分组标题，但保留图标态可访问名称', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: '收起侧边栏' }));

    expect(screen.getByRole('button', { name: '展开侧边栏' })).toBeTruthy();
    const nav = sidebarNav();
    expect(within(nav).queryByText('训练')).toBeNull();
    // 折叠态保留序号作为分组标识
    expect(within(nav).getByText('01')).toBeTruthy();

    const helpLink = within(nav).getByRole('link', { name: '帮助中心' });
    expect(helpLink.textContent).toBe('');

    // 再次点击展开恢复文字
    fireEvent.click(screen.getByRole('button', { name: '展开侧边栏' }));
    expect(within(sidebarNav()).getByText('训练')).toBeTruthy();
  });

  it('语言切换按钮切换 i18n 并写入 progress store（跨刷新恢复的事实源）', { timeout: 30000 }, async () => {
    renderLayout();

    fireEvent.click(screen.getAllByRole('button', { name: '切换语言' })[0]!);

    // 切换会先预加载目标语言资源再 changeLanguage；覆盖率插桩 + 全量并行下可能超过 10s
    expect(
      await screen.findByRole('navigation', { name: 'Main navigation' }, { timeout: 15000 }),
    ).toBeTruthy();
    expect(i18n.language).toBe('en');
    expect(useProgressStore.getState().settings.language).toBe('en');
    // 顶栏页名随语言切换（Help Center）
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Help Center');
  });

  it('顶栏呈现分组眉标 + 页名，并同步 document.title', () => {
    renderLayout('/settings');

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('设置');
    expect(document.title).toBe('设置 · 德州扑克训练平台');

    const header = document.querySelector('header') as HTMLElement;
    expect(within(header).getByText('04')).toBeTruthy();
    // 眉标文案与页名都可能等于分组名，按元素粒度分别断言
    const sectionLabels = Array.from(header.querySelectorAll('span')).map((span) => span.textContent);
    expect(sectionLabels).toContain('设置');
  });

  it('连击徽标仅在 streak > 0 时出现', () => {
    renderLayout();
    const header = document.querySelector('header') as HTMLElement;
    const before = header.textContent ?? '';
    expect(before).not.toContain('7');

    cleanup();
    useProgressStore.setState((state) => ({ streak: { ...state.streak, currentStreak: 7 } }));
    renderLayout();

    expect((document.querySelector('header') as HTMLElement).textContent).toContain('7');
  });

  it('移动端与桌面端帮助按钮都跳转到 /help', () => {
    renderLayout('/');

    expect(screen.getByText('仪表盘内容')).toBeTruthy();
    const helpButtons = screen.getAllByRole('button', { name: '帮助中心' });
    expect(helpButtons).toHaveLength(2);

    fireEvent.click(helpButtons[0]!);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('帮助中心');

    // 桌面端按钮（header 内第二个）走同一导航出口
    cleanup();
    renderLayout('/');
    fireEvent.click(screen.getAllByRole('button', { name: '帮助中心' })[1]!);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('帮助中心');
  });

  it('移动端顶栏设置齿轮跳转到 /settings，桌面侧边栏设置入口保留', () => {
    renderLayout('/');

    const settingsButton = screen.getByRole('button', { name: '设置' });
    // 设置已从底部导航移出：移动端唯一设置入口是顶栏齿轮（md:hidden）
    expect(settingsButton.className).toContain('md:hidden');
    expect(within(sidebarNav()).getByRole('link', { name: '设置' })).toBeTruthy();

    fireEvent.click(settingsButton);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('设置');
  });

  it('内容区宽度分级：策略学院概览视图展宽，其余页面收敛（DESIGN §6.5）', () => {
    renderLayout('/academy/concept-graph');
    const wideWrapper = document.getElementById('main-content')?.firstElementChild as HTMLElement;
    expect(wideWrapper.className).toContain('max-w-[1680px]');

    cleanup();
    renderLayout('/help');
    const narrowWrapper = document.getElementById('main-content')?.firstElementChild as HTMLElement;
    expect(narrowWrapper.className).toContain('max-w-[1400px]');
  });

  it('主导航从 h1 到内容的跳转目标存在（#main-content 可聚焦）', () => {
    renderLayout();
    const main = document.getElementById('main-content');
    expect(main).toBeTruthy();
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });
});
