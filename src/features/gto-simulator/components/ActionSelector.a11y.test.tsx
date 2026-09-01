// UI 无障碍残留回归测试（jsdom）：ActionSelector 按钮 aria-label + 滑块 aria-valuetext。
// 遵循既有组件测试基式（react-dom/client + act，不引入 testing-library）。

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { ActionSelector } from './ActionSelector';
import { ActionType } from '@/shared/types/action';

function fireClick(node: HTMLElement) {
  node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

describe('ActionSelector 无障碍（a11y 残留修复）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await preloadI18n(['gto']);
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderSel = () =>
    act(() => {
      root.render(
        <ActionSelector
          potSize={6}
          effectiveStack={100}
          callAmount={2.5}
          onDecision={() => {}}
        />
      );
    });

  it('三个主动作按钮 + All-In 均带 aria-label', () => {
    renderSel();
    const fold = container.querySelector<HTMLButtonElement>('[aria-label="Fold"]');
    const call = container.querySelector<HTMLButtonElement>('[aria-label="Call 2.5BB"]');
    const raise = container.querySelector<HTMLButtonElement>('[aria-label="Raise"]');
    const allIn = container.querySelector<HTMLButtonElement>('[aria-label="All-In (100 BB)"]');

    expect(fold).not.toBeNull();
    expect(call).not.toBeNull();
    expect(raise).not.toBeNull();
    expect(allIn).not.toBeNull();
  });

  it('展开加注面板后，raise 滑块带 aria-valuetext（当前 BB 播报）', () => {
    renderSel();
    const raiseBtn = container.querySelector<HTMLButtonElement>('[aria-label="Raise"]');
    expect(raiseBtn).not.toBeNull();

    act(() => fireClick(raiseBtn!));

    const slider = container.querySelector<HTMLInputElement>('input[type="range"]');
    expect(slider).not.toBeNull();
    expect(slider!.getAttribute('aria-valuetext')).toBeTruthy();
    expect(slider!.getAttribute('aria-label')).toBeTruthy();
  });

  it('无 callAmount（limp/check 语境）时 Call 按钮呈现 Check 语义的 aria-label', () => {
    act(() => {
      root.render(
        <ActionSelector potSize={6} effectiveStack={100} onDecision={() => {}} />
      );
    });
    const check = container.querySelector<HTMLButtonElement>('[aria-label="Check"]');
    expect(check).not.toBeNull();
  });

  // 类型守卫：确保 ActionType 引用有效（避免死引用告警）
  const _actionRef: ActionType = ActionType.Fold;
  void _actionRef;
});
