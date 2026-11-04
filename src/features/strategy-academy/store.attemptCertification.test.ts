import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy 级别认证（submitCertificationAttempt 唯一入口）测试。
 *
 * 回归守卫：
 * - requiredAccuracy 单一口径（REQUIRED_ACCURACY=70，不随考生分数漂移）
 * - validUntil 每次通过认证从当次时间起算 30 天（认证过期后重考不再基于历史 validUntil 叠加）
 * - 未达标不写 certifiedAt/validUntil，attempts 递增
 * - isCertified 含 validUntil 过期校验
 */

const DAY_MS = 24 * 60 * 60 * 1000;

describe('strategy-academy submitCertificationAttempt', () => {
  beforeEach(() => {
    vi.resetModules();
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function completeLevel1() {
    const { useAcademyStore } = await import('./store');
    const { getLevelSummariesByNumber } = await import('./utils/academyMeta');
    for (const lesson of getLevelSummariesByNumber(1).flatMap((entry) => entry.lessons)) {
      useAcademyStore.getState().completeLesson(lesson.id);
    }
    return useAcademyStore;
  }

  it('score 达到 REQUIRED_ACCURACY 通过认证：certifiedAt/validUntil 从当次时间起算 30 天', async () => {
    const { REQUIRED_ACCURACY } = await import('./store');
    const store = await completeLevel1();
    const now = Date.now();
    expect(
      store.getState().submitCertificationAttempt(1, {
        score: REQUIRED_ACCURACY,
        totalQuestions: 20,
      }),
    ).toEqual({ accepted: true });

    const cert = store.getState().certifications[1];
    expect(cert).toBeDefined();
    expect(cert?.requiredAccuracy).toBe(REQUIRED_ACCURACY);
    expect(cert?.certifiedAt).toBe(now);
    expect(cert?.validUntil).toBe(now + 30 * DAY_MS);
    expect(store.getState().isCertified(1)).toBe(true);
  });

  it('requiredAccuracy 不随考生分数漂移（score=100 仍为 70）', async () => {
    const { REQUIRED_ACCURACY } = await import('./store');
    const store = await completeLevel1();
    store.getState().submitCertificationAttempt(1, { score: 100, totalQuestions: 20 });
    expect(store.getState().certifications[1]?.requiredAccuracy).toBe(REQUIRED_ACCURACY);
  });

  it('score 低于基准不认证：certifiedAt/validUntil 不设置，attempts 递增', async () => {
    const store = await completeLevel1();
    expect(
      store.getState().submitCertificationAttempt(1, { score: 69, totalQuestions: 20 }),
    ).toEqual({ accepted: true });
    const cert = store.getState().certifications[1];
    expect(cert?.certifiedAt).toBeUndefined();
    expect(cert?.validUntil).toBeUndefined();
    expect(cert?.attempts).toBe(1);
    expect(store.getState().isCertified(1)).toBe(false);
  });

  it('认证过期很久后重新通过：validUntil 从当次时间起算（不再是过去时间）', async () => {
    const store = await completeLevel1();
    store.getState().submitCertificationAttempt(1, { score: 85, totalQuestions: 20 });
    vi.setSystemTime(Date.now() + 65 * DAY_MS); // t0+65d：认证已过期 35 天
    expect(store.getState().isCertified(1)).toBe(false);

    const retryAt = Date.now();
    expect(
      store.getState().submitCertificationAttempt(1, { score: 85, totalQuestions: 20 }),
    ).toEqual({ accepted: true });
    const cert = store.getState().certifications[1];
    // 旧实现：validUntil = (t0+30d) + 30d = t0+60d < now → 刚通过立即失效
    expect(cert?.validUntil).toBe(retryAt + 30 * DAY_MS);
    expect(store.getState().isCertified(1)).toBe(true);
  });

  it('isCertified：validUntil 过期后视为未认证', async () => {
    const store = await completeLevel1();
    store.getState().submitCertificationAttempt(1, { score: 85, totalQuestions: 20 });
    expect(store.getState().isCertified(1)).toBe(true);
    vi.setSystemTime(Date.now() + 31 * DAY_MS);
    expect(store.getState().isCertified(1)).toBe(false);
  });

  it('未完成 Level 时拒绝认证', async () => {
    const { useAcademyStore } = await import('./store');
    expect(
      useAcademyStore.getState().submitCertificationAttempt(1, {
        score: 90,
        totalQuestions: 20,
      }),
    ).toEqual({ accepted: false, reason: 'not-completed' });
  });
});
