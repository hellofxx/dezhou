import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { useHandHistoryStore } from '../store';
import type { HandHistory } from '../types';
import { AnnotationPanel } from './AnnotationPanel';

/**
 * 批注面板冒烟（jsdom）。
 * 覆盖：既有批注回显、空态禁用保存、保存透传（含空值删除语义）、
 * 导出下拉（点击外部关闭）、JSON / Markdown 导出内容。
 * 未覆盖（L4）：真实浏览器下载交互与排版。
 */

function makeHand(annotations: Record<string, string> = {}): HandHistory {
  return {
    id: 'h1',
    site: 'pokerstars',
    handNumber: '777',
    timestamp: new Date(2024, 0, 15, 20, 30).getTime(),
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      { id: 0, name: 'Alice', position: Position.BTN, seatNumber: 1, stack: 100 },
      { id: 1, name: 'Bob', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: [],
    streets: {
      // HH-020：preflop 存 to 金额（call 2 + raise to 6）
      preflop: [
        { type: ActionType.Call, amount: 2, playerIndex: 0 },
        { type: ActionType.Raise, amount: 6, playerIndex: 1 },
        { type: ActionType.Call, amount: 6, playerIndex: 0 },
        { type: ActionType.Fold, playerIndex: 2 },
      ],
      flop: {
        cards: [
          { rank: Rank.Ace, suit: Suit.Spades },
          { rank: Rank.King, suit: Suit.Hearts },
          { rank: Rank.Queen, suit: Suit.Diamonds },
        ],
        actions: [{ type: ActionType.Check, playerIndex: 0 }],
      },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 12,
    annotations,
  };
}

const addAnnotation = vi.fn(async () => {});

beforeEach(() => {
  void i18n.changeLanguage('zh');
  addAnnotation.mockClear();
  useHandHistoryStore.setState({ hands: [makeHand()], currentHand: null, dbError: null, addAnnotation });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (URL as unknown as Record<string, unknown>).createObjectURL;
  delete (URL as unknown as Record<string, unknown>).revokeObjectURL;
});

describe('AnnotationPanel 渲染与保存', () => {
  it('渲染街道标题 / 占位符；无既有批注时不显示回显块', () => {
    render(<AnnotationPanel hand={makeHand()} currentStreet="flop" />);

    expect(screen.getByText(i18n.t('handHistory.annotation.notes', { street: 'flop' }))).not.toBeNull();
    const textarea = screen.getByPlaceholderText(
      i18n.t('handHistory.annotation.placeholder', { street: 'flop' }),
    ) as HTMLTextAreaElement;
    expect(textarea.value).toBe('');
    expect(containerHasText(i18n.t('handHistory.annotation.save'))).toBe(true);
  });

  it('既有批注回显并作为编辑初值', () => {
    render(<AnnotationPanel hand={makeHand({ flop: '这里应该 check-raise' })} currentStreet="flop" />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toBe('这里应该 check-raise');
    // textarea 的初值同样作为子文本节点渲染，回显块按「无子元素的精确文本容器」定位
    const echoBlocks = Array.from(document.querySelectorAll('div')).filter(
      (el) => el.children.length === 0 && el.textContent === '这里应该 check-raise',
    );
    expect(echoBlocks).toHaveLength(1);
  });

  it('无内容且无既有批注时保存按钮禁用', () => {
    render(<AnnotationPanel hand={makeHand()} currentStreet="turn" />);

    const save = screen.getByText(i18n.t('handHistory.annotation.save')).closest('button')!;
    expect(save.disabled).toBe(true);
  });

  it('输入后保存：以去空白内容调用 addAnnotation', () => {
    render(<AnnotationPanel hand={makeHand()} currentStreet="river" />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '  river bluff  ' } });
    fireEvent.click(screen.getByText(i18n.t('handHistory.annotation.save')).closest('button')!);

    expect(addAnnotation).toHaveBeenCalledWith('h1', 'river', 'river bluff');
  });

  it('清空既有批注后仍可保存（空值 = 删除该街批注）', () => {
    render(<AnnotationPanel hand={makeHand({ flop: '旧笔记' })} currentStreet="flop" />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    const save = screen.getByText(i18n.t('handHistory.annotation.save')).closest('button')!;
    expect(save.disabled).toBe(false);
    fireEvent.click(save);

    expect(addAnnotation).toHaveBeenCalledWith('h1', 'flop', '');
  });
});

// ─── 导出下拉 ──────────────────────────────────────────────
function containerHasText(text: string): boolean {
  return (document.body.textContent ?? '').includes(text);
}

function stubDownloads(): { blobs: Blob[] } {
  const blobs: Blob[] = [];
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:mock';
    }),
  });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
  // jsdom 未实现导航：拦截 <a download>.click()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  return { blobs };
}

describe('AnnotationPanel 导出', () => {
  it('导出菜单默认收起，点击后展开 JSON / Markdown；点击外部关闭', () => {
    render(<AnnotationPanel hand={makeHand()} currentStreet="preflop" />);

    expect(containerHasText('Markdown')).toBe(false);
    fireEvent.click(screen.getByText(i18n.t('handHistory.annotation.export')));
    expect(containerHasText('Markdown')).toBe(true);

    fireEvent.mouseDown(document.body);
    expect(containerHasText('Markdown')).toBe(false);
  });

  it('Markdown 导出包含动作流水（Call 显示增量）与批注正文', async () => {
    const { blobs } = stubDownloads();
    render(<AnnotationPanel hand={makeHand({ flop: 'c-bet 尺度太大' })} currentStreet="flop" />);

    fireEvent.click(screen.getByText(i18n.t('handHistory.annotation.export')));
    fireEvent.click(screen.getByText('Markdown'));

    expect(blobs).toHaveLength(1);
    const text = await blobs[0]!.text();
    expect(text).toContain('# Hand 777');
    expect(text).toContain('**Site**: pokerstars');
    // HH-020：第二条 Alice call 的 to 6 减去先前投入 2 → calls $4
    expect(text).toContain('Alice calls $4');
    // Raise 显示 to 总额
    expect(text).toContain('Bob raises $6');
    // 越界玩家索引回退为 Player N
    expect(text).toContain('Player 2 folds');
    expect(text).toContain('c-bet 尺度太大');
    expect(text).not.toContain('*No annotations*');
  });

  it('Markdown 导出无批注时写 *No annotations*', async () => {
    const { blobs } = stubDownloads();
    render(<AnnotationPanel hand={makeHand()} currentStreet="preflop" />);

    fireEvent.click(screen.getByText(i18n.t('handHistory.annotation.export')));
    fireEvent.click(screen.getByText('Markdown'));

    expect(await blobs[0]!.text()).toContain('*No annotations*');
  });

  it('JSON 导出包含手牌标识与批注键值', async () => {
    const { blobs } = stubDownloads();
    render(<AnnotationPanel hand={makeHand({ turn: '过牌控池' })} currentStreet="turn" />);

    fireEvent.click(screen.getByText(i18n.t('handHistory.annotation.export')));
    fireEvent.click(screen.getByText('JSON'));

    const payload = JSON.parse(await blobs[0]!.text()) as {
      handId: string;
      handNumber: string;
      annotations: Record<string, string>;
      actions: { preflop: unknown[] };
    };
    expect(payload.handId).toBe('h1');
    expect(payload.handNumber).toBe('777');
    expect(payload.annotations).toEqual({ turn: '过牌控池' });
    expect(payload.actions.preflop).toHaveLength(4);
  });
});
