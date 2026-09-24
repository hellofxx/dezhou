// StreakTracker 组件冒烟测试（jsdom）：验证 tsx 测试路由可用
// 不引入 testing-library，直接用 react-dom/client + act 渲染

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import StreakTracker from './StreakTracker';

describe('StreakTracker 冒烟测试', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('渲染标题、当前与最长连续天数', () => {
    act(() => {
      root.render(
        <StreakTracker currentStreak={3} longestStreak={7} calendarData={new Map()} />,
      );
    });

    const text = container.textContent ?? '';
    expect(text).toContain('训练打卡');
    expect(text).toContain('当前连续天数');
    expect(text).toContain('最长连续记录');
    expect(text).toContain('3');
    expect(text).toContain('7');
  });

  it('渲染最近 30 天打卡日历网格', () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    act(() => {
      root.render(
        <StreakTracker
          currentStreak={1}
          longestStreak={1}
          calendarData={new Map([[dateStr, 2]])}
        />,
      );
    });

    // 30 天网格：每个单元格带 sr-only 日期文本
    expect(container.textContent).toContain('最近 30 天');
    expect(container.textContent).toContain(`${dateStr}: 2`);
  });
});
