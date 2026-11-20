import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import PersistErrorNotice from './PersistErrorNotice';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../store';
import { DEFAULT_EMOTION_STATE } from '../types';
import type { TrainingRecord } from '../types';
import { clearPersistenceFailure, reportPersistenceFailure } from '../persistenceStatus';

/**
 * 持久化失败提示条（分源 + 三条动作）。
 *
 * 契约：
 * - 按来源分别显示「学习状态未保存 / 训练记录仅本次可见 / 历史记录加载失败 / 维护清理失败」，
 *   不再一律归因为「磁盘已满」；
 * - 重试：localStorage 走快照重写（成功后提示消失），records 走 retryPendingRecords（仍失败给出提示）；
 * - 前往设置走 SPA 路由（保留 /dezhou/ basename），不做 window.location 整页硬跳；
 * - 「下载当前数据」不读 IndexedDB，直接序列化内存 records + settings，并在文案与载荷里
 *   标注不含可能未加载的历史与牌局、不是完整备份。
 */

const downloadBlobs: Blob[] = [];

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function seedStore(): void {
  useProgressStore.setState({
    records: [],
    streak: { ...DEFAULT_STREAK_STATE },
    emotion: { ...DEFAULT_EMOTION_STATE },
    onboarding: { ...DEFAULT_ONBOARDING },
    settings: {
      theme: 'dark',
      soundEnabled: true,
      defaultQuizTime: 15,
      defaultQuestionCount: 20,
      language: 'zh',
    },
  });
}

function buildRecord(id: string): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt: Date.now(),
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions: 10,
      correctAnswers: 6,
      accuracy: 0.6,
      averageTime: 4000,
      timestamp: Date.now(),
      details: [],
    },
  };
}

