/**
 * recordDatabase（训练记录 IndexedDB 持久层）单元测试（Node + fake-indexeddb）。
 *
 * 契约（见 recordDatabase.ts 顶部注释）：
 * - add 以 id 为主键 put，重复写入同 id 幂等覆盖；
 * - getAll 返回全部记录；
 * - delete 按 id 删除；
 * - clear 清空；
 * - cleanup(limit) 保留最近 N 条（按 createdAt 降序），返回被删除条数。
 *
 * 隔离：DB 名为模块内常量（跨用例共享），故每个用例前 clear() 清库，
 * 不使用模块级私有状态断言，避免用例顺序耦合。
 */
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { recordDatabase } from './recordDatabase';
import type { TrainingRecord } from '@/shared/types/training';

function buildRecord(
  id: string,
  createdAt: number,
  module: TrainingRecord['module'] = 'range-trainer',
): TrainingRecord {
  return {
    id,
    module,
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module,
      totalQuestions: 10,
      correctAnswers: 7,
      accuracy: 0.7,
      averageTime: 4200,
      timestamp: createdAt,
      details: [],
    },
  };
}

describe('recordDatabase（IndexedDB 训练记录持久层）', () => {
  beforeEach(async () => {
    await recordDatabase.clear();
  });

  it('add + getAll 往返：写入的记录可原样读回', async () => {
    await recordDatabase.add([buildRecord('r1', 1000), buildRecord('r2', 2000, 'pot-odds')]);

    const all = await recordDatabase.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((r) => r.id).toSorted()).toEqual(['r1', 'r2']);
    // 记录内容不带部分字段（result 完整性）
    const r2 = all.find((r) => r.id === 'r2');
    expect(r2?.module).toBe('pot-odds');
    expect(r2?.result.totalQuestions).toBe(10);
  });

  it('同一 id 重复 add 幂等覆盖，不产生重复行', async () => {
    await recordDatabase.add([buildRecord('dup', 1000)]);
    const updated = buildRecord('dup', 1000);
    updated.result.correctAnswers = 10;
    updated.result.accuracy = 1;
    await recordDatabase.add([updated]);

    const all = await recordDatabase.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.result.correctAnswers).toBe(10);
  });

  it('delete 按 id 删除，其余记录保留', async () => {
    await recordDatabase.add([buildRecord('keep', 1000), buildRecord('drop', 2000)]);

    await recordDatabase.delete('drop');

    const all = await recordDatabase.getAll();
    expect(all.map((r) => r.id)).toEqual(['keep']);
  });

  it('cleanup(limit) 保留最近 N 条并返回被删除条数', async () => {
    await recordDatabase.add([
      buildRecord('oldest', 1000),
      buildRecord('middle', 2000),
      buildRecord('newest', 3000),
    ]);

    const removed = await recordDatabase.cleanup(2);

    expect(removed).toBe(1);
    const remaining = await recordDatabase.getAll();
    expect(remaining.map((r) => r.id).toSorted()).toEqual(['middle', 'newest']);
  });

  it('cleanup 在记录数未超限时不删除任何数据', async () => {
    await recordDatabase.add([buildRecord('a', 1000), buildRecord('b', 2000)]);

    const removed = await recordDatabase.cleanup(1000);

    expect(removed).toBe(0);
    expect(await recordDatabase.getAll()).toHaveLength(2);
  });

  it('clear 清空全部记录', async () => {
    await recordDatabase.add([buildRecord('a', 1000), buildRecord('b', 2000)]);

    await recordDatabase.clear();

    expect(await recordDatabase.getAll()).toEqual([]);
  });
});
