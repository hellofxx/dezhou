import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy store markUnitCompleted 测试（P4 小节完成记录）。
 * 幂等：重复标记同一 unit 不重复计数（符合项目「记录完成 action 必须幂等」规范）。
 */
describe('strategy-academy markUnitCompleted', () => {
  beforeEach(() => {
    // 每个用例独立模块实例 + 空 localStorage，避免用例间状态残留
    vi.resetModules();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
  });

  it('标记小节完成写入 completedUnits[lessonId]', async () => {
    const { useAcademyStore } = await import('./store');
    const s = useAcademyStore.getState();
    s.markUnitCompleted('l1-hand-rankings', 'u1');
    expect(useAcademyStore.getState().progress.completedUnits['l1-hand-rankings']).toEqual(['u1']);
  });

  it('同一 unit 重复标记只记录一次（幂等）', async () => {
    const { useAcademyStore } = await import('./store');
    const s = useAcademyStore.getState();
    s.markUnitCompleted('l1-hand-rankings', 'u1');
    s.markUnitCompleted('l1-hand-rankings', 'u1');
    s.markUnitCompleted('l1-hand-rankings', 'u1');
    expect(useAcademyStore.getState().progress.completedUnits['l1-hand-rankings']).toEqual(['u1']);
  });

  it('不同 unit 按标记顺序追加', async () => {
    const { useAcademyStore } = await import('./store');
    const s = useAcademyStore.getState();
    s.markUnitCompleted('l1-hand-rankings', 'u1');
    s.markUnitCompleted('l1-hand-rankings', 'u2');
    s.markUnitCompleted('l1-hand-rankings', 'u1'); // 重复插在中间，不改变顺序
    expect(useAcademyStore.getState().progress.completedUnits['l1-hand-rankings']).toEqual(['u1', 'u2']);
  });

  it('不同 lesson 独立记录', async () => {
    const { useAcademyStore } = await import('./store');
    const s = useAcademyStore.getState();
    s.markUnitCompleted('l1-hand-rankings', 'u1');
    s.markUnitCompleted('l1-position-basics', 'u2');
    const { completedUnits } = useAcademyStore.getState().progress;
    expect(completedUnits['l1-hand-rankings']).toEqual(['u1']);
    expect(completedUnits['l1-position-basics']).toEqual(['u2']);
  });

  it('不影响 completedLessons / quizScores 等其他进度字段', async () => {
    const { useAcademyStore } = await import('./store');
    const s = useAcademyStore.getState();
    s.markUnitCompleted('l1-hand-rankings', 'u1');
    const progress = useAcademyStore.getState().progress;
    expect(progress.completedLessons).toEqual([]);
    expect(progress.quizScores).toEqual({});
    expect(progress.currentLesson).toBeNull();
  });
});
