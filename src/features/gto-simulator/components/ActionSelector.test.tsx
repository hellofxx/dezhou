/**
 * ActionSelector 交互测试（L2 · jsdom）
 *
 * 补充既有 ActionSelector.a11y.test.tsx（只覆盖 aria 语义）：本文件覆盖
 *  - 主动作按钮回调（Fold / Call / Check / Raise / All-In）
 *  - 加注面板：快捷尺寸、滑块、确认提交的区间钳制
 *  - 键盘快捷键 1/2/3/4 与 disabled 期间整体旁路
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ActionSelector } from './ActionSelector';
import { ActionType } from '@/shared/types/action';

afterEach(() => cleanup());

/** callAmount 传 null 表示不传（check 语境） */
function setup(overrides?: {
  callAmount?: number | null;
  disabled?: boolean;
  effectiveStack?: number;
}) {
  const onDecision = vi.fn();
  render(
    <ActionSelector
      potSize={6}
      effectiveStack={overrides?.effectiveStack ?? 100}
      callAmount={overrides?.callAmount === null ? undefined : (overrides?.callAmount ?? 2.5)}
      onDecision={onDecision}
      disabled={overrides?.disabled}
    />,
  );
  return { onDecision };
}

const clickButton = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const pressKey = (key: string) => fireEvent.keyDown(window, { key });

describe('ActionSelector 主动作', () => {
  it('Fold / Call / All-In 按钮分别回调对应动作与金额', () => {
    const { onDecision } = setup();

    clickButton('Fold');
    expect(onDecision).toHaveBeenNthCalledWith(1, { action: ActionType.Fold });

    clickButton('Call 2.5BB');
    expect(onDecision).toHaveBeenNthCalledWith(2, { action: ActionType.Call, amount: 2.5 });

    clickButton('All-In (100 BB)');
    expect(onDecision).toHaveBeenNthCalledWith(3, { action: ActionType.AllIn, amount: 100 });
  });

  it('无 callAmount（check 语境）时按钮回调 Call 且不带金额', () => {
    const { onDecision } = setup({ callAmount: null });

    clickButton('Check');

    expect(onDecision).toHaveBeenCalledWith({ action: ActionType.Call, amount: undefined });
  });
});

describe('ActionSelector 加注面板', () => {
  it('点击 Raise 展开面板，再次点击收起且不提交决策', () => {
    const { onDecision } = setup();
    const raise = screen.getByRole('button', { name: 'Raise' });

    fireEvent.click(raise);
    expect(raise.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('1/2 Pot')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Raise 5.0 BB' })).toBeTruthy();

    fireEvent.click(raise);
    expect(raise.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('1/2 Pot')).toBeNull();
    expect(onDecision).not.toHaveBeenCalled();
  });

  it('快捷尺寸按钮改变加注额并提交（Pot = 底池 6 BB）', () => {
    const { onDecision } = setup();
    clickButton('Raise');

    clickButton('Pot');
    clickButton('Raise 6.0 BB');

    expect(onDecision).toHaveBeenCalledWith({ action: ActionType.Raise, amount: 6 });
    // 提交后收起面板
    expect(screen.queryByText('1/2 Pot')).toBeNull();
  });

  it('滑块改变加注额，提交时按区间钳制（低于 minRaise 抬到 2×callAmount）', () => {
    const { onDecision } = setup();
    clickButton('Raise');

    const slider = screen.getByRole('slider') as HTMLInputElement;
    expect(slider.min).toBe('5');
    expect(slider.max).toBe('100');

    fireEvent.change(slider, { target: { value: '15' } });
    clickButton('Raise 15.0 BB');
    expect(onDecision).toHaveBeenNthCalledWith(1, { action: ActionType.Raise, amount: 15 });

    // 重新展开并输入低于下限的尺寸 → 钳制到 minRaise（5 BB）
    clickButton('Raise');
    fireEvent.change(screen.getByRole('slider'), { target: { value: '1' } });
    clickButton('Raise 5.0 BB');
    expect(onDecision).toHaveBeenNthCalledWith(2, { action: ActionType.Raise, amount: 5 });
  });
});

describe('ActionSelector 键盘快捷键', () => {
  it('1 / 2 / 4 直接提交 Fold / Call / All-In', () => {
    const { onDecision } = setup();

    pressKey('1');
    pressKey('2');
    pressKey('4');

    expect(onDecision).toHaveBeenNthCalledWith(1, { action: ActionType.Fold });
    expect(onDecision).toHaveBeenNthCalledWith(2, { action: ActionType.Call, amount: 2.5 });
    expect(onDecision).toHaveBeenNthCalledWith(3, { action: ActionType.AllIn, amount: 100 });
  });

  it('3 首次展开加注面板，再次按下按当前尺寸提交 Raise', () => {
    const { onDecision } = setup();

    pressKey('3');
    expect(screen.getByRole('button', { name: 'Raise' }).getAttribute('aria-expanded')).toBe('true');
    expect(onDecision).not.toHaveBeenCalled();

    fireEvent.change(screen.getByRole('slider'), { target: { value: '9' } });
    pressKey('3');

    expect(onDecision).toHaveBeenCalledWith({ action: ActionType.Raise, amount: 9 });
  });

  it('disabled 时键盘与按钮均不产生决策', () => {
    const { onDecision } = setup({ disabled: true });

    pressKey('1');
    pressKey('4');

    expect(onDecision).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Fold' }) as HTMLButtonElement).disabled).toBe(true);
    expect(
      (screen.getByRole('button', { name: 'All-In (100 BB)' }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});
