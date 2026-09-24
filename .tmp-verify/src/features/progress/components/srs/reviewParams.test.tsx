/**
 * 复习项 label / back 的 `metadata.params` 插值守卫（jsdom）。
 *
 * 背景：渲染层原先只对 `metadata.front` 与 `options[].text` 传 `metadata.params`，
 * `label` 与 `metadata.back` 不传 —— 一旦复习项采用「静态 key + 结构化插值参数」
 * （gto-simulator 的复习项即如此：场景运行时生成，无现成完整文案 key），
 * label / back 就会渲染出 `{{var}}` 裸模板。
 *
 * 本测试锁定补齐后的插值行为，并保护「无 params 的既有项」不回归。
 * 复用真实存在的带插值 key，不为测试新增文案。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import SpacedRepetitionPanel from './SpacedRepetitionPanel';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

/** zh 译文为「用时 {{sec}} 秒」——真实存在且带插值的 key */
const INTERPOLATED_KEY = 'review.complete.duration';

function gtoLikeItem(params?: Record<string, unknown>): ReviewItem {
  const item = createReviewItem('gto:btn-open:AKs', INTERPOLATED_KEY, 'gto', {
    source: 'gto',
    front: INTERPOLATED_KEY,
    back: INTERPOLATED_KEY,
  });
  if (params) {
    item.metadata = { ...item.metadata, params } as ReviewItem['metadata'];
  }
  return item;
}

describe('复习项 params 插值（label）', () => {
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
        </MemoryRouter>,
      );
    });
  }

  it('带 params 时 label 渲染插值结果，不残留裸模板占位符', () => {
    render([gtoLikeItem({ sec: 12 })]);
    const text = container.textContent ?? '';
    expect(text).toContain('用时 12 秒');
    expect(text).not.toContain('{{');
  });

  it('无 params 的既有项行为不变（仍解析为 zh 译文，不抛错）', () => {
    render([gtoLikeItem()]);
    const text = container.textContent ?? '';
    expect(text).toContain('用时');
  });
});
