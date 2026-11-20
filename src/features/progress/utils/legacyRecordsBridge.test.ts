/**
 * legacyRecordsBridge 单元测试（unit 项目，Node 环境）。
 *
 * 契约：
 * - capture 只从 persist 原始载荷提取「非空 + 有 id + 有 createdAt」的旧 records，
 *   损坏 JSON / 非对象 / 空数组一律安全跳过（不抛、不记录正文）；
 * - preserve 在桥接激活期间把旧 records 合并回即将写入的载荷（同 id 以已存在为准）；
 * - remove 成功才释放桥接并摘掉载荷中的 records；写回失败保持激活并上报 records 来源。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildPersistPayload,
  createLocalStorageStub,
  type LocalStorageStub,
} from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from '@/shared/types/training';
import { __resetPersistenceStatus, getPersistenceStatus } from '../persistenceStatus';
import {
  LEGACY_RECORDS_STORAGE_KEY,
  captureLegacyRecords,
  getLegacyRecords,
  isLegacyBridgeActive,
  preserveLegacyRecordsInPayload,
  releaseLegacyBridge,
  removeLegacyRecordsFromStorage,
} from './legacyRecordsBridge';

function buildRecord(id: string, createdAt: number, correctAnswers = 7): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions: 10,
      correctAnswers,
      accuracy: correctAnswers / 10,
      averageTime: 4000,
      timestamp: createdAt,
      details: [],
    },
  };
}

let storage: LocalStorageStub;

function useStorage(seed: Record<string, string> = {}): LocalStorageStub {
  storage = createLocalStorageStub(seed);
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('window', { localStorage: storage });
  return storage;
}

function storedPayloadState(): Record<string, unknown> {
  const raw = storage.getItem(LEGACY_RECORDS_STORAGE_KEY);
  if (raw === null) throw new Error('persist payload missing');
  const parsed = JSON.parse(raw) as { state: Record<string, unknown> };
  return parsed.state;
}

beforeEach(() => {
  useStorage();
  releaseLegacyBridge();
  __resetPersistenceStatus();
});

afterEach(() => {
  releaseLegacyBridge();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('captureLegacyRecords', () => {
  it('从 persist 原始载荷提取非空 records', () => {
    const raw = buildPersistPayload(
      { records: [buildRecord('legacy-1', 1000), buildRecord('legacy-2', 2000)] },
      12,
    );

    captureLegacyRecords(raw);

    expect(isLegacyBridgeActive()).toBe(true);
    expect(getLegacyRecords().map((record) => record.id)).toEqual(['legacy-1', 'legacy-2']);
  });

  it('重复捕获按 id 合并（幂等，不重复登记）', () => {
    captureLegacyRecords(buildPersistPayload({ records: [buildRecord('a', 1000)] }, 12));
    captureLegacyRecords(
      buildPersistPayload({ records: [buildRecord('a', 1000), buildRecord('b', 2000)] }, 13),
    );

    expect(getLegacyRecords().map((record) => record.id)).toEqual(['a', 'b']);
  });

  it('空载荷 / 损坏 JSON / 非对象 / 空数组 / 缺 id 一律安全跳过', () => {
    const payloads = [
      null,
      '',
      'not-json',
      '[]',
      '{"state":null}',
      '{"state":{}}',
      '{"state":{"records":[]}}',
      '{"state":{"records":[{"createdAt":1000}]}}',
      '{"state":{"records":[{"id":"","createdAt":1000}]}}',
      '{"state":{"records":[{"id":"x","createdAt":"1000"}]}}',
    ];

    for (const payload of payloads) captureLegacyRecords(payload);

    expect(isLegacyBridgeActive()).toBe(false);
    expect(getLegacyRecords()).toHaveLength(0);
  });
});

describe('preserveLegacyRecordsInPayload', () => {
  it('桥接激活时把旧 records 合并回载荷，且不覆盖已有同 id 记录', () => {
    captureLegacyRecords(
      buildPersistPayload({ records: [buildRecord('a', 1000), buildRecord('b', 2000)] }, 12),
    );
    const existing = buildRecord('a', 1000, 9);

    const preserved = preserveLegacyRecordsInPayload({
      state: { settings: { language: 'zh' }, records: [existing] },
      version: 18,
    }) as { state: { records: TrainingRecord[] } };

    expect(preserved.state.records.map((record) => record.id)).toEqual(['a', 'b']);
    // 同 id 以载荷中已存在者为准（不静默覆盖）
    expect(preserved.state.records[0]).toBe(existing);
  });

  it('桥接未激活时原样返回（引用不变）', () => {
    const payload = { state: { records: [] }, version: 18 };
    expect(preserveLegacyRecordsInPayload(payload)).toBe(payload);
  });

  it('载荷缺失 state / state 非对象时不注入非法结构', () => {
    captureLegacyRecords(buildPersistPayload({ records: [buildRecord('a', 1000)] }, 12));

    expect(preserveLegacyRecordsInPayload(null)).toBeNull();
    expect(preserveLegacyRecordsInPayload('raw')).toBe('raw');
    const preserved = preserveLegacyRecordsInPayload({ state: 'oops' }) as { state: string };
    expect(preserved.state).toBe('oops');
  });
});

describe('removeLegacyRecordsFromStorage', () => {
  it('写回成功：载荷摘掉 records（保留其他键）并释放桥接', () => {
    const stub = useStorage({
      [LEGACY_RECORDS_STORAGE_KEY]: buildPersistPayload(
        { settings: { language: 'zh' }, records: [buildRecord('a', 1000)] },
        12,
      ),
    });
    captureLegacyRecords(stub.getItem(LEGACY_RECORDS_STORAGE_KEY));

    expect(removeLegacyRecordsFromStorage()).toBe(true);

    const state = storedPayloadState();
    expect(state).not.toHaveProperty('records');
    expect(state.settings).toEqual({ language: 'zh' });
    expect(isLegacyBridgeActive()).toBe(false);
  });

  it('写回失败：返回 false、保持桥接并上报 records 来源；重试成功后释放', () => {
    const stub = useStorage({
      [LEGACY_RECORDS_STORAGE_KEY]: buildPersistPayload({ records: [buildRecord('a', 1000)] }, 12),
    });
    captureLegacyRecords(stub.getItem(LEGACY_RECORDS_STORAGE_KEY));
    const originalSetItem = stub.setItem;
    const quota = new Error('QuotaExceededError: quota exceeded');
    quota.name = 'QuotaExceededError';
    stub.setItem = () => {
      throw quota;
    };

    expect(removeLegacyRecordsFromStorage()).toBe(false);

    expect(isLegacyBridgeActive()).toBe(true);
    expect(getPersistenceStatus().records).toMatchObject({
      active: true,
      reason: 'quota',
      operation: 'legacy-cleanup',
    });

    stub.setItem = originalSetItem;
    expect(removeLegacyRecordsFromStorage()).toBe(true);
    expect(isLegacyBridgeActive()).toBe(false);
    expect(getPersistenceStatus().records.active).toBe(false);
    expect(storedPayloadState()).not.toHaveProperty('records');
  });

  it('原载荷已不存在时直接释放桥接', () => {
    captureLegacyRecords(buildPersistPayload({ records: [buildRecord('a', 1000)] }, 12));

    expect(removeLegacyRecordsFromStorage()).toBe(true);
    expect(isLegacyBridgeActive()).toBe(false);
  });
});
