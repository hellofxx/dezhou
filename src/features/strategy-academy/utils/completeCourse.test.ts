import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { Lesson } from '../types';
import { lessonTitleKey } from './titleKeys';

/**
 * completeCourse 的 SRS 入队契约用例（PRD §12.4.3「复习/回忆类状态必须存 i18n key」）。
 *
 * 缺陷原型：早期实现把数据层**课时中文原文**写进 reviewItem.label，
 * 而 SpacedRepetitionPanel / ReviewSession 走 t(item.label)，
 * i18next 未命中 key 时原样回显入参 → 英文界面复习队列回显中文课名。
 * 本用例锁定「入队 label 必须是 key、且不得等于 lesson.title」，防止回归。
 *
 * 存量脏数据由 progress store 的 v16→v17 迁移改写
 * （见 @/features/progress/utils/migrateStrategyReviewKeys.ts）。
 */

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 'l3-cbet',
    level: 3,
    order: 1,
    title: '持续下注（C-Bet）',
    subtitle: '测试副标题',
    duration: '10 min',
    content: [],
    quiz: [],
    ...overrides,
  };
}

async function loadStores() {
  const { completeCourse } = await import('./completeCourse');
  const { useProgressStore } = await import('@/features/progress/store');
  return { completeCourse, useProgressStore };
}

beforeEach(() => {
  const storageStub = createLocalStorageStub();
  // zustand persist 默认 storage 引用 window.localStorage，需同时 stub window
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });
});

describe('completeCourse 复习项 label 语言中立', () => {
  it('quiz 完成后入队的 label 为 academy.lessonTitle.<id>，而非中文原文', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson();

    completeCourse({ lessonId: lesson.id, score: 80, mode: 'quiz', lesson });

    const item = useProgressStore.getState().reviewItems.find((r) => r.id === lesson.id);
    expect(item).toBeDefined();
    expect(item!.label).toBe(lessonTitleKey(lesson.id));
    expect(item!.label).toBe('academy.lessonTitle.l3-cbet');
    // 关键断言：不得与数据层中文原文同值（英文界面会原样回显）
    expect(item!.label).not.toBe(lesson.title);
    expect(item!.label).not.toMatch(/[一-鿿]/);
    expect(item!.category).toBe('strategy');
  });

  it('高分复习项保留 interval 3 天调整，且 label 仍为 key', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson({ id: 'l4-mdf', title: '最小防御频率 (MDF)' });

    completeCourse({ lessonId: lesson.id, score: 95, mode: 'quiz', lesson });

    const item = useProgressStore.getState().reviewItems.find((r) => r.id === lesson.id);
    expect(item!.label).toBe('academy.lessonTitle.l4-mdf');
    expect(item!.interval).toBe(3);
  });

  it('同一课程重复完成不重复入队（addReviewItem 幂等，label 保持 key 形态）', async () => {
    const { completeCourse, useProgressStore } = await loadStores();
    const lesson = makeLesson({ id: 'l2-squeeze', title: 'Squeeze Play' });

    completeCourse({ lessonId: lesson.id, score: 60, mode: 'quiz', lesson });
    completeCourse({ lessonId: lesson.id, score: 90, mode: 'quiz', lesson });

    const items = useProgressStore.getState().reviewItems.filter((r) => r.id === lesson.id);
    expect(items).toHaveLength(1);
    expect(items[0]!.label).toBe('academy.lessonTitle.l2-squeeze');
  });
});
