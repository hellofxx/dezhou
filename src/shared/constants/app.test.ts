/**
 * 构建版本契约（unit）：
 * - 部署序号（CI 的 GITHUB_RUN_NUMBER）递增 patch，本地 / 非法序号保持基础版本
 * - 构建时间按语言本地化；空值 / 非法时间返回空串（UI 不渲染更新时间）
 * - 测试环境未注入 Vite define → 回退 dev 版本且无更新时间
 */
import { describe, expect, it } from 'vitest';
import { APP_BUILD_TIME, APP_VERSION, formatBuildTime, resolveAppVersion } from './app';

describe('resolveAppVersion', () => {
  it('部署序号递增 patch', () => {
    expect(resolveAppVersion('0.1.0', 1)).toBe('0.1.1');
    expect(resolveAppVersion('0.1.0', 42)).toBe('0.1.42');
    expect(resolveAppVersion('1.2.9', 3)).toBe('1.2.12');
  });

  it('本地构建 / 非法序号保持基础版本', () => {
    expect(resolveAppVersion('0.1.0', 0)).toBe('0.1.0');
    expect(resolveAppVersion('0.1.0', -1)).toBe('0.1.0');
    expect(resolveAppVersion('0.1.0', Number.NaN)).toBe('0.1.0');
    expect(resolveAppVersion('bad', 3)).toBe('bad');
  });
});

describe('formatBuildTime', () => {
  it('空值 / 非法时间返回空串', () => {
    expect(formatBuildTime('', 'zh')).toBe('');
    expect(formatBuildTime('not-a-date', 'zh')).toBe('');
  });

  it('按语言本地化并包含日期与时分', () => {
    const zh = formatBuildTime('2026-11-20T07:00:00.000Z', 'zh');
    expect(zh).toContain('2026');
    expect(zh).toMatch(/\d{2}:\d{2}/);

    const en = formatBuildTime('2026-11-20T07:00:00.000Z', 'en');
    expect(en).toContain('2026');
    expect(en).toMatch(/\d{2}:\d{2}\s?(AM|PM)?/);
  });
});

describe('构建信息回退', () => {
  it('测试环境未注入 define → dev 版本、无更新时间', () => {
    expect(APP_VERSION).toBe('0.0.0-dev');
    expect(APP_BUILD_TIME).toBe('');
  });
});
