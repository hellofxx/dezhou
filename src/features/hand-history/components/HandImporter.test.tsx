import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import i18n from '@/i18n/config';
import { useHandHistoryStore } from '../store';
import { HandImporter } from './HandImporter';

/**
 * 手牌导入器冒烟（jsdom）。
 * 覆盖：初态禁用、格式预览、单手 / 多手导入成功、无法识别、解析异常、
 * 导入后 IndexedDB 报错回传、文本变更清空上次结果、.txt 文件读取。
 * 未覆盖（L4）：真实拖拽手势与真实浏览器文件选择器。
 */

const PS_HAND = `PokerStars Hand #111: Hold'em No Limit ($1/$2 USD) - 2024/01/15 20:30:00 ET
Table 'T' 2-max Seat #1 is the button
Seat 1: Hero ($100 in chips)
Seat 2: Villain ($100 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah Kd]
Hero: raises $4 to $6
Villain: folds
*** SUMMARY ***
Total pot $8
Hero collected $8
`;

const GG_HAND = `GGPoker Hand #HD-900: Hold'em No Limit ($1/$2) - 2024/01/15 20:30:00
Table 'G' 2-max Seat #1 is the button
Seat 1: Hero ($100)
Seat 2: Villain ($100)
*** HOLE CARDS ***
Dealt to Hero [Ah Kd]
Hero: raises $4 to $6
Villain: folds
*** SUMMARY ***
Total pot $8
Hero collected $8
`;

const GG_HAND_2 = GG_HAND.replace('HD-900', 'HD-901');

const PARTY_HAND = `***** Hand History for Game 12345678 *****
$1/$2 USD NL Texas Hold'em - Monday, January 15, 20:30:00 EST 2024
Table 1234567 (Real Money)
Seat 1 is the button
Seat 1: Hero ( $200.00 USD )
Seat 2: Villain ( $200.00 USD )
*** Dealing down cards ***
Dealt to Hero [ Ah, As ]
Hero posts small blind [$1.00 USD]
Villain posts big blind [$2.00 USD]
Hero raises [$6.00 USD]
Villain calls [$4.00 USD]
*** Dealing flop *** [ Kd, 7h, 2c ]
Villain checks
Hero bets [$4.00 USD]
Villain calls [$4.00 USD]
*** Summary ***
Total Pot: $20.00
`;

const GG_BROKEN = `GGPoker Hand #HD-999: Hold'em No Limit ($1/$2) - 2024/01/15 20:30:00
Table 'B' 2-max Seat #1 is the button
Seat 1: X ($100)
*** HOLE CARDS ***
Dealt to X [Zz Zz]
`;

const addHands = vi.fn(async () => {});

function textarea(): HTMLTextAreaElement {
  return screen.getByRole('textbox') as HTMLTextAreaElement;
}

function importButton(): HTMLButtonElement {
  return screen.getByText(i18n.t('handHistory.importer.import')).closest('button') as HTMLButtonElement;
}

