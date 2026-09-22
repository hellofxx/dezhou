/**
 * P0 复验探针（jsdom）：addReviewItem 写入后 localStorage 的真实结构。
 *
 * 背景：Wave 3 浏览器验收脚本以 `JSON.parse(localStorage.getItem('poker-training-progress')).reviewItems`
 * 读取复习队列，结果恒为空 → 误判「章末小测入队断裂」。本探针用真实 progress store
 * 写入一条复习项后直接读 localStorage，确认 zustand persist 的包装层形态
 * （预期为 `{ state: {...}, version }`，即复习队列在 `state.reviewItems` 而非顶层）。
 *
 * 注意：此测试不依赖任何 feature module 的导入（如 theory-academy），仅使用硬编码数据，
 * 因此符合 eslint 白名单约束（progress 出边为 []）。原文件中的测试 2（theory 章节数据验证）
 * 已移出至 theory-academy/utils/theorySrs.test.ts。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

describe('persist 包装层探针（P0 入队断裂复验）', () => {
  beforeEach(() => {
    const stub = createLocalStorageStub();
    vi.stubGlobal('localStorage', stub);
    vi.stubGlobal('window', { localStorage: stub });
  });

  it('addReviewItem 后 localStorage 结构为 {state:{reviewItems},version}（包装层）', async () => {
    const { useProgressStore } = await import('./store');
    const store = useProgressStore.getState();
    const before = store.reviewItems.length;

    const item = {
      id: 'theory:t1-combinatorics-q1',
      label: 'theory.quiz.t1-combinatorics-q1.question',
      category: 'theory',
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: '2026-09-07',
      metadata: {
        front: 'theory.quiz.t1-combinatorics-q1.question',
        back: 'theory.quiz.t1-combinatorics-q1.explanation',
        source: 'theory' as const,
        route: '/theory/chapter/t1-combinatorics',
      },
    };
    store.addReviewItem(item);

    const raw = localStorage.getItem('poker-training-progress');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);

    // 包装层断言：顶层是 state/version，不是 reviewItems
    expect(parsed).toHaveProperty('state');
    expect(parsed).toHaveProperty('version');
    expect(parsed).not.toHaveProperty('reviewItems');

    // 复习项写入 state.reviewItems
    const stateItems = parsed.state.reviewItems as Array<{ id: string }>;
    expect(stateItems.some((r) => r.id === 'theory:t1-combinatorics-q1')).toBe(true);
    expect(stateItems.length).toBe(before + 1);
  });
});
