/**
 * AppLayout 契约（全站壳层，批次 3 冻结导航）：
 * - 导航：学习路径 / 课程 / 训练 / 速训 / 进度中心 / 帮助 六项扁平，设置改由顶栏齿轮承接
 * - 折叠：按钮标签在「收起/展开侧边栏」间切换，折叠后隐藏文字标签（图标 + aria-label 保留）
 * - 语言切换：写入 progress store settings.language（跨刷新恢复的事实源）并切换 i18n 文案
 * - 顶栏：分组眉标（01–04）+ 页名 h1 + document.title；连击徽标仅在 streak > 0 时出现
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
          <Route index element={<p>学习路径内容</p>} />
          <Route path="lesson" element={<p>课程内容</p>} />
          <Route path="drill" element={<p>训练场内容</p>} />
          <Route path="quick" element={<p>速训内容</p>} />
          <Route path="help" element={<p>帮助内容</p>} />
          <Route path="settings" element={<p>设置内容</p>} />
          <Route path="academy" element={<p>全部课程</p>} />
          <Route path="theory" element={<p>理论地图内容</p>} />
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

  it('侧边栏版本行展示应用版本，测试环境不渲染更新时间', () => {
    renderLayout();

    expect(screen.getByText(/^v\d+\.\d+\.\d+/)).toBeTruthy();
    expect(screen.queryByText(/更新于/)).toBeNull();
  });

  it('侧边栏为六项扁平主入口，且不再渲染分组眉标', () => {
    renderLayout();
    const nav = sidebarNav();

    const labels = Array.from(nav.querySelectorAll('a')).map((link) =>
      link.getAttribute('aria-label'),
    );
    expect(labels).toEqual(['学习路径', '课程', '训练', '速训', '进度中心', '帮助中心']);

    // 分组关系由顶栏眉标（01–04）承担，侧栏不再输出分组段落
    expect(nav.querySelectorAll('p')).toHaveLength(0);
    // 设置已从侧栏移出：顶栏齿轮是唯一入口
    expect(within(nav).queryByRole('link', { name: '设置' })).toBeNull();
  });

  it('当前路径的导航项标记 aria-current=page（含子路由）', () => {
    renderLayout('/help');

    const helpLink = within(sidebarNav()).getByRole('link', { name: '帮助中心' });
    expect(helpLink.getAttribute('aria-current')).toBe('page');
    expect(
      within(sidebarNav()).getByRole('link', { name: '学习路径' }).getAttribute('aria-current'),
    ).toBeNull();
  });

  it('折叠后隐藏文字标签，但保留图标态可访问名称', () => {
    renderLayout();

    fireEvent.click(screen.getByRole('button', { name: '收起侧边栏' }));

    expect(screen.getByRole('button', { name: '展开侧边栏' })).toBeTruthy();
    const nav = sidebarNav();
    expect(within(nav).queryByText('课程')).toBeNull();

    const helpLink = within(nav).getByRole('link', { name: '帮助中心' });
    expect(helpLink.textContent).toBe('');

    // 再次点击展开恢复文字
    fireEvent.click(screen.getByRole('button', { name: '展开侧边栏' }));
    expect(within(sidebarNav()).getByText('课程')).toBeTruthy();
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

  it('训练与速训共用 02 眉标，课程回落 01', () => {
    renderLayout('/drill');
    expect((document.querySelector('header') as HTMLElement).textContent).toContain('02');

    cleanup();
    renderLayout('/quick');
    expect((document.querySelector('header') as HTMLElement).textContent).toContain('02');

    cleanup();
    renderLayout('/lesson');
    expect((document.querySelector('header') as HTMLElement).textContent).toContain('01');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('课程');
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

  it('顶栏设置齿轮跳转到 /settings（全端唯一设置入口）', () => {
    renderLayout('/');

    const settingsButton = screen.getByRole('button', { name: '设置' });
    expect(settingsButton.className).toContain('flex');

    fireEvent.click(settingsButton);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('设置');
  });

  it('移动端帮助按钮跳转到 /help（宽屏由侧栏帮助项承接）', () => {
    renderLayout('/');

    const helpButtons = screen.getAllByRole('button', { name: '帮助中心' });
    expect(helpButtons).toHaveLength(1);
    expect(helpButtons[0]!.className).toContain('md:hidden');

    fireEvent.click(helpButtons[0]!);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('帮助中心');
  });

  it('内容区宽度分级：课程主线与两张地图展宽，其余页面收敛（DESIGN §6.5）', () => {
    const wrapperFor = (path: string) => {
      cleanup();
      renderLayout(path);
      return document.getElementById('main-content')?.firstElementChild as HTMLElement;
    };

    for (const path of ['/lesson', '/academy', '/theory']) {
      expect(wrapperFor(path).className, `${path} 应走 L2 展宽`).toContain('max-w-[1680px]');
    }

    expect(wrapperFor('/help').className).toContain('max-w-[1400px]');
  });

  it('侧栏「课程」项激活态覆盖 01 组：主线 / 实战地图 / 理论地图（R10）', () => {
    const courseLink = (path: string) => {
      cleanup();
      renderLayout(path);
      return within(sidebarNav()).getByRole('link', { name: '课程' });
    };

    for (const path of ['/lesson', '/academy', '/theory']) {
      expect(courseLink(path).className, `${path} 应点亮课程项`).toContain('nav-item-active');
    }

    // 仅作用于「课程」项：训练页点亮训练项，课程项回落
    const drillCourseLink = courseLink('/drill');
    expect(drillCourseLink.className).not.toContain('nav-item-active');
    expect(within(sidebarNav()).getByRole('link', { name: '训练' }).className).toContain(
      'nav-item-active',
    );
  });

  it('课程区页名：主线为课程，/academy 为实战地图，/theory 为理论地图', () => {
    renderLayout('/lesson');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('课程');

    cleanup();
    renderLayout('/academy');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('实战地图');

    cleanup();
    renderLayout('/theory');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('理论地图');
  });

  it('主导航从 h1 到内容的跳转目标存在（#main-content 可聚焦）', () => {
    renderLayout();
    const main = document.getElementById('main-content');
    expect(main).toBeTruthy();
    expect(main?.getAttribute('tabindex')).toBe('-1');
  });

  it('移动端主内容为底栏与安全区预留间距，桌面恢复 md 间距', () => {
    renderLayout();
    const main = document.getElementById('main-content');

    expect(main?.className).toContain('pb-[calc(5rem+env(safe-area-inset-bottom))]');
    expect(main?.className).toContain('md:pb-6');
    expect(main?.className).not.toContain('pb-20');
  });
});
