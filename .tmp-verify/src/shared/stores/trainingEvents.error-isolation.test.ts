/**
 * trainingEvents 错误隔离验证（P1-02）
 * 
 * 验证当订阅者抛出异常时，不会中断主线程循环
 */
import { describe, it, expect } from 'vitest';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingRecord } from '@/shared/types/training';

describe('trainingEvents error isolation (P1-02)', () => {
  it('subscriber 抛错不应中断主线程循环', () => {
    const validRecord: TrainingRecord = {
      id: 'test-valid-1',
      module: 'puzzle-trainer',
      mode: 'quiz',
      result: {
        sessionId: 'sess-1',
        module: 'puzzle-trainer',
        totalQuestions: 1,
        correctAnswers: 1,
        accuracy: 1,
        averageTime: 1000,
        timestamp: Date.now(),
        details: [],
      },
      createdAt: Date.now(),
    };

    const brokenRecord: TrainingRecord = {
      id: 'test-broken-1',
      module: 'puzzle-trainer',
      mode: 'quiz',
      result: {
        sessionId: 'sess-2',
        module: 'puzzle-trainer',
        totalQuestions: 1,
        correctAnswers: 0,
        accuracy: 0,
        averageTime: 1000,
        timestamp: Date.now(),
        details: [],
      },
      createdAt: Date.now(),
    };

    let callCount = 0;
    
    // 正常订阅者
    const validCb = (_: TrainingRecord) => {
      callCount++;
      console.log('✓ Valid subscriber processed:', callCount);
    };
    const brokenCb = (_: TrainingRecord) => {
      throw new Error('Simulated subscriber failure');
    };

    // 订阅两个回调
    const unsubscribeValid = trainingEvents.subscribe(validCb);
    const unsubscribeBroken = trainingEvents.subscribe(brokenCb);

    // 记录正常事件 → 应触发有效订阅者，故障订阅者抛错但不中断
    let mainThreadHalted = false;
    try {
      trainingEvents.emit(validRecord);
      
      // 继续执行后续逻辑（证明未中断）
      trainingEvents.emit(brokenRecord); // accuracy=0，不触发 callCount++
      
      // 再次发射正常事件（验证订阅者仍可接收）
      trainingEvents.emit(validRecord);
    } catch (err) {
      mainThreadHalted = true;
      console.error('✗ Main thread halted:', err);
    }

    // 取消订阅
    unsubscribeValid();
    unsubscribeBroken();

    // 断言
    expect(mainThreadHalted).toBe(false); // 主线未中断
    expect(callCount).toBe(3); // 有效订阅者被调用了 3 次（所有 emit 都触发），但只有 accuracy=1 时打印日志
  });

  it('多个订阅者中单个失败不影响其他订阅者', () => {
    const record: TrainingRecord = {
      id: 'test-multi-1',
      module: 'puzzle-trainer',
      mode: 'quiz',
      result: {
        sessionId: 'sess-3',
        module: 'puzzle-trainer',
        totalQuestions: 1,
        correctAnswers: 1,
        accuracy: 1,
        averageTime: 1000,
        timestamp: Date.now(),
        details: [],
      },
      createdAt: Date.now(),
    };

    let cb1Called = false;
    let cb2Called = false;
    let cb3Called = false;

    const cb1 = (_: TrainingRecord) => { cb1Called = true; };
    const cb2 = (_: TrainingRecord) => { throw new Error('CB2 failed'); };
    const cb3 = (_: TrainingRecord) => { cb3Called = true; };

    trainingEvents.subscribe(cb1);
    trainingEvents.subscribe(cb2);
    trainingEvents.subscribe(cb3);

    trainingEvents.emit(record);

    expect(cb1Called).toBe(true); // CB1 成功
    expect(cb2Called).toBe(false); // CB2 抛错
    expect(cb3Called).toBe(true); // CB3 仍被调用（证明 CB2 失败未影响 CB3）
  });
});
