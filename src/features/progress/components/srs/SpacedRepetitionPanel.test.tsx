/**
 * SpacedRepetitionPanel 理论分类渲染/跳转测试（jsdom）。
 *
 * 锁定「理论学院接入 SRS」的端到端可见行为（纯函数侧由 utils/reviewRoute.test.ts 覆盖）：
 * 1. category='theory' 的到期项显示「理论」标签与 frost token 配色（而非回退成「策略」）；
 * 2. 点击「复习」跳到 metadata.route 指向的章节页，不落入 /academy/lesson 死链。
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 TheoryQuiz 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import SpacedRepetitionPanel from './SpacedRepetitionPanel';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function theoryItem(): ReviewItem {
  return createReviewItem('theory:t1-combinatorics-q1', '组合计数题面', 'theory', {
    source: 'theory',
    route: '/theory/chapter/t1-combinatorics',
    front: '题干',
    back: '解析',
  });
}

describe('SpacedRepetitionPanel 理论复习项', () => {
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

  function render(items: ReviewItem[]) {
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <SpacedRepetitionPanel reviewItems={items} todayItems={items} />
          <LocationProbe />
        </MemoryRouter>,
      );
    });
  }

  it('到期理论项渲染「理论」分类标签（不回退成「策略」）', () => {
    render([theoryItem()]);
    const chip = Array.from(container.querySelectorAll('span')).find((el) =>
      el.textContent?.includes('理论'),
    );
    expect(chip).toBeTruthy();
    // 配色必须走 frost token（分类第 5 色），且不得复用策略分类的 indigo 类
    expect(chip!.className).toContain('--poker-frost');
    expect(chip!.className).not.toContain('--poker-indigo');
  });

  it('点击「复习」跳到 metadata.route 的章节页', () => {
    render([theoryItem()]);
    const reviewBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('复习'),
    );
    expect(reviewBtn).toBeTruthy();
    act(() => {
      reviewBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[data-probe]')?.textContent).toBe(
      '/theory/chapter/t1-combinatorics',
    );
  });

  it('理论项缺 route（老存量数据）时跳转回退理论主页而非死链', () => {
    const legacy = theoryItem();
    delete legacy.metadata?.route;
    render([legacy]);
    const reviewBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('复习'),
    );
    act(() => {
      reviewBtn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/theory');
  });
});
