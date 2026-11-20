/**
 * PuzzleHome 入口页组件测试。
 *
 * 契约：
 *  - Hero 三态 CTA（未完成 → 开始今日谜题 / 已完成 → 查看今日谜题 + 今日已完成 + 最佳正确率）；
 *  - 三大模式卡片为语义链接（href 直达、键盘可达；Rush 子按钮独立于链接外，无交互嵌套）；
 *  - Best Record 展示（Rush 最高分 / Daily 正确率 / 主题最佳正确率与 dots）；
 *  - 主题列表按 4 大类分组渲染全部 10 个主题。
 */
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const navigateMock = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  Link: ({ to, children, className }: { to: string; children?: ReactNode; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}));

import PuzzleHome from './PuzzleHome';
import { usePuzzleStore } from '../store';
import { PUZZLE_THEMES } from '../data/puzzleBank';
import { getDailyKey } from '../data/dailyPuzzles';

const TODAY_KEY = '2026-08-22';

const best = (overrides: Record<string, unknown> = {}) => ({
  mode: 'rush' as const,
  bestScore: 1200,
  bestAccuracy: 0.6,
  bestTime: 60000,
  achievedAt: 1_700_000_000_000,
  ...overrides,
});

describe('PuzzleHome 谜题首页', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 22, 10, 0, 0, 0));
    // jsdom 提供原生 localStorage；清空 + reset 保证用例隔离
    localStorage.clear();
    usePuzzleStore.getState().reset();
    navigateMock.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const render = () =>
    act(() => {
      root.render(<PuzzleHome />);
    });

  const text = () => container.textContent ?? '';

  const cardByText = (needle: string): HTMLElement => {
    const card = [...container.querySelectorAll<HTMLElement>('.puzzle-card')].find((node) =>
      node.textContent?.includes(needle)
    );
    if (!card) throw new Error(`未找到卡片：${needle}`);
    return card;
  };

  const click = (element: Element | null | undefined) => {
    if (!element) throw new Error('点击目标不存在');
    act(() => {
      (element as HTMLElement).click();
    });
  };

  const buttonByText = (needle: string): HTMLButtonElement | undefined =>
    [...container.querySelectorAll('button')].find((btn) => btn.textContent?.trim() === needle);

  it('视觉标题保留 h2，且首页不渲染 h1（全站唯一 h1 归壳层）', () => {
    render();
    expect(container.querySelector('h2.puzzle-hero-title')).not.toBeNull();
    expect(container.querySelector('h1')).toBeNull();
  });

  it('渲染三大模式入口、Hero 与按类别分组的全部主题', () => {
    render();
    expect(text()).toContain('限时冲刺');
    expect(text()).toContain('每日谜题');
    expect(text()).toContain('主题训练');
    // 4 大类别标题
    for (const label of ['翻前', '翻后', '河牌', '锦标赛']) expect(text()).toContain(label);
    // 全部主题卡片按 PUZZLE_THEMES 顺序渲染
    expect(container.querySelectorAll('.theme-card')).toHaveLength(PUZZLE_THEMES.length);
    expect(text()).toContain(TODAY_KEY);
  });

  it('无记录时 Hero 显示开始今日谜题，且不显示最高分 / 正确率', () => {
    render();
    expect(text()).toContain('开始今日谜题');
    expect(text()).not.toContain('今日已完成');
    expect(text()).not.toContain('最高分 '); // 描述文案含「最高分。」，故按记录格式断言
  });

  it('今日已完成 + 最佳正确率时 Hero 切到查看态并展示正确率', () => {
    usePuzzleStore.setState({
      dailyCompleted: { [getDailyKey(new Date())]: true },
      dailyBest: best({ mode: 'daily', bestAccuracy: 0.875 }),
      rushBest: best(),
    });
    render();

    expect(text()).toContain('查看今日谜题');
    expect(text()).toContain('今日已完成');
    expect(text()).toContain('最佳正确率 88%');
    expect(text()).toContain('最高分 1200');
    expect(text()).toContain('88%');
  });

  it('今日已完成但无最佳记录时不显示正确率文案', () => {
    usePuzzleStore.setState({ dailyCompleted: { [TODAY_KEY]: true }, dailyBest: null });
    render();
    expect(text()).toContain('查看今日谜题');
    expect(text()).not.toContain('最佳正确率');
  });

  const linkIn = (needle: string): HTMLAnchorElement => {
    const card = cardByText(needle);
    const link = card.matches('a[href]')
      ? (card as HTMLAnchorElement)
      : card.querySelector<HTMLAnchorElement>('a[href]');
    if (!link) throw new Error(`卡片缺少语义链接：${needle}`);
    return link;
  };

  it('三大模式卡均为语义链接，Rush 卡直达 3 分钟默认时长', () => {
    render();
    expect(linkIn('限时冲刺').getAttribute('href')).toBe('/puzzle/rush?duration=3');
    expect(linkIn('每日谜题').getAttribute('href')).toBe('/puzzle/daily');
    expect(linkIn('Theme Drill').getAttribute('href')).toBe(`/puzzle/theme/${PUZZLE_THEMES[0]?.id}`);
    // 每张模式卡都由 <a href> 承载跳转，不再是可点击 div
    for (const card of container.querySelectorAll<HTMLElement>('.puzzle-card')) {
      expect(card.tagName === 'A' || card.querySelector('a[href]') !== null).toBe(true);
    }
  });

  it('5 min 子按钮独立于卡片链接（无交互嵌套），点击直达 5 分钟', () => {
    render();
    expect(cardByText('限时冲刺').querySelector('a button')).toBeNull();
    click(buttonByText('5 min'));
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/puzzle/rush?duration=5');
  });

  it('主题卡片进入对应主题路由', () => {
    render();
    const firstThemeCard = container.querySelector<HTMLElement>('.theme-card');
    click(firstThemeCard);
    expect(navigateMock).toHaveBeenCalledWith(`/puzzle/theme/${PUZZLE_THEMES[0]?.id}`);
  });

  it('主题最佳记录展示「最佳 N%」与按正确率点亮的 dots', () => {
    usePuzzleStore.setState({ themeBest: { 'preflop-rfi': best({ mode: 'theme', theme: 'preflop-rfi', bestAccuracy: 0.6 }) } });
    render();

    const themeCard = container.querySelector<HTMLElement>('.theme-card');
    expect(themeCard?.textContent).toContain('最佳 60%');
    expect(themeCard?.querySelectorAll('.dot.filled')).toHaveLength(3);
    expect(themeCard?.querySelectorAll('.dot')).toHaveLength(5);
  });

  it('主题卡片渲染 Lucide 主题图标（装饰性 aria-hidden），卡片文本不再含 emoji', () => {
    render();
    const cards = [...container.querySelectorAll<HTMLElement>('.theme-card')];
    expect(cards).toHaveLength(PUZZLE_THEMES.length);

    for (const card of cards) {
      const icon = card.querySelector('svg[aria-hidden="true"]');
      expect(icon).not.toBeNull();
      // emoji 已迁移为 Lucide：卡片文本不含 Emoji_Presentation 字符
      expect(card.textContent ?? '').not.toMatch(/\p{Emoji_Presentation}/u);
    }
  });
});
