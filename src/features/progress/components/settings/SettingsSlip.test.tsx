/**
 * SettingsSlip 最小烟测：/settings 路由与纸条外壳同构，关闭按钮走 onClose。
 * SettingsPage 本体分区由既有测试覆盖，本文件只锁浮层宿主。
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import SettingsSlip from './SettingsSlip';

afterEach(cleanup);

describe('SettingsSlip', () => {
  it('打开纸条并可通过关闭按钮退出', async () => {
    const onClose = vi.fn();
    render(<SettingsSlip open onClose={onClose} />);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
