import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { useHandHistoryStore } from '../store';
import type { HandHistory } from '../types';
import HandHistoryList from './HandHistoryList';

/**
 * 牌局列表页冒烟（jsdom）。
 * 覆盖：空态、列表渲染与导航、搜索过滤无匹配、单条删除（不触发导航）、
 * 清空全部确认弹窗、IndexedDB 错误提示、统计页签三种分支（数据不足 / 未识别 Hero / 有数据懒载）。
 * 未覆盖（L4）：真实浏览器视觉与 20 手以上的完整图表排版。
 */

MotionGlobalConfig.skipAnimations = true;

function makeHand(id: string, overrides: Partial<HandHistory> = {}): HandHistory {
  return {
    id,
    site: 'pokerstars',
    handNumber: `HN-${id}`,
    timestamp: new Date(2024, 0, 15, 20, 30).getTime(),
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      {
        id: 0,
        name: 'Hero',
        position: Position.BTN,
        seatNumber: 1,
        stack: 100,
        holeCards: [
          { rank: Rank.Ace, suit: Suit.Hearts },
          { rank: Rank.King, suit: Suit.Hearts },
        ],
      },
      { id: 1, name: 'Villain', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: [],
    streets: {
      preflop: [
        { type: ActionType.Raise, amount: 3, playerIndex: 0 },
        { type: ActionType.Call, amount: 3, playerIndex: 1 },
      ],
      flop: { cards: [], actions: [] },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 6,
    winner: { playerId: 0, amount: 6 },
    heroPlayerId: 0,
    annotations: {},
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="loc">{location.pathname}</div>;
}

function mount() {
  return render(
    <MemoryRouter initialEntries={['/hand-history']}>
      <HandHistoryList />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function currentPath(): string {
  return screen.getByTestId('loc').textContent ?? '';
}

const deleteHand = vi.fn(async () => {});
const clearAll = vi.fn(async () => {});
const loadFromDB = vi.fn(async () => {});

function seed(hands: HandHistory[], extra: Partial<ReturnType<typeof useHandHistoryStore.getState>> = {}) {
  useHandHistoryStore.setState({
    hands,
    currentHand: null,
    loaded: true,
    dbError: null,
    filter: { search: '', sortBy: 'date' },
    deleteHand,
    clearAll,
    loadFromDB,
    ...extra,
  });
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
  deleteHand.mockClear();
  clearAll.mockClear();
  loadFromDB.mockClear();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HandHistoryList 列表与导航', () => {
  it('无牌局时展示空态与导入入口，按钮跳转导入页', () => {
    seed([]);
    mount();

    expect(screen.getByText(i18n.t('handHistory.list.emptyTitle'))).not.toBeNull();
    expect(screen.getByText(i18n.t('handHistory.list.emptyDesc'))).not.toBeNull();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.emptyAction')));
    expect(currentPath()).toBe('/hand-history/import');
  });

  it('渲染牌局行（站点 / 牌局号 / 底池 / 获胜者）并可点击进入回放', () => {
    seed([makeHand('h1')]);
    mount();

    expect(
      screen.getByText(i18n.t('handHistory.list.importedCount', { count: 1 })),
    ).not.toBeNull();
    expect(screen.getByText(i18n.t('handHistory.list.handNumber', { number: 'HN-h1' }))).not.toBeNull();
    expect(screen.getByText('$6.00')).not.toBeNull();
    expect(screen.getByText(i18n.t('handHistory.list.wonBy', { name: 'Hero' }))).not.toBeNull();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.handNumber', { number: 'HN-h1' })));
    expect(currentPath()).toBe('/hand-history/h1');
  });

  it('搜索无结果时提示「没有匹配的牌局」，命中时仅保留匹配行', () => {
    seed([makeHand('h1'), makeHand('h2', { handNumber: 'OTHER' })]);
    mount();

    const search = screen.getByPlaceholderText(i18n.t('handHistory.list.searchPlaceholder'));
    fireEvent.change(search, { target: { value: 'nomatch' } });
    expect(screen.getByText(i18n.t('handHistory.list.noMatch'))).not.toBeNull();

    fireEvent.change(search, { target: { value: 'OTHER' } });
    expect(screen.getByText(i18n.t('handHistory.list.handNumber', { number: 'OTHER' }))).not.toBeNull();
    expect(screen.queryByText(i18n.t('handHistory.list.handNumber', { number: 'HN-h1' }))).toBeNull();
  });

  it('单条删除按钮调用 deleteHand 且不触发进入回放的导航', () => {
    seed([makeHand('h1')]);
    mount();

    const deleteButton = screen
      .getAllByRole('button')
      .find(btn => btn.getAttribute('aria-label') === i18n.t('common.ui.delete'));
    expect(deleteButton).not.toBeUndefined();
    fireEvent.click(deleteButton!);

    expect(deleteHand).toHaveBeenCalledWith('h1');
    expect(currentPath()).toBe('/hand-history');
  });

  it('清空全部需二次确认：取消关闭弹窗，确认后调用 clearAll', () => {
    seed([makeHand('h1'), makeHand('h2')]);
    mount();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.clearAll')));
    expect(screen.getByText(i18n.t('handHistory.list.confirmClearTitle'))).not.toBeNull();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.cancel')));
    expect(screen.queryByText(i18n.t('handHistory.list.confirmClearTitle'))).toBeNull();
    expect(clearAll).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.clearAll')));
    fireEvent.click(screen.getByText(i18n.t('handHistory.list.deleteAll')));
    expect(clearAll).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(i18n.t('handHistory.list.confirmClearTitle'))).toBeNull();
  });

  it('站点筛选 / 排序下拉写入 filter，点击遮罩关闭确认弹窗，头部导入按钮跳转导入页', () => {
    seed([makeHand('h1'), makeHand('h2', { site: 'ggpoker', handNumber: 'GG-2' })]);
    mount();

    const [siteSelect, sortSelect] = Array.from(
      document.querySelectorAll('select'),
    ) as HTMLSelectElement[];
    fireEvent.change(siteSelect!, { target: { value: 'ggpoker' } });
    expect(useHandHistoryStore.getState().filter.site).toBe('ggpoker');
    expect(screen.queryByText(i18n.t('handHistory.list.handNumber', { number: 'HN-h1' }))).toBeNull();

    fireEvent.change(sortSelect!, { target: { value: 'pot' } });
    expect(useHandHistoryStore.getState().filter.sortBy).toBe('pot');

    // 点击遮罩关闭确认弹窗
    fireEvent.click(screen.getByText(i18n.t('handHistory.list.clearAll')));
    const overlay = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(overlay);
    expect(screen.queryByText(i18n.t('handHistory.list.confirmClearTitle'))).toBeNull();
    expect(clearAll).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.import')));
    expect(currentPath()).toBe('/hand-history/import');
  });

  it('IndexedDB 错误按类型 key 渲染本地化提示', () => {
    seed([], { dbError: 'quotaExceeded' });
    mount();

    expect(screen.getByText(i18n.t('handHistory.dbError.quotaExceeded'))).not.toBeNull();
  });
});

describe('HandHistoryList 统计页签', () => {
  it('不足最小手数时展示数据不足空态', () => {
    seed([makeHand('h1')]);
    mount();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.tabsStats')));
    expect(screen.getByText(i18n.t('handHistory.list.statsInsufficientTitle'))).not.toBeNull();
    expect(
      screen.getByText(i18n.t('handHistory.list.statsInsufficientDesc', { min: 20, count: 1 })),
    ).not.toBeNull();
  });

  it('可在列表与统计页签之间切换回列表', () => {
    seed([makeHand('h1')]);
    mount();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.tabsStats')));
    expect(screen.getByText(i18n.t('handHistory.list.statsInsufficientTitle'))).not.toBeNull();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.tabsHands')));
    expect(
      screen.getByText(i18n.t('handHistory.list.handNumber', { number: 'HN-h1' })),
    ).not.toBeNull();
  });

  it('达到最小手数但无法识别 Hero 时提示底牌缺失', () => {
    const hands = Array.from({ length: 20 }, (_, i) =>
      makeHand(`n${i}`, {
        heroPlayerId: undefined,
        players: [
          { id: 0, name: 'Hero', position: Position.BTN, seatNumber: 1, stack: 100 },
          { id: 1, name: 'Villain', position: Position.BB, seatNumber: 2, stack: 100 },
        ],
      }),
    );
    seed(hands);
    mount();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.tabsStats')));
    expect(screen.getByText(i18n.t('handHistory.list.heroNotFoundTitle'))).not.toBeNull();
  });

  it('达到最小手数且识别到 Hero 时懒载统计面板', async () => {
    const hands = Array.from({ length: 20 }, (_, i) => makeHand(`s${i}`));
    seed(hands);
    mount();

    fireEvent.click(screen.getByText(i18n.t('handHistory.list.tabsStats')));
    // 懒载 chunk 在覆盖率插桩下解析较慢，放宽等待上限
    await waitFor(
      () => {
        expect(document.body.textContent).toContain('VPIP');
      },
      { timeout: 8000 },
    );
    expect(screen.getByText(i18n.t('handHistory.stats.basedOn', { count: 20 }))).not.toBeNull();
  });
});
