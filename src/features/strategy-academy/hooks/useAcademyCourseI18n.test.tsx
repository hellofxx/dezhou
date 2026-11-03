import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import i18n from '@/i18n/config';
import { isAcademyCourseFilesLoaded } from '@/i18n/academyCourse';
import { useAcademyCourseI18n } from './useAcademyCourseI18n';

/**
 * 课程文案就绪态 hook 契约：
 * - zh：数据层原文即中文，立即返回 true（文件后台加载即可）
 * - en：等待对应文件注入后再返回 true，避免中文原文闪现
 * - 空 files：视为就绪（无内容需求）
 * - 已加载文件：同步 true，同 Level 课程间切换不闪骨架
 */

afterEach(async () => {
  cleanup();
  if (i18n.language !== 'zh') await i18n.changeLanguage('zh');
});

describe('useAcademyCourseI18n', () => {
  it('空文件列表视为就绪', () => {
    const { result } = renderHook(() => useAcademyCourseI18n([]));
    expect(result.current).toBe(true);
  });

  it('zh 环境不等待文件加载，立即返回 true', () => {
    expect(isAcademyCourseFilesLoaded(['basics'], 'zh')).toBe(false);
    const { result } = renderHook(() => useAcademyCourseI18n(['basics']));
    expect(result.current).toBe(true);
  });

  it('en 环境先返回 false，文件注入后就绪', async () => {
    await i18n.changeLanguage('en');
    expect(isAcademyCourseFilesLoaded(['opponentDrill'], 'en')).toBe(false);

    const { result } = renderHook(() => useAcademyCourseI18n(['opponentDrill']));
    expect(result.current).toBe(false);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
    expect(isAcademyCourseFilesLoaded(['opponentDrill'], 'en')).toBe(true);
  });

  it('已加载文件在 en 下同步返回 true（切换课程不闪骨架）', async () => {
    await i18n.changeLanguage('en');
    const { result: first } = renderHook(() => useAcademyCourseI18n(['term']));
    await waitFor(() => {
      expect(first.current).toBe(true);
    });

    const { result: second } = renderHook(() => useAcademyCourseI18n(['term']));
    expect(second.current).toBe(true);
  });

  it('重复文件名去重后仍正确判定就绪', () => {
    const { result } = renderHook(() => useAcademyCourseI18n(['basics', 'basics']));
    expect(result.current).toBe(true);
  });
});
