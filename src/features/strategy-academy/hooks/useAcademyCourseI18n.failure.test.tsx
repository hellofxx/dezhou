import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import i18n from '@/i18n/config';
import { useAcademyCourseI18n } from './useAcademyCourseI18n';

/**
 * 课程文案加载失败回退（懒加载边界 mock）：
 * 文件始终不就绪（网络失败 / chunk 404 / 加载被拒）时，钩子必须在加载尝试结束后放行渲染，
 * 由渲染层回退数据层中文原文 —— 不允许永久停在骨架屏。
 */

const mocks = vi.hoisted(() => ({
  loadAcademyCourseFiles: vi.fn<(files: readonly string[], lng?: string) => Promise<void>>(
    () => Promise.resolve(),
  ),
}));

vi.mock('@/i18n/academyCourse', () => ({
  isAcademyCourseFilesLoaded: () => false,
  loadAcademyCourseFiles: mocks.loadAcademyCourseFiles,
}));

afterEach(async () => {
  cleanup();
  mocks.loadAcademyCourseFiles.mockClear();
  if (i18n.language !== 'zh') await i18n.changeLanguage('zh');
});

describe('useAcademyCourseI18n：加载失败回退', () => {
  it('文件始终不就绪时先返回 false（避免中文原文闪现），加载尝试后放行渲染', async () => {
    await i18n.changeLanguage('en');
    const { result } = renderHook(() => useAcademyCourseI18n(['level2']));

    expect(result.current).toBe(false);
    expect(mocks.loadAcademyCourseFiles).toHaveBeenCalledWith(['level2'], 'en');

    // 加载结束（无论成功与否）即放行：渲染层回退数据层中文原文，而非永久骨架
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('文件名去重并排序后请求，避免重复加载同一文件', async () => {
    await i18n.changeLanguage('en');
    const { result } = renderHook(() => useAcademyCourseI18n(['level2', 'level1', 'level2']));
    expect(result.current).toBe(false);

    await waitFor(() => expect(result.current).toBe(true));
    expect(mocks.loadAcademyCourseFiles).toHaveBeenCalledWith(['level1', 'level2'], 'en');
  });
});
