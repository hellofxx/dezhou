// P1D-06/P1F-01（专批 B）：SessionLimitGuard「开局判定」口径测试（jsdom）
// 不引入 testing-library，直接用 react-dom/client + act 渲染探针组件

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useSessionLimitReached } from '@/shared/components/gate/SessionLimitGuard';
import { useProgressStore } from '../../store';
import { getTodayString } from '@/shared/utils/spacedRepetition';
import { useDebugModeStore } from '@/shared/stores/debugMode';

/** 探针组件：把 hook 结果渲染为文本便于断言 */
function Probe() {
  const reached = useSessionLimitReached();
  return <span data-testid="probe">{reached ? 'blocked' : 'open'}</span>;
}

function setEmotionCounters(answered: number, limit: number) {
  useProgressStore.setState((s) => ({
    emotion: {
      ...s.emotion,
      dailyQuestionLimit: limit,
      dailyQuestionsAnswered: answered,
      dailyQuestionsDate: getTodayString(),
    },
  }));
}

describe('useSessionLimitReached 开局判定口径（专批 B）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    useDebugModeStore.setState({ unlockAll: false });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  afterAll(async () => {
    // 等待 progress store 模块底部 setTimeout 副作用，避免 teardown 后悬挂 timer
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  it('开局未达上限 → 放行；会话中途额度耗尽不翻转（不吞进行中会话）', () => {
    setEmotionCounters(10, 50);
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe('open');

    // 模拟答题中途额度耗尽：同一挂载内快照冻结，不得翻转为 blocked
    act(() => setEmotionCounters(50, 50));
    expect(container.textContent).toBe('open');

    act(() => setEmotionCounters(80, 50));
    expect(container.textContent).toBe('open');
  });

  it('开局已达上限 → 新挂载即拦截（blocked）', () => {
    setEmotionCounters(50, 50);
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe('blocked');
  });

  it('limit = 0（无限制）→ 放行', () => {
    setEmotionCounters(999, 0);
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe('open');
  });

  it('调试解锁旁路：开局已达上限但 unlockAll = true → 放行（响应式）', () => {
    setEmotionCounters(50, 50);
    useDebugModeStore.setState({ unlockAll: true });
    act(() => root.render(<Probe />));
    expect(container.textContent).toBe('open');

    // 关闭调试解锁后按开局口径重新判定（激活期间未冻结快照）
    act(() => useDebugModeStore.setState({ unlockAll: false }));
    expect(container.textContent).toBe('blocked');
  });
});