async function pasteAndImport(text: string): Promise<void> {
  fireEvent.change(textarea(), { target: { value: text } });
  await act(async () => {
    fireEvent.click(importButton());
  });
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
  addHands.mockClear();
  useHandHistoryStore.setState({ hands: [], currentHand: null, dbError: null, addHands });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('HandImporter 初态与预览', () => {
  it('无文本时导入按钮禁用，并展示拖拽与支持格式提示', () => {
    render(<HandImporter />);

    expect(importButton().disabled).toBe(true);
    expect(screen.getByText(i18n.t('handHistory.importer.dropHint'))).not.toBeNull();
    expect(screen.getByText(i18n.t('handHistory.importer.supportsFormats'))).not.toBeNull();
    expect(document.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('输入文本后预览检测到的格式并启用导入', () => {
    render(<HandImporter />);
    fireEvent.change(textarea(), { target: { value: PS_HAND } });

    expect(screen.getByText(i18n.t('handHistory.importer.format', { format: 'pokerstars' }))).not.toBeNull();
    expect(importButton().disabled).toBe(false);
  });

  it('无法识别的文本显示未知格式', () => {
    render(<HandImporter />);
    fireEvent.change(textarea(), { target: { value: 'just some text' } });

    expect(
      screen.getByText(
        i18n.t('handHistory.importer.format', { format: i18n.t('handHistory.importer.unknown') }),
      ),
    ).not.toBeNull();
  });
});

describe('HandImporter 导入结果', () => {
  it('PokerStars 单手：上报 1 手并展示成功文案', async () => {
    render(<HandImporter />);
    await pasteAndImport(PS_HAND);

    expect(addHands).toHaveBeenCalledTimes(1);
    const hands = (addHands.mock.calls[0] as unknown as [Array<{ handNumber: string }>])[0];
    expect(hands).toHaveLength(1);
    expect(hands[0]!.handNumber).toBe('111');
    expect(
      screen.getByText(i18n.t('handHistory.importer.success', { count: 1, format: 'pokerstars' })),
    ).not.toBeNull();
  });

  it('GGPoker 多手：上报 2 手', async () => {
    render(<HandImporter />);
    await pasteAndImport(`${GG_HAND}\n${GG_HAND_2}`);

    const hands = (addHands.mock.calls[0] as unknown as [Array<{ handNumber: string }>])[0];
    expect(hands.map(h => h.handNumber)).toEqual(['900', '901']);
    expect(
      screen.getByText(i18n.t('handHistory.importer.success', { count: 2, format: 'ggpoker' })),
    ).not.toBeNull();
  });

  it('PartyPoker 单手：上报 1 手并展示成功文案', async () => {
    render(<HandImporter />);
    await pasteAndImport(PARTY_HAND);

    expect(addHands).toHaveBeenCalledTimes(1);
    const hands = (addHands.mock.calls[0] as unknown as [Array<{ site: string }>])[0];
    expect(hands).toHaveLength(1);
    expect(hands[0]!.site).toBe('partypoker');
    expect(
      screen.getByText(i18n.t('handHistory.importer.success', { count: 1, format: 'partypoker' })),
    ).not.toBeNull();
  });

  it('无法识别时展示错误且不写入 store', async () => {
    render(<HandImporter />);
    await pasteAndImport('nothing to parse here');

    expect(addHands).not.toHaveBeenCalled();
    expect(screen.getByText(i18n.t('handHistory.importer.unrecognized'))).not.toBeNull();
  });

  it('解析异常转换为 parseError 文案（不崩溃）', async () => {
    render(<HandImporter />);
    await pasteAndImport(GG_BROKEN);

    expect(addHands).not.toHaveBeenCalled();
    const text = document.body.textContent ?? '';
    expect(text).toContain(i18n.t('handHistory.importer.parseError', { message: 'Invalid rank: "Z"' }));
  });

  it('IndexedDB 写入失败时不误报成功，改为展示 dbError 文案', async () => {
    addHands.mockImplementationOnce(async () => {
      useHandHistoryStore.setState({ dbError: 'quotaExceeded' });
    });
    render(<HandImporter />);
    await pasteAndImport(PS_HAND);

    expect(screen.getByText(i18n.t('handHistory.dbError.quotaExceeded'))).not.toBeNull();
    expect(
      screen.queryByText(i18n.t('handHistory.importer.success', { count: 1, format: 'pokerstars' })),
    ).toBeNull();
  });

  it('多手文本中部分无法解析时给出跳过警告', async () => {
    render(<HandImporter />);
    await pasteAndImport(`${GG_HAND}
${GG_BROKEN}`);

    const hands = (addHands.mock.calls[0] as unknown as [Array<{ handNumber: string }>])[0];
    expect(hands.map(h => h.handNumber)).toEqual(['900']);
    expect(
      screen.getByText(i18n.t('handHistory.importer.skipped', { skipped: 1, total: 2 })),
    ).not.toBeNull();
  });

  it('修改文本后清空上一次导入结果', async () => {
    render(<HandImporter />);
    await pasteAndImport(PS_HAND);
    expect(document.body.textContent).toContain(i18n.t('handHistory.importer.success', { count: 1, format: 'pokerstars' }));

    fireEvent.change(textarea(), { target: { value: PS_HAND.replace('Hero', 'Hero2') } });
    expect(document.body.textContent).not.toContain('成功导入');
  });
});

describe('HandImporter 文件读取', () => {
  it('拖拽 .txt 文件读取内容；非 .txt 文件被忽略', async () => {
    render(<HandImporter />);
    const dropZone = screen.getByText(i18n.t('handHistory.importer.dropHint')).closest('label')!;

    fireEvent.dragOver(dropZone);
    fireEvent.dragLeave(dropZone);

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [new File(['binary'], 'chart.png', { type: 'image/png' })] },
    });
    expect(textarea().value).toBe('');

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [new File([PS_HAND], 'dropped.txt', { type: 'text/plain' })] },
    });
    await waitFor(() => {
      expect(textarea().value).toContain('PokerStars Hand #111');
    });
  });

  it('选择 .txt 文件后把内容填入文本框', async () => {
    render(<HandImporter />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([PS_HAND], 'hands.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(textarea().value).toContain('PokerStars Hand #111');
    });
  });
});
