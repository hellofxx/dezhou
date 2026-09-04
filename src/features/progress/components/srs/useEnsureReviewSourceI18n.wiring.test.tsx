/**
 * useEnsureReviewSourceI18n 接线测试（jsdom）。
 *
 * 证明「渲染复习项即触发来源翻译包补加载」这一环真实存在：
 * 复习队列 / 复习会话渲染在 Dashboard 路由 '/'，其 FEATURE_GROUPS 分组不含
 * theory / rangeTrainer / potOdds / gto，冷启动直达首页时若不补加载，
 * t(key) 会原样回显 key 字面量（中英皆错）。
 *
 * 双语解析结果本身的断言见 src/features/theory-academy/components/theoryReviewI18n.test.tsx
 * （模块单向依赖只允许 theory-academy → progress，本文件因此不引用理论题库，改用合成复习项）。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';

const preloadI18n = vi.fn((_keys: readonly unknown[]) => Promise.resolve());
vi.mock('@/i18n/preload', () => ({
  preloadI18n: (keys: readonly unknown[]) => preloadI18n(keys),
}));

import SpacedRepetitionPanel from './SpacedRepetitionPanel';
import ReviewSession from './ReviewSession';
import { createReviewItem } from '@/shared/utils/spacedRepetition';
import type { ReviewItem, ReviewItemMetadata } from '@/shared/utils/spacedRepetition';

/** 合成一个 label/front/back 均为 i18n key 的复习项（形态与理论复习项一致） */
function itemWith(source: NonNullable<ReviewItemMetadata['source']>): ReviewItem {
  return createReviewItem(`${source}:q1`, `${source}.quiz.q1.question`, source, {
    source,
    front: `${source}.quiz.q1.question`,
    back: `${source}.quiz.q1.explanation`,
  });
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  preloadI18n.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function calledModules(): unknown[] {
  return preloadI18n.mock.calls.map((call) => call[0]);
}

describe('复习渲染触发来源翻译包补加载', () => {
  it('渲染含理论复习项的队列时请求 theory 包', () => {
    const item = itemWith('theory');
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <SpacedRepetitionPanel reviewItems={[item]} todayItems={[item]} />
        </MemoryRouter>,
      );
    });
    expect(calledModules()).toContainEqual(['theory']);
  });

  it('打开复习会话时同样请求 theory 包（自评卡片 front/back 依赖它）', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <ReviewSession open onOpenChange={() => {}} initialItems={[itemWith('theory')]} />
        </MemoryRouter>,
      );
    });
    expect(calledModules()).toContainEqual(['theory']);
  });

  it('多来源混合时一次请求全部所需包', () => {
    const items = [itemWith('theory'), itemWith('range'), itemWith('odds')];
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <SpacedRepetitionPanel reviewItems={items} todayItems={items} />
        </MemoryRouter>,
      );
    });
    expect(calledModules()).toContainEqual(['potOdds', 'rangeTrainer', 'theory']);
  });

  it('策略学院复习项不触发加载（academy 属 core，启动即就绪）', () => {
    const item = itemWith('strategy');
    act(() => {
      root.render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <SpacedRepetitionPanel reviewItems={[item]} todayItems={[item]} />
        </MemoryRouter>,
      );
    });
    expect(preloadI18n).not.toHaveBeenCalled();
  });
});