/** basename 与生产一致（/dezhou/）：验证 SPA 跳转保留 basename */
function renderNotice() {
  return render(
    <MemoryRouter basename="/dezhou" initialEntries={['/dezhou/range-trainer']}>
      <PersistErrorNotice />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function readBlobText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

beforeEach(() => {
  seedStore();
  downloadBlobs.length = 0;
  Object.defineProperty(globalThis.URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => {
      downloadBlobs.push(blob);
      return 'blob:mock';
    },
  });
  Object.defineProperty(globalThis.URL, 'revokeObjectURL', { configurable: true, value: () => {} });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  seedStore();
  clearPersistenceFailure('localStorage');
  clearPersistenceFailure('records');
  clearPersistenceFailure('cleanup');
  vi.restoreAllMocks();
});

describe('PersistErrorNotice 无失败时', () => {
  it('三个来源均正常时不渲染任何提示', () => {
    const { container } = renderNotice();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});

describe('PersistErrorNotice 分源文案', () => {
  it('localStorage 写失败显示「学习状态未保存」', () => {
    reportPersistenceFailure('localStorage', { reason: 'quota', operation: 'write' });
    const { getByRole, container } = renderNotice();

    expect(getByRole('alert')).toBeTruthy();
    expect(container.textContent).toContain('学习状态未保存');
    expect(container.textContent).not.toContain('磁盘已满');
  });

  it('records 写失败显示「训练记录仅本次可见」并带待写入条数', () => {
    reportPersistenceFailure('records', { reason: 'unavailable', operation: 'add', pending: 3 });
    const { container } = renderNotice();

    expect(container.textContent).toContain('训练记录仅本次可见');
    expect(container.textContent).toContain('待写入 3 条');
  });

  it('records 加载失败显示「历史记录加载失败」（与写失败区分）', () => {
    reportPersistenceFailure('records', { reason: 'unknown', operation: 'load' });
    const { container } = renderNotice();

    expect(container.textContent).toContain('历史记录加载失败');
    expect(container.textContent).not.toContain('训练记录仅本次可见');
  });

  it('cleanup 失败显示「维护清理失败」', () => {
    reportPersistenceFailure('cleanup', { reason: 'unknown', operation: 'cleanup' });
    const { container } = renderNotice();

    expect(container.textContent).toContain('维护清理失败');
  });

  it('多来源同时失败时逐条列出', () => {
    reportPersistenceFailure('localStorage', { reason: 'quota', operation: 'write' });
    reportPersistenceFailure('cleanup', { reason: 'unknown', operation: 'cleanup' });
    const { container } = renderNotice();

    expect(container.textContent).toContain('学习状态未保存');
    expect(container.textContent).toContain('维护清理失败');
  });
});

describe('PersistErrorNotice 重试', () => {
  it('localStorage 来源重试成功后提示消失', async () => {
    reportPersistenceFailure('localStorage', { reason: 'quota', operation: 'write' });
    const { container, getByText } = renderNotice();

    fireEvent.click(getByText('重试'));

    await waitFor(() => {
      expect(container.querySelector('[role="alert"]')).toBeNull();
    });
    expect(container.textContent).not.toContain('重试仍未成功');
  });

  it('records 来源重试走 retryPendingRecords，仍失败时给出提示', async () => {
    const originalRetry = useProgressStore.getState().retryPendingRecords;
    const retrySpy = vi.fn(async () => ({ retried: 2, saved: 0, failed: 2 }));
    useProgressStore.setState({ retryPendingRecords: retrySpy });
    reportPersistenceFailure('records', { reason: 'quota', operation: 'add', pending: 2 });

    const { container, getByText } = renderNotice();
    fireEvent.click(getByText('重试'));

    await waitFor(() => {
      expect(retrySpy).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(container.textContent).toContain('重试仍未成功');
    });

    useProgressStore.setState({ retryPendingRecords: originalRetry });
  });
});

describe('PersistErrorNotice 下载与导航', () => {
  it('下载当前数据：不读 IDB，仅内存 records+settings，并标注不是完整备份', async () => {
    useProgressStore.setState({ records: [buildRecord('mem-1')] });
    reportPersistenceFailure('localStorage', { reason: 'quota', operation: 'write' });

    const { container, getByText } = renderNotice();
    expect(container.textContent).toContain('不含可能未加载的历史与牌局，不是完整备份');

    fireEvent.click(getByText('下载当前数据'));

    await waitFor(() => {
      expect(downloadBlobs).toHaveLength(1);
    });
    const payload = JSON.parse(await readBlobText(downloadBlobs[0]!)) as Record<string, unknown>;
    expect(payload.partial).toBe(true);
    expect(payload.handsIncluded).toBe(false);
    expect(payload).not.toHaveProperty('hands');
    expect((payload.records as TrainingRecord[]).map((r) => r.id)).toEqual(['mem-1']);
    expect(payload.settings).toMatchObject({ language: 'zh' });
    expect(String(payload.note)).toContain('不是完整备份');
  });

  it('前往设置走 SPA 路由（保留 /dezhou basename），不做整页硬跳', () => {
    reportPersistenceFailure('cleanup', { reason: 'unknown', operation: 'cleanup' });
    const beforeHref = window.location.href;
    const { container, getByText } = renderNotice();

    fireEvent.click(getByText('前往设置'));

    // SPA 路由内跳转：useLocation 给出 basename 内路径（basename 由路由器持有，不下发）
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/settings');
    // 未发生整页导航：window.location 仍停在测试起点（硬跳会把它改成 /settings）
    expect(window.location.href).toBe(beforeHref);
    expect(window.location.pathname).not.toBe('/settings');
  });

  it('关闭后不再显示，直到出现新的失败', async () => {
    reportPersistenceFailure('cleanup', { reason: 'unknown', operation: 'cleanup' });
    const { container, getByLabelText } = renderNotice();

    fireEvent.click(getByLabelText('关闭提示'));
    expect(container.querySelector('[role="alert"]')).toBeNull();

    // 新的失败（时间戳更新）应重新出现
    await new Promise((resolve) => setTimeout(resolve, 2));
    reportPersistenceFailure('localStorage', { reason: 'quota', operation: 'write' });

    await waitFor(() => {
      expect(container.querySelector('[role="alert"]')).toBeTruthy();
    });
  });
});
