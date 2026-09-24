import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * strategy-academy store attemptCertification 测试（级别认证）。
 *
 * 回归守卫：
 * - requiredAccuracy 单一口径（REQUIRED_ACCURACY=70，不随考生分数漂移）
 * - validUntil 每次通过认证从当次时间起算 30 天（修复：旧实现基于历史
 *   validUntil 叠加，认证过期很久后重新通过会得到仍为过去时间的 validUntil）
 * - 未通过时保留既有 validUntil（旧实现 spread 条件写法会整字段丢失）
 * - isCertified 含 validUntil 过期校验
 */

const DAY_MS = 24 * 60 * 60 * 1000;

describe('strategy-academy attemptCertification', () => {
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

  it('score 达到 REQUIRED_ACCURACY 通过认证：certifiedAt/validUntil 从当次时间起算 30 天', async () => {
    const { useAcademyStore, REQUIRED_ACCURACY } = await import('./store');
    const now = Date.now();
    useAcademyStore.getState().attemptCertification(1, REQUIRED_ACCURACY);

    const cert = useAcademyStore.getState().certifications[1];
    expect(cert).toBeDefined();
    expect(cert?.requiredAccuracy).toBe(REQUIRED_ACCURACY);
    expect(cert?.certifiedAt).toBe(now);
    expect(cert?.validUntil).toBe(now + 30 * DAY_MS);
    expect(useAcademyStore.getState().isCertified(1)).toBe(true);
  });

  it('requiredAccuracy 不随考生分数漂移（score=100 仍为 70）', async () => {
    const { useAcademyStore, REQUIRED_ACCURACY } = await import('./store');
    useAcademyStore.getState().attemptCertification(1, 100);
    expect(useAcademyStore.getState().certifications[1]?.requiredAccuracy).toBe(REQUIRED_ACCURACY);
  });

  it('score 低于基准不认证：certifiedAt/validUntil 不设置，attempts 递增', async () => {
    const { useAcademyStore } = await import('./store');
    useAcademyStore.getState().attemptCertification(1, 69);
    const cert = useAcademyStore.getState().certifications[1];
    expect(cert?.certifiedAt).toBeUndefined();
    expect(cert?.validUntil).toBeUndefined();
    expect(cert?.attempts).toBe(1);
    expect(useAcademyStore.getState().isCertified(1)).toBe(false);
  });

  it('认证过期很久后重新通过：validUntil 从当次时间起算（不再是过去时间）', async () => {
    const { useAcademyStore } = await import('./store');
    useAcademyStore.getState().attemptCertification(1, 85); // t0 通过，validUntil = t0+30d
    vi.setSystemTime(Date.now() + 65 * DAY_MS); // t0+65d：认证已过期 35 天
    expect(useAcademyStore.getState().isCertified(1)).toBe(false);

    const retryAt = Date.now();
    useAcademyStore.getState().attemptCertification(1, 85); // 重新通过
    const cert = useAcademyStore.getState().certifications[1];
    // 旧实现：validUntil = (t0+30d) + 30d = t0+60d < now → 刚通过立即失效
    expect(cert?.validUntil).toBe(retryAt + 30 * DAY_MS);
    expect(useAcademyStore.getState().isCertified(1)).toBe(true);
  });

  it('已认证未过期时重考未通过：保留既有 certifiedAt 与 validUntil', async () => {
    const { useAcademyStore } = await import('./store');
    useAcademyStore.getState().attemptCertification(1, 85);
    const before = useAcademyStore.getState().certifications[1];
    vi.advanceTimersByTime(10 * DAY_MS); // 有效期内

    useAcademyStore.getState().attemptCertification(1, 60); // 重考未达标
    const after = useAcademyStore.getState().certifications[1];
    expect(after?.certifiedAt).toBe(before?.certifiedAt);
    expect(after?.validUntil).toBe(before?.validUntil);
    expect(after?.attempts).toBe(2);
    expect(after?.bestScore).toBe(85);
    expect(useAcademyStore.getState().isCertified(1)).toBe(true);
  });

  it('isCertified：validUntil 过期后视为未认证', async () => {
    const { useAcademyStore } = await import('./store');
    useAcademyStore.getState().attemptCertification(1, 85);
    expect(useAcademyStore.getState().isCertified(1)).toBe(true);
    vi.setSystemTime(Date.now() + 31 * DAY_MS);
    expect(useAcademyStore.getState().isCertified(1)).toBe(false);
  });
});
